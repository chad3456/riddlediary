# NCRB source files

Every number in the "Crime in India" report rendered by this app is derived
from these four CSVs by `scripts/build_ncrb.py`. Nothing is typed in by hand
and nothing is estimated — regenerate the report data at any time with:

```
python3 scripts/build_ncrb.py
```

## Why these files are committed

`ncrb.gov.in` and `data.gov.in` are both unreachable from the environment this
was built in (the egress proxy returns 403 on CONNECT for each — an
organization policy denial, not a transient failure). The source CSVs are
therefore vendored here so the pipeline is reproducible without network access,
and so anyone can check the derived figures against the raw input.

## The files

| File | Rows | Covers | Origin |
|---|---|---|---|
| `national_cognizable_2001_2011_CII2011.csv` | 11 data years | 2001–2011 | NCRB *Crime in India 2011*, national time-series table |
| `national_cognizable_2005_2015_CII2015.csv` | 11 data years | 2005–2015 | NCRB *Crime in India 2015*, national time-series table |
| `national_cognizable_2014_2016_CII2016.csv` | 3 data years | 2014–2016 | NCRB *Crime in India 2016*, national time-series table |
| `district_wise_ipc_2001_2012.csv` | 9,017 | 2001–2012 | NCRB district-wise IPC crime returns |

The three national files were obtained from
<https://github.com/avinashladdha/CrimeDataset>, which states it sourced them
from the Open Government Data platform (<https://data.gov.in/>). The
district-wise file was obtained from
<https://github.com/reethified/India-IPC-Crimes-Datasets>, which cites the NCRB
"Crime in India" additional tables as its source.

Both are mirrors, not the primary publisher. They are used here because the
primary publisher is network-blocked; the reconciliation checks below are what
establish that the mirrored numbers are internally consistent and match NCRB's
own published national totals.

## Two real data problems these files expose

The pipeline does not paper over either of these — the report surfaces both.

### 1. The SLL definition changed between the 2015 and 2016 editions

The same year, reported by two different NCRB editions, does not agree:

| Year | Edition | IPC | SLL | Total |
|---|---|---|---|---|
| 2014 | *Crime in India 2015* | 2,851,563 | 4,377,630 | 7,229,193 |
| 2014 | *Crime in India 2016* | 2,851,563 | **1,720,100** | **4,571,663** |
| 2015 | *Crime in India 2015* | 2,949,400 | 4,376,699 | 7,326,099 |
| 2015 | *Crime in India 2016* | 2,949,400 | **1,761,276** | **4,710,676** |

IPC and population match to the digit; SLL differs by ~2.6 million. NCRB
narrowed what counts as an SLL cognizable crime. **The IPC series is therefore
the only one comparable across the whole span**, and the app charts the SLL and
Total series only within an edition, never across the break.

### 2. District returns do not sum to the published national total

Summing the per-state `TOTAL` rows in the district file falls short of NCRB's
published national IPC incidence by a stable 2.3–3.1% every year:

| Year | Sum of state totals | NCRB published | Gap |
|---|---|---|---|
| 2004 | 1,778,387 | 1,832,015 | −2.93% |
| 2008 | 2,044,029 | 2,093,379 | −2.36% |
| 2012 | 2,332,901 | 2,387,188 | −2.27% |

The gap is systematic rather than noisy, consistent with central/railway
police units being counted in the national total but not in state returns
(the district file carries separate `G.R.P.` and `RAILWAYS` rows). The
consequence for the report: **national figures come from the national files,
state comparisons come from the district file, and the two are never mixed in
one chart.** `build_ncrb.py` recomputes this reconciliation on every run and
writes it into the report, so the gap is shown rather than hidden.

## Coverage limits

- These files end at **2016** (national) and **2012** (state-level).
- NCRB's most recent publication is *Crime in India 2024*, released 6 May 2026.
  **There is no 2025 or 2026 NCRB data** — the reporting year always trails the
  calendar year by roughly 18 months.
- 2017–2024 is therefore a genuine gap in this repository. To close it, drop
  the corresponding NCRB tables into this directory and extend
  `scripts/build_ncrb.py`; nothing else needs changing.

## Map layer

Two further files drive the state-by-year choropleth, via
`scripts/build_ncrb_map.py`:

| File | Covers | Origin |
|---|---|---|
| `District_wise_IPC_crimes_reported_2001_2018.xlsx` | 2001–2018 (2001–2015 used) | NCRB district returns, via <https://github.com/reethified/India-IPC-Crimes-Datasets> |
| `india_districts.geojson` | 760 district polygons | <https://github.com/udit-001/india-maps-data> |

### Why the map stops at 2015

The workbook's 2016, 2017 and 2018 sheets carry a **corrupt YEAR column** — it
holds a row index (0, 1, 2, …) rather than a year, so no row on those sheets can
be attributed to a year. They are skipped rather than guessed at. 2013–2015 are
usable after normalising header spellings (`ROBERRY`, `ASSAULT ON OWMEN`,
`KIDNAPPING ABDUCTION`).

### Which crime heads, and why only seven

Only heads present on *every* usable sheet are emitted, so no series has a
year-shaped hole: murder, rape, riots, theft, robbery, dowry deaths, assault on
women. Dacoity and kidnapping are dropped — each is missing from at least one
sheet (2014 replaces dacoity with rash driving; 2015 omits kidnapping).

### Aggregation basis

Per state-year, all district rows are summed and the sheets' own aggregate rows
(`TOTAL`, `ZZ TOTAL`) are excluded, so nothing is counted twice. This basis
exists on every sheet, whereas the aggregate rows are missing from some. It runs
about **3% above** those TOTAL rows because railway/CID/crime-branch units are
included.

Sanity check: this basis gives **31,945 murders nationally in 2015** against
NCRB's published figure of roughly 32,127 — a 0.6% difference, consistent with
the aggregation note above.

### Successor states

Two territories in the modern GeoJSON did not exist for most of the data period.
They are shaded from the state that actually reported them, labelled as such on
hover, and excluded from the ranking table so nothing is double-counted:

- **Telangana** — part of Andhra Pradesh until June 2014; has its own NCRB rows from 2014.
- **Ladakh** — part of Jammu & Kashmir until 2019; has no rows in this period at all.

Boundaries are the GeoJSON publisher's and are used as supplied; they are not a
statement about any territorial claim.
