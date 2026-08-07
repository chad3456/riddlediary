# Population denominators

Every "per million" and "per capita" figure in the India Infrastructure Explorer
divides by a population value from these files. The denominator travels with the
data point, so any normalised figure can be reconstructed from the raw value.

| File | Rows | Coverage | Source |
|---|---|---|---|
| `population_worldbank.csv` | 17,196 | 1960–2024, all countries | [datasets/population](https://github.com/datasets/population), World Bank series |
| `population_owid.csv` | 38,332 | 1850–2024, 218 ISO3 countries | Extracted from [owid/co2-data](https://github.com/owid/co2-data) (population + GDP columns only) |

## Cross-check

India population, the two files against each other:

| Year | World Bank | OWID | Diff |
|---|---|---|---|
| 2010 | 1,243,481,564 | 1,243,481,565 | 0.00% |
| 2014 | 1,312,277,191 | 1,312,277,184 | −0.00% |
| 2020 | 1,402,617,695 | 1,402,617,694 | −0.00% |
| 2023 | 1,438,069,596 | 1,438,069,597 | 0.00% |

They agree to within floating-point rounding — differences of one to seven
people on a 1.3-billion base.

**This proves consistency, not independence.** OWID sources population from the
UN World Population Prospects / World Bank lineage, so the two files share an
upstream. Agreement here means neither has been corrupted in transit; it is not
a second opinion on India's population. Treat the denominator as one source,
not two.

## Why not fetch from the World Bank directly

`api.worldbank.org` and `datacatalog.worldbank.org` are both blocked by this
environment's egress policy (403 on CONNECT). These GitHub-hosted copies are
the reachable route, and are vendored so the pipeline is reproducible offline.
