# Agent 2 - verification & cleaning report

Generated from `data/infra/clean/indicators.json` by `scripts/verify_infra.py`.
Machine-readable report: `data/infra/clean/verification_report.json`.

## Headline

- **155,128 records verified, 0 rejected.** Every record that
  entered the store passed `infra_schema.validate`.
- **0 records without a source URL.** Provenance is mandatory in the
  schema, so a record cannot exist without one.
- **296 country/aggregate codes, 25 indicators, 2000-2025.**
- **2 errors, 5,229 warnings, 1,129 informational.**
- **Nothing was fabricated, imputed, interpolated or back-filled.** Missing country-years
  are absent from the store and are listed as missing in the coverage section.

## What agent 1 delivered

At the time of writing, `data/infra/raw/` contains exactly two files, both dropped
in one batch, and **no `agent1_manifest.md` was ever written**:

| File | Size |
|---|---|
| `data/infra/raw/owid-co2-data.csv` | 14.4 MB |
| `data/infra/raw/owid-energy-data.csv` | 9.2 MB |

Two further files appeared under `data/infra/population/` with their own
`PROVENANCE.md`. Those four files are the entire input to this pipeline.

This means the dashboard currently has **energy, electricity and emissions only**.
The categories the schema is built for but which have no data at all are:
transport, telecom, water & sanitation, urban, health infrastructure, education
infrastructure and finance. Several of those (road length, rail electrification,
broadband subscriptions, household toilet and tap coverage) are the indicators an
"India infrastructure since 2014" story most obviously needs. I have not
substituted anything for them.

## The two findings that need a human decision

### 1. The population cross-check claim in PROVENANCE.md does not generalise

`data/infra/population/PROVENANCE.md` states the World Bank and OWID population
files "agree to within floating-point rounding", evidencing it with four Indian
year rows. That is true **for India**. It is not true globally. Across the
5,150 country-years where both files have a value:

| Pairwise divergence | Country-years |
|---|---:|
| > 0.01% | 1,963 |
| > 1% | 670 |
| > 5% | 180 |
| > 10% | 65 |
| max | 36.6% (Moldova) |

Moldova differs by ~18% throughout the 2000s (2,924,668 vs 4,234,969 in 2000 -
almost certainly Transnistria in or out). Albania, Qatar, Curacao, Seychelles and
Togo also diverge materially. **Any per-capita figure for those countries is
denominator-dependent**, and the dashboard should not present one without saying
which population it divided by. India itself is unaffected.

### 2. OWID's two files disagree with each other on primary energy

`primary_energy_consumption` appears in both `owid-energy-data.csv` and
`owid-co2-data.csv`. For 126 country-years they disagree by more than 5% against
the median, reaching **31% for Somalia and Yemen**. These are two vintages of the
same upstream, not two opinions. I retained **both** values and flagged the
divergence; I did not pick one. India is not among the affected countries.

## How the checks were interpreted

- **Cross-source divergence is measured against the group median.** For a
  two-source comparison a 5% flag therefore corresponds to roughly a 10% pairwise
  spread. This is deliberate (it stops one outlier among three sources producing
  two symmetric complaints) but the numbers in this report and in
  `PROVENANCE.md`-style pairwise framings are not directly comparable.
- **Sibling sources are labelled.** Records carry `source_lineage`. Of
  15,668 cells covered by two or more
  source files, only 10,518
  span genuinely independent lineages. Agreement between the two population files
  proves nothing was corrupted in transit; it is **not** a second opinion, and the
  report never counts it as one.
- **Per-capita records carry the denominator that actually produced them.** A
  publisher's own per-capita column is stored with the publisher's own population;
  an absolute is stored with the canonical vendored denominator (World Bank first,
  OWID filling gaps). Mixing these produced 2,811 spurious reconstruction errors in
  an earlier pass - that was my bug, and it is fixed. All
  39,072
  population-normalised records are now arithmetically reconstructible.
- **Rounding is not an error.** Reconstruction mismatches are compared against the
  publisher's printed precision, propagated across both operands, before being
  called an error. A value printed as `0.016` is only claimed wrong if the gap
  exceeds what that formatting can hide.
- **Year-on-year jumps are flagged, never removed.** All 5,659
  are warnings. The 28 flagged for India are all solar and wind growing off a
  near-zero base (e.g. solar +654% 2010-2011) - real growth, not corruption, and
  exactly the story the dashboard is meant to show.

## The 2 genuine errors

| Indicator | Where | Issue |
|---|---|---|
| `total_ghg_mt_co2e` | Samoa (WSM), 2008 | Value is -0.003 million tonnes. A negative total GHG stock is not physical; it is a rounding artefact of a land-use sink in the upstream. Retained and flagged. |
| `co2_per_capita_t` | North America aggregate, 2000 | Published per-capita is 1.01% off reconstruction from the aggregate's own population. Affects an OWID regional aggregate, not a country. |

Neither touches India. Both are retained with the flag attached, per the
no-silent-deletion rule.

## File size

The fat canonical record is the right logical contract but a poor serialisation:
155,128 records written as JSON objects came to **119 MB**, almost all of it the
same dozen provenance strings repeated. Rather than truncate countries, I added
`scripts/infra_store.py`, which dictionary-encodes the repetition into a
`series_defs` / `countries` / `populations` / `rows` layout. Result: **6.6 MB**,
losslessly, with the round-trip asserted at build time and a sample re-validated
against the schema on every run. `data/infra/clean/by_indicator/` additionally
holds a per-indicator split (25 files plus an `index.json`) so the dashboard can
lazy-load one chart at a time.

---

Schema version `1.0.0`

## Totals

| metric | value |
|---|---:|
| records submitted | 155128 |
| records verified | 155128 |
| records rejected | 0 |
| records without source url | 0 |
| indicators | 25 |
| countries | 296 |
| year min | 2000 |
| year max | 2025 |

## Records per source

| source | records |
|---|---:|
| Our World in Data :: data/infra/raw/owid-energy-data.csv | 101234 |
| Our World in Data :: data/infra/raw/owid-co2-data.csv | 41869 |
| World Bank (via datasets/population) :: data/infra/population/population_worldbank.csv | 6625 |
| Our World in Data :: data/infra/population/population_owid.csv | 5400 |

## What each check actually had to work on

A check reporting zero findings means nothing unless it had data to examine. These are the denominators.

- **cross_source**
    - indicator country year cells: 139460
    - cells covered by 2plus sources: 15668
    - cells covered by 2plus INDEPENDENT lineages: 10518
- **yoy_jump**
    - series: 6226
    - consecutive year pairs available: 148902
    - series exempt as flow: 0
- **population_consistency**
    - population normalised records: 39072
    - records fully reconstructable: 39072
    - country year cells with population: 6046
    - cells with 2plus population sources: 6046

## Findings

| severity | count |
|---|---:|
| error | 2 |
| warn | 5229 |
| info | 1129 |

| check | count |
|---|---:|
| yoy_jump | 5659 |
| population_consistency | 383 |
| cross_source | 317 |
| range_sanity | 1 |

### cross_source (317)

- **warn** `primary_energy_consumption_twh` BHS 2023 - sources disagree by up to 6.33% (median 13.049, spread 1.652 twh)
    - Our World in Data = 12.223 (-6.33% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 13.875 (+6.33% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` BHS 2023 - sources disagree by up to 6.33% (median 32666.2, spread 4135.57 kwh)
    - Our World in Data = 30598.4 (-6.33% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 34734 (+6.33% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `primary_energy_consumption_twh` BRB 2023 - sources disagree by up to 8.40% (median 6.1695, spread 1.037 twh)
    - Our World in Data = 5.651 (-8.40% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 6.688 (+8.40% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` BRB 2023 - sources disagree by up to 8.41% (median 21851, spread 3674.22 kwh)
    - Our World in Data = 20013.9 (-8.41% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 23688.1 (+8.41% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `primary_energy_consumption_twh` BEN 2023 - sources disagree by up to 6.84% (median 28.727, spread 3.928 twh)
    - Our World in Data = 26.763 (-6.84% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 30.691 (+6.84% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` BEN 2023 - sources disagree by up to 6.84% (median 2035.81, spread 278.363 kwh)
    - Our World in Data = 1896.63 (-6.84% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 2174.99 (+6.84% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `primary_energy_consumption_twh` BDI 2022 - sources disagree by up to 5.82% (median 3.866, spread 0.45 twh)
    - Our World in Data = 3.641 (-5.82% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 4.091 (+5.82% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` BDI 2022 - sources disagree by up to 5.81% (median 290.226, spread 33.743 kwh)
    - Our World in Data = 273.355 (-5.81% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 307.098 (+5.81% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `primary_energy_consumption_twh` CAF 2019 - sources disagree by up to 7.96% (median 1.4515, spread 0.231 twh)
    - Our World in Data = 1.336 (-7.96% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 1.567 (+7.96% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` CAF 2019 - sources disagree by up to 7.94% (median 293.526, spread 46.584 kwh)
    - Our World in Data = 270.234 (-7.94% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 316.818 (+7.94% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `primary_energy_consumption_twh` CAF 2020 - sources disagree by up to 7.13% (median 1.5085, spread 0.215 twh)
    - Our World in Data = 1.401 (-7.13% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 1.616 (+7.13% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- **warn** `energy_per_capita_kwh` CAF 2020 - sources disagree by up to 7.13% (median 300.029, spread 42.755 kwh)
    - Our World in Data = 278.651 (-7.13% vs median) <https://raw.githubusercontent.com/owid/energy-data/master/owid-energy-data.csv>
    - Our World in Data = 321.406 (+7.13% vs median) <https://raw.githubusercontent.com/owid/co2-data/master/owid-co2-data.csv>
- _...and 305 more (see JSON report)_

### population_consistency (383)

- **error** `co2_per_capita_t` OWID_NAM 2000 - per-capita value 14.786 does not reconstruct from 7.11153e+09 / 4.85805e+08 * 1 = 14.6386 (off by 1.01%, beyond the +/-0.000501 printed-precision band)
- **warn** - population denominator for ALB 2014 differs by up to 2.29% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2015 differs by up to 2.97% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2016 differs by up to 3.73% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2017 differs by up to 4.51% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2018 differs by up to 5.21% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2019 differs by up to 5.82% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2020 differs by up to 6.36% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2021 differs by up to 6.74% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2022 differs by up to 7.12% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2023 differs by up to 7.61% between sources; every per-capita indicator built on it inherits this divergence
- **warn** - population denominator for ALB 2024 differs by up to 8.02% between sources; every per-capita indicator built on it inherits this divergence
- _...and 371 more (see JSON report)_

### range_sanity (1)

- **error** `total_ghg_mt_co2e` WSM 2008 - negative value -0.003 for a non-negative unit (million tonnes)

### yoy_jump (5659)

- **warn** `hydro_electricity_twh` AFG 2001 - +61.3% change 2000->2001 (0.31 -> 0.5) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2003 - +125.0% change 2002->2003 (0.04 -> 0.09) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2006 - +150.0% change 2005->2006 (0.06 -> 0.15) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2009 - -53.8% change 2008->2009 (0.13 -> 0.06) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2011 - +66.7% change 2010->2011 (0.06 -> 0.1) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2013 - +71.4% change 2012->2013 (0.07 -> 0.12) exceeds 50% threshold
- **warn** `coal_electricity_twh` AFG 2020 - -75.0% change 2019->2020 (0.08 -> 0.02) exceeds 50% threshold
- **warn** `renewables_electricity_twh` AFG 2001 - +61.3% change 2000->2001 (0.31 -> 0.5) exceeds 50% threshold
- **warn** `fossil_share_elec_pct` AFG 2009 - -59.8% change 2008->2009 (30.769 -> 12.36) exceeds 50% threshold
- **warn** `primary_energy_consumption_twh` AFG 2008 - +93.9% change 2007->2008 (7.758 -> 15.04) exceeds 50% threshold
- **warn** `primary_energy_consumption_twh` AFG 2009 - +67.9% change 2008->2009 (15.04 -> 25.258) exceeds 50% threshold
- **warn** `energy_per_capita_kwh` AFG 2008 - +89.7% change 2007->2008 (299.434 -> 567.922) exceeds 50% threshold
- _...and 5647 more (see JSON report)_

## Coverage

| indicator | unit | basis | records | countries | years | density | sources |
|---|---|---|---:|---:|---|---:|---:|
| `cement_co2_mt` | million tonnes | absolute | 5526 | 211 | 2000-2024 | 99.78% | 1 |
| `co2_emissions_mt` | million tonnes | absolute | 5675 | 215 | 2000-2024 | 100.0% | 1 |
| `co2_per_capita_t` | tonnes | per capita | 5625 | 213 | 2000-2024 | 100.0% | 1 |
| `coal_co2_mt` | million tonnes | absolute | 3722 | 150 | 2000-2024 | 91.7% | 1 |
| `coal_electricity_twh` | TWh | absolute | 5605 | 211 | 2000-2025 | 98.84% | 1 |
| `electricity_demand_twh` | TWh | absolute | 5690 | 214 | 2000-2025 | 98.77% | 1 |
| `electricity_generation_gwh_per_million_people` | GWh | per million people | 5690 | 214 | 2000-2025 | 98.77% | 1 |
| `electricity_generation_twh` | TWh | absolute | 5690 | 214 | 2000-2025 | 98.77% | 1 |
| `electricity_per_capita_kwh` | kWh | per capita | 5690 | 214 | 2000-2025 | 98.77% | 1 |
| `energy_per_capita_kwh` | kWh | per capita | 10919 | 217 | 2000-2024 | 99.04% | 2 |
| `fossil_share_elec_pct` | percent | % | 5664 | 213 | 2000-2025 | 98.72% | 1 |
| `hydro_electricity_twh` | TWh | absolute | 5595 | 211 | 2000-2025 | 98.54% | 1 |
| `low_carbon_share_elec_pct` | percent | % | 5664 | 213 | 2000-2025 | 98.72% | 1 |
| `methane_mt_co2e` | million tonnes | absolute | 5275 | 199 | 2000-2024 | 100.0% | 1 |
| `nuclear_electricity_twh` | TWh | absolute | 5521 | 208 | 2000-2025 | 98.91% | 1 |
| `population_persons` | count of people | absolute | 12025 | 275 | 2000-2024 | 100.0% | 2 |
| `primary_energy_consumption_twh` | TWh | absolute | 10981 | 218 | 2000-2024 | 99.46% | 2 |
| `renewables_electricity_twh` | TWh | absolute | 5690 | 214 | 2000-2025 | 98.77% | 1 |
| `renewables_share_elec_pct` | percent | % | 5664 | 213 | 2000-2025 | 98.72% | 1 |
| `solar_elec_per_capita_kwh` | kWh | per capita | 5672 | 214 | 2000-2025 | 98.77% | 1 |
| `solar_electricity_twh` | TWh | absolute | 5672 | 214 | 2000-2025 | 98.77% | 1 |
| `solar_share_elec_pct` | percent | % | 5646 | 213 | 2000-2025 | 98.72% | 1 |
| `total_ghg_mt_co2e` | million tonnes | absolute | 5275 | 199 | 2000-2024 | 100.0% | 1 |
| `wind_elec_per_capita_kwh` | kWh | per capita | 5476 | 211 | 2000-2025 | 98.41% | 1 |
| `wind_electricity_twh` | TWh | absolute | 5476 | 211 | 2000-2025 | 98.41% | 1 |
