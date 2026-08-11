#!/usr/bin/env python3
"""Re-runnable refresh pipeline for the India infrastructure indicator set.

WHAT THIS IS
    A declarative registry of upstream sources plus a fetch/checksum/diff runner.
    Run it and it will, for every registered source: try to fetch, hash the
    payload, compare the hash against the previously stored copy, extract the
    India slice into a small cache file, and append a timestamped record to a
    refresh log so that staleness is visible rather than assumed.

WHAT THIS IS NOT
    It is not a daemon and it does not run itself. There is no scheduler here.
    Something external (cron, a CI job, or a human) has to invoke it. See the
    "SCHEDULING" section below and scratchpad/agent3_pipeline.md.

    Many of the registered sources are official Indian government publishers
    that this container cannot reach at all (the egress proxy answers 403 to
    CONNECT). Those are recorded as BLOCKED. That is a real, reportable fact
    about the data, not an error to be swallowed.

USAGE
    python3 scripts/refresh_infra.py                # fetch everything reachable
    python3 scripts/refresh_infra.py --offline      # no network; re-stat cache only
    python3 scripts/refresh_infra.py --only owid_energy wb_population
    python3 scripts/refresh_infra.py --timeout 60
    python3 scripts/refresh_infra.py --json         # machine-readable run summary

SCHEDULING (you must set this up yourself; nothing here does it for you)
    cron, weekly:
        0 6 * * 1 cd /path/to/riddlediary && /usr/bin/python3 scripts/refresh_infra.py \
            && /usr/bin/python3 scripts/score_infra.py

    GitHub Actions, weekly:
        on:
          schedule: [{cron: "0 6 * * 1"}]
          workflow_dispatch:
        jobs:
          refresh:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - run: python3 scripts/refresh_infra.py
              - run: python3 scripts/score_infra.py
              - run: |
                  git config user.name  github-actions
                  git config user.email github-actions@github.com
                  git add data/infra/cache data/infra/quality
                  git diff --cached --quiet || git commit -m "refresh: infra indicators"
                  git push

    A GitHub Actions runner has open egress, so sources that are BLOCKED here
    would actually resolve there. That is the main reason the registry keeps
    unreachable sources in it instead of deleting them.

OUTPUTS
    data/infra/cache/<source_id>.json     small India-only slice + payload hash
    data/infra/quality/source_state.json  last-known hash/status per source
    data/infra/quality/refresh_log.jsonl  append-only run history
"""

import argparse
import csv
import hashlib
import io
import json
import os
import ssl
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone, date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE = os.path.join(ROOT, "data", "infra", "cache")
QUALITY = os.path.join(ROOT, "data", "infra", "quality")
STATE_PATH = os.path.join(QUALITY, "source_state.json")
LOG_PATH = os.path.join(QUALITY, "refresh_log.jsonl")

# The window the dashboard cares about.
BASE_YEAR = 2014

USER_AGENT = "riddlediary-infra-refresh/1.0 (+https://github.com/; contact: repo owner)"


# ─────────────────────────────────────────────────────────────────────────────
# Source registry
#
# Every entry is data, not code. `parser` names a function in PARSERS below.
#
#   provenance_tier  how far this source sits from the body that actually
#                    produces the statistic. Used by score_infra.py.
#                      official_direct  the authoritative publisher itself
#                      official_mirror  that publisher's own mirror
#                      community_mirror a third party republishing it verbatim
#                      aggregator       a compiler that re-derives/harmonises
#                      media            a news report of a number
#   lineage          provenance root. Two sources sharing a lineage are NOT
#                    independent corroboration however different their URLs are.
#   cadence_days     how often the publisher actually releases.
#   feeds            indicator ids this source can populate.
# ─────────────────────────────────────────────────────────────────────────────

SOURCES = [
    {
        "id": "owid_energy",
        "title": "Our World in Data — Energy Dataset",
        "publisher": "Our World in Data",
        "landing": "https://github.com/owid/energy-data",
        "url": "https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv",
        "provenance_tier": "aggregator",
        "lineage": "owid",
        "cadence_days": 180,
        "parser": "owid_wide_csv",
        "parser_args": {
            "fields": [
                "population", "gdp", "electricity_generation", "electricity_demand",
                "electricity_demand_per_capita", "renewables_share_elec",
                "low_carbon_share_elec", "fossil_share_elec", "solar_electricity",
                "wind_electricity", "hydro_electricity", "coal_electricity",
                "nuclear_electricity", "energy_per_capita", "carbon_intensity_elec",
            ],
        },
        "feeds": [
            "electricity_generation_twh", "renewables_share_elec_pct",
            "low_carbon_share_elec_pct", "solar_electricity_twh",
            "wind_electricity_twh", "electricity_demand_twh",
            "energy_per_capita_kwh", "population_persons",
        ],
        "notes": (
            "OWID compiles this from Ember and the Energy Institute Statistical "
            "Review; for India those in turn rest on CEA reporting. So this is "
            "two hops from the authoritative national source."
        ),
    },
    {
        "id": "owid_co2",
        "title": "Our World in Data — CO2 and Greenhouse Gas Emissions",
        "publisher": "Our World in Data",
        "landing": "https://github.com/owid/co2-data",
        "url": "https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv",
        "provenance_tier": "aggregator",
        # Same lineage root as owid_energy on purpose: the CO2 dataset imports
        # OWID's own energy series. Agreement between the two is an internal
        # consistency check, NOT independent corroboration, and the scorer must
        # not be allowed to count it as such.
        "lineage": "owid",
        "cadence_days": 180,
        "parser": "owid_wide_csv",
        "parser_args": {
            "fields": ["population", "gdp", "co2", "co2_per_capita", "energy_per_capita"],
        },
        "feeds": ["co2_per_capita_t", "co2_emissions_mt", "energy_per_capita_kwh",
                  "population_persons"],
        "notes": "Shares a lineage with owid_energy. Consistency check only.",
    },
    {
        "id": "wb_population",
        "title": "World Bank population (community mirror)",
        "publisher": "World Bank WDI, republished by the `datasets` project",
        "landing": "https://github.com/datasets/population",
        "url": "https://raw.githubusercontent.com/datasets/population/main/data/population.csv",
        "provenance_tier": "community_mirror",
        "lineage": "worldbank-wdi",
        "cadence_days": 365,
        "parser": "wb_long_csv",
        "parser_args": {"value_field": "population"},
        "feeds": ["population_persons"],
        "notes": (
            "Genuinely lineage-distinct from OWID for population: World Bank's "
            "own estimates rather than OWID's UN WPP/HYDE blend. This is the "
            "one indicator in the set with real two-source corroboration that "
            "this environment can actually compute."
        ),
    },
    {
        "id": "wb_gdp",
        "title": "World Bank GDP, current US$ (community mirror)",
        "publisher": "World Bank WDI, republished by the `datasets` project",
        "landing": "https://github.com/datasets/gdp",
        "url": "https://raw.githubusercontent.com/datasets/gdp/main/data/gdp.csv",
        "provenance_tier": "community_mirror",
        "lineage": "worldbank-wdi",
        "cadence_days": 365,
        "parser": "wb_long_csv",
        "parser_args": {"value_field": "gdp_current_usd"},
        "feeds": ["gdp_current_usd"],
        "notes": (
            "Current US$. Deliberately NOT paired against OWID's `gdp` column, "
            "which is constant international-$ (PPP): 2014 is 2.04e12 here vs "
            "6.88e12 there. Same name, different quantity. Cross-checking them "
            "would manufacture a ~70% 'divergence' that means nothing."
        ),
    },
    {
        "id": "cdiac_fossil_co2",
        "title": "CDIAC fossil-fuel CO2 emissions by nation (community mirror)",
        "publisher": "CDIAC / Oak Ridge, republished by the `datasets` project",
        "landing": "https://github.com/datasets/co2-fossil-by-nation",
        "url": "https://raw.githubusercontent.com/datasets/co2-fossil-by-nation/main/data/fossil-fuel-co2-emissions-by-nation.csv",
        "provenance_tier": "community_mirror",
        "lineage": "cdiac",
        "cadence_days": 365,
        "parser": "cdiac_csv",
        "parser_args": {},
        "feeds": ["co2_emissions_mt"],
        "notes": (
            "Lineage-distinct from OWID, whose CO2 series comes via the Global "
            "Carbon Project. Reported in thousand tonnes of CARBON, so it needs "
            "a 44/12 conversion to tonnes of CO2 before any comparison; the "
            "binding carries that scale factor. Ends at 2020, so it corroborates "
            "2014-2020 only."
        ),
    },

    # ── Sources this environment cannot reach ────────────────────────────────
    # These stay registered on purpose. The URLs are real and correct; a runner
    # with open egress (CI, a laptop) resolves them. Here they record BLOCKED,
    # which is exactly the signal the dashboard needs to show.

    {
        "id": "cea_installed_capacity",
        "title": "CEA — All India Installed Capacity of Power Stations",
        "publisher": "Central Electricity Authority, Government of India",
        "landing": "https://cea.nic.in/installed-capacity-report/",
        "url": "https://cea.nic.in/installed-capacity-report/?lang=en",
        "provenance_tier": "official_direct",
        "lineage": "cea",
        "cadence_days": 30,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["installed_capacity_gw", "renewable_capacity_gw"],
        "notes": (
            "The authoritative Indian source for generation capacity, published "
            "monthly as PDF/XLS. Blocked at the egress proxy here. Even with "
            "egress it would need a PDF/XLS parser per monthly layout."
        ),
    },
    {
        "id": "morth_road_stats",
        "title": "MoRTH — Basic Road Statistics / National Highways length",
        "publisher": "Ministry of Road Transport & Highways",
        "landing": "https://morth.nic.in/road-transport-year-books",
        "url": "https://morth.nic.in/road-transport-year-books",
        "provenance_tier": "official_direct",
        "lineage": "morth",
        "cadence_days": 365,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["national_highways_km"],
        "notes": "Blocked here. Annual yearbook, PDF, layout changes between editions.",
    },
    {
        "id": "indian_railways_ar",
        "title": "Indian Railways — Annual Report & Statistical Statements",
        "publisher": "Ministry of Railways",
        "landing": "https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,1,304,366,554",
        "url": "https://indianrailways.gov.in/railwayboard/view_section.jsp?lang=0&id=0,1,304,366,554",
        "provenance_tier": "official_direct",
        "lineage": "indian-railways",
        "cadence_days": 365,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["rail_electrification_pct", "rail_route_km"],
        "notes": "Blocked here.",
    },
    {
        "id": "trai_subscription",
        "title": "TRAI — Telecom Subscription Reports",
        "publisher": "Telecom Regulatory Authority of India",
        "landing": "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports",
        "url": "https://www.trai.gov.in/release-publication/reports/telecom-subscriptions-reports",
        "provenance_tier": "official_direct",
        "lineage": "trai",
        "cadence_days": 30,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["internet_subscribers_mn", "broadband_subscribers_mn"],
        "notes": "Blocked here. Monthly cadence, so it goes stale fastest of the set.",
    },
    {
        "id": "jjm_dashboard",
        "title": "Jal Jeevan Mission — household tap connection dashboard",
        "publisher": "Department of Drinking Water & Sanitation",
        "landing": "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx",
        "url": "https://ejalshakti.gov.in/jjmreport/JJMIndia.aspx",
        "provenance_tier": "official_direct",
        "lineage": "jjm",
        "cadence_days": 1,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["rural_tap_connections_mn"],
        "notes": (
            "Live dashboard, updated daily, ASP.NET postback UI. Blocked here. "
            "Its 1-day cadence means any stored figure is stale almost at once."
        ),
    },
    {
        "id": "pmgsy_omms",
        "title": "PMGSY — Online Management & Monitoring System",
        "publisher": "Ministry of Rural Development",
        "landing": "https://omms.nic.in/",
        "url": "https://omms.nic.in/",
        "provenance_tier": "official_direct",
        "lineage": "pmgsy",
        "cadence_days": 7,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": ["pmgsy_road_km"],
        "notes": "Blocked here.",
    },
    {
        "id": "data_gov_in",
        "title": "data.gov.in — Open Government Data Platform",
        "publisher": "NIC / Government of India",
        "landing": "https://data.gov.in/",
        "url": "https://api.data.gov.in/resource/",
        "provenance_tier": "official_direct",
        "lineage": "data-gov-in",
        "cadence_days": 90,
        "parser": "unavailable_html",
        "parser_args": {},
        "feeds": [],
        "notes": (
            "Blocked here, and separately would need an API key "
            "(register at data.gov.in) which this environment has no way to "
            "hold securely. Registered so the gap is documented."
        ),
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Indicator layer
#
# scripts/ingest_infra.py (agent 1) already produces the canonical India series
# in data/infra/clean/indicators.json, under agent 2's schema. This module does
# NOT duplicate that. It adds the two things the canonical file cannot carry
# about itself:
#
#   CORROBORATORS        lineage-distinct second opinions on a canonical
#                        indicator, fetched by this pipeline, so that
#                        cross-source divergence is actually measurable.
#
#   UNSOURCED_INDICATORS indicators the dashboard wants and no reachable
#                        machine source supplies. Registering them keeps the
#                        gap visible instead of letting it vanish by omission.
#
# LINEAGE_OF_FILE maps the raw files the canonical ingest reads back to a
# provenance root, because two files from one publisher are not two sources.
# ─────────────────────────────────────────────────────────────────────────────

#: Lineage roots are PUBLISHER-level, not file-level. Two datasets from one
#: compiler are one source however many files they arrive in: OWID's CO2
#: dataset imports OWID's own energy series, and its population column and the
#: energy file's population column are the same numbers. Treating those as
#: mutual corroboration would be self-congratulation.
LINEAGE_OF_FILE = {
    "data/infra/raw/owid-energy-data.csv": "owid",
    "data/infra/raw/owid-co2-data.csv": "owid",
    "data/infra/population/population_owid.csv": "owid",
    "data/infra/population/population_worldbank.csv": "worldbank-wdi",
}

#: Fallback when a canonical record names a file or URL we do not recognise.
#: Matched as a case-insensitive substring of the record's source_publisher, so
#: new files from a publisher already in the registry resolve without an edit.
PUBLISHER_LINEAGE = [
    ("our world in data", "owid"),
    ("owid", "owid"),
    ("world bank", "worldbank-wdi"),
    ("cdiac", "cdiac"),
    ("ember", "ember"),
    ("energy institute", "energy-institute"),
]

#: Canonical indicator id -> extra bindings drawn from this pipeline's cache.
#: `scale` converts the cached source's native units into the canonical unit,
#: and is applied at comparison time so the conversion stays auditable.
CORROBORATORS = {
    "population_persons": [
        {"source": "wb_population", "field": "population", "scale": 1.0,
         "note": "World Bank estimate vs OWID's UN WPP/HYDE blend"},
    ],
    "co2_emissions_mt": [
        # thousand tonnes of carbon -> million tonnes of CO2: (44/12)/1000.
        {"source": "cdiac_fossil_co2", "field": "total_kt_c", "scale": 44.0 / 12.0 / 1000.0,
         "note": "CDIAC, converted from kt carbon; covers 2014-2020 only"},
    ],
}

#: Indicators with no reachable machine source in any environment we have.
#: These score low, and should: we hold no values for them at all.
UNSOURCED_INDICATORS = [
    {
        "id": "installed_capacity_gw",
        "label": "Installed generation capacity",
        "unit": "GW",
        "category": "electricity",
        "source": "cea_installed_capacity",
        "series_break": None,
    },
    {
        "id": "renewable_capacity_gw",
        "label": "Renewable installed capacity",
        "unit": "GW",
        "category": "electricity",
        "source": "cea_installed_capacity",
        "series_break": (
            "CEA reclassified large hydro (>25 MW) as renewable in March 2019. "
            "Figures before and after that date are not the same definition."
        ),
    },
    {
        "id": "national_highways_km",
        "label": "National highways length",
        "unit": "km",
        "category": "transport",
        "source": "morth_road_stats",
        "series_break": (
            "State highways are periodically re-declared as national highways, "
            "so growth mixes new construction with reclassification."
        ),
    },
    {
        "id": "pmgsy_road_km",
        "label": "PMGSY rural roads completed",
        "unit": "km",
        "category": "transport",
        "source": "pmgsy_omms",
        "series_break": None,
    },
    {
        "id": "rail_electrification_pct",
        "label": "Rail route electrified",
        "unit": "%",
        "category": "transport",
        "source": "indian_railways_ar",
        "series_break": None,
    },
    {
        "id": "rail_route_km",
        "label": "Rail route length",
        "unit": "km",
        "category": "transport",
        "source": "indian_railways_ar",
        "series_break": None,
    },
    {
        "id": "internet_subscribers_mn",
        "label": "Internet subscribers",
        "unit": "million",
        "category": "telecom",
        "source": "trai_subscription",
        "series_break": None,
    },
    {
        "id": "broadband_subscribers_mn",
        "label": "Broadband subscribers",
        "unit": "million",
        "category": "telecom",
        "source": "trai_subscription",
        "series_break": (
            "TRAI's broadband definition moved from >=256 kbit/s to >=512 kbit/s "
            "in 2014, which lifts the level independently of any build-out."
        ),
    },
    {
        "id": "rural_tap_connections_mn",
        "label": "Rural households with tap water",
        "unit": "million",
        "category": "water_sanitation",
        "source": "jjm_dashboard",
        "series_break": None,
    },
]


# ─────────────────────────────────────────────────────────────────────────────
# Parsers. Each takes raw bytes and returns {year: {field: float}} for India.
# ─────────────────────────────────────────────────────────────────────────────

def _f(v):
    """Parse a CSV cell to float, or None for blank/non-numeric."""
    if v is None:
        return None
    v = str(v).strip().replace(",", "")
    if v == "" or v.lower() in ("na", "nan", "null", "-"):
        return None
    try:
        return float(v)
    except ValueError:
        return None


def parse_owid_wide_csv(raw, args):
    """OWID's wide layout: one row per country-year, one column per variable."""
    fields = args.get("fields", [])
    out = {}
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8", errors="replace")))
    for row in reader:
        if (row.get("country") or "").strip() != "India":
            continue
        try:
            year = int(row["year"])
        except (KeyError, TypeError, ValueError):
            continue
        if year < BASE_YEAR:
            continue
        rec = {}
        for f in fields:
            val = _f(row.get(f))
            if val is not None:
                rec[f] = val
        if rec:
            out[year] = rec
    return out


def parse_wb_long_csv(raw, args):
    """`datasets` project layout: Country Name,Country Code,Year,Value."""
    key = args["value_field"]
    out = {}
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8", errors="replace")))
    for row in reader:
        code = (row.get("Country Code") or "").strip()
        name = (row.get("Country Name") or "").strip()
        if code != "IND" and name != "India":
            continue
        try:
            year = int(str(row.get("Year", "")).strip())
        except (TypeError, ValueError):
            continue
        if year < BASE_YEAR:
            continue
        val = _f(row.get("Value"))
        if val is not None:
            out[year] = {key: val}
    return out


def parse_cdiac_csv(raw, args):
    """CDIAC layout: Year,Country,Total,... in thousand tonnes of carbon."""
    out = {}
    reader = csv.DictReader(io.StringIO(raw.decode("utf-8", errors="replace")))
    for row in reader:
        if (row.get("Country") or "").strip().upper() != "INDIA":
            continue
        try:
            year = int(str(row.get("Year", "")).strip())
        except (TypeError, ValueError):
            continue
        if year < BASE_YEAR:
            continue
        val = _f(row.get("Total"))
        if val is not None:
            # Left in native units (kt C). The indicator binding applies the
            # 44/12 carbon-to-CO2 conversion, so the unit change stays visible
            # at the point of comparison instead of being buried here.
            out[year] = {"total_kt_c": val}
    return out


def parse_unavailable_html(raw, args):
    """Placeholder for sources that are landing pages, not machine-readable feeds.

    These need a bespoke PDF/XLS/scraper per publisher and, in this container,
    cannot be fetched at all. Returning empty is honest: we got nothing.
    """
    return {}


PARSERS = {
    "owid_wide_csv": parse_owid_wide_csv,
    "wb_long_csv": parse_wb_long_csv,
    "cdiac_csv": parse_cdiac_csv,
    "unavailable_html": parse_unavailable_html,
}


# ─────────────────────────────────────────────────────────────────────────────
# Fetch
# ─────────────────────────────────────────────────────────────────────────────

def _ssl_context():
    """Trust the environment's CA bundle if one is configured."""
    ca = os.environ.get("SSL_CERT_FILE") or os.environ.get("REQUESTS_CA_BUNDLE")
    if ca and os.path.exists(ca):
        return ssl.create_default_context(cafile=ca)
    return ssl.create_default_context()


def fetch(url, timeout):
    """Return (outcome, body_bytes, detail).

    outcome is one of:
        OK           body_bytes is the payload
        BLOCKED      the egress proxy refused to open a tunnel to this host.
                     The source may be perfectly healthy; we simply cannot see
                     it from here. This is the case that must stay visible.
        HTTP_ERROR   we reached the origin and it returned an error status
        NETWORK_ERROR anything else (DNS, timeout, TLS)
    """
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=_ssl_context()) as resp:
            return "OK", resp.read(), f"HTTP {resp.status}"
    except urllib.error.HTTPError as e:
        # We got through to the origin; it answered with an error.
        return "HTTP_ERROR", None, f"HTTP {e.code} {e.reason}"
    except urllib.error.URLError as e:
        reason = str(e.reason)
        # The CONNECT-tunnel refusal signature of an egress-filtering proxy.
        if "Tunnel connection failed" in reason or "403" in reason:
            return "BLOCKED", None, f"egress proxy refused CONNECT ({reason})"
        return "NETWORK_ERROR", None, reason
    except Exception as e:  # noqa: BLE001 - a refresh run must never die on one source
        return "NETWORK_ERROR", None, f"{type(e).__name__}: {e}"


# ─────────────────────────────────────────────────────────────────────────────
# State / logging
# ─────────────────────────────────────────────────────────────────────────────

def load_state():
    if os.path.exists(STATE_PATH):
        try:
            with open(STATE_PATH, encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, OSError):
            pass
    return {"sources": {}}


def save_state(state):
    os.makedirs(QUALITY, exist_ok=True)
    with open(STATE_PATH, "w", encoding="utf-8") as fh:
        json.dump(state, fh, indent=2, sort_keys=True)
        fh.write("\n")


def cache_path(source_id):
    return os.path.join(CACHE, f"{source_id}.json")


def load_cache(source_id):
    p = cache_path(source_id)
    if os.path.exists(p):
        try:
            with open(p, encoding="utf-8") as fh:
                return json.load(fh)
        except (json.JSONDecodeError, OSError):
            pass
    return None


def write_cache(source_id, payload):
    os.makedirs(CACHE, exist_ok=True)
    with open(cache_path(source_id), "w", encoding="utf-8") as fh:
        json.dump(payload, fh, indent=2, sort_keys=True)
        fh.write("\n")


def now_iso():
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


# ─────────────────────────────────────────────────────────────────────────────
# Run
# ─────────────────────────────────────────────────────────────────────────────

def refresh_source(src, state, timeout, offline):
    """Fetch one source, diff it against the stored copy, update cache+state."""
    sid = src["id"]
    prev = state["sources"].get(sid, {})
    rec = {
        "source_id": sid,
        "url": src["url"],
        "publisher": src["publisher"],
        "attempted_at": now_iso(),
    }

    if offline:
        rec["status"] = "SKIPPED_OFFLINE"
        rec["detail"] = "--offline: no fetch attempted"
        rec["changed"] = False
        return rec

    t0 = time.time()
    outcome, body, detail = fetch(src["url"], timeout)
    rec["elapsed_s"] = round(time.time() - t0, 2)
    rec["detail"] = detail

    if outcome != "OK":
        rec["status"] = outcome
        rec["changed"] = False
        entry = dict(prev)
        entry["last_attempt"] = rec["attempted_at"]
        entry["last_status"] = outcome
        entry["last_detail"] = detail
        entry["consecutive_failures"] = int(prev.get("consecutive_failures", 0)) + 1
        entry["env_reachable"] = False if outcome == "BLOCKED" else prev.get("env_reachable")
        state["sources"][sid] = entry
        return rec

    digest = hashlib.sha256(body).hexdigest()
    rec["sha256"] = digest
    rec["bytes"] = len(body)
    changed = digest != prev.get("sha256")
    rec["changed"] = changed
    rec["status"] = "OK_CHANGED" if changed else "OK_UNCHANGED"

    # Parse to the India slice. A parse failure is reported, not raised: the
    # payload was still fetched and hashed, and that is worth recording.
    parser = PARSERS.get(src["parser"])
    try:
        rows = parser(body, src.get("parser_args", {})) if parser else {}
        rec["years"] = len(rows)
        if rows:
            rec["year_min"] = min(rows)
            rec["year_max"] = max(rows)
    except Exception as e:  # noqa: BLE001
        rec["status"] = "PARSE_ERROR"
        rec["detail"] = f"{type(e).__name__}: {e}"
        rows = {}
        rec["years"] = 0

    if rows or changed or load_cache(sid) is None:
        write_cache(sid, {
            "source_id": sid,
            "title": src["title"],
            "publisher": src["publisher"],
            "url": src["url"],
            "landing": src.get("landing"),
            "provenance_tier": src["provenance_tier"],
            "lineage": src["lineage"],
            "cadence_days": src["cadence_days"],
            "fetched_at": rec["attempted_at"],
            "sha256_full": digest,
            "bytes_full": len(body),
            # Only the India slice is cached. The upstream CSVs are 9-14 MB and
            # storing them verbatim would add ~23 MB of duplicate data to the
            # repo for no benefit: the hash above is enough to detect change.
            "rows": {str(y): v for y, v in sorted(rows.items())},
        })

    state["sources"][sid] = {
        "last_attempt": rec["attempted_at"],
        "last_success": rec["attempted_at"],
        "last_status": rec["status"],
        "last_detail": rec["detail"],
        "last_changed_at": rec["attempted_at"] if changed else prev.get("last_changed_at"),
        "sha256": digest,
        "bytes": len(body),
        "consecutive_failures": 0,
        "env_reachable": True,
    }
    return rec


def main(argv=None):
    ap = argparse.ArgumentParser(description="Refresh the India infrastructure source set.")
    ap.add_argument("--offline", action="store_true", help="do not touch the network")
    ap.add_argument("--only", nargs="*", metavar="SOURCE_ID", help="restrict to these source ids")
    ap.add_argument("--timeout", type=int, default=45, help="per-request timeout in seconds")
    ap.add_argument("--json", action="store_true", help="emit the run summary as JSON")
    args = ap.parse_args(argv)

    selected = SOURCES
    if args.only:
        wanted = set(args.only)
        unknown = wanted - {s["id"] for s in SOURCES}
        if unknown:
            ap.error(f"unknown source id(s): {', '.join(sorted(unknown))}")
        selected = [s for s in SOURCES if s["id"] in wanted]

    state = load_state()
    run_id = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    records = []

    for src in selected:
        rec = refresh_source(src, state, args.timeout, args.offline)
        records.append(rec)
        if not args.json:
            flag = "*" if rec.get("changed") else " "
            print(f"  {flag} {rec['status']:<16} {rec['source_id']:<24} {rec.get('detail', '')}")

    save_state(state)

    summary = {
        "run_id": run_id,
        "finished_at": now_iso(),
        "offline": args.offline,
        "sources_attempted": len(records),
        "ok": sum(1 for r in records if r["status"].startswith("OK")),
        "changed": sum(1 for r in records if r.get("changed")),
        "blocked": sum(1 for r in records if r["status"] == "BLOCKED"),
        "failed": sum(1 for r in records if r["status"] in ("HTTP_ERROR", "NETWORK_ERROR", "PARSE_ERROR")),
        "records": records,
    }

    os.makedirs(QUALITY, exist_ok=True)
    with open(LOG_PATH, "a", encoding="utf-8") as fh:
        fh.write(json.dumps(summary, sort_keys=True) + "\n")

    if args.json:
        print(json.dumps(summary, indent=2, sort_keys=True))
    else:
        print()
        print(f"run {run_id}: {summary['ok']} ok "
              f"({summary['changed']} changed), "
              f"{summary['blocked']} blocked, {summary['failed']} failed")
        if summary["blocked"]:
            print("  BLOCKED = the source exists but this environment cannot reach it.")
            print("  Re-run from a host with open egress (e.g. CI) to resolve those.")
        print(f"  log: {os.path.relpath(LOG_PATH, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
