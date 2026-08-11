# Population denominators

Every "per million" and "per capita" figure in the India Infrastructure Explorer
divides by a population value from these files. The denominator travels with the
data point, so any normalised figure can be reconstructed from the raw value.

| File | Rows | Coverage | Source |
|---|---|---|---|
| `population_worldbank.csv` | 17,196 | 1960–2024, all countries | [datasets/population](https://github.com/datasets/population), World Bank series |
| `population_owid.csv` | 38,332 | 1850–2024, 218 ISO3 countries | Extracted from [owid/co2-data](https://github.com/owid/co2-data) (population + GDP columns only) |

## CORRECTION — the earlier version of this file was wrong

An earlier version claimed the two files "agree to within floating-point
rounding", evidenced with four Indian rows. **That generalisation was wrong and
is retracted.** It is true for India and false globally.

Measured across all 13,360 shared country-years:

| Divergence | Country-years |
|---|---|
| > 1% | 1,501 |
| > 5% | 385 |
| worst | **49.5%** |

The worst cases are Moldova (WB 2.30M vs OWID 3.44M for 1966 — almost certainly
Transnistria counted in one and not the other), and similar territorial-boundary
disagreements elsewhere.

India's worst divergence across the whole period is **0.0000%**, which is
precisely why a four-row India spot-check looked flawless and hid a real problem.
Credit for catching this goes to the verification agent, which checked all
shared country-years rather than a sample.

### What this means in practice

- **For India, the denominator is not in doubt.** Every India per-capita figure
  in the explorer is safe on this axis.
- **For cross-country comparison it can matter.** If you compare India against
  Moldova, Albania, Qatar, Curaçao, Seychelles or Togo, the per-capita result
  depends on which population series was used. The record carries
  `population_source` so you can see which one produced any given figure.
- The two files are **not independent sources.** Both descend from the UN World
  Population Prospects / World Bank lineage. Where they agree, that is evidence
  of clean transit, not a second opinion. Treat them as one source.

## Why not fetch from the World Bank directly

`api.worldbank.org` and `datacatalog.worldbank.org` are both blocked by this
environment's egress policy (403 on CONNECT). These GitHub-hosted copies are
the reachable route, and are vendored so the pipeline is reproducible offline.

## Reproducing the divergence check

```
python3 - <<'PY'
import csv
wb={}
for r in csv.DictReader(open('data/infra/population/population_worldbank.csv')):
    try: wb[(r['Country Code'],int(r['Year']))]=float(r['Value'])
    except: pass
ow={}
for r in csv.DictReader(open('data/infra/population/population_owid.csv')):
    try: ow[(r['iso_code'],int(r['year']))]=float(r['population'])
    except: pass
div=sorted(((abs(ow[k]-wb[k])/wb[k]*100,k) for k in set(wb)&set(ow) if wb[k]),reverse=True)
print(f">1%: {sum(1 for d in div if d[0]>1)}  >5%: {sum(1 for d in div if d[0]>5)}  max: {div[0]}")
PY
```
