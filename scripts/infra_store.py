"""Compact on-disk store for canonical indicator records.

WHY
---
The canonical record (see ``infra_schema``) is deliberately fat: every single
data point carries its own publisher, URL, dataset file, retrieval date,
definition note and population denominator, so that no point can ever appear on
a chart without its provenance. That is the right logical contract and it is
non-negotiable.

It is a terrible *serialisation*. Written out as 155k JSON objects it comes to
roughly 119 MB, of which the overwhelming majority is the same dozen strings
repeated over and over. Truncating the country list to shrink the file would
destroy the product requirement (compare India against any country), so the
fix belongs in the encoding, not in the data.

This module dictionary-encodes the repetition and nothing else. ``load()``
returns records byte-identical to what ``save()`` was given - the full fat
schema shape, which then passes ``infra_schema.validate`` unchanged. Nothing is
dropped, rounded, or summarised: this is compression by normalisation, not by
loss.

FORMAT ("infra-columnar-1")
---------------------------
series_defs : list of objects
    One entry per distinct (indicator, source, column, note) combination -
    i.e. everything that is constant along a time series. ~30 entries stand in
    for 155k copies.
countries : list of [iso3, country_name]
    Distinct pairs. Kept as pairs rather than a dict because the same ISO3 can
    carry different display names in different upstreams ("South Korea" vs
    "Korea, Rep."), and silently unifying them would edit the sources.
populations : list of [country_idx, year, population, population_source]
    The denominator table. Population repeats across every indicator for a
    given country-year, so it is stored once and referenced by index.
rows : list of [series_idx, country_idx, year, value, value_absolute|null,
                population_idx|null]
    One row per observation.
flagged : list of [row_idx, is_estimated, break_in_series]
    Sparse override list. Quality flags are false for the overwhelming
    majority of rows, so only the exceptions are written.

USAGE
-----
    from infra_store import save, load
    save(records, "data/infra/clean/indicators.json", meta={...})
    records = load("data/infra/clean/indicators.json")
"""

from __future__ import annotations

import json
import os
from typing import Any, Dict, List, Optional, Sequence

FORMAT = "infra-columnar-1"

#: Fields that are constant along one series and therefore live in series_defs.
_SERIES_FIELDS = (
    "indicator_id",
    "indicator_name",
    "category",
    "unit",
    "per_capita_basis",
    "source_publisher",
    "source_url",
    "source_dataset_file",
    "source_column",
    "source_lineage",
    "retrieved_at",
    "definition_note",
)


def _series_key(r: Dict[str, Any]):
    return tuple(r.get(f) for f in _SERIES_FIELDS)


def encode(records: Sequence[Dict[str, Any]], meta: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """Dictionary-encode records into the columnar payload."""
    series_index: Dict[Any, int] = {}
    series_defs: List[Dict[str, Any]] = []
    country_index: Dict[Any, int] = {}
    countries: List[List[str]] = []
    pop_index: Dict[Any, int] = {}
    populations: List[List[Any]] = []
    rows: List[List[Any]] = []
    flagged: List[List[Any]] = []

    for r in records:
        sk = _series_key(r)
        si = series_index.get(sk)
        if si is None:
            si = len(series_defs)
            series_index[sk] = si
            series_defs.append({f: r.get(f) for f in _SERIES_FIELDS})

        ck = (r["country_iso3"], r["country_name"])
        ci = country_index.get(ck)
        if ci is None:
            ci = len(countries)
            country_index[ck] = ci
            countries.append([r["country_iso3"], r["country_name"]])

        pi: Optional[int] = None
        if r.get("population") is not None:
            pk = (ci, r["year"], r["population"], r.get("population_source"))
            pi = pop_index.get(pk)
            if pi is None:
                pi = len(populations)
                pop_index[pk] = pi
                populations.append(
                    [ci, r["year"], r["population"], r.get("population_source")]
                )

        rows.append([si, ci, r["year"], r["value"], r.get("value_absolute"), pi])

        if r.get("is_estimated") or r.get("break_in_series"):
            flagged.append(
                [len(rows) - 1, bool(r.get("is_estimated")), bool(r.get("break_in_series"))]
            )

    payload: Dict[str, Any] = dict(meta or {})
    payload.update(
        {
            "format": FORMAT,
            "n_records": len(rows),
            "series_defs": series_defs,
            "countries": countries,
            "populations": populations,
            "rows": rows,
            "flagged": flagged,
        }
    )
    return payload


def decode(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Rehydrate the columnar payload back into full canonical records."""
    if payload.get("format") != FORMAT:
        # Tolerate the plain fat-record layout so older files still load.
        if "records" in payload:
            return list(payload["records"])
        raise ValueError(f"unrecognised store format: {payload.get('format')!r}")

    series_defs = payload["series_defs"]
    countries = payload["countries"]
    populations = payload["populations"]
    flags = {f[0]: (f[1], f[2]) for f in payload.get("flagged", [])}

    out: List[Dict[str, Any]] = []
    for i, row in enumerate(payload["rows"]):
        si, ci, year, value, value_absolute, pi = row
        rec = dict(series_defs[si])
        iso3, cname = countries[ci]
        rec["country_iso3"] = iso3
        rec["country_name"] = cname
        rec["year"] = year
        rec["value"] = value
        rec["value_absolute"] = value_absolute
        if pi is None:
            rec["population"] = None
            rec["population_source"] = None
        else:
            rec["population"] = populations[pi][2]
            rec["population_source"] = populations[pi][3]
        est, brk = flags.get(i, (False, False))
        rec["is_estimated"] = est
        rec["break_in_series"] = brk
        out.append(rec)
    return out


def save(
    records: Sequence[Dict[str, Any]],
    path: str,
    meta: Optional[Dict[str, Any]] = None,
) -> int:
    """Encode and write. Returns the file size in bytes."""
    os.makedirs(os.path.dirname(os.path.abspath(path)), exist_ok=True)
    with open(path, "w") as fh:
        json.dump(encode(records, meta), fh, separators=(",", ":"), default=str)
    return os.path.getsize(path)


def load(path: str) -> List[Dict[str, Any]]:
    """Read and rehydrate full canonical records."""
    with open(path) as fh:
        return decode(json.load(fh))


def load_meta(path: str) -> Dict[str, Any]:
    """Read only the header fields (everything but the bulk arrays)."""
    with open(path) as fh:
        payload = json.load(fh)
    bulk = {"series_defs", "countries", "populations", "rows", "flagged", "records"}
    return {k: v for k, v in payload.items() if k not in bulk}
