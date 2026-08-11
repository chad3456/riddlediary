#!/usr/bin/env python3
"""Ingest raw datasets in data/infra/raw/ into the canonical schema.

Every mapping below is declarative: raw column -> canonical indicator. Nothing
is computed except explicit, auditable arithmetic on values that are actually
present in the file (e.g. rescaling TWh to GWh, or dividing a real absolute by
a real population). If either operand is missing, no record is produced -
missing stays missing.

COUNTRY SCOPE: every entity with a valid ISO 3166-1 alpha-3 code is retained,
so India can be compared against any country the source covers. A curated set
of OWID regional/income aggregates is additionally retained under synthetic
OWID_* codes, which ``infra_schema.is_aggregate`` recognises so the UI can keep
them off country rankings.

Run:  python3 scripts/ingest_infra.py
"""

from __future__ import annotations

import csv
import datetime as _dt
import json
import os
import sys
from typing import Any, Dict, List, Optional, Tuple

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
csv.field_size_limit(10_000_000)

import infra_store  # noqa: E402
from infra_schema import (  # noqa: E402
    POPULATION_NORMALISED,
    SchemaError,
    is_aggregate,
    make_record,
    validate,
)

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(REPO, "data", "infra", "raw")
POP_DIR = os.path.join(REPO, "data", "infra", "population")
CLEAN = os.path.join(REPO, "data", "infra", "clean")

#: Non-country entities worth charting as reference lines. OWID leaves
#: iso_code blank for these, so they are matched by exact country name and
#: given a synthetic code. Anything not listed here and lacking an ISO3 code is
#: dropped - "Asia (Ember)" and "Asia (GCP)" are the same continent measured by
#: different upstreams and would silently double-count.
AGGREGATE_NAME_MAP = {
    "World": ("OWID_WRL", "World"),
    "Africa": ("OWID_AFR", "Africa"),
    "Asia": ("OWID_ASI", "Asia"),
    "Europe": ("OWID_EUR", "Europe"),
    "North America": ("OWID_NAM", "North America"),
    "South America": ("OWID_SAM", "South America"),
    "Oceania": ("OWID_OCE", "Oceania"),
    "European Union (27)": ("OWID_EU27", "European Union (27)"),
    "High-income countries": ("OWID_HIC", "High-income countries"),
    "Upper-middle-income countries": ("OWID_UMC", "Upper-middle-income countries"),
    "Lower-middle-income countries": ("OWID_LMC", "Lower-middle-income countries"),
    "Low-income countries": ("OWID_LIC", "Low-income countries"),
}

#: The brief is "since 2014", but a pre-2014 baseline is what makes a "since
#: 2014" claim legible - without it the reader cannot see whether a trend
#: started in 2014 or was already running.
YEAR_FROM = 2000
YEAR_TO = 2035

OWID = "Our World in Data"

OWID_CO2_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
OWID_ENERGY_URL = (
    "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
)
WB_POP_URL = "https://github.com/datasets/population"
OWID_POP_URL = "https://github.com/owid/co2-data"

#: Ultimate upstreams. Files sharing a lineage string are siblings, not
#: independent witnesses - see infra_schema.source_lineage.
LINEAGE_POP = "UN World Population Prospects / World Bank"
LINEAGE_ENERGY = "Energy Institute / Ember / EIA (via OWID)"
LINEAGE_CARBON = "Global Carbon Project / Jones et al. (via OWID)"

SOURCES = {
    "owid_energy": {
        "publisher": OWID,
        "file": "data/infra/raw/owid-energy-data.csv",
        "url": OWID_ENERGY_URL,
        "landing_page": "https://github.com/owid/energy-data",
        "lineage": LINEAGE_ENERGY,
    },
    "owid_co2": {
        "publisher": OWID,
        "file": "data/infra/raw/owid-co2-data.csv",
        "url": OWID_CO2_URL,
        "landing_page": "https://github.com/owid/co2-data",
        "lineage": LINEAGE_CARBON,
    },
    "worldbank_population": {
        "publisher": "World Bank (via datasets/population)",
        "file": "data/infra/population/population_worldbank.csv",
        "url": WB_POP_URL,
        "landing_page": WB_POP_URL,
        "lineage": LINEAGE_POP,
    },
    "owid_population": {
        "publisher": OWID,
        "file": "data/infra/population/population_owid.csv",
        "url": OWID_POP_URL,
        "landing_page": OWID_POP_URL,
        "lineage": LINEAGE_POP,
    },
}

#: Short, stable label written into every record's population_source. Kept
#: terse deliberately: it is repeated on every one of ~200k records, and the
#: full URL/landing page for each key lives in the file's `sources` registry.
POP_SOURCE_LABEL = {
    "worldbank_population": "World Bank (data/infra/population/population_worldbank.csv)",
    "owid_population": "OWID (data/infra/population/population_owid.csv)",
}


def _retrieved_at(path: str) -> str:
    """Download date taken from the raw file's mtime - we did not fetch it."""
    return _dt.date.fromtimestamp(os.path.getmtime(path)).isoformat()


def _num(row: Dict[str, str], col: str) -> Optional[float]:
    """Parse a numeric cell. Blank/absent/unparseable -> None (never 0)."""
    v = row.get(col)
    if v is None:
        return None
    v = v.strip()
    if v == "" or v.upper() in ("NA", "N/A", "NAN", "NULL"):
        return None
    try:
        f = float(v)
    except ValueError:
        return None
    if f != f:
        return None
    return f


def _entity(row: Dict[str, str]) -> Optional[Tuple[str, str]]:
    """Resolve a raw row to (iso3_or_aggregate_code, display_name), or None."""
    iso = (row.get("iso_code") or "").strip().upper()
    name = (row.get("country") or "").strip()
    if len(iso) == 3 and iso.isalpha():
        return iso, name or iso
    if name in AGGREGATE_NAME_MAP:
        return AGGREGATE_NAME_MAP[name]
    return None


# --------------------------------------------------------------------------
# population denominators
# --------------------------------------------------------------------------

def load_population() -> Tuple[Dict[Tuple[str, int], Tuple[float, str]], Dict[str, int]]:
    """Build the canonical (iso3, year) -> (population, source_key) index.

    World Bank is primary; OWID fills country-years the World Bank file does
    not cover. They are NOT averaged and NOT reconciled - one is chosen, and
    which one is recorded on every record that uses it. Their agreement is
    separately verified by ingesting both as `population_persons` indicator
    records and letting the cross-source check compare them (flagged
    non-independent, since they share the UN WPP / World Bank lineage).
    """
    index: Dict[Tuple[str, int], Tuple[float, str]] = {}
    stats = {"worldbank": 0, "owid_fallback": 0}

    wb = os.path.join(POP_DIR, "population_worldbank.csv")
    if os.path.exists(wb):
        with open(wb, newline="") as fh:
            for row in csv.DictReader(fh):
                iso = (row.get("Country Code") or "").strip().upper()
                if not (len(iso) == 3 and iso.isalpha()):
                    continue
                try:
                    year = int(float(row["Year"]))
                    val = float(row["Value"])
                except (KeyError, TypeError, ValueError):
                    continue
                if val <= 0:
                    continue
                index[(iso, year)] = (val, "worldbank_population")
                stats["worldbank"] += 1

    ow = os.path.join(POP_DIR, "population_owid.csv")
    if os.path.exists(ow):
        with open(ow, newline="") as fh:
            for row in csv.DictReader(fh):
                iso = (row.get("iso_code") or "").strip().upper()
                if not (len(iso) == 3 and iso.isalpha()):
                    continue
                try:
                    year = int(float(row["year"]))
                    val = float(row["population"])
                except (KeyError, TypeError, ValueError):
                    continue
                if val <= 0 or (iso, year) in index:
                    continue
                index[(iso, year)] = (val, "owid_population")
                stats["owid_fallback"] += 1

    return index, stats


def population_records(rejects: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Emit population itself as an indicator, from BOTH vendored files.

    Ingesting both is what lets the cross-source check actually compare them
    rather than us asserting in prose that they agree.
    """
    out: List[Dict[str, Any]] = []

    specs = [
        ("worldbank_population", "population_worldbank.csv",
         "Country Code", "Country Name", "Year", "Value"),
        ("owid_population", "population_owid.csv",
         "iso_code", "country", "year", "population"),
    ]
    for key, fname, iso_col, name_col, year_col, val_col in specs:
        path = os.path.join(POP_DIR, fname)
        if not os.path.exists(path):
            continue
        src = SOURCES[key]
        retrieved = _retrieved_at(path)
        with open(path, newline="") as fh:
            for row in csv.DictReader(fh):
                iso = (row.get(iso_col) or "").strip().upper()
                if not (len(iso) == 3 and iso.isalpha()):
                    continue
                try:
                    year = int(float(row[year_col]))
                    val = float(row[val_col])
                except (KeyError, TypeError, ValueError):
                    continue
                if not (YEAR_FROM <= year <= YEAR_TO) or val <= 0:
                    continue
                try:
                    out.append(
                        make_record(
                            indicator_id="population_persons",
                            indicator_name="Population",
                            category="demographics",
                            unit="count of people",
                            per_capita_basis="absolute",
                            country_iso3=iso,
                            country_name=(row.get(name_col) or iso).strip(),
                            year=year,
                            value=val,
                            source_publisher=src["publisher"],
                            source_url=src["url"],
                            source_dataset_file=src["file"],
                            source_column=val_col,
                            source_lineage=src["lineage"],
                            retrieved_at=retrieved,
                            definition_note=(
                                "Per-capita denominator. Shares the UN WPP / "
                                "World Bank lineage with the other population "
                                "file, so the two corroborate transit integrity, "
                                "not each other's accuracy."
                            ),
                        )
                    )
                except SchemaError as e:
                    rejects.append(
                        {
                            "indicator_id": "population_persons",
                            "country_iso3": iso,
                            "year": year,
                            "value": val,
                            "source_dataset_file": src["file"],
                            "reason": str(e),
                        }
                    )
    return out


# --------------------------------------------------------------------------
# column -> indicator mappings
# --------------------------------------------------------------------------
# (indicator_id, name, category, unit, basis, value_column,
#  absolute_column | None, absolute_scale, definition_note)

ENERGY_MAP = [
    ("electricity_generation_twh", "Electricity generation", "electricity", "TWh",
     "absolute", "electricity_generation", None, 1.0, ""),
    ("electricity_demand_twh", "Electricity demand", "electricity", "TWh",
     "absolute", "electricity_demand", None, 1.0, ""),
    ("solar_electricity_twh", "Solar electricity generation", "electricity", "TWh",
     "absolute", "solar_electricity", None, 1.0, ""),
    ("wind_electricity_twh", "Wind electricity generation", "electricity", "TWh",
     "absolute", "wind_electricity", None, 1.0, ""),
    ("hydro_electricity_twh", "Hydro electricity generation", "electricity", "TWh",
     "absolute", "hydro_electricity", None, 1.0, ""),
    ("nuclear_electricity_twh", "Nuclear electricity generation", "electricity", "TWh",
     "absolute", "nuclear_electricity", None, 1.0, ""),
    ("coal_electricity_twh", "Coal electricity generation", "electricity", "TWh",
     "absolute", "coal_electricity", None, 1.0, ""),
    ("renewables_electricity_twh", "Renewable electricity generation", "electricity",
     "TWh", "absolute", "renewables_electricity", None, 1.0, ""),
    ("renewables_share_elec_pct", "Renewables share of electricity", "electricity",
     "percent", "%", "renewables_share_elec", None, 1.0, ""),
    ("low_carbon_share_elec_pct", "Low-carbon share of electricity", "electricity",
     "percent", "%", "low_carbon_share_elec", None, 1.0, "Renewables plus nuclear."),
    ("fossil_share_elec_pct", "Fossil share of electricity", "electricity",
     "percent", "%", "fossil_share_elec", None, 1.0, ""),
    ("solar_share_elec_pct", "Solar share of electricity", "electricity",
     "percent", "%", "solar_share_elec", None, 1.0, ""),
    ("primary_energy_consumption_twh", "Primary energy consumption", "energy", "TWh",
     "absolute", "primary_energy_consumption", None, 1.0,
     "Substitution method; comparable across fuels."),
    ("energy_per_capita_kwh", "Primary energy use per person", "energy",
     "kWh", "per capita", "energy_per_capita", "primary_energy_consumption", 1e9, ""),
    ("electricity_per_capita_kwh", "Electricity generation per person", "electricity",
     "kWh", "per capita", "per_capita_electricity", "electricity_generation", 1e9, ""),
    ("solar_elec_per_capita_kwh", "Solar electricity per person", "electricity",
     "kWh", "per capita", "solar_elec_per_capita", "solar_electricity", 1e9, ""),
    ("wind_elec_per_capita_kwh", "Wind electricity per person", "electricity",
     "kWh", "per capita", "wind_elec_per_capita", "wind_electricity", 1e9, ""),
]

CO2_MAP = [
    ("co2_emissions_mt", "CO2 emissions", "emissions", "million tonnes",
     "absolute", "co2", None, 1.0, "Production-based, fossil fuels and industry."),
    ("co2_per_capita_t", "CO2 emissions per person", "emissions", "tonnes",
     "per capita", "co2_per_capita", "co2", 1e6, "Production-based."),
    ("cement_co2_mt", "CO2 from cement production", "emissions", "million tonnes",
     "absolute", "cement_co2", None, 1.0,
     "Proxy for construction/infrastructure activity."),
    ("coal_co2_mt", "CO2 from coal", "emissions", "million tonnes",
     "absolute", "coal_co2", None, 1.0, ""),
    ("methane_mt_co2e", "Methane emissions", "emissions", "million tonnes",
     "absolute", "methane", None, 1.0, "CO2-equivalent, 100-year GWP."),
    ("total_ghg_mt_co2e", "Total greenhouse gas emissions", "emissions",
     "million tonnes", "absolute", "total_ghg", None, 1.0,
     "CO2-equivalent including land use."),
    # Deliberately overlapping with the energy file. Ingesting both copies is
    # what gives the cross-source agreement check something real to compare.
    ("primary_energy_consumption_twh", "Primary energy consumption", "energy", "TWh",
     "absolute", "primary_energy_consumption", None, 1.0,
     "Also published in owid-energy-data.csv; both retained for cross-check."),
    ("energy_per_capita_kwh", "Primary energy use per person", "energy",
     "kWh", "per capita", "energy_per_capita", "primary_energy_consumption", 1e9,
     "Also published in owid-energy-data.csv; both retained for cross-check."),
]


def ingest_owid(
    source_key: str,
    mapping,
    pop_index: Dict[Tuple[str, int], Tuple[float, str]],
    rejects: List[Dict[str, Any]],
    counters: Dict[str, int],
) -> List[Dict[str, Any]]:
    src = SOURCES[source_key]
    path = os.path.join(REPO, src["file"])
    if not os.path.exists(path):
        return []
    retrieved = _retrieved_at(path)
    out: List[Dict[str, Any]] = []

    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            ent = _entity(row)
            if ent is None:
                counters["rows_skipped_no_iso3"] += 1
                continue
            iso, cname = ent
            try:
                year = int(float(row["year"]))
            except (KeyError, TypeError, ValueError):
                continue
            if not (YEAR_FROM <= year <= YEAR_TO):
                continue

            # TWO different denominators, deliberately.
            #
            # `own` is the population column of this very file - the number the
            # publisher itself divided by to produce its per-capita columns.
            # `canon` is our canonical vendored denominator (World Bank first,
            # OWID filling gaps), which is what the dashboard should divide an
            # ABSOLUTE by when the user asks for a per-capita view.
            #
            # These are not interchangeable, and they do not always agree (see
            # the cross-source findings on population_persons). Attaching the
            # canonical denominator to a publisher's own per-capita figure would
            # make a correct figure look broken; attaching the publisher's
            # denominator to an absolute would make the dashboard's own
            # normalisation unreproducible. So each value carries the
            # denominator that actually belongs to it.
            own = _num(row, "population")
            own = own if (own is not None and own > 0) else None
            canon_entry = pop_index.get((iso, year))
            if canon_entry is not None:
                canon_val, canon_label = canon_entry[0], POP_SOURCE_LABEL[canon_entry[1]]
            elif own is not None:
                canon_val = own
                canon_label = f"{src['publisher']} ({src['file']})"
                counters["population_from_own_file"] += 1
            else:
                canon_val, canon_label = None, None
                counters["population_unavailable"] += 1

            own_label = f"{src['publisher']} ({src['file']}, own population column)"

            for (iid, iname, cat, unit, basis, col, abs_col, abs_scale, note) in mapping:
                val = _num(row, col)
                if val is None:
                    continue  # missing stays missing

                if basis in POPULATION_NORMALISED:
                    pop_val, pop_label = own, (own_label if own is not None else None)
                else:
                    pop_val, pop_label = canon_val, canon_label

                value_absolute = None
                if abs_col is not None:
                    raw_abs = _num(row, abs_col)
                    if raw_abs is not None and pop_val is not None:
                        value_absolute = raw_abs * abs_scale

                try:
                    out.append(
                        make_record(
                            indicator_id=iid,
                            indicator_name=iname,
                            category=cat,
                            unit=unit,
                            per_capita_basis=basis,
                            country_iso3=iso,
                            country_name=cname,
                            year=year,
                            value=val,
                            value_absolute=value_absolute,
                            population=pop_val,
                            population_source=pop_label,
                            source_publisher=src["publisher"],
                            source_url=src["url"],
                            source_dataset_file=src["file"],
                            source_column=col,
                            source_lineage=src["lineage"],
                            retrieved_at=retrieved,
                            is_estimated=False,
                            definition_note=note,
                            break_in_series=False,
                        )
                    )
                except SchemaError as e:
                    rejects.append(
                        {
                            "indicator_id": iid,
                            "country_iso3": iso,
                            "year": year,
                            "value": val,
                            "source_dataset_file": src["file"],
                            "source_column": col,
                            "reason": str(e),
                        }
                    )
    return out


def derive_per_million(
    records: List[Dict[str, Any]],
    rejects: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    """Derive electricity generation per million people.

    Computed only where BOTH the real absolute and a real population for that
    exact country-year exist. No imputation, no carry-forward, no smoothing.
    Both operands are stored on the derived record so a reviewer can redo the
    division by hand.
    """
    out = []
    for r in records:
        if r["indicator_id"] != "electricity_generation_twh":
            continue
        pop = r.get("population")
        if pop is None or float(pop) <= 0:
            continue
        gwh = float(r["value"]) * 1000.0  # TWh -> GWh
        try:
            out.append(
                make_record(
                    indicator_id="electricity_generation_gwh_per_million_people",
                    indicator_name="Electricity generation per million people",
                    category="electricity",
                    unit="GWh",
                    per_capita_basis="per million people",
                    country_iso3=r["country_iso3"],
                    country_name=r["country_name"],
                    year=r["year"],
                    value=gwh / float(pop) * 1_000_000.0,
                    value_absolute=gwh,
                    population=float(pop),
                    population_source=r["population_source"],
                    source_publisher=r["source_publisher"],
                    source_url=r["source_url"],
                    source_dataset_file=r["source_dataset_file"],
                    source_column="electricity_generation / population",
                    source_lineage=r.get("source_lineage"),
                    retrieved_at=r["retrieved_at"],
                    definition_note=(
                        "Derived by this pipeline: electricity_generation (TWh) "
                        "x 1000, divided by the population denominator stored on "
                        "this record."
                    ),
                )
            )
        except SchemaError as e:
            rejects.append(
                {
                    "indicator_id": "electricity_generation_gwh_per_million_people",
                    "country_iso3": r["country_iso3"],
                    "year": r["year"],
                    "reason": str(e),
                }
            )
    return out


def main() -> int:
    rejects: List[Dict[str, Any]] = []
    counters: Dict[str, int] = {
        "rows_skipped_no_iso3": 0,
        "population_from_own_file": 0,
        "population_unavailable": 0,
    }

    pop_index, pop_stats = load_population()
    print(
        f"population index: {len(pop_index)} country-years "
        f"(World Bank {pop_stats['worldbank']}, OWID fallback {pop_stats['owid_fallback']})"
    )

    records: List[Dict[str, Any]] = []
    records += ingest_owid("owid_energy", ENERGY_MAP, pop_index, rejects, counters)
    records += ingest_owid("owid_co2", CO2_MAP, pop_index, rejects, counters)
    records += population_records(rejects)
    records += derive_per_million(records, rejects)

    known = {"owid-energy-data.csv", "owid-co2-data.csv"}
    unmapped = (
        sorted(f for f in os.listdir(RAW) if not f.startswith(".") and f not in known)
        if os.path.isdir(RAW)
        else []
    )

    countries = {r["country_iso3"] for r in records if not is_aggregate(r["country_iso3"])}
    aggregates = {r["country_iso3"] for r in records if is_aggregate(r["country_iso3"])}
    indicators = {r["indicator_id"] for r in records}
    with_pop = sum(1 for r in records if r.get("population") is not None)

    os.makedirs(CLEAN, exist_ok=True)
    meta = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "generator": "scripts/ingest_infra.py",
        "schema_module": "scripts/infra_schema.py",
        "store_module": "scripts/infra_store.py",
        "n_countries": len(countries),
        "n_aggregates": len(aggregates),
        "n_indicators": len(indicators),
        "records_with_population_denominator": with_pop,
        "year_from": YEAR_FROM,
        "sources": SOURCES,
        "aggregate_codes": {v[0]: v[1] for v in AGGREGATE_NAME_MAP.values()},
        "unmapped_raw_files": unmapped,
        "ingest_counters": counters,
    }
    out_path = os.path.join(CLEAN, "indicators.json")
    size = infra_store.save(records, out_path, meta)

    with open(os.path.join(CLEAN, "ingest_rejects.json"), "w") as fh:
        json.dump({"n": len(rejects), "rejects": rejects}, fh, indent=1, default=str)

    # Per-indicator split so the dashboard can lazy-load one chart's data
    # instead of the whole corpus.
    by_ind_dir = os.path.join(CLEAN, "by_indicator")
    os.makedirs(by_ind_dir, exist_ok=True)
    index = []
    for iid in sorted(indicators):
        subset = [r for r in records if r["indicator_id"] == iid]
        p = os.path.join(by_ind_dir, f"{iid}.json")
        sz = infra_store.save(subset, p, {"indicator_id": iid, "sources": SOURCES})
        index.append(
            {
                "indicator_id": iid,
                "indicator_name": subset[0]["indicator_name"],
                "category": subset[0]["category"],
                "unit": subset[0]["unit"],
                "per_capita_basis": subset[0]["per_capita_basis"],
                "n_records": len(subset),
                "n_countries": len({r["country_iso3"] for r in subset}),
                "year_min": min(r["year"] for r in subset),
                "year_max": max(r["year"] for r in subset),
                "file": os.path.relpath(p, REPO),
                "bytes": sz,
            }
        )
    with open(os.path.join(by_ind_dir, "index.json"), "w") as fh:
        json.dump({"indicators": index, "sources": SOURCES}, fh, indent=1, default=str)

    # Prove the compact encoding round-trips to records that still satisfy the
    # schema - compression must never quietly become data loss.
    reloaded = infra_store.load(out_path)
    assert len(reloaded) == len(records), "round-trip lost records"
    for r in reloaded[:: max(1, len(reloaded) // 500)]:
        validate(r)

    size_mb = size / 1e6
    print(
        f"records: {len(records)}  countries: {len(countries)}  "
        f"aggregates: {len(aggregates)}  indicators: {len(indicators)}"
    )
    if records:
        print(
            f"records carrying a population denominator: {with_pop} "
            f"({100.0 * with_pop / len(records):.1f}%)"
        )
    print(f"rejects: {len(rejects)}  unmapped raw files: {unmapped}")
    print(f"indicators.json: {size_mb:.1f} MB (round-trip verified)")
    print(f"per-indicator split: {len(index)} files in {os.path.relpath(by_ind_dir, REPO)}")
    if size_mb > 15:
        print("WARNING: indicators.json exceeds 15 MB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
