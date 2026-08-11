#!/usr/bin/env python3
"""Verification suite for normalised infrastructure indicator records.

Consumes records in the canonical shape defined by ``infra_schema`` and runs
six independent checks, emitting a machine-readable JSON report plus a
human-readable Markdown summary.

DESIGN PRINCIPLE: this module FLAGS, it does not FIX.
Nothing here deletes, rewrites, interpolates or reconciles a value. A
suspicious point stays in the dataset with a finding attached to it, so a
human decides. The only records that ever get dropped are ones that fail
``infra_schema.validate`` outright (structurally unusable), and those are
reported individually with the reason.

CHECKS
------
1. range_sanity
     Percent-unit values outside [0, 100]; negative values on indicators
     whose unit implies a non-negative count/stock.
2. yoy_jumps
     Within a single source's series, any year-on-year change whose
     magnitude exceeds ``--yoy-threshold`` (default 50%). Only applied to
     stock/level variables - indicators that are themselves growth rates or
     net flows are exempt via IS_FLOW_HINTS, since a 200% swing in a net
     figure is meaningless as an anomaly signal.
3. cross_source_agreement
     For every (indicator_id, country_iso3, year) covered by more than one
     source, computes relative divergence against the median of the group
     and flags anything above ``--divergence-threshold`` (default 5%).
     BOTH values are always reported. The check never picks a winner.
4. population_consistency
     For population-normalised records that carry both value_absolute and
     population, recomputes value = value_absolute / population * basis
     and flags mismatches beyond a small numeric tolerance. Also flags
     per-capita records that carry no denominator at all (unauditable) and
     population values that disagree across sources for the same
     country-year.
5. duplicates
     Same (indicator, country, year) appearing more than once from the SAME
     publisher+file. Reports whether the duplicate values agree (harmless
     repeat) or conflict (real problem).
6. coverage
     Per indicator: which countries and which years actually have data,
     which are missing from the expected grid, and the density percentage.

SEVERITY
--------
  error   - the record is unusable or internally contradictory
  warn    - the record is usable but a human should look
  info    - descriptive, no action implied

CLI
---
    python3 verify_infra.py --records data/infra/clean/indicators.json \
        --json-out report.json --md-out report.md \
        --focus-country IND --focus-from 2014
"""

from __future__ import annotations

import argparse
import json
import math
import os
import statistics
import sys
from collections import Counter, defaultdict
from typing import Any, Dict, Iterable, List, Optional, Sequence

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from infra_schema import (  # noqa: E402
    NON_NEGATIVE_UNIT_HINTS,
    PERCENT_UNITS,
    POPULATION_NORMALISED,
    SCHEMA_VERSION,
    SchemaError,
    basis_multiplier,
    comparison_key,
    is_aggregate,
    record_key,
    series_key,
    validate,
)

DEFAULT_YOY_THRESHOLD = 0.50          # 50% single-year change
DEFAULT_DIVERGENCE_THRESHOLD = 0.05   # 5% cross-source divergence
POP_RECONSTRUCTION_TOLERANCE = 0.01   # 1% - covers rounding in published files
POP_CROSS_SOURCE_TOLERANCE = 0.02     # 2% - population vintages differ slightly

#: Indicator-id substrings that mark a FLOW / rate / change variable, for which
#: a large year-on-year swing is normal and must not be flagged as implausible.
IS_FLOW_HINTS = (
    "_change",
    "_growth",
    "growth_",
    "net_",
    "_imports",
    "trade_",
    "_per_gdp",
)

#: Indicator-id substrings marking values that may legitimately be negative
#: (net trade positions, net imports, land-use-change sinks).
MAY_BE_NEGATIVE_HINTS = (
    "net_",
    "trade_",
    "_change",
    "_growth",
    "growth_",
    "land_use",
    "luc",
)


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def _is_flow(indicator_id: str) -> bool:
    return any(h in indicator_id for h in IS_FLOW_HINTS)


def _may_be_negative(indicator_id: str) -> bool:
    return any(h in indicator_id for h in MAY_BE_NEGATIVE_HINTS)


def _implies_non_negative(unit: str) -> bool:
    u = unit.strip().lower()
    return any(h in u for h in NON_NEGATIVE_UNIT_HINTS) or u in PERCENT_UNITS


def _half_ulp_decimal(x: float) -> float:
    """Half of the last published decimal place of x.

    A source that prints ``0.016`` is telling us the true value lies in
    [0.0155, 0.0165). Reconstruction must be allowed to differ by that much
    without being called an error - otherwise every small per-capita figure
    trips the check purely because of how it was printed.
    """
    s = repr(float(x))
    if "e" in s or "E" in s:
        mant, _, exp = s.partition("e")
        dec = len(mant.partition(".")[2])
        return 0.5 * (10.0 ** (int(exp) - dec))
    dec = len(s.partition(".")[2].rstrip("0"))
    return 0.5 * (10.0 ** (-dec))


def _half_ulp_sigfig(x: float) -> float:
    """Half of the last SIGNIFICANT digit of x.

    Used for numerators that were rescaled during ingest (TWh -> kWh), where
    decimal-place precision is destroyed but significant-figure precision
    survives: 2e+07 carries one significant digit, so the true value is
    somewhere in [1.5e7, 2.5e7).
    """
    if x == 0:
        return 0.0
    s = f"{abs(float(x)):e}"          # e.g. '2.000000e+07'
    mant, _, exp = s.partition("e")
    sig = len(mant.replace(".", "").rstrip("0")) or 1
    return 0.5 * (10.0 ** (int(exp) - sig + 1))


def _rel_diff(a: float, b: float) -> Optional[float]:
    """Relative difference of a vs b, scaled by |b|. None if b == 0."""
    if b == 0:
        return None
    return (a - b) / abs(b)


def _finding(check: str, severity: str, message: str, **ctx) -> Dict[str, Any]:
    f = {"check": check, "severity": severity, "message": message}
    f.update(ctx)
    return f


def _rec_ref(r: Dict[str, Any]) -> Dict[str, Any]:
    """Compact reference to a record, for embedding in findings."""
    return {
        "indicator_id": r["indicator_id"],
        "country_iso3": r["country_iso3"],
        "year": r["year"],
        "value": r["value"],
        "unit": r["unit"],
        "per_capita_basis": r["per_capita_basis"],
        "source_publisher": r["source_publisher"],
        "source_dataset_file": r["source_dataset_file"],
        "source_url": r["source_url"],
    }


# --------------------------------------------------------------------------
# check 0 - schema validation (gate)
# --------------------------------------------------------------------------

def check_schema(records: Sequence[Dict[str, Any]]):
    """Split records into structurally valid / rejected. Returns (ok, findings)."""
    ok: List[Dict[str, Any]] = []
    findings: List[Dict[str, Any]] = []
    for i, r in enumerate(records):
        try:
            ok.append(validate(r))
        except SchemaError as e:
            findings.append(
                _finding(
                    "schema",
                    "error",
                    f"record #{i} rejected: {e}",
                    record_index=i,
                    indicator_id=r.get("indicator_id") if isinstance(r, dict) else None,
                    country_iso3=r.get("country_iso3") if isinstance(r, dict) else None,
                    year=r.get("year") if isinstance(r, dict) else None,
                )
            )
    return ok, findings


# --------------------------------------------------------------------------
# check 1 - range sanity
# --------------------------------------------------------------------------

def check_range_sanity(records: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    findings = []
    for r in records:
        v = float(r["value"])
        unit_l = r["unit"].strip().lower()
        is_pct = unit_l in PERCENT_UNITS or r["per_capita_basis"] == "%"

        if is_pct and not (0.0 <= v <= 100.0):
            findings.append(
                _finding(
                    "range_sanity",
                    "error",
                    f"percentage value {v:g} outside [0,100]",
                    record=_rec_ref(r),
                )
            )
            continue

        if v < 0 and _implies_non_negative(r["unit"]) and not _may_be_negative(r["indicator_id"]):
            findings.append(
                _finding(
                    "range_sanity",
                    "error",
                    f"negative value {v:g} for a non-negative unit ({r['unit']})",
                    record=_rec_ref(r),
                )
            )

        if r.get("population") is not None and float(r["population"]) <= 0:
            findings.append(
                _finding(
                    "range_sanity",
                    "error",
                    f"non-positive population denominator {r['population']!r}",
                    record=_rec_ref(r),
                )
            )
    return findings


# --------------------------------------------------------------------------
# check 2 - year-over-year implausible jumps
# --------------------------------------------------------------------------

def check_yoy_jumps(
    records: Sequence[Dict[str, Any]],
    threshold: float = DEFAULT_YOY_THRESHOLD,
) -> List[Dict[str, Any]]:
    """Flag >threshold single-year relative change within one source's series.

    Skipped for flow/rate indicators, for records already marked
    ``break_in_series`` (the publisher told us the jump is real), and where the
    previous value is zero (relative change undefined - reported separately at
    info severity when the new value is materially non-zero).
    """
    findings = []
    by_series: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
    for r in records:
        by_series[series_key(r)].append(r)

    for key, rows in by_series.items():
        indicator_id = key[0]
        if _is_flow(indicator_id):
            continue
        rows = sorted(rows, key=lambda r: r["year"])
        for prev, cur in zip(rows, rows[1:]):
            if cur["year"] - prev["year"] != 1:
                continue  # gap in series: a multi-year delta is not a YoY jump
            if cur.get("break_in_series") or prev.get("break_in_series"):
                continue
            pv, cv = float(prev["value"]), float(cur["value"])
            if pv == 0:
                if cv != 0:
                    findings.append(
                        _finding(
                            "yoy_jump",
                            "info",
                            f"series moves off zero ({pv:g} -> {cv:g}); "
                            f"relative change undefined",
                            record=_rec_ref(cur),
                            prev_year=prev["year"],
                            prev_value=pv,
                        )
                    )
                continue
            change = (cv - pv) / abs(pv)
            if abs(change) > threshold:
                findings.append(
                    _finding(
                        "yoy_jump",
                        "warn",
                        f"{change * 100:+.1f}% change {prev['year']}->{cur['year']} "
                        f"({pv:g} -> {cv:g}) exceeds {threshold * 100:.0f}% threshold",
                        record=_rec_ref(cur),
                        prev_year=prev["year"],
                        prev_value=pv,
                        relative_change=round(change, 6),
                    )
                )
    return findings


# --------------------------------------------------------------------------
# check 3 - cross-source agreement
# --------------------------------------------------------------------------

def check_cross_source(
    records: Sequence[Dict[str, Any]],
    threshold: float = DEFAULT_DIVERGENCE_THRESHOLD,
) -> List[Dict[str, Any]]:
    """Compare every (indicator, country, year) covered by 2+ distinct sources.

    Divergence is measured against the group median so that three sources with
    one outlier do not produce two symmetric complaints. BOTH (all) competing
    values, with their URLs, are recorded in the finding. This function never
    chooses a preferred source.
    """
    findings = []
    groups: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
    for r in records:
        groups[comparison_key(r)].append(r)

    for key, rows in groups.items():
        sources = {(r["source_publisher"], r["source_dataset_file"]) for r in rows}
        if len(sources) < 2:
            continue

        # Only compare like with like: same unit and same normalisation basis.
        by_shape: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
        for r in rows:
            by_shape[(r["unit"].strip().lower(), r["per_capita_basis"])].append(r)

        if len(by_shape) > 1:
            findings.append(
                _finding(
                    "cross_source",
                    "warn",
                    "same indicator/country/year reported in incompatible "
                    "units or bases; not comparable without conversion",
                    indicator_id=key[0],
                    country_iso3=key[1],
                    year=key[2],
                    shapes=[
                        {"unit": u, "per_capita_basis": b, "n": len(v)}
                        for (u, b), v in by_shape.items()
                    ],
                    values=[_rec_ref(r) for r in rows],
                )
            )

        for (unit, basis), shape_rows in by_shape.items():
            shape_sources = {
                (r["source_publisher"], r["source_dataset_file"]) for r in shape_rows
            }
            if len(shape_sources) < 2:
                continue
            vals = [float(r["value"]) for r in shape_rows]
            med = statistics.median(vals)
            divergences = []
            worst = 0.0
            for r in shape_rows:
                d = _rel_diff(float(r["value"]), med)
                divergences.append(
                    {
                        "source_publisher": r["source_publisher"],
                        "source_dataset_file": r["source_dataset_file"],
                        "source_url": r["source_url"],
                        "source_column": r.get("source_column"),
                        "source_lineage": r.get("source_lineage"),
                        "value": float(r["value"]),
                        "relative_to_median": None if d is None else round(d, 6),
                    }
                )
                if d is not None:
                    worst = max(worst, abs(d))
            spread = (max(vals) - min(vals))

            # Two files that descend from one upstream are siblings, not
            # witnesses. Agreement between them proves nothing was corrupted in
            # transit; it is not corroboration, and disagreement between them
            # is a transit/vintage bug rather than a genuine dispute.
            lineages = {r.get("source_lineage") for r in shape_rows}
            independent = len({l for l in lineages if l}) > 1

            if worst > threshold:
                findings.append(
                    _finding(
                        "cross_source",
                        "warn",
                        f"sources disagree by up to {worst * 100:.2f}% "
                        f"(median {med:g}, spread {spread:g} {unit})"
                        + (
                            ""
                            if independent
                            else " - NOTE: these sources share one upstream "
                            "lineage, so this is a transit/vintage discrepancy, "
                            "not two independent estimates disagreeing"
                        ),
                        indicator_id=key[0],
                        country_iso3=key[1],
                        year=key[2],
                        unit=unit,
                        per_capita_basis=basis,
                        median=med,
                        max_relative_divergence=round(worst, 6),
                        independent_sources=independent,
                        lineages=sorted(l for l in lineages if l),
                        sources=divergences,
                    )
                )
    return findings


# --------------------------------------------------------------------------
# check 4 - population denominator consistency
# --------------------------------------------------------------------------

def check_population_consistency(
    records: Sequence[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Three sub-checks.

    (a) reconstructability: for population-normalised records carrying both an
        absolute value and a denominator, value must equal
        absolute / population * basis_multiplier within tolerance.
    (b) auditability: population-normalised records with no denominator stored
        at all cannot be re-derived; reported at warn.
    (c) denominator agreement: the population used for a given country-year
        must not differ materially between sources, since that alone can
        manufacture a cross-source divergence in every per-capita indicator.
    """
    findings = []

    # (a) + (b)
    for r in records:
        basis = r["per_capita_basis"]
        if basis not in POPULATION_NORMALISED:
            continue
        mult = basis_multiplier(basis)
        pop = r.get("population")
        va = r.get("value_absolute")

        if pop is None:
            findings.append(
                _finding(
                    "population_consistency",
                    "warn",
                    f"per-capita record ({basis}) stores no population "
                    f"denominator; value cannot be independently reconstructed",
                    record=_rec_ref(r),
                )
            )
            continue

        if va is None:
            findings.append(
                _finding(
                    "population_consistency",
                    "info",
                    f"per-capita record ({basis}) has a denominator but no "
                    f"absolute numerator; reconstruction not possible",
                    record=_rec_ref(r),
                    population=float(pop),
                    population_source=r.get("population_source"),
                )
            )
            continue

        expected = float(va) / float(pop) * float(mult)
        actual = float(r["value"])
        denom = abs(expected) if expected != 0 else None
        if denom is None:
            rel = 0.0 if actual == 0 else float("inf")
        else:
            rel = abs(actual - expected) / denom
        if rel > POP_RECONSTRUCTION_TOLERANCE:
            # Before calling it an error, propagate the rounding the publisher
            # already applied to BOTH operands. If the gap fits inside the
            # printed precision, the two figures are consistent and the
            # apparent mismatch is an artefact of formatting, not of data.
            abs_gap = abs(actual - expected)
            rounding_band = (
                _half_ulp_decimal(actual)
                + _half_ulp_sigfig(float(va)) / float(pop) * float(mult)
            )
            if abs_gap <= rounding_band:
                findings.append(
                    _finding(
                        "population_consistency",
                        "info",
                        f"per-capita value {actual:g} differs from the "
                        f"reconstruction {expected:g} by {rel * 100:.2f}%, but the "
                        f"gap ({abs_gap:.3g}) fits inside the publisher's printed "
                        f"precision (+/-{rounding_band:.3g}); consistent",
                        record=_rec_ref(r),
                        expected=expected,
                        population=float(pop),
                        population_source=r.get("population_source"),
                        relative_error=round(rel, 6) if math.isfinite(rel) else None,
                        rounding_band=rounding_band,
                    )
                )
            else:
                findings.append(
                    _finding(
                        "population_consistency",
                        "error",
                        f"per-capita value {actual:g} does not reconstruct from "
                        f"{va:g} / {pop:g} * {mult:g} = {expected:g} "
                        f"(off by {rel * 100:.2f}%, beyond the "
                        f"+/-{rounding_band:.3g} printed-precision band)",
                        record=_rec_ref(r),
                        expected=expected,
                        population=float(pop),
                        population_source=r.get("population_source"),
                        relative_error=round(rel, 6) if math.isfinite(rel) else None,
                        rounding_band=rounding_band,
                    )
                )

    # (c) denominator agreement across sources
    pops: Dict[Any, Dict[Any, float]] = defaultdict(dict)
    for r in records:
        pop = r.get("population")
        if pop is None:
            continue
        src = (r.get("population_source") or r["source_publisher"], r["source_dataset_file"])
        pops[(r["country_iso3"], r["year"])][src] = float(pop)

    for (iso3, year), by_src in pops.items():
        if len(by_src) < 2:
            continue
        vals = list(by_src.values())
        med = statistics.median(vals)
        worst = max(abs((v - med) / med) for v in vals) if med else 0.0
        if worst > POP_CROSS_SOURCE_TOLERANCE:
            findings.append(
                _finding(
                    "population_consistency",
                    "warn",
                    f"population denominator for {iso3} {year} differs by up to "
                    f"{worst * 100:.2f}% between sources; every per-capita "
                    f"indicator built on it inherits this divergence",
                    country_iso3=iso3,
                    year=year,
                    median=med,
                    populations=[
                        {"source": list(k), "population": v} for k, v in by_src.items()
                    ],
                )
            )
    return findings


# --------------------------------------------------------------------------
# check 5 - duplicates
# --------------------------------------------------------------------------

def check_duplicates(records: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Same indicator/country/year from the same publisher+file, more than once."""
    findings = []
    groups: Dict[Any, List[Dict[str, Any]]] = defaultdict(list)
    for r in records:
        groups[record_key(r)].append(r)

    for key, rows in groups.items():
        if len(rows) < 2:
            continue
        vals = sorted({round(float(r["value"]), 10) for r in rows})
        conflicting = len(vals) > 1
        findings.append(
            _finding(
                "duplicates",
                "error" if conflicting else "warn",
                (
                    f"{len(rows)} records for the same indicator/country/year from "
                    f"the same source with CONFLICTING values {vals}"
                    if conflicting
                    else f"{len(rows)} identical duplicate records from the same source"
                ),
                indicator_id=key[0],
                country_iso3=key[1],
                year=key[2],
                source_publisher=key[3],
                source_dataset_file=key[4],
                distinct_values=vals,
                count=len(rows),
            )
        )
    return findings


# --------------------------------------------------------------------------
# check 6 - coverage
# --------------------------------------------------------------------------

def check_coverage(
    records: Sequence[Dict[str, Any]],
    focus_countries: Optional[Sequence[str]] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
) -> Dict[str, Any]:
    """Per-indicator coverage: countries and years present vs missing.

    The "expected grid" is (focus_countries x [year_from..year_to]). Where the
    caller gives no focus set, the observed country set for that indicator is
    used, which reports internal raggedness only. Missing cells are reported as
    missing - they are never filled.
    """
    by_ind: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for r in records:
        by_ind[r["indicator_id"]].append(r)

    out: Dict[str, Any] = {}
    for iid, rows in sorted(by_ind.items()):
        countries = sorted({r["country_iso3"] for r in rows})
        real_countries = sorted(c for c in countries if not is_aggregate(c))
        years = sorted({r["year"] for r in rows})

        yf = year_from if year_from is not None else (min(years) if years else None)
        yt = year_to if year_to is not None else (max(years) if years else None)
        expected_years = list(range(yf, yt + 1)) if yf is not None and yt is not None else []
        expected_countries = list(focus_countries) if focus_countries else real_countries

        present = {(r["country_iso3"], r["year"]) for r in rows}
        missing = [
            {"country_iso3": c, "year": y}
            for c in expected_countries
            for y in expected_years
            if (c, y) not in present
        ]
        expected_n = len(expected_countries) * len(expected_years)
        present_n = sum(
            1
            for c in expected_countries
            for y in expected_years
            if (c, y) in present
        )

        per_country_years = {}
        for c in expected_countries:
            cy = sorted(r["year"] for r in rows if r["country_iso3"] == c)
            per_country_years[c] = {
                "n_years": len(cy),
                "first_year": cy[0] if cy else None,
                "last_year": cy[-1] if cy else None,
                "missing_years": [y for y in expected_years if y not in set(cy)],
            }

        out[iid] = {
            "indicator_name": rows[0]["indicator_name"],
            "category": rows[0]["category"],
            "unit": rows[0]["unit"],
            "per_capita_basis": rows[0]["per_capita_basis"],
            "n_records": len(rows),
            "n_countries": len(real_countries),
            "n_aggregates": len(countries) - len(real_countries),
            "countries": real_countries,
            "year_min": min(years) if years else None,
            "year_max": max(years) if years else None,
            "sources": sorted(
                {f"{r['source_publisher']} :: {r['source_dataset_file']}" for r in rows}
            ),
            "expected_cells": expected_n,
            "present_cells": present_n,
            "density_pct": round(100.0 * present_n / expected_n, 2) if expected_n else None,
            "missing_cells": missing[:500],
            "n_missing_cells": len(missing),
            "missing_truncated": len(missing) > 500,
            "per_country": per_country_years,
        }
    return out


# --------------------------------------------------------------------------
# orchestration
# --------------------------------------------------------------------------

def check_scope(records: Sequence[Dict[str, Any]]) -> Dict[str, Any]:
    """How much data each check actually had to work on.

    Without this, a check that returns zero findings is ambiguous: it could
    mean "everything agrees" or "there was nothing to compare". The report
    must never let those two be confused.
    """
    groups: Dict[Any, set] = defaultdict(set)
    lineages: Dict[Any, set] = defaultdict(set)
    for r in records:
        groups[comparison_key(r)].add((r["source_publisher"], r["source_dataset_file"]))
        if r.get("source_lineage"):
            lineages[comparison_key(r)].add(r["source_lineage"])
    multi = {k: v for k, v in groups.items() if len(v) > 1}
    truly_independent = sum(1 for k in multi if len(lineages.get(k, ())) > 1)

    series: Dict[Any, int] = Counter(series_key(r) for r in records)
    comparable_pairs = sum(max(0, n - 1) for n in series.values())

    pop_norm = [r for r in records if r["per_capita_basis"] in POPULATION_NORMALISED]
    reconstructable = [
        r for r in pop_norm
        if r.get("population") is not None and r.get("value_absolute") is not None
    ]
    pop_cells: Dict[Any, set] = defaultdict(set)
    for r in records:
        if r.get("population") is not None:
            pop_cells[(r["country_iso3"], r["year"])].add(
                r.get("population_source") or r["source_publisher"]
            )

    return {
        "cross_source": {
            "indicator_country_year_cells": len(groups),
            "cells_covered_by_2plus_sources": len(multi),
            "cells_covered_by_2plus_INDEPENDENT_lineages": truly_independent,
            "note": (
                "Zero cross_source findings is only meaningful if "
                "cells_covered_by_2plus_sources > 0. And only "
                "cells_covered_by_2plus_INDEPENDENT_lineages represents genuine "
                "corroboration - the rest are sibling copies of one upstream."
            ),
        },
        "yoy_jump": {
            "series": len(series),
            "consecutive_year_pairs_available": comparable_pairs,
            "series_exempt_as_flow": sum(1 for k in series if _is_flow(k[0])),
        },
        "population_consistency": {
            "population_normalised_records": len(pop_norm),
            "records_fully_reconstructable": len(reconstructable),
            "country_year_cells_with_population": len(pop_cells),
            "cells_with_2plus_population_sources": sum(
                1 for v in pop_cells.values() if len(v) > 1
            ),
        },
    }


def run_all(
    records: Sequence[Dict[str, Any]],
    *,
    yoy_threshold: float = DEFAULT_YOY_THRESHOLD,
    divergence_threshold: float = DEFAULT_DIVERGENCE_THRESHOLD,
    focus_countries: Optional[Sequence[str]] = None,
    year_from: Optional[int] = None,
    year_to: Optional[int] = None,
) -> Dict[str, Any]:
    """Run every check. Returns the machine-readable report dict."""
    valid, schema_findings = check_schema(records)

    findings: List[Dict[str, Any]] = list(schema_findings)
    findings += check_range_sanity(valid)
    findings += check_yoy_jumps(valid, yoy_threshold)
    findings += check_cross_source(valid, divergence_threshold)
    findings += check_population_consistency(valid)
    findings += check_duplicates(valid)

    coverage = check_coverage(valid, focus_countries, year_from, year_to)

    by_check = Counter(f["check"] for f in findings)
    by_sev = Counter(f["severity"] for f in findings)

    sources = Counter(
        f"{r['source_publisher']} :: {r['source_dataset_file']}" for r in valid
    )
    missing_url = sum(1 for r in valid if not r.get("source_url"))

    return {
        "schema_version": SCHEMA_VERSION,
        "thresholds": {
            "yoy_relative_change": yoy_threshold,
            "cross_source_divergence": divergence_threshold,
            "population_reconstruction_tolerance": POP_RECONSTRUCTION_TOLERANCE,
            "population_cross_source_tolerance": POP_CROSS_SOURCE_TOLERANCE,
        },
        "totals": {
            "records_submitted": len(records),
            "records_verified": len(valid),
            "records_rejected": len(records) - len(valid),
            "records_without_source_url": missing_url,
            "indicators": len(coverage),
            "countries": len({r["country_iso3"] for r in valid}),
            "year_min": min((r["year"] for r in valid), default=None),
            "year_max": max((r["year"] for r in valid), default=None),
        },
        "check_scope": check_scope(valid),
        "findings_by_check": dict(by_check),
        "findings_by_severity": dict(by_sev),
        "records_per_source": dict(sources),
        "findings": findings,
        "coverage": coverage,
    }


def summarise(report: Dict[str, Any], max_examples: int = 12) -> str:
    """Render the report as human-readable Markdown."""
    t = report["totals"]
    L: List[str] = []
    L.append("# Infrastructure indicator verification report")
    L.append("")
    L.append(f"Schema version `{report['schema_version']}`")
    L.append("")
    L.append("## Totals")
    L.append("")
    L.append("| metric | value |")
    L.append("|---|---:|")
    for k, v in t.items():
        L.append(f"| {k.replace('_', ' ')} | {v if v is not None else '-'} |")
    L.append("")

    L.append("## Records per source")
    L.append("")
    L.append("| source | records |")
    L.append("|---|---:|")
    for s, n in sorted(report["records_per_source"].items(), key=lambda kv: -kv[1]):
        L.append(f"| {s} | {n} |")
    L.append("")

    L.append("## What each check actually had to work on")
    L.append("")
    L.append(
        "A check reporting zero findings means nothing unless it had data to "
        "examine. These are the denominators."
    )
    L.append("")
    for check, scope in report.get("check_scope", {}).items():
        L.append(f"- **{check}**")
        for k, v in scope.items():
            if k == "note":
                continue
            L.append(f"    - {k.replace('_', ' ')}: {v}")
    L.append("")

    L.append("## Findings")
    L.append("")
    if not report["findings"]:
        L.append("No findings.")
    else:
        L.append("| severity | count |")
        L.append("|---|---:|")
        for s in ("error", "warn", "info"):
            if s in report["findings_by_severity"]:
                L.append(f"| {s} | {report['findings_by_severity'][s]} |")
        L.append("")
        L.append("| check | count |")
        L.append("|---|---:|")
        for c, n in sorted(report["findings_by_check"].items(), key=lambda kv: -kv[1]):
            L.append(f"| {c} | {n} |")
        L.append("")

        by_check: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
        for f in report["findings"]:
            by_check[f["check"]].append(f)
        sev_rank = {"error": 0, "warn": 1, "info": 2}
        for check in sorted(by_check):
            items = sorted(by_check[check], key=lambda f: sev_rank.get(f["severity"], 9))
            L.append(f"### {check} ({len(items)})")
            L.append("")
            for f in items[:max_examples]:
                rec = f.get("record") or {}
                where = ""
                iid = f.get("indicator_id") or rec.get("indicator_id")
                iso = f.get("country_iso3") or rec.get("country_iso3")
                yr = f.get("year") or rec.get("year")
                if iid:
                    where = f" `{iid}` {iso or ''} {yr or ''}".rstrip()
                L.append(f"- **{f['severity']}**{where} - {f['message']}")
                if check == "cross_source" and f.get("sources"):
                    for s in f["sources"]:
                        L.append(
                            f"    - {s['source_publisher']} = {s['value']:g} "
                            f"({(s['relative_to_median'] or 0) * 100:+.2f}% vs median) "
                            f"<{s['source_url']}>"
                        )
            if len(items) > max_examples:
                L.append(f"- _...and {len(items) - max_examples} more (see JSON report)_")
            L.append("")

    L.append("## Coverage")
    L.append("")
    L.append("| indicator | unit | basis | records | countries | years | density | sources |")
    L.append("|---|---|---|---:|---:|---|---:|---:|")
    for iid, c in sorted(report["coverage"].items()):
        yr = (
            f"{c['year_min']}-{c['year_max']}"
            if c["year_min"] is not None
            else "-"
        )
        dens = f"{c['density_pct']}%" if c["density_pct"] is not None else "-"
        L.append(
            f"| `{iid}` | {c['unit']} | {c['per_capita_basis']} | {c['n_records']} | "
            f"{c['n_countries']} | {yr} | {dens} | {len(c['sources'])} |"
        )
    L.append("")
    return "\n".join(L)


def main(argv: Optional[Sequence[str]] = None) -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    p.add_argument("--records", required=True, help="JSON file of normalised records")
    p.add_argument("--json-out", help="write machine-readable report here")
    p.add_argument("--md-out", help="write human-readable summary here")
    p.add_argument("--yoy-threshold", type=float, default=DEFAULT_YOY_THRESHOLD)
    p.add_argument("--divergence-threshold", type=float, default=DEFAULT_DIVERGENCE_THRESHOLD)
    p.add_argument("--focus-country", action="append", dest="focus_countries")
    p.add_argument("--focus-from", type=int, dest="year_from")
    p.add_argument("--focus-to", type=int, dest="year_to")
    a = p.parse_args(argv)

    with open(a.records) as fh:
        payload = json.load(fh)
    if isinstance(payload, list):
        records = payload
    else:
        import infra_store

        records = infra_store.decode(payload)

    report = run_all(
        records,
        yoy_threshold=a.yoy_threshold,
        divergence_threshold=a.divergence_threshold,
        focus_countries=a.focus_countries,
        year_from=a.year_from,
        year_to=a.year_to,
    )

    if a.json_out:
        with open(a.json_out, "w") as fh:
            json.dump(report, fh, indent=2, default=str)
    md = summarise(report)
    if a.md_out:
        with open(a.md_out, "w") as fh:
            fh.write(md)
    else:
        print(md)

    t = report["totals"]
    print(
        f"[verify] verified {t['records_verified']}/{t['records_submitted']} records, "
        f"rejected {t['records_rejected']}, "
        f"{report['findings_by_severity'].get('error', 0)} errors / "
        f"{report['findings_by_severity'].get('warn', 0)} warnings",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
