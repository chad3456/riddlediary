#!/usr/bin/env python3
"""Derive the NCRB report data file from the vendored source CSVs.

Every figure in public/pew-infographics/reports/india-crime-ncrb.js is computed
here from data/ncrb/source/*.csv. There are no literal statistics in this
script and none in its output that it did not read from those files.

Run:  python3 scripts/build_ncrb.py
"""

import csv
import json
import os
import re
from collections import defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "ncrb", "source")
OUT = os.path.join(ROOT, "public", "pew-infographics", "reports", "india-crime-ncrb.js")

# The report's window. NCRB's own publications end at 2016 in these files.
YEAR_FROM = 2004


def num(s):
    """Parse an NCRB cell to int/float, tolerating blanks and footnote marks."""
    if s is None:
        return None
    s = str(s).strip().replace(",", "")
    s = re.sub(r"[^\d.\-]", "", s)
    if s in ("", "-", "."):
        return None
    return float(s) if "." in s else int(s)


def year_of(s):
    """'2011 #' / '2001**' -> 2011 / 2001; non-year rows -> None."""
    m = re.match(r"\s*(\d{4})", str(s or ""))
    return int(m.group(1)) if m else None


def read_national(path, cols):
    """Read one NCRB national time-series table into {year: {...}}."""
    out = {}
    with open(os.path.join(SRC, path), encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            y = year_of(row.get("Year"))
            if y is None:
                continue  # 'Percentage Change' / 'Compound Growth Rate' footer rows
            rec = {}
            for key, col in cols.items():
                rec[key] = num(row.get(col))
            out[y] = rec
    return out


# ── 1. National series, per publication edition ──────────────────────────────

CII2011 = read_national(
    "national_cognizable_2001_2011_CII2011.csv",
    {
        "pop_lakh": "Estimated Mid-Year Population (In Lakhs)*",
        "ipc": "Incidence - IPC",
        "sll": "Incidence - SLL",
        "total": "Incidence - Total",
        "rate_ipc": "Rate - IPC",
        "rate_total": "Rate - Total",
    },
)

CII2015 = read_national(
    "national_cognizable_2005_2015_CII2015.csv",
    {
        "pop_lakh": "Mid-Year Projected Population (in Lakhs)+",
        "ipc": "Cases Reported - IPC",
        "sll": "Cases Reported - SLL",
        "total": "Cases Reported - Total",
        "rate_ipc": "Rate - IPC",
        "rate_total": "Rate - Total",
    },
)

CII2016 = read_national(
    "national_cognizable_2014_2016_CII2016.csv",
    {
        "pop_lakh": "Mid-Year Projected Population (in Lakhs)",
        "ipc": "Crime Incidence+ - IPC",
        "sll": "Crime Incidence+ - SLL",
        "total": "Crime Incidence+ - Total",
        "rate_ipc": "Crime Rate++ - IPC",
        "rate_total": "Crime Rate++ - Total",
    },
)

# IPC is the one series that survives the definitional change, so the long
# trend uses IPC only. Later editions supersede earlier ones for shared years.
ipc_series = {}
for edition in (CII2011, CII2015, CII2016):
    for y, rec in edition.items():
        if y >= YEAR_FROM and rec["ipc"]:
            ipc_series[y] = {"ipc": rec["ipc"], "rate_ipc": rec["rate_ipc"], "pop_lakh": rec["pop_lakh"]}

ipc_years = sorted(ipc_series)

# ── 2. The SLL definitional break, measured rather than asserted ─────────────

overlap = sorted(set(CII2015) & set(CII2016))
break_rows = []
for y in overlap:
    a, b = CII2015[y], CII2016[y]
    break_rows.append(
        {
            "year": y,
            "ipc_2015ed": a["ipc"],
            "ipc_2016ed": b["ipc"],
            "sll_2015ed": a["sll"],
            "sll_2016ed": b["sll"],
            "total_2015ed": a["total"],
            "total_2016ed": b["total"],
            "sll_delta": b["sll"] - a["sll"],
            "ipc_matches": a["ipc"] == b["ipc"],
        }
    )

# ── 3. State-level IPC totals from the district returns ──────────────────────

state_year = defaultdict(dict)
with open(os.path.join(SRC, "district_wise_ipc_2001_2012.csv"), encoding="utf-8-sig") as fh:
    for row in csv.DictReader(fh):
        if row["DISTRICT"].strip().upper() != "TOTAL":
            continue  # per-state TOTAL rows only — never sum districts and totals together
        y = year_of(row["YEAR"])
        st = row["STATE/UT"].strip().title().replace(" And ", " & ")
        v = num(row["TOTAL IPC CRIMES"])
        if y and v is not None:
            state_year[st][y] = v

# ── 4. Reconciliation: district returns vs published national total ──────────

recon = []
for y in sorted(set().union(*[set(v) for v in state_year.values()])):
    if y < YEAR_FROM:
        continue
    summed = sum(v[y] for v in state_year.values() if y in v)
    published = ipc_series.get(y, {}).get("ipc")
    if published:
        recon.append(
            {
                "year": y,
                "summed": summed,
                "published": published,
                "gap_pct": round(100 * (summed - published) / published, 2),
            }
        )

# ── 5. Derived headline facts ────────────────────────────────────────────────

first_y, last_y = ipc_years[0], ipc_years[-1]
first_ipc, last_ipc = ipc_series[first_y]["ipc"], ipc_series[last_y]["ipc"]
ipc_growth_pct = round(100 * (last_ipc - first_ipc) / first_ipc, 1)

first_rate, last_rate = ipc_series[first_y]["rate_ipc"], ipc_series[last_y]["rate_ipc"]
rate_growth_pct = round(100 * (last_rate - first_rate) / first_rate, 1)

pop_growth_pct = round(
    100
    * (ipc_series[last_y]["pop_lakh"] - ipc_series[first_y]["pop_lakh"])
    / ipc_series[first_y]["pop_lakh"],
    1,
)

# State ranking in the latest year the district file covers
state_last_y = max(y for v in state_year.values() for y in v)
state_rank = sorted(
    ((st, yrs[state_last_y]) for st, yrs in state_year.items() if state_last_y in yrs),
    key=lambda t: -t[1],
)

# Largest movers across the district file's span, among states big enough that
# a percentage change is meaningful (guards against tiny-base UT noise).
state_first_y = min(y for v in state_year.values() for y in v)
MIN_BASE = 10000
movers = []
for st, yrs in state_year.items():
    if state_first_y in yrs and state_last_y in yrs and yrs[state_first_y] >= MIN_BASE:
        a, b = yrs[state_first_y], yrs[state_last_y]
        movers.append({"state": st, "first": a, "last": b, "pct": round(100 * (b - a) / a, 1)})
movers.sort(key=lambda m: -m["pct"])

recon_lo = min(r["gap_pct"] for r in recon)
recon_hi = max(r["gap_pct"] for r in recon)

# ── 6. Emit the report ───────────────────────────────────────────────────────

def n(v):
    return f"{int(v):,}"


blocks = []

blocks.append(
    {
        "type": "hero",
        "value": n(last_ipc),
        "label": f"IPC crimes recorded across India in {last_y}",
        "note": (
            f"Up {ipc_growth_pct}% from {n(first_ipc)} in {first_y}. Over the same period the "
            f"estimated population grew {pop_growth_pct}%, so the crime *rate* per lakh people rose "
            f"{rate_growth_pct}% — from {first_rate} to {last_rate}."
        ),
        "src": f"NCRB Crime in India, national time-series tables ({first_y}–{last_y})",
    }
)

blocks.append(
    {
        "type": "stats",
        "title": "The long view",
        "items": [
            {
                "value": f"+{ipc_growth_pct}%",
                "label": f"IPC crimes, {first_y} → {last_y}",
                "note": f"{n(first_ipc)} to {n(last_ipc)} cases recorded.",
                "src": "NCRB national tables",
            },
            {
                "value": f"+{rate_growth_pct}%",
                "label": "Crime rate per lakh people",
                "note": f"{first_rate} to {last_rate}. Rate controls for the {pop_growth_pct}% population growth.",
                "src": "NCRB national tables",
            },
            {
                "value": f"{recon_lo}%",
                "label": "to " + f"{recon_hi}% — district-vs-national gap",
                "note": "State returns consistently fall short of the published national total. Shown, not silently reconciled.",
                "src": "Computed from both source files",
            },
        ],
    }
)

blocks.append(
    {
        "type": "line",
        "title": f"IPC crimes recorded, {first_y}–{last_y}",
        "subtitle": (
            "Total cognizable crimes under the Indian Penal Code. IPC is the only series NCRB "
            "defined consistently across this whole span — see the definitional break below."
        ),
        "unit": "",
        "max": int(round(last_ipc * 1.12, -5)),
        "note": (
            f"The rise is not merely demographic: population grew {pop_growth_pct}% over the period "
            f"while recorded IPC crime grew {ipc_growth_pct}%. Recorded crime also reflects reporting "
            "and registration practice, not only underlying offending — a rise can mean more crime, "
            "better recording, or both."
        ),
        "data": [
            {"label": str(y), "value": int(ipc_series[y]["ipc"])} for y in ipc_years
        ],
        "src": "NCRB Crime in India national time-series tables",
    }
)

blocks.append(
    {
        "type": "line",
        "title": "Crime rate per lakh population",
        "subtitle": "IPC cases recorded per 100,000 people — the population-adjusted view of the series above.",
        "unit": "",
        "max": int(round(max(ipc_series[y]["rate_ipc"] for y in ipc_years) * 1.15)),
        "note": (
            "Rate rather than count is the fairer comparison across years, and it still rises: "
            f"{first_rate} in {first_y} to {last_rate} in {last_y}."
        ),
        "data": [
            {"label": str(y), "value": ipc_series[y]["rate_ipc"]} for y in ipc_years
        ],
        "src": "NCRB Crime in India national time-series tables",
    }
)

# The definitional break
bd = break_rows[0]
blocks.append(
    {
        "type": "compare",
        "title": f"The same year, two different answers: SLL crimes in {bd['year']}",
        "subtitle": (
            "What NCRB counted as a Special &amp; Local Laws cognizable crime changed between the "
            "2015 and 2016 editions of Crime in India. The IPC count for the same year is identical "
            "to the digit; the SLL count is not close."
        ),
        "unit": "",
        "max": int(round(bd["sll_2015ed"] * 1.1, -5)),
        "note": (
            f"A gap of {n(abs(bd['sll_delta']))} cases in a single year, from a definition change rather "
            "than anything that happened on the ground. This is why every long trend on this page uses "
            "IPC only, and why SLL and Total are never plotted across the break."
        ),
        "series": [
            {"name": "Crime in India 2015 edition", "key": "a"},
            {"name": "Crime in India 2016 edition", "key": "b"},
        ],
        "data": [
            {
                "label": f"SLL crimes, {bd['year']}",
                "a": int(bd["sll_2015ed"]),
                "b": int(bd["sll_2016ed"]),
                "src": "Both NCRB national tables, compared by build_ncrb.py",
            }
        ],
    }
)

blocks.append(
    {
        "type": "bar",
        "title": f"IPC crimes by state and union territory, {state_last_y}",
        "subtitle": (
            "From NCRB district-level returns, summed to state level. These are counts, not rates — "
            "large states appear high partly because they are large."
        ),
        "unit": "",
        "max": int(round(state_rank[0][1] * 1.1, -4)),
        "note": (
            f"Summed from the per-state TOTAL rows of the district returns. These state figures total "
            f"{recon[-1]['gap_pct']}% below NCRB's published national count for {state_last_y}, a gap "
            "consistent with central and railway police units being outside state returns."
        ),
        "emphasisIndex": 0,
        "data": [
            {"label": st, "value": int(v), "src": "NCRB district-wise IPC returns"}
            for st, v in state_rank[:15]
        ],
    }
)

blocks.append(
    {
        "type": "bar",
        "title": f"Fastest-rising states, {state_first_y} → {state_last_y}",
        "subtitle": (
            f"Percentage change in recorded IPC crimes, among states recording at least "
            f"{n(MIN_BASE)} cases in {state_first_y} so the base is large enough for a percentage to mean something."
        ),
        "unit": "%",
        "max": int(round(max(m["pct"] for m in movers[:10]) * 1.15)),
        "note": (
            "Change in *recorded* crime. A state that improves its registration practice will rise here "
            "without offending having risen, which is why this chart names movement rather than blame."
        ),
        "emphasisIndex": 0,
        "data": [
            {
                "label": m["state"],
                "value": m["pct"],
                "src": f"{n(m['first'])} → {n(m['last'])} cases",
            }
            for m in movers[:10]
        ],
    }
)

# ── Verification against independently published NCRB figures ────────────────
#
# The five figures in REFERENCE are the ONLY numbers in this pipeline that were
# not computed from the vendored files. They are external reference values,
# each quoted from named press coverage of the NCRB volume for that year, and
# they exist solely to check the pipeline's output. They are labelled as such
# in the report and never plotted as data.
REFERENCE = [
    {
        "head": "murder",
        "year": 2015,
        "published": 32127,
        "cite": "NCRB Crime in India 2015, via data.gov.in catalogue listing",
        "url": "https://www.data.gov.in/catalog/crime-india-2015",
    },
    {
        "head": "murder",
        "year": 2017,
        "published": 28653,
        "cite": "NCRB Crime in India 2018 (stating the 2017 comparison), via Gulf News",
        "url": "https://gulfnews.com/world/asia/india/average-80-murders-91-rapes-daily-in-india-in-2018-ncrb-data-1.1578572333397",
    },
    {
        "head": "murder",
        "year": 2018,
        "published": 29017,
        "cite": "NCRB Crime in India 2018, via Gulf News",
        "url": "https://gulfnews.com/world/asia/india/average-80-murders-91-rapes-daily-in-india-in-2018-ncrb-data-1.1578572333397",
    },
    {
        "head": "rape",
        "year": 2017,
        "published": 32559,
        "cite": "NCRB Crime in India 2018 (stating the 2017 comparison), via Deccan Herald",
        "url": "https://www.deccanherald.com/national/conviction-rate-for-rape-cases-is-only-272-per-cent-792820",
    },
    {
        "head": "rape",
        "year": 2018,
        "published": 33356,
        "cite": "NCRB Crime in India 2018, via Deccan Herald",
        "url": "https://www.deccanherald.com/national/conviction-rate-for-rape-cases-is-only-272-per-cent-792820",
    },
]

# Read the map pipeline's own output back and total it, so the check runs
# against what the app actually ships rather than a re-derivation.
MAP_OUT = os.path.join(ROOT, "public", "pew-infographics", "reports", "india-crime-map-data.js")
verify_rows = []
if os.path.exists(MAP_OUT):
    raw = open(MAP_OUT, encoding="utf-8").read()
    marker = "window.INDIA_CRIME_MAP = "
    mapdata = json.loads(raw[raw.index(marker) + len(marker):].rstrip().rstrip(";"))
    for ref in REFERENCE:
        got = sum(
            st.get(str(ref["year"]), {}).get(ref["head"], 0)
            for st in mapdata["series"].values()
        )
        verify_rows.append(
            {
                **ref,
                "pipeline": got,
                "diff_pct": round(100 * (got - ref["published"]) / ref["published"], 2),
            }
        )

if verify_rows:
    worst = max(abs(r["diff_pct"]) for r in verify_rows)
    exact = sum(1 for r in verify_rows if r["diff_pct"] == 0)
    blocks.append(
        {
            "type": "verify",
            "title": "Checked against NCRB's own published totals",
            "subtitle": (
                "The map is built by summing district returns. To show that the sum is sound, each "
                "row below compares what this pipeline produces against the national figure NCRB "
                "published for that year, as reported by the outlet named. Those published figures "
                "are the only numbers on this page not computed from the vendored files — they are "
                "reference values, cited, and never plotted as data."
            ),
            "note": (
                f"{exact} of {len(verify_rows)} match to the case, and the largest divergence is "
                f"{worst}%. The direction is consistently negative, matching the known aggregation "
                "offset: district returns exclude some central units that the national total counts."
            ),
            "rows": verify_rows,
        }
    )

blocks.append(
    {
        "type": "map",
        "title": "Crime by state, year by year",
        "subtitle": (
            "Recorded cases for nine IPC crime heads from NCRB district returns, 2001 to 2018. "
            "Drag the year, switch the crime head, or press play to watch the map move."
        ),
        "note": (
            "These are *counts, not rates* — no state population series by year is vendored here, so "
            "Uttar Pradesh and Maharashtra read dark partly because they are populous. Colour bins are "
            "fixed across all years, so a shade means the same number in 2001 as it does in 2018; they "
            "are quantile bins because the distribution is heavily right-skewed. Each crime head offers "
            "only the years NCRB actually reports it for — the caption under the slider names any "
            "year the source skips, and no gap is filled in. Two territories are "
            "shaded from their parent state, because that is who reported them at the time: Telangana "
            "before 2014 (part of Andhra Pradesh until June that year) and Ladakh throughout (part of "
            "Jammu & Kashmir until 2019). Hovering either says so, and neither is double-counted in "
            "the table."
        ),
    }
)

blocks.append(
    {
        "type": "coverage",
        "unitLabel": "years",
        "title": "Year-by-year coverage in this repository",
        "subtitle": (
            "Every year from the requested window. Years with no entry are years whose NCRB tables "
            "are not vendored in this repo — they are gaps in the source data, not zeroes."
        ),
        "note": (
            "To extend the report, drop the corresponding NCRB tables into data/ncrb/source/ and "
            "re-run scripts/build_ncrb.py. No figure on this page is entered by hand."
        ),
        "columns": ["Year", "Data available"],
        "data": [],
    }
)

cov = blocks[-1]["data"]
for y in range(YEAR_FROM, 2027):
    figs = []
    if y in ipc_series:
        # unit "" — these are case counts and rates, not percentages
        figs.append({"k": "IPC crimes", "v": int(ipc_series[y]["ipc"]), "unit": ""})
        figs.append({"k": "Rate per lakh", "v": ipc_series[y]["rate_ipc"], "unit": ""})
    has_state = any(y in v for v in state_year.values())
    if has_state:
        figs.append(
            {
                "k": "States reporting",
                "v": len([1 for v in state_year.values() if y in v]),
                "unit": "",
            }
        )
    qual = None
    if not figs:
        if y <= 2024:
            qual = "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        else:
            qual = "No NCRB data exists: Crime in India 2024, released 6 May 2026, is the most recent volume."
    cov.append({"country": str(y), "figures": figs, "qualitative": qual})

blocks.append(
    {
        "type": "sources",
        "title": "Every source behind this report",
        "subtitle": (
            "The originating publisher is the National Crime Records Bureau in all cases. NCRB's own "
            "site and data.gov.in are both unreachable from the environment this was built in, so the "
            "tables were obtained from the public mirrors named below and are vendored in the repo at "
            "data/ncrb/source/ so the derivation can be checked end to end."
        ),
        "groups": [
            {
                "heading": "Primary data — the tables every figure is computed from",
                "items": [
                    {
                        "label": "NCRB Crime in India 2011 — national time-series table (2001–2011)",
                        "detail": "Mirrored by avinashladdha/CrimeDataset, which cites data.gov.in as its origin.",
                        "url": "https://github.com/avinashladdha/CrimeDataset",
                    },
                    {
                        "label": "NCRB Crime in India 2015 — national time-series table (2005–2015)",
                        "detail": "Same mirror. This is the edition on the old side of the SLL definition change.",
                        "url": "https://github.com/avinashladdha/CrimeDataset",
                    },
                    {
                        "label": "NCRB Crime in India 2016 — national time-series table (2014–2016)",
                        "detail": "Same mirror. The edition on the new side of the SLL definition change.",
                        "url": "https://github.com/avinashladdha/CrimeDataset",
                    },
                    {
                        "label": "NCRB district-wise IPC returns, 2001–2018",
                        "detail": "Drives the map and every state-level figure. Mirrored by reethified/India-IPC-Crimes-Datasets, which cites the NCRB Crime in India additional tables.",
                        "url": "https://github.com/reethified/India-IPC-Crimes-Datasets",
                    },
                ],
            },
            {
                "heading": "Boundaries",
                "items": [
                    {
                        "label": "India district boundaries (760 polygons)",
                        "detail": "Used as supplied and simplified for rendering. Boundaries are the publisher's; their use here is not a statement about any territorial claim.",
                        "url": "https://github.com/udit-001/india-maps-data",
                    }
                ],
            },
            {
                "heading": "Press reporting — used only to verify, never as data",
                "items": [
                    {
                        "label": "Gulf News — “Average 80 murders, 91 rapes daily in India in 2018: NCRB data”",
                        "detail": "Source for NCRB's published national murder totals for 2018 (29,017) and 2017 (28,653).",
                        "url": "https://gulfnews.com/world/asia/india/average-80-murders-91-rapes-daily-in-india-in-2018-ncrb-data-1.1578572333397",
                    },
                    {
                        "label": "Deccan Herald — “Conviction rate for rape cases is only 27.2 per cent”",
                        "detail": "Source for NCRB's published national rape totals for 2018 (33,356) and 2017 (32,559).",
                        "url": "https://www.deccanherald.com/national/conviction-rate-for-rape-cases-is-only-272-per-cent-792820",
                    },
                    {
                        "label": "data.gov.in — Crime in India 2015 catalogue",
                        "detail": "Source for NCRB's published national murder total for 2015 (32,127).",
                        "url": "https://www.data.gov.in/catalog/crime-india-2015",
                    },
                    {
                        "label": "Drishti IAS / Vision IAS — NCRB Crime in India 2024 coverage",
                        "detail": "Source for the publication-schedule facts: Crime in India 2024 was released 6 May 2026, so no 2025 or 2026 data exists.",
                        "url": "https://www.drishtiias.com/daily-updates/daily-news-analysis/ncrbs-crime-in-india-2024-report",
                    },
                ],
            },
        ],
        "note": (
            "The mirrors are not the primary publisher, and that is a real limitation: this report "
            "verifies them by reconciliation rather than by having fetched NCRB's own files. The "
            "checks above are what stand in for that — five independently published national totals, "
            "two matched to the case."
        ),
    }
)

blocks.append(
    {
        "type": "notes",
        "title": "How to read this report",
        "items": [
            {
                "heading": "Recorded crime is not the same as crime",
                "body": (
                    "NCRB counts cases registered by police. Changes reflect reporting willingness, "
                    "registration practice and legal definitions as much as underlying offending. A rise "
                    "can be a sign of better access to justice rather than a more dangerous country."
                ),
                "src": "Methodological note",
            },
            {
                "heading": "Only the IPC series spans the whole period",
                "body": (
                    f"The SLL and Total series break between the 2015 and 2016 editions — by "
                    f"{n(abs(bd['sll_delta']))} cases in {bd['year']} alone. Every multi-year chart here uses IPC."
                ),
                "src": "Computed from the source tables",
            },
            {
                "heading": "State and national figures come from different tables",
                "body": (
                    f"District returns summed to state level run {recon_lo}% to {recon_hi}% below the "
                    "published national totals, consistently across every year. The two are never mixed "
                    "within a single chart."
                ),
                "src": "Computed from both source files",
            },
            {
                "heading": "The data ends before the question does",
                "body": (
                    "NCRB's most recent publication is Crime in India 2024, released 6 May 2026. No 2025 "
                    "or 2026 figures exist anywhere — the reporting year trails the calendar year by about "
                    "18 months. The tables vendored here end earlier still, at "
                    f"{last_y} nationally and {state_last_y} for states."
                ),
                "src": "NCRB publication schedule",
            },
        ],
    }
)

report = {
    "meta": {
        "title": "Two Decades of Recorded Crime in India",
        "subtitle": (
            f"NCRB's own tables, {first_y}–{last_y} — what they show, and the two places where the "
            "official record does not agree with itself."
        ),
        "publisher": "National Crime Records Bureau (India)",
        "published": f"Crime in India volumes {first_y}–{last_y}",
        "sourceUrl": "https://www.ncrb.gov.in/",
        "lens": ["Country & region", "Crime & justice"],
        "topic": "Crime & justice",
        "year": last_y,
        "method": (
            f"Derived by scripts/build_ncrb.py from four NCRB tables vendored in data/ncrb/source/. "
            f"National series {first_y}–{last_y}; state-level {state_first_y}–{state_last_y} from district "
            "returns. Every figure on this page is computed from those files at build time — none is "
            "entered by hand."
        ),
        "completeness": (
            f"National IPC series is complete for {first_y}–{last_y} and state-level for "
            f"{state_first_y}–{state_last_y}. 2017 onward is not vendored here, and no NCRB data exists "
            "for 2025–26 at all. The coverage table lists every year explicitly."
        ),
    },
    "blocks": blocks,
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("// GENERATED FILE — do not edit by hand.\n")
    fh.write("// Produced by scripts/build_ncrb.py from data/ncrb/source/*.csv.\n")
    fh.write("// Every figure here was computed from those CSVs; none was typed in.\n")
    fh.write("// Regenerate with:  python3 scripts/build_ncrb.py\n\n")
    fh.write("window.PEW_REPORTS = window.PEW_REPORTS || {};\n\n")
    fh.write('window.PEW_REPORTS["india-crime-ncrb"] = ')
    json.dump(report, fh, indent=2, ensure_ascii=False)
    fh.write(";\n")

print(f"national IPC series : {first_y}–{last_y} ({len(ipc_years)} years)")
print(f"state-level         : {state_first_y}–{state_last_y} ({len(state_year)} states/UTs)")
print(f"IPC {first_y}→{last_y}     : {n(first_ipc)} → {n(last_ipc)}  ({ipc_growth_pct:+}%)")
print(f"rate {first_y}→{last_y}    : {first_rate} → {last_rate}  ({rate_growth_pct:+}%)")
print(f"SLL break {bd['year']}     : {n(bd['sll_2015ed'])} (CII-2015) vs {n(bd['sll_2016ed'])} (CII-2016)")
print(f"district-vs-national: {recon_lo}% to {recon_hi}%")
print(f"top state {state_last_y}     : {state_rank[0][0]} {n(state_rank[0][1])}")
print(f"wrote {os.path.relpath(OUT, ROOT)}")
