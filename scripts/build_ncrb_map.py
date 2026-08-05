#!/usr/bin/env python3
"""Build the state-by-year crime map data from NCRB district returns.

Reads:
  data/ncrb/source/District_wise_IPC_crimes_reported_2001_2018.xlsx
  data/ncrb/source/india_districts.geojson

Writes:
  public/pew-infographics/reports/india-crime-map-data.js

Every value is aggregated from the workbook at build time. Nothing is typed in.

Aggregation basis: for each state-year, all district rows are summed, excluding
the sheets' own aggregate rows ("TOTAL" / "ZZ TOTAL") so nothing is counted
twice. That basis is available in every sheet, whereas the aggregate rows are
missing from some, and it runs about 3% above the sheets' own TOTAL rows
because it includes railway/CID/crime-branch reporting units that those rows
leave out. The report states this.

Coverage is per crime head, not one shared year range. The sheets disagree
about which heads they carry (2017 drops riots and assault-on-women, 2018 drops
riots and robbery, 2014 drops dacoity, and so on), so insisting on heads present
in EVERY sheet would cut the map from nine heads to four. Instead each head
carries its own list of years, the UI offers only those years, and a head is
never interpolated across a sheet that does not report it.

The YEAR column is read by header name, and where a sheet has no YEAR column at
all (2017) the sheet's own name supplies the year. An earlier version of this
script read the column positionally and mistook the 2016/2017/2018 sheets for
having corrupt years; they do not.
"""

import json
import math
import os
import re
from collections import defaultdict

import openpyxl

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "data", "ncrb", "source")
XLSX = os.path.join(SRC, "District_wise_IPC_crimes_reported_2001_2018.xlsx")
GEO = os.path.join(SRC, "india_districts.geojson")
OUT = os.path.join(ROOT, "public", "pew-infographics", "reports", "india-crime-map-data.js")

SHEETS = ["2001-2012", "2013", "2014", "2015", "2016", "2017", "2018"]

# Header spellings differ per sheet, including outright typos in the source
# ("ROBERRY", "ASSAULT ON OWMEN", "DACOITS").
CANON = {
    "MURDER": "murder",
    "RAPE": "rape",
    "RIOTS": "riots",
    "THEFT": "theft",
    "ROBBERY": "robbery",
    "ROBERRY": "robbery",
    "DOWRY DEATHS": "dowry_deaths",
    "DOWRY DEATH": "dowry_deaths",
    "DOWRY": "dowry_deaths",
    "ASSAULT ON WOMEN": "assault_on_women",
    "ASSAULT ON OWMEN": "assault_on_women",
    "KIDNAPPING AND ABDUCTION": "kidnapping",
    "KIDNAPPING ABDUCTION": "kidnapping",
    "DACOITY": "dacoity",
    "DACOITS": "dacoity",
}

LABELS = {
    "murder": "Murder",
    "rape": "Rape",
    "riots": "Riots",
    "theft": "Theft",
    "robbery": "Robbery",
    "dowry_deaths": "Dowry deaths",
    "assault_on_women": "Assault on women",
    "kidnapping": "Kidnapping & abduction",
    "dacoity": "Dacoity",
}

AGGREGATE_ROWS = {"TOTAL", "ZZ TOTAL", "TOTAL STATE(S)", "GRAND TOTAL"}

# NCRB spellings → the GeoJSON's st_nm spellings.
STATE_ALIASES = {
    "A & N ISLANDS": "Andaman and Nicobar Islands",
    "A&N ISLANDS": "Andaman and Nicobar Islands",
    "ANDAMAN & NICOBAR ISLANDS": "Andaman and Nicobar Islands",
    "D & N HAVELI": "Dadra and Nagar Haveli and Daman and Diu",
    "D&N HAVELI": "Dadra and Nagar Haveli and Daman and Diu",
    "DAMAN & DIU": "Dadra and Nagar Haveli and Daman and Diu",
    "DELHI UT": "Delhi",
    "DELHI": "Delhi",
    "ORISSA": "Odisha",
    "ODISHA": "Odisha",
    "PONDICHERRY": "Puducherry",
    "PUDUCHERRY": "Puducherry",
    "JAMMU & KASHMIR": "Jammu and Kashmir",
    "UTTARANCHAL": "Uttarakhand",
    "UTTARAKHAND": "Uttarakhand",
    "CHATISGARH": "Chhattisgarh",
    "CHHATTISGARH": "Chhattisgarh",
    "TELENGANA": "Telangana",
    "HARAYANA": "Haryana",  # misspelt in one sheet; would split Haryana in two
}


def canon_state(raw):
    s = re.sub(r"\s+", " ", str(raw or "").strip().upper())
    if not s or s in AGGREGATE_ROWS:
        return None
    if s in STATE_ALIASES:
        return STATE_ALIASES[s]
    return s.title().replace(" And ", " and ")


def as_int(v):
    if v is None:
        return 0
    if isinstance(v, (int, float)):
        return int(v)
    s = re.sub(r"[^\d\-]", "", str(v))
    return int(s) if s else 0


# ── 1. Read the workbook ─────────────────────────────────────────────────────

wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)

# state -> year -> head -> value
data = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
# head -> set of years the SOURCE actually reports it (a head absent from a
# sheet must stay absent, not silently become zero)
head_years = defaultdict(set)
sheet_report = []

for sn in SHEETS:
    ws = wb[sn]
    rows = ws.iter_rows(values_only=True)
    hdr = [str(h).strip().upper() if h else "" for h in next(rows)]

    idx = {}
    for i, h in enumerate(hdr):
        if h in CANON and CANON[h] not in idx:
            idx[CANON[h]] = i
    try:
        iS, iD = hdr.index("STATE"), hdr.index("DISTRICT")
    except ValueError:
        continue
    iY = hdr.index("YEAR") if "YEAR" in hdr else None
    # A single-year sheet with no YEAR column: its name is the year.
    sheet_year = int(sn) if re.fullmatch(r"\d{4}", sn) else None

    n_rows = 0
    for r in rows:
        if r is None or iS >= len(r):
            continue
        district = re.sub(r"\s+", " ", str(r[iD] or "").strip().upper())
        if district in AGGREGATE_ROWS:
            continue  # never mix aggregate rows with the districts they aggregate
        st = canon_state(r[iS])
        if not st:
            continue

        y = None
        if iY is not None and iY < len(r):
            m = re.match(r"\s*(\d{4})", str(r[iY] or ""))
            if m:
                y = int(m.group(1))
        if y is None:
            y = sheet_year
        if y is None or not (2001 <= y <= 2018):
            continue

        n_rows += 1
        for head, i in idx.items():
            if i < len(r):
                data[st][y][head] += as_int(r[i])
                head_years[head].add(y)

    sheet_report.append((sn, n_rows, sorted(idx)))

wb.close()

HEADS = sorted(head_years)
years = sorted({y for st in data for y in data[st]})
states = sorted(data)

# ── 2. Read + simplify the district geometry ─────────────────────────────────


def perp_dist(p, a, b):
    (x, y), (x1, y1), (x2, y2) = p, a, b
    dx, dy = x2 - x1, y2 - y1
    if dx == 0 and dy == 0:
        return math.hypot(x - x1, y - y1)
    t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy)))
    return math.hypot(x - (x1 + t * dx), y - (y1 + t * dy))


def rdp(pts, eps):
    """Ramer-Douglas-Peucker, iterative so deep rings can't blow the stack."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        s, e = stack.pop()
        dmax, imax = 0.0, s
        for i in range(s + 1, e):
            d = perp_dist(pts[i], pts[s], pts[e])
            if d > dmax:
                dmax, imax = d, i
        if dmax > eps:
            keep[imax] = True
            stack.append((s, imax))
            stack.append((imax, e))
    return [p for p, k in zip(pts, keep) if k]


TOL = 0.012  # degrees; ~1.3 km — plenty for a nationwide choropleth
MIN_RING_PTS = 4

geo = json.load(open(GEO, encoding="utf-8"))
shapes = defaultdict(list)  # state -> [path-string, ...]

for feat in geo["features"]:
    st = canon_state(feat["properties"].get("st_nm"))
    if not st:
        continue
    g = feat.get("geometry") or {}
    polys = []
    if g.get("type") == "Polygon":
        polys = [g["coordinates"]]
    elif g.get("type") == "MultiPolygon":
        polys = g["coordinates"]
    for poly in polys:
        for ring in poly:
            raw = [(float(c[0]), float(c[1])) for c in ring if c and len(c) >= 2]
            if len(raw) < MIN_RING_PTS:
                continue
            # Back off the tolerance for features smaller than it — otherwise
            # small island UTs (Lakshadweep) simplify away to nothing and drop
            # off the map entirely.
            pts = []
            for tol in (TOL, TOL / 4, TOL / 16, 0.0):
                pts = rdp(raw, tol) if tol else raw
                if len(pts) >= MIN_RING_PTS:
                    break
            if len(pts) < MIN_RING_PTS:
                continue
            shapes[st].append([[round(x, 3), round(y, 3)] for x, y in pts])

# ── 3. Emit ──────────────────────────────────────────────────────────────────

matched = sorted(set(shapes) & set(states))
data_only = sorted(set(states) - set(shapes))
geo_only = sorted(set(shapes) - set(states))

# A head is emitted for a year whenever the SOURCE reported that head that
# year — including when the tally is 0. Dropping zeros would paint a state
# with genuinely no dowry deaths as "no data" grey, which is a different and
# wrong claim. Absent means "the source did not report this", nothing else.
out_series = {}
for st in states:
    out_series[st] = {
        str(y): {h: data[st][y][h] for h in HEADS if y in head_years[h]}
        for y in sorted(data[st])
    }

payload = {
    "meta": {
        "years": years,
        "heads": HEADS,
        # Each head offers only the years the source reports it for. A head is
        # never carried across a sheet that omits it.
        "headYears": {h: sorted(head_years[h]) for h in HEADS},
        "labels": LABELS,
        "states_with_data": len(states),
        "states_with_geometry": len(shapes),
        "states_matched": len(matched),
        "data_without_geometry": data_only,
        "geometry_without_data": geo_only,
        "simplify_tolerance_deg": TOL,
        "source": "NCRB district-wise IPC returns, 2001-2015",
        "basis": (
            "Sum of district rows per state-year, excluding the sheets' own aggregate rows. "
            "Runs ~3% above the sheets' TOTAL rows because railway/CID units are included."
        ),
    },
    "shapes": shapes,
    "series": out_series,
}

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    fh.write("// GENERATED FILE - do not edit by hand.\n")
    fh.write("// Produced by scripts/build_ncrb_map.py from the NCRB workbook + district GeoJSON.\n")
    fh.write("// Regenerate with:  python3 scripts/build_ncrb_map.py\n\n")
    fh.write("window.INDIA_CRIME_MAP = ")
    json.dump(payload, fh, separators=(",", ":"), ensure_ascii=False)
    fh.write(";\n")

size = os.path.getsize(OUT)
print(f"years        : {years[0]}-{years[-1]} ({len(years)})")
print(f"crime heads  : {', '.join(HEADS)}")
print(f"states data  : {len(states)}   geometry: {len(shapes)}   matched: {len(matched)}")
if data_only:
    print(f"  !! data but no geometry (name mismatch?) : {data_only}")
if geo_only:
    print(f"  geometry but no data : {geo_only}")
print("per-sheet rows / heads:")
for sn, n, hs in sheet_report:
    print(f"  {sn:11} {n:>5} rows  {len(hs)} heads")
print("per-head year coverage:")
for h in HEADS:
    ys = sorted(head_years[h])
    gaps = [y for y in range(ys[0], ys[-1] + 1) if y not in head_years[h]]
    print(f"  {h:18} {ys[0]}-{ys[-1]} ({len(ys)} yrs)" + (f"  gaps: {gaps}" if gaps else ""))
for probe in ("murder", "rape"):
    for yy in (2015, 2018):
        if yy in head_years[probe]:
            t = sum(data[st][yy][probe] for st in states if yy in data[st])
            print(f"national {probe} {yy}: {t:,}")
print(f"wrote {os.path.relpath(OUT, ROOT)}  ({size/1024:.0f} KB)")
