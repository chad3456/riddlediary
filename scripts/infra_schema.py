"""Canonical normalised indicator record schema for the
"India infrastructure since 2014" comparison dashboard.

WHY THIS EXISTS
---------------
The dashboard mixes sources (Our World in Data, World Bank, national
statistical offices, ministry dashboards). Each publishes different
column names, different units, different country codings and different
vintages of the same underlying number. Everything that reaches the
front-end must first be flattened into ONE record shape so that:

  * multiple countries can be plotted on the same axis,
  * a raw count can be turned into a per-capita / per-million figure
    *reproducibly* (the denominator travels with the record),
  * every single plotted point can be traced back to a URL and a file
    on disk, and
  * known data-quality caveats (estimates, definitional changes,
    breaks in series) are visible rather than silently smoothed over.

HARD RULE ENFORCED BY THIS MODULE
---------------------------------
A record must never be synthesised. There is no "impute", no "fill",
no "interpolate" anywhere in this pipeline. If a country-year is not
in a source, it does not become a record. `validate()` will reject a
record with a null `value`, and rejects any record lacking a real
`source_url`.

RECORD SHAPE
------------
One record == one (indicator, country, year, source) observation.

Identity / taxonomy
~~~~~~~~~~~~~~~~~~~
indicator_id : str
    Stable machine slug, snake_case, e.g. "electricity_generation_twh".
    This is the join key across sources; two sources reporting the same
    concept MUST share the indicator_id so the cross-source divergence
    check can find them.
indicator_name : str
    Human-readable label for the chart axis/legend.
category : str
    One of CATEGORIES. Groups indicators into dashboard sections.
unit : str
    Physical unit of `value` as stored, e.g. "TWh", "tonnes CO2",
    "percent", "km". Free text but should be consistent per
    indicator_id.
per_capita_basis : str
    One of PER_CAPITA_BASES. Declares what `value` is normalised by.
    "absolute" means the value is a raw total, not normalised.
    This is what lets the UI say "per million people" honestly.

Observation
~~~~~~~~~~~
country_iso3 : str
    ISO 3166-1 alpha-3, uppercase, 3 chars. Aggregates that have no
    ISO3 code (e.g. "World", "Asia") are given a synthetic code from
    AGGREGATE_CODES so they are never mistaken for a country.
country_name : str
    Display name as published by the source.
year : int
    Calendar (or fiscal, see definition_note) year. Bounded by
    MIN_YEAR/MAX_YEAR to catch column-misalignment bugs.
value : float
    The observation. Never None. Never imputed.

Denominator provenance (for check #4, population consistency)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
value_absolute : float | None
    The un-normalised total this record was derived from, when the
    record is a per-capita/per-million figure that WE computed. If the
    source published the per-capita figure directly, this may be the
    source's own absolute column (so the two can be reconciled), or
    None if no absolute figure was available.
population : float | None
    The population denominator actually used, in persons. Required
    whenever per_capita_basis is a population-normalised basis AND
    value_absolute is present, because check #4 reconstructs
    value == value_absolute / population * basis_multiplier.
population_source : str | None
    Where that population number came from (publisher + dataset file).
    Deliberately separate from source_publisher: it is extremely
    common for the numerator and denominator to come from different
    places, and that is a real source of spurious divergence.

Provenance (mandatory on every record)
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
source_publisher : str
    Organisation that published the number, e.g. "Our World in Data",
    "World Bank", "Ministry of Road Transport & Highways".
source_url : str
    Real, resolvable http(s) URL to the dataset or its landing page.
    Required. A record without one is rejected.
source_dataset_file : str
    Path (repo-relative) of the raw file on disk this was parsed from,
    so a reviewer can re-derive the number.
retrieved_at : str
    ISO-8601 date/datetime the raw file was downloaded.
source_column : str | None
    The original column/field name in the raw file. Optional but
    strongly recommended - it is the fastest way to audit a mapping.

Quality flags
~~~~~~~~~~~~~
is_estimated : bool
    True if the publisher marks this figure as an estimate,
    provisional, projected or modelled rather than observed/reported.
definition_note : str
    Free text caveat: fiscal-year basis, coverage change, scope
    ("IPC only"), or the publisher's own footnote. Empty string when
    there is nothing to say.
break_in_series : bool
    True if the publisher flags a discontinuity at this year such that
    comparison with the prior year is invalid. The dashboard should
    draw a gap, not a line, across such a point.

USAGE
-----
    from infra_schema import make_record, validate
    rec = make_record(indicator_id="...", ...)
    validate(rec)          # raises SchemaError on violation
"""

from __future__ import annotations

import math
import re
from typing import Any, Dict, Optional

SCHEMA_VERSION = "1.0.0"

# --------------------------------------------------------------------------
# Controlled vocabularies
# --------------------------------------------------------------------------

CATEGORIES = {
    "energy",
    "electricity",
    "emissions",
    "transport",
    "telecom",
    "water_sanitation",
    "urban",
    "health_infrastructure",
    "education_infrastructure",
    "finance",
    "demographics",
    "economy",
    "other",
}

#: per_capita_basis -> multiplier applied to (absolute / population).
#: "absolute" and "%" and "ratio" are not population-normalised and map to None.
PER_CAPITA_BASES: Dict[str, Optional[float]] = {
    "absolute": None,
    "%": None,
    "ratio": None,
    "index": None,
    "per capita": 1.0,
    "per 1000 people": 1_000.0,
    "per 100000 people": 100_000.0,
    "per million people": 1_000_000.0,
}

#: Bases that require a population denominator to be auditable.
POPULATION_NORMALISED = {b for b, m in PER_CAPITA_BASES.items() if m is not None}

#: Units whose values are percentages and must sit within [0, 100].
PERCENT_UNITS = {"percent", "%", "percentage", "pct"}

#: Indicators that are counts/stocks and can never be negative.
#: (Flows such as net trade or year-on-year change legitimately can be,
#: so negativity is checked against unit/indicator semantics, not blanket.)
NON_NEGATIVE_UNIT_HINTS = (
    "count",
    "number",
    "km",
    "twh",
    "kwh",
    "tonnes",
    "people",
    "persons",
    "units",
    "subscriptions",
)

MIN_YEAR = 1960
MAX_YEAR = 2035  # generous upper bound; catches 20134-style typos

#: Synthetic codes for non-country aggregates so they can be filtered out
#: of country comparisons but still charted as reference lines.
AGGREGATE_CODES = {
    "OWID_WRL",
    "OWID_ASI",
    "OWID_EUR",
    "OWID_AFR",
    "OWID_NAM",
    "OWID_SAM",
    "OWID_OCE",
    "OWID_EU27",
    "OWID_EU28",
    "OWID_HIC",
    "OWID_UMC",
    "OWID_LMC",
    "OWID_LIC",
    "AGG_OTHER",
}

_ISO3_RE = re.compile(r"^[A-Z]{3}$")
_SLUG_RE = re.compile(r"^[a-z][a-z0-9_]*$")
_URL_RE = re.compile(r"^https?://[^\s]+\.[^\s]+", re.IGNORECASE)
_DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}([T ].*)?$")

FIELDS = (
    "indicator_id",
    "indicator_name",
    "category",
    "unit",
    "per_capita_basis",
    "country_iso3",
    "country_name",
    "year",
    "value",
    "value_absolute",
    "population",
    "population_source",
    "source_publisher",
    "source_url",
    "source_dataset_file",
    "source_column",
    "retrieved_at",
    "is_estimated",
    "definition_note",
    "break_in_series",
)

REQUIRED_FIELDS = (
    "indicator_id",
    "indicator_name",
    "category",
    "unit",
    "per_capita_basis",
    "country_iso3",
    "country_name",
    "year",
    "value",
    "source_publisher",
    "source_url",
    "source_dataset_file",
    "retrieved_at",
    "is_estimated",
    "definition_note",
    "break_in_series",
)


class SchemaError(ValueError):
    """Raised when a record violates the canonical schema."""


def is_aggregate(country_iso3: str) -> bool:
    """True if the code denotes a region/income-group aggregate, not a country."""
    return country_iso3 in AGGREGATE_CODES or country_iso3.startswith("OWID_")


def basis_multiplier(per_capita_basis: str) -> Optional[float]:
    """Return the multiplier for a population-normalised basis, else None."""
    return PER_CAPITA_BASES.get(per_capita_basis)


def make_record(
    *,
    indicator_id: str,
    indicator_name: str,
    category: str,
    unit: str,
    per_capita_basis: str,
    country_iso3: str,
    country_name: str,
    year: int,
    value: float,
    source_publisher: str,
    source_url: str,
    source_dataset_file: str,
    retrieved_at: str,
    value_absolute: Optional[float] = None,
    population: Optional[float] = None,
    population_source: Optional[str] = None,
    source_column: Optional[str] = None,
    is_estimated: bool = False,
    definition_note: str = "",
    break_in_series: bool = False,
    validate_now: bool = True,
) -> Dict[str, Any]:
    """Build a canonical record dict. Validates by default.

    Keyword-only on purpose: positional args on a 20-field record are how
    column-misalignment bugs get in.
    """
    rec: Dict[str, Any] = {
        "indicator_id": indicator_id,
        "indicator_name": indicator_name,
        "category": category,
        "unit": unit,
        "per_capita_basis": per_capita_basis,
        "country_iso3": country_iso3,
        "country_name": country_name,
        "year": year,
        "value": value,
        "value_absolute": value_absolute,
        "population": population,
        "population_source": population_source,
        "source_publisher": source_publisher,
        "source_url": source_url,
        "source_dataset_file": source_dataset_file,
        "source_column": source_column,
        "retrieved_at": retrieved_at,
        "is_estimated": bool(is_estimated),
        "definition_note": definition_note or "",
        "break_in_series": bool(break_in_series),
    }
    if validate_now:
        validate(rec)
    return rec


def validate(record: Dict[str, Any]) -> Dict[str, Any]:
    """Validate one canonical record in place. Raises SchemaError on violation.

    Checks, in order:
      1. no unknown fields, all required fields present and non-None
      2. indicator_id / category / per_capita_basis vocabularies
      3. country_iso3 shape (ISO3 or a declared aggregate code)
      4. year is an int within [MIN_YEAR, MAX_YEAR]
      5. value is a finite real number (never None, never NaN/inf)
      6. percent-unit values sit within [0, 100]
      7. population-normalised records carry a usable, positive population
         and a population_source whenever value_absolute is supplied
      8. source_url is a real http(s) URL; retrieved_at is ISO-8601-ish
      9. flag fields are genuine bools, definition_note a str

    Returns the record so it can be used as ``recs.append(validate(r))``.
    """
    if not isinstance(record, dict):
        raise SchemaError(f"record must be a dict, got {type(record).__name__}")

    unknown = set(record) - set(FIELDS)
    if unknown:
        raise SchemaError(f"unknown field(s): {sorted(unknown)}")

    for f in REQUIRED_FIELDS:
        if f not in record:
            raise SchemaError(f"missing required field: {f}")
        if record[f] is None:
            raise SchemaError(
                f"field {f!r} is None; missing data must be dropped, not stored as null"
            )

    # --- taxonomy -------------------------------------------------------
    iid = record["indicator_id"]
    if not isinstance(iid, str) or not _SLUG_RE.match(iid):
        raise SchemaError(f"indicator_id must be a snake_case slug, got {iid!r}")

    if not isinstance(record["indicator_name"], str) or not record["indicator_name"].strip():
        raise SchemaError(f"indicator_name must be a non-empty string ({iid})")

    if record["category"] not in CATEGORIES:
        raise SchemaError(
            f"category {record['category']!r} not in CATEGORIES ({iid})"
        )

    if not isinstance(record["unit"], str) or not record["unit"].strip():
        raise SchemaError(f"unit must be a non-empty string ({iid})")

    basis = record["per_capita_basis"]
    if basis not in PER_CAPITA_BASES:
        raise SchemaError(
            f"per_capita_basis {basis!r} not in PER_CAPITA_BASES ({iid}); "
            f"allowed: {sorted(PER_CAPITA_BASES)}"
        )

    # --- observation ----------------------------------------------------
    iso3 = record["country_iso3"]
    if not isinstance(iso3, str):
        raise SchemaError(f"country_iso3 must be a string ({iid})")
    if not (_ISO3_RE.match(iso3) or iso3 in AGGREGATE_CODES):
        raise SchemaError(
            f"country_iso3 {iso3!r} is neither ISO3 nor a declared aggregate code ({iid})"
        )
    if not isinstance(record["country_name"], str) or not record["country_name"].strip():
        raise SchemaError(f"country_name must be a non-empty string ({iid})")

    year = record["year"]
    if isinstance(year, bool) or not isinstance(year, int):
        raise SchemaError(f"year must be an int, got {year!r} ({iid})")
    if not (MIN_YEAR <= year <= MAX_YEAR):
        raise SchemaError(f"year {year} outside [{MIN_YEAR},{MAX_YEAR}] ({iid})")

    value = record["value"]
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        raise SchemaError(f"value must be a number, got {value!r} ({iid} {iso3} {year})")
    if not math.isfinite(float(value)):
        raise SchemaError(f"value must be finite, got {value!r} ({iid} {iso3} {year})")

    # --- unit-driven range sanity --------------------------------------
    if record["unit"].strip().lower() in PERCENT_UNITS or basis == "%":
        if not (0.0 <= float(value) <= 100.0):
            raise SchemaError(
                f"percentage value {value} outside [0,100] ({iid} {iso3} {year})"
            )

    # --- denominator provenance ----------------------------------------
    pop = record.get("population")
    if pop is not None:
        if isinstance(pop, bool) or not isinstance(pop, (int, float)):
            raise SchemaError(f"population must be a number or None ({iid})")
        if not math.isfinite(float(pop)) or float(pop) <= 0:
            raise SchemaError(
                f"population must be finite and > 0, got {pop!r} ({iid} {iso3} {year})"
            )
        if not record.get("population_source"):
            raise SchemaError(
                f"population supplied without population_source ({iid} {iso3} {year})"
            )

    va = record.get("value_absolute")
    if va is not None:
        if isinstance(va, bool) or not isinstance(va, (int, float)):
            raise SchemaError(f"value_absolute must be a number or None ({iid})")
        if not math.isfinite(float(va)):
            raise SchemaError(f"value_absolute must be finite ({iid} {iso3} {year})")

    if basis in POPULATION_NORMALISED and va is not None and pop is None:
        raise SchemaError(
            f"per-capita record with value_absolute must carry the population "
            f"denominator used ({iid} {iso3} {year})"
        )

    # --- provenance -----------------------------------------------------
    if not isinstance(record["source_publisher"], str) or not record["source_publisher"].strip():
        raise SchemaError(f"source_publisher must be non-empty ({iid})")

    url = record["source_url"]
    if not isinstance(url, str) or not _URL_RE.match(url.strip()):
        raise SchemaError(
            f"source_url must be a real http(s) URL, got {url!r} ({iid} {iso3} {year})"
        )

    if not isinstance(record["source_dataset_file"], str) or not record["source_dataset_file"].strip():
        raise SchemaError(f"source_dataset_file must be non-empty ({iid})")

    ra = record["retrieved_at"]
    if not isinstance(ra, str) or not _DATE_RE.match(ra.strip()):
        raise SchemaError(
            f"retrieved_at must be ISO-8601 (YYYY-MM-DD[...]), got {ra!r} ({iid})"
        )

    sc = record.get("source_column")
    if sc is not None and not isinstance(sc, str):
        raise SchemaError(f"source_column must be a string or None ({iid})")

    ps = record.get("population_source")
    if ps is not None and not isinstance(ps, str):
        raise SchemaError(f"population_source must be a string or None ({iid})")

    # --- quality flags --------------------------------------------------
    for f in ("is_estimated", "break_in_series"):
        if not isinstance(record[f], bool):
            raise SchemaError(f"{f} must be a bool, got {record[f]!r} ({iid})")
    if not isinstance(record["definition_note"], str):
        raise SchemaError(f"definition_note must be a string ({iid})")

    return record


def validate_many(records, stop_on_first: bool = False):
    """Validate an iterable of records.

    Returns ``(ok_records, rejections)`` where each rejection is
    ``(index, reason, record)``. Never mutates or repairs a record - a bad
    record is dropped and reported, never silently coerced.
    """
    ok, rejects = [], []
    for i, r in enumerate(records):
        try:
            ok.append(validate(r))
        except SchemaError as e:
            if stop_on_first:
                raise
            rejects.append((i, str(e), r))
    return ok, rejects


def record_key(record: Dict[str, Any]):
    """Identity used for duplicate detection: indicator/country/year/source file."""
    return (
        record["indicator_id"],
        record["country_iso3"],
        record["year"],
        record["source_publisher"],
        record["source_dataset_file"],
    )


def series_key(record: Dict[str, Any]):
    """Identity of a time series within one source (for YoY checks)."""
    return (
        record["indicator_id"],
        record["country_iso3"],
        record["source_publisher"],
        record["source_dataset_file"],
    )


def comparison_key(record: Dict[str, Any]):
    """Identity used for cross-source agreement: same concept, same point."""
    return (record["indicator_id"], record["country_iso3"], record["year"])


if __name__ == "__main__":  # tiny self-test
    good = make_record(
        indicator_id="electricity_generation_twh",
        indicator_name="Electricity generation",
        category="electricity",
        unit="TWh",
        per_capita_basis="absolute",
        country_iso3="IND",
        country_name="India",
        year=2020,
        value=1_558.0,
        source_publisher="Our World in Data",
        source_url="https://github.com/owid/energy-data",
        source_dataset_file="data/infra/raw/owid-energy-data.csv",
        retrieved_at="2026-08-07",
        source_column="electricity_generation",
    )
    assert validate(good) is good
    for bad, why in [
        ({**good, "value": None}, "null value"),
        ({**good, "source_url": "n/a"}, "fake url"),
        ({**good, "year": 1800}, "year out of range"),
        ({**good, "unit": "percent", "value": 140.0}, "percent > 100"),
        ({**good, "per_capita_basis": "per capita", "value_absolute": 1.0}, "no population"),
    ]:
        try:
            validate(bad)
        except SchemaError:
            pass
        else:
            raise AssertionError(f"should have rejected: {why}")
    print(f"infra_schema v{SCHEMA_VERSION} self-test OK")
