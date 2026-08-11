#!/usr/bin/env python3
"""Bridge: turn the agent pipeline's outputs into the explorer's data.js.

Inputs (all produced by the pipeline, none hand-written):
  data/infra/clean/indicators.json      normalised observations (columnar)
  data/infra/quality/indicators_quality.json   per-indicator accuracy scores
  data/infra/quality/source_state.json  per-source reachability
  data/infra/claims/media_claims.json   cited India-specific claims (optional)

Output:
  public/india-infra/data.js

Design rule this file enforces: an indicator that is DEFINED but has no data
(because its source is unreachable from here) still ships, carrying its blocked
state and a zero-length series. Dropping it would hide the gap; the explorer
shows it as blocked instead. Nothing is interpolated, ever.

Run:  python3 scripts/build_infra.py
"""

import json
import os
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CLEAN = os.path.join(ROOT, "data", "infra", "clean", "indicators.json")
QUAL = os.path.join(ROOT, "data", "infra", "quality", "indicators_quality.json")
SRCSTATE = os.path.join(ROOT, "data", "infra", "quality", "source_state.json")
CLAIMS = os.path.join(ROOT, "data", "infra", "claims", "media_claims.json")
OUT = os.path.join(ROOT, "public", "india-infra", "data.js")


def load(path, default=None):
    if not os.path.exists(path):
        return default
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


clean = load(CLEAN)
if not clean:
    raise SystemExit("no clean/indicators.json — run scripts/ingest_infra.py first")

quality = load(QUAL, {}) or {}
qmap = quality.get("indicators", {})
srcstate = (load(SRCSTATE, {}) or {}).get("sources", {})
claims = load(CLAIMS, {}) or {}

countries = clean["countries"]          # [[iso3, name], ...]
series_defs = clean["series_defs"]      # indicator definitions, index-aligned
rows = clean["rows"]                    # [series_idx, country_idx, year, value, _, source_idx]
pops = clean["populations"]             # [country_idx, year, population, source]
aggregates = set((clean.get("aggregate_codes") or {}).keys())

# ── countries + population denominators ──────────────────────────────────────

out_countries = {}
for idx, (iso, name) in enumerate(countries):
    out_countries[iso] = {"name": name, "population": {}, "is_aggregate": iso in aggregates}

pop_src = set()
for c_idx, year, value, src in pops:
    if c_idx < len(countries) and value:
        out_countries[countries[c_idx][0]]["population"][str(year)] = value
        if src:
            pop_src.add(src)

# ── observations, grouped per indicator ──────────────────────────────────────

by_ind = defaultdict(lambda: defaultdict(dict))
for r in rows:
    s_idx, c_idx, year, value = r[0], r[1], r[2], r[3]
    if value is None or s_idx >= len(series_defs) or c_idx >= len(countries):
        continue
    by_ind[s_idx][countries[c_idx][0]][str(year)] = value

# ── indicators ───────────────────────────────────────────────────────────────

CATEGORY_LABEL = {
    "electricity": "Electricity & power",
    "energy": "Energy",
    "emissions": "Emissions",
    "economy": "Economy",
    "demographics": "Population",
    "transport": "Transport",
    "roads": "Roads",
    "rail": "Rail",
    "digital": "Digital & telecom",
    "water": "Water & sanitation",
    "housing": "Housing",
}

indicators = []
for idx, sd in enumerate(series_defs):
    iid = sd["indicator_id"]
    q = qmap.get(iid, {})
    series = by_ind.get(idx, {})

    sources = [
        {
            "publisher": sd.get("source_publisher", "unknown"),
            "url": sd.get("source_url") or sd.get("landing_page") or "",
            "detail": " · ".join(
                x
                for x in [
                    sd.get("source_lineage"),
                    f"column: {sd['source_column']}" if sd.get("source_column") else None,
                    f"file: {sd['source_dataset_file']}" if sd.get("source_dataset_file") else None,
                ]
                if x
            ),
        }
    ]

    # agent 3 changed this field mid-build from a string to an object carrying
    # the state plus staleness metadata. Accept either shape and normalise to
    # the plain state string the UI expects.
    fr = q.get("freshness") or q.get("freshness_state") or "UNKNOWN"
    if isinstance(fr, dict):
        freshness = fr.get("state") or fr.get("last_status") or "UNKNOWN"
        freshness_detail = fr
    else:
        freshness = str(fr)
        freshness_detail = None
    comp = q.get("components", {})
    tier_bits = []
    if comp.get("provenance") is not None:
        tier_bits.append(f"provenance {comp['provenance']}/25")
    if q.get("corroborating_lineages") is not None:
        tier_bits.append(f"{q['corroborating_lineages']} corroborating lineage(s)")

    indicators.append(
        {
            "id": iid,
            "name": sd.get("indicator_name", iid),
            "category": CATEGORY_LABEL.get(sd.get("category", ""), sd.get("category", "Other").title()),
            "unit": sd.get("unit", ""),
            "per_capita_basis": sd.get("per_capita_basis", "absolute"),
            "definition_note": sd.get("definition_note")
            or (
                f"{sd.get('indicator_name', iid)}, as published by "
                f"{sd.get('source_publisher', 'the source')}."
                + (
                    "  No data is available in this build: the source is unreachable from "
                    "the environment that generated it."
                    if not series
                    else ""
                )
            ),
            "sources": sources,
            "quality": {
                "score": q.get("score"),
                "tier": " · ".join(tier_bits) or q.get("provenance_tier") or "not scored",
                "corroborating_sources": q.get("corroborating_lineages"),
                "completeness": q.get("completeness_share"),
                "freshness": freshness,
                "freshness_detail": freshness_detail,
                "last_updated": q.get("latest_data_year"),
                "break_years": q.get("break_years") or [],
            },
            "series": series,
        }
    )

# Populated indicators first, blocked ones last — but blocked ones still ship,
# so the gap in coverage is visible in the picker rather than silently absent.
indicators.sort(key=lambda i: (0 if i["series"] else 1, i["category"], i["name"]))

payload = {
    "meta": {
        "built_at": clean.get("generated_at"),
        "n_records": clean.get("n_records"),
        "n_countries": len({i for ind in indicators for i in ind["series"]}),
        "population_sources": [
            {
                "publisher": s.split(" (")[0],
                "url": "https://github.com/datasets/population"
                if "World Bank" in s
                else "https://github.com/owid/co2-data",
                "detail": s,
            }
            for s in sorted(pop_src)
        ],
        "blocked_sources": sorted(
            k for k, v in srcstate.items() if v.get("last_status") == "BLOCKED"
        ),
        "claims": claims.get("claims", []),
        "claims_note": claims.get("note", ""),
    },
    "countries": out_countries,
    "indicators": indicators,
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("// GENERATED FILE - do not edit by hand.\n")
    fh.write("// Built by scripts/build_infra.py from the agent pipeline outputs.\n")
    fh.write("// Regenerate with:  python3 scripts/build_infra.py\n\n")
    fh.write("window.INFRA_DATA = ")
    json.dump(payload, fh, separators=(",", ":"), ensure_ascii=False)
    fh.write(";\n")

populated = [i for i in indicators if i["series"]]
blocked = [i for i in indicators if not i["series"]]
print(f"indicators           : {len(indicators)}  ({len(populated)} with data, {len(blocked)} blocked/empty)")
print(f"countries with data  : {payload['meta']['n_countries']}")
print(f"population coverage  : {sum(len(c['population']) for c in out_countries.values()):,} country-years")
print(f"blocked sources      : {len(payload['meta']['blocked_sources'])}")
print(f"cited claims         : {len(payload['meta']['claims'])}")
print(f"wrote {os.path.relpath(OUT, ROOT)}  ({os.path.getsize(OUT)/1024/1024:.1f} MB)")
if blocked:
    print("\nblocked indicators (defined, no data reachable):")
    for i in blocked:
        print(f"   {i['id']}")
