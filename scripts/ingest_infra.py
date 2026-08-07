#!/usr/bin/env python3
"""Ingest raw datasets in data/infra/raw/ into the canonical schema.

Every mapping below is declarative: raw column -> canonical indicator. Nothing
is computed except explicit, auditable arithmetic on values that are actually
present in the file (e.g. rescaling TWh to GWh, or dividing a real absolute by
a real population). If either operand is missing, no record is produced -
missing stays missing.

Run:  python3 scripts/ingest_infra.py
"""

from __future__ import annotations

import csv
import datetime as _dt
import json
import os
import sys
from typing import Any, Dict, List, Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
csv.field_size_limit(10_000_000)

from infra_schema import SchemaError, make_record  # noqa: E402

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(REPO, "data", "infra", "raw")
CLEAN = os.path.join(REPO, "data", "infra", "clean")

#: Comparator set for the "India since 2014" dashboard: large developing
#: economies India is usually benchmarked against, one advanced-economy
#: reference, plus the World aggregate.
FOCUS = {
    "IND": "India",
    "CHN": "China",
    "IDN": "Indonesia",
    "BRA": "Brazil",
    "BGD": "Bangladesh",
    "VNM": "Vietnam",
    "NGA": "Nigeria",
    "PAK": "Pakistan",
    "ZAF": "South Africa",
    "USA": "United States",
    "OWID_WRL": "World",
}

YEAR_FROM = 2000  # pre-2014 baseline is needed to show "since 2014" as a change
YEAR_TO = 2035

OWID_CO2_URL = "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv"
OWID_CO2_LANDING = "https://github.com/owid/co2-data"
OWID_ENERGY_URL = (
    "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv"
)
OWID_ENERGY_LANDING = "https://github.com/owid/energy-data"

OWID = "Our World in Data"


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
    if f != f:  # NaN
        return None
    return f


# --------------------------------------------------------------------------
# column -> indicator mappings
# --------------------------------------------------------------------------
# Each entry: (indicator_id, indicator_name, category, unit, basis,
#              absolute_source_column | None, absolute_scale, definition_note)
# `absolute_source_column` is only set for per-capita indicators where the raw
# file ALSO carries the matching absolute, so check #4 can reconstruct the
# figure. `absolute_scale` converts that absolute into the numerator unit
# implied by `unit` (e.g. TWh -> kWh is 1e9).

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
     "percent", "%", "low_carbon_share_elec", None, 1.0,
     "Renewables plus nuclear."),
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
    ("population_persons", "Population", "demographics", "count of people",
     "absolute", "population", None, 1.0,
     "OWID population series, used as the per-capita denominator in this file."),
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
    # Deliberately overlapping columns: these two also exist in the energy file.
    # Ingesting both is what makes the cross-source agreement check meaningful.
    ("primary_energy_consumption_twh", "Primary energy consumption", "energy", "TWh",
     "absolute", "primary_energy_consumption", None, 1.0,
     "Also published in owid-energy-data.csv; both retained for cross-check."),
    ("energy_per_capita_kwh", "Primary energy use per person", "energy",
     "kWh", "per capita", "energy_per_capita", "primary_energy_consumption", 1e9,
     "Also published in owid-energy-data.csv; both retained for cross-check."),
    ("population_persons", "Population", "demographics", "count of people",
     "absolute", "population", None, 1.0,
     "Also published in owid-energy-data.csv; both retained for cross-check."),
]


def ingest_owid(
    path: str,
    mapping,
    publisher: str,
    url: str,
    landing: str,
    rejects: List[Dict[str, Any]],
) -> List[Dict[str, Any]]:
    if not os.path.exists(path):
        return []
    rel = os.path.relpath(path, REPO)
    retrieved = _retrieved_at(path)
    pop_src = f"{publisher} :: {rel} :: column 'population'"
    out: List[Dict[str, Any]] = []

    with open(path, newline="") as fh:
        for row in csv.DictReader(fh):
            iso = (row.get("iso_code") or "").strip()
            if iso not in FOCUS:
                continue
            try:
                year = int(float(row["year"]))
            except (KeyError, TypeError, ValueError):
                continue
            if not (YEAR_FROM <= year <= YEAR_TO):
                continue

            pop = _num(row, "population")
            cname = (row.get("country") or FOCUS[iso]).strip()

            for (iid, iname, cat, unit, basis, col, abs_col, abs_scale, note) in mapping:
                val = _num(row, col)
                if val is None:
                    continue  # missing stays missing

                value_absolute = None
                population = None
                population_source = None
                if abs_col is not None:
                    raw_abs = _num(row, abs_col)
                    if raw_abs is not None and pop is not None:
                        value_absolute = raw_abs * abs_scale
                        population = pop
                        population_source = pop_src

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
                            population=population,
                            population_source=population_source,
                            source_publisher=publisher,
                            source_url=url,
                            source_dataset_file=rel,
                            source_column=col,
                            retrieved_at=retrieved,
                            is_estimated=False,
                            definition_note=(
                                f"{note} Dataset landing page: {landing}".strip()
                            ),
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
                            "source_dataset_file": rel,
                            "source_column": col,
                            "reason": str(e),
                        }
                    )
    return out


def derive_per_million(records: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Derive one genuinely per-million indicator to exercise that basis.

    electricity generation (TWh) -> GWh per million people, computed only where
    BOTH the real absolute and the real population for that exact country-year
    are present in the SAME source file. No imputation, no carry-forward.
    """
    pop_index: Dict[Any, Dict[str, Any]] = {}
    for r in records:
        if r["indicator_id"] == "population_persons":
            pop_index[(r["country_iso3"], r["year"], r["source_dataset_file"])] = r

    out = []
    for r in records:
        if r["indicator_id"] != "electricity_generation_twh":
            continue
        p = pop_index.get((r["country_iso3"], r["year"], r["source_dataset_file"]))
        if p is None:
            continue
        pop = float(p["value"])
        if pop <= 0:
            continue
        gwh = float(r["value"]) * 1000.0  # TWh -> GWh
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
                value=gwh / pop * 1_000_000.0,
                value_absolute=gwh,
                population=pop,
                population_source=p["source_publisher"] + " :: " + p["source_dataset_file"],
                source_publisher=r["source_publisher"],
                source_url=r["source_url"],
                source_dataset_file=r["source_dataset_file"],
                source_column="electricity_generation / population",
                retrieved_at=r["retrieved_at"],
                definition_note=(
                    "Derived by this pipeline: electricity_generation (TWh) x 1000 "
                    "divided by the population column of the same row. Both operands "
                    "are stored on the record so the figure is reconstructible."
                ),
            )
        )
    return out


def main() -> int:
    rejects: List[Dict[str, Any]] = []
    records: List[Dict[str, Any]] = []

    energy = os.path.join(RAW, "owid-energy-data.csv")
    co2 = os.path.join(RAW, "owid-co2-data.csv")

    records += ingest_owid(energy, ENERGY_MAP, OWID, OWID_ENERGY_URL,
                           OWID_ENERGY_LANDING, rejects)
    records += ingest_owid(co2, CO2_MAP, OWID, OWID_CO2_URL,
                           OWID_CO2_LANDING, rejects)
    records += derive_per_million(records)

    # Report any raw files nobody has a mapping for, so agent 1's later drops
    # are not silently ignored.
    known = {"owid-energy-data.csv", "owid-co2-data.csv"}
    unmapped = sorted(
        f for f in os.listdir(RAW) if not f.startswith(".") and f not in known
    ) if os.path.isdir(RAW) else []

    os.makedirs(CLEAN, exist_ok=True)
    payload = {
        "generated_at": _dt.datetime.now(_dt.timezone.utc).isoformat(timespec="seconds"),
        "generator": "scripts/ingest_infra.py",
        "n_records": len(records),
        "focus_countries": FOCUS,
        "year_from": YEAR_FROM,
        "unmapped_raw_files": unmapped,
        "records": records,
    }
    with open(os.path.join(CLEAN, "indicators.json"), "w") as fh:
        json.dump(payload, fh, indent=1, default=str)

    with open(os.path.join(CLEAN, "ingest_rejects.json"), "w") as fh:
        json.dump({"n": len(rejects), "rejects": rejects}, fh, indent=1, default=str)

    print(f"records: {len(records)}  rejects: {len(rejects)}  unmapped files: {unmapped}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
