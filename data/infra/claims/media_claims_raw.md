# AGENT 4 — MEDIA & WEB LAYER
## Cited claims about Indian infrastructure since 2014: official claims, media reports, third-party analysis, and criticism

**Compiled:** 2026-08-07
**Method:** WebSearch only. `WebFetch` was blocked at the egress proxy for **pib.gov.in**, **prsindia.org**, and previously for several news domains (403s). I therefore could **not** open primary documents directly — every figure below is taken from **search-engine result summaries** of those pages, not from reading the page text myself. Treat all figures as "reported by the cited source per search snippet" until a teammate can open the primary link.
**No social media was scraped.** X/Twitter, Reddit and Instagram APIs require auth and were not available. Nothing below is social-media sentiment.

**Flags used:** `OFFICIAL_CLAIM` (govt/ministry/PIB/minister), `MEDIA_REPORT`, `THIRD_PARTY_ANALYSIS` (think tank, academic, multilateral), `CRITICISM` (sceptical/audit/opposition).

---

## 1. TABLE OF NUMERIC CLAIMS

### 1.1 National highways & roads

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Highways | National highway network length | 91,287 km (2014) → 1,46,145 km (Dec 2023) | MoRTH / Road Secretary, via Deccan Herald | ~2023–24 (snippet undated) | OFFICIAL_CLAIM (reported) | YES — DD News and PIB Year-End Review 2024 give same 2014 base and ~1,46,000 km end point | https://www.deccanherald.com/india/length-of-national-highways-in-india-increased-60-in-10-years-road-secy-2836745 |
| Highways | NH network grew 60% in a decade; India now 2nd-largest road network | 91,287 → ~1,46,195 km | DD News (state broadcaster) | 2024 | OFFICIAL_CLAIM | YES (see above) | https://ddnews.gov.in/en/indias-national-highways-achieve-60-growth-in-a-decade-establishing-the-second-largest-network-globally/ |
| Highways | NH length after FY25, with 10,660 km built in FY25 | 1,46,342 km | Swarajya (citing MoRTH) | 2025 | MEDIA_REPORT | Partially — value differs slightly from other end-points (see §2.1) | https://swarajyamag.com/news-brief/indias-national-highways-network-expands-to-146342-km-with-10660-km-built-in-fy25 |
| Highways | MoRTH Year End Review 2024 (primary govt source for NH stats) | — | PIB, Ministry of Road Transport & Highways | Dec 2024 | OFFICIAL_CLAIM | — (could not open; PIB blocked) | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2091508&reg=48&lang=2 |
| Highways | High-speed corridors | 93 km (2014) → 2,474 km | MoRTH, via search summary of DD News/PIB | 2024 | OFFICIAL_CLAIM | NO — single-source in my search; needs verification | https://ddnews.gov.in/en/indias-national-highways-achieve-60-growth-in-a-decade-establishing-the-second-largest-network-globally/ |
| Highways | NH stretches with 4+ lanes | 18,371 km (2014) → 48,422 km (2024), 2.6× | Govt / newsonair (Prasar Bharati) | Jun 2025 | OFFICIAL_CLAIM | NO — single-source | https://www.newsonair.gov.in/indias-transport-infra-transformed-over-11-years-highways-railways-airports-upgraded |
| Highways | Construction pace | 12 km/day (2014-15) → 37 km/day (2020-21) | MoRTH, via Swarajya | 2021 | OFFICIAL_CLAIM | YES — Hindustan Times (PressReader) reports the same 37 km/day record | https://swarajyamag.com/infrastructure/highway-construction-increases-from-12-km-per-day-in-2014-15-to-37-km-per-day-in-2020-21 |
| Highways | NH km constructed per year | 4,410 km (2014-15) → 13,327 km (2020-21) | MoRTH via Swarajya | 2021 | OFFICIAL_CLAIM | NO — single-source | (same as above) |
| Highways | Pace since peak: 34 km/day (2023-24), ~29 km/day (2024-25) | — | MoRTH figures via media | 2024–25 | MEDIA_REPORT | Partially — newsonair also cites 34 km/day for 2023-24 | https://www.newsonair.gov.in/indias-transport-infra-transformed-over-11-years-highways-railways-airports-upgraded |
| Highways | Pace fell to 19.44 km/day in Apr–Sep of a fiscal year | 19.44 km/day | Tribune India | undated in snippet | CRITICISM / MEDIA_REPORT | NO | https://www.tribuneindia.com/news/nation/highway-construction-slows-to-19-44-km-per-day-during-april-september-440936 |
| Highways | Bharatmala: 26,425 km awarded, 20,378 km constructed | — | Govt data via analysis pieces | 2024–25 | OFFICIAL_CLAIM | Partially | https://www.drishtiias.com/daily-updates/daily-news-analysis/india-s-journey-of-infrastructure-development |
| Road safety | Road accident deaths | ~137,572 (2014) → 1.72 lakh (2023) → ~1.80 lakh (2024) | MoRTH "Road Accidents in India" reports; 2024 figure stated by Nitin Gadkari | 2023 report / 2024–25 | OFFICIAL_CLAIM used as COUNTER-EVIDENCE | YES — 2014 figure from Data For India; 2023 from MoRTH report PDF; 2024 from Gadkari via newsonair | https://morth.gov.in/backend/documents/uploaded/Road-Accident-in-India-2023-Publications.pdf ; https://www.dataforindia.com/road-accident-deaths/ ; https://www.newsonair.gov.in/over-1-80-lakh-deaths-occurred-due-to-road-accidents-in-2024-union-minister-nitin-gadkari |
| Road safety | 2023: 4.80 lakh accidents, +4.2% over 2022 (4.61 lakh) | — | MoRTH Road Accidents in India 2023 | 2024 (publication) | OFFICIAL_CLAIM | NO (single primary doc) | https://morth.gov.in/backend/documents/uploaded/Road-Accident-in-India-2023-Publications.pdf |

### 1.2 Railways

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Rail electrification | Broad-gauge network electrified | ~94% of BG network | PIB / Ministry of Railways | Jan 2024 (PRID 2001906) | OFFICIAL_CLAIM | YES — trend corroborated by later PIB releases and industry press | https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2001906 |
| Rail electrification | ~40,000 route-km of BG electrified since 2014-15; 21,801 rkm electrified as of 2014 | — | Ministry of Railways via PIB / Future Rail | 2024 | OFFICIAL_CLAIM | Partially — the "2014 = 21,801 rkm" base appeared in a search summary, not a document I read. Treat as UNVERIFIED. | https://rail.nridigital.com/future_rail_mar24/how_india_electrified_45_network_five_years |
| Rail electrification | Pace: ~1.42 km/day (2004–14) → ~18 km/day (2022-23) | — | Ministry of Railways via PIB | 2023–24 | OFFICIAL_CLAIM | NO — single-source | https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=2001906 |
| Rail electrification | 99.2% of BG network electrified; ahead of UK (39%), Russia (52%), China (82%) | — | PIB | ~2025 (PRID 2205232) | OFFICIAL_CLAIM | NO | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2205232&reg=3&lang=2 |
| Rail electrification | 100% electrified in 22 of 29 states/UTs | — | PIB | 2025 (PRID 2115511) | OFFICIAL_CLAIM | NO | https://www.pib.gov.in/PressReleseDetailm.aspx?PRID=2115511 |
| Rail track | New track commissioned 2014–2024 | 31,180 km, avg 8.54 km/day | Ministry of Railways / DD News | 2024–25 | OFFICIAL_CLAIM | **DISPUTED** — RTI reply says 27,057.7 km (see §2.2) | https://ddnews.gov.in/en/indian-railways-modernisation-drive-35000-km-of-new-tracks-next-gen-train-technologies-unveiled/ |
| Rail track | Track laid 2014-15 to 2023-24 | 27,057.7 km = 7.41 km/day | RTI response, reported by Business Standard & Deccan Herald | May 2024 | MEDIA_REPORT / CRITICISM | YES — two outlets, same RTI | https://www.business-standard.com/india-news/railways-laid-on-7-41-km-tracks-daily-in-10-years-reveals-rti-response-124050800886_1.html ; https://www.deccanherald.com/india/railways-laid-741-km-tracks-daily-in-10-years-rti-response-reveals-3014051 |
| Rail track | 2009–2014 comparison: 7,599 km, 4.2 km/day | — | Govt figures via media | 2024 | OFFICIAL_CLAIM | NO | https://indianinfrastructure.com/2024/05/10/indian-railways-laid-over-27000-km-of-railway-tracks-over-the-past-decade/ |
| Rail capex | Railways capital outlay | ₹28,174 cr (2013-14) → ₹2,62,200 cr (2024-25 BE) | PIB / Union Budget | Jul 2024 | OFFICIAL_CLAIM | YES — International Railway Journal and ipfonline cite ~₹2.65 trn capex | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2036104 ; https://www.railjournal.com/in_depth/the-rise-and-rise-of-indian-rail-investment/ |
| Freight | Freight loading | 1,095 MT (2014-15) → 1,588 MT (FY 2023-24, all-time high) | Ministry of Railways | 2024 | OFFICIAL_CLAIM | NO — single-source in my search | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/aug/doc202485364501.pdf |
| Vande Bharat | Trains in service | 136 Vande Bharat trains as of 26 Dec 2024; 62 introduced during 2024 | Ministry of Railways / Year End Review | Dec 2024 | OFFICIAL_CLAIM | YES — two outlets (The Hawk, Construction World) report 136 | https://www.thehawk.in/news/india/indian-railways-2024-136-vande-bharat-trains-transform-rail-travel-with-modernization-sustainability ; https://www.constructionworld.in/transport-infrastructure/metro-rail-and-railways-infrastructure/136-vande-bharat-trains-transforming-indian-railways/66955 |
| DFC | Dedicated Freight Corridor commissioned | ~2,741 km (96.4% of network) as of Mar 2025 | DFCCIL/Railways via media | 2025 | OFFICIAL_CLAIM | NO | https://www.kotakmf.com/Information/blogs/indian-railways-modernisation-future-plans_ |
| DFC | Goods trains on EDFC averaged 75 km/h — faster than many Vande Bharat services (60–70 km/h avg) | — | The Secretariat | undated in snippet | THIRD_PARTY_ANALYSIS | NO | https://thesecretariat.in/article/dedicated-freight-corridor-where-goods-trains-run-faster-than-many-vande-bharat-trains |

### 1.3 Metro rail

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Metro | Operational metro network | ~248 km in 5 cities (pre-2014) → ~993 km in 23 cities (2024); +745 km | MoHUA / Union Minister Manohar Lal | Oct 2024 | OFFICIAL_CLAIM | YES — PIB metro note and newsonair both give 248 km base | https://www.newsonair.gov.in/india-will-soon-have-the-second-largest-metro-network-in-the-world-union-minister-manohar-lal ; https://www.pib.gov.in/PressReleasePage.aspx?PRID=2046368 |
| Metro | Alternative 2024 figure: ~945 km operational in 21 cities, 919 km under construction in 26 cities | — | MoHUA materials via search summary | 2024 | OFFICIAL_CLAIM | **Inconsistent with the 993 km / 23 cities figure** (see §2.3) | https://static.pib.gov.in/WriteReadData/specificdocs/documents/2024/mar/doc2024314324401.pdf |
| Metro | ~997 km under construction in 28 cities | — | MoHUA | 2024 | OFFICIAL_CLAIM | NO | https://www.newsonair.gov.in/india-will-soon-have-the-second-largest-metro-network-in-the-world-union-minister-manohar-lal |

### 1.4 Airports & UDAN

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Airports | Operational airports | 74 (2014) → 157 (Dec 2024) | Civil Aviation Minister (K. Rammohan Naidu) via newsonair | 5 Dec 2024 | OFFICIAL_CLAIM | YES — Pratidin Time reports the same 74→157 | https://www.newsonair.gov.in/157-airports-operational-accross-country-udan-scheme-revolutionizes-air-travel-civil-aviation-minister ; https://www.pratidintime.com/national/airports-in-india-increased-from-74-to-157-in-last-decade-under-udan-scheme |
| Airports | Later restatement: 74 → 160 | — | Civil Aviation Minister via newsonair | later than Dec 2024 | OFFICIAL_CLAIM | — running count, consistent with 157 | https://www.newsonair.gov.in/indias-airports-increase-from-74-to-160-under-udan-scheme-civil-aviation-minister |
| Airports | Target of 350–400 airports by 2047 | — | MoCA | 2024 | OFFICIAL_CLAIM | NO | (same newsonair release) |
| UDAN | 619 routes operationalised connecting 88 airports (Oct 2024) | — | MoCA / 8-years-of-UDAN materials | Oct 2024 | OFFICIAL_CLAIM | Partially | https://www.nextias.com/ca/current-affairs/21-10-2024/8-years-of-regional-connectivity-scheme-rcs-udan |
| UDAN | 1.49 crore / 1.44 crore passengers benefited; 2.8 lakh+ flights | — | MoCA via newsonair | 2024–25 | OFFICIAL_CLAIM | NO — figures drift between releases | https://www.newsonair.gov.in/one-crore-49-lakh-passengers-benefited-from-affordable-regional-air-travel-schemeudan |

### 1.5 Ports & shipping

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Ports | Major-port cargo handling capacity | 800.5 MTPA (2014) → 1,630 MTPA (Mar 2024) | Ministry of Ports, Shipping & Waterways, Year End Review 2024 | Dec 2024 | OFFICIAL_CLAIM | YES — India Shipping News carries same Year End Review | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2089049 ; https://indiashippingnews.com/year-end-review-2024-ministry-of-ports-shipping-and-waterways/ |
| Ports | Vessel turnaround time | ~94 hrs (FY2013-14) → ~48.06 hrs (FY2023-24); 96 → 49.5 hrs by 2025 | MoPSW / Sagarmala | 2024–25 | OFFICIAL_CLAIM | YES — two sources, though base value quoted as 94 or 96 hrs | https://www.maritimegateway.com/india-cuts-major-port-turnaround-time-to-49-47-hours-as-sagarmala-completes-315-projects-adding-400-mtpa-capacity/ |
| Ports | Sagarmala: 315 projects completed, 210 under implementation, 320 in planning; 120 port-modernisation projects adding 400+ MTPA | — | MoPSW | 2025 | OFFICIAL_CLAIM | Partially — a separate count says "277 projects completed"; see §2.4 | https://www.pib.gov.in/PressNoteDetails.aspx?NoteId=158151&ModuleId=3&reg=3&lang=1 |

### 1.6 Rural electrification

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Electricity | Households electrified under Saubhagya | 2.86 crore | Ministry of Power / PIB / newsonair | Aug 2024 & Dec 2023 (PRID 1989801) | OFFICIAL_CLAIM | YES — PIB + newsonair + newkerala all cite 2.86 crore | https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1989801&reg=48&lang=2 ; https://www.newsonair.gov.in/govt-provides-electricity-to-2-86-crore-households-under-saubhagya-scheme-aims-for-universal-electrification |
| Electricity | Villages electrified under DDUGJY | 18,374 villages | Ministry of Power | 2023–24 | OFFICIAL_CLAIM | NO | (same PIB release) |
| Electricity | All inhabited un-electrified census villages electrified by 28 April 2018 | — | Govt of India (state-reported data) | Apr 2018 | OFFICIAL_CLAIM — **definitionally contested, see §2.5** | YES on the claim itself | https://indbiz.gov.in/100-rural-electrification-achieved-in-2018/ |
| Electricity | Rural daily supply hours | 12.5 hrs (2015) → 15 hrs (2018) → 18.5 hrs (2020) | Survey data (CEEW ACCESS 2015; NITI Aayog/Rockefeller/Smart Power India 2020) | 2020 | THIRD_PARTY_ANALYSIS | YES — NITI Aayog/Rockefeller report cites ~17 hrs/day across customer categories | https://www.niti.gov.in/sites/default/files/2023-02/Rockefeller-report-discoms.pdf ; https://www.ceew.in/publications/access-to-electricity-availability-and-electrification-percentage-in-india |
| Electricity | IEA praised Saubhagya/DDUGJY as transformative for rural electrification | — | IEA, reported by ThePrint/Tribune/IBEF | undated in snippet | THIRD_PARTY_ANALYSIS | YES — multiple outlets | https://theprint.in/economy/indias-electrification-schemes-saubhagya-and-ddugjy-appreciated-by-iea/2419244/ |

### 1.7 Sanitation / toilets (Swachh Bharat)

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Toilets | Individual household latrines built under SBM-Grameen | "over 11 crore" IHHLs + 2.23 lakh community sanitary complexes since Oct 2014 | PIB / Dept of Drinking Water & Sanitation | Mar 2023 (PRID 1907510) | OFFICIAL_CLAIM | YES — newsonair "India builds 11 crore toilets"; a later figure of 11.64 crore also circulates | https://www.pib.gov.in/PressReleaseIframePage.aspx?PRID=1907510 ; https://www.newsonair.gov.in/india-builds-11-crore-toilets-under-swachh-bharat-mission |
| Toilets | 10.4 crore toilets built 2014–2020, 60,000 villages ODF; >110 million toilets in 60 months | — | Govt figures repeated by CNN | 5 Oct 2019 (CNN) | MEDIA_REPORT | YES | https://www.cnn.com/2019/10/05/asia/india-modi-open-defecation-free-intl-hnk-scli/ |
| Toilets | India declared open-defecation-free | 2 Oct 2019 | PM Narendra Modi | 2 Oct 2019 | OFFICIAL_CLAIM — **heavily contested, see §3.2** | YES on the declaration | https://www.cnn.com/2019/10/05/asia/india-modi-open-defecation-free-intl-hnk-scli/ |
| Toilets | Use of improved sanitation facilities | 49% (NFHS-4, 2015-16) → 70% (NFHS-5, 2019-21) | NFHS, analysed by Ideas for India / Payal Seth | 2021 | THIRD_PARTY_ANALYSIS | YES — Ideas for India and SSRN paper agree | https://www.ideasforindia.in/topics/human-development/what-can-we-learn-about-swachh-bharat-mission-from-the-nfhs-5-factsheets ; https://papers.ssrn.com/sol3/papers.cfm?abstract_id=3851880 |

### 1.8 Piped water (Jal Jeevan Mission)

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Water | Rural households with tap connections | 3.23 crore (16.7%) at launch, Aug 2019 → 15 crore, Jul 2024 | Jal Shakti Ministry / PIB / newsonair | Jul 2024 | OFFICIAL_CLAIM | YES — PIB and newsonair both | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2098651 ; https://www.newsonair.gov.in/national-jal-jeevan-mission-achieves-historic-milestone-of-providing-tap-water-connections-to-15-crore-rural-households-across-country |
| Water | 15.19 crore households = 78.58% of rural households (6 Oct 2024) | — | Jal Shakti Ministry | Oct 2024 | OFFICIAL_CLAIM | Partially | https://ddnews.gov.in/en/jal-jeevan-mission-transforms-rural-india-with-tap-water-for-over-15-72-crore-households/ |
| Water | Later: 15.5–15.83 crore of 19.36 crore rural households; >80% coverage | — | Union Jal Shakti Minister C.R. Patil | Mar 2026 | OFFICIAL_CLAIM | Partially | https://www.newsonair.gov.in/union-jal-shakti-minister-cr-patil-says-over-15-83-crore-households-now-have-tap-water-under-jal-jeevan-mission |

### 1.9 LPG (Ujjwala)

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| LPG | PMUY connections released | 10.33 crore (Minister Hardeep Puri); ~10.58 crore beneficiaries as of Jul 2026 | Ministry of Petroleum & Natural Gas | 2024–2026 | OFFICIAL_CLAIM | YES — Tribune + newsonair both report "over 10 crore" | https://www.tribuneindia.com/news/business/pm-ujjwala-yojana-connections-stand-at-10-33-crore-minister-hardeep-puri ; https://www.newsonair.gov.in/over-10-crore-lpg-connections-released-under-pm-ujjwala-yojana-govt |
| LPG | 86.6% of Ujjwala households now use LPG as primary cooking fuel | 86.6% | Government, in Parliament, reported by ThePrint | (recent; snippet undated) | OFFICIAL_CLAIM | NO — and it sits awkwardly against NFHS-5 (see §2.6) | https://theprint.in/economy/govt-says-86-6-ujjwala-households-now-use-lpg-as-primary-fuel-defends-9-to-4-refills-subsidy-cut/2995543/ |
| LPG | Clean cooking fuel use, all households | 43.8% (NFHS-4, 2015-16) → 58.6% (NFHS-5, 2019-21); rural 43.2% vs urban 89.7% | NFHS, analysed by CEDA (Ashoka University) | 2021–22 | THIRD_PARTY_ANALYSIS | YES — CEDA and Deccan Herald ("40% of Indians lack clean fuel access") | https://ceda.ashoka.edu.in/how-many-indian-households-use-clean-fuel-for-cooking/ |

### 1.10 Housing (PMAY)

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Housing | PMAY-Gramin | 2.94 cr sanctioned / 2.62 cr completed (12 Jun 2024); 3.87 cr sanctioned / 2.95 cr completed (2 Feb 2026) | Ministry of Rural Development | 2024 & 2026 | OFFICIAL_CLAIM | YES — two newsonair releases at different dates | https://www.newsonair.gov.in/over-2-82-crore-houses-completed-under-pmay-g ; https://www.newsonair.gov.in/government-sanctions-over-3-crore-87-lakh-houses-to-states-uts-under-pmay-g |
| Housing | PMAY-G target: 4.95 crore houses by March 2029 | — | Ministry of Rural Development | 2026 | OFFICIAL_CLAIM | NO | (same) |
| Housing | PMAY-Urban | 1.18 crore sanctioned, 1.14 crore grounded, 89 lakh+ completed (25 Nov 2024); 85 lakh completed as of Jul 2024 | MoHUA, to Parliament | 2024 | OFFICIAL_CLAIM | YES — Business Standard reports 11.863 million (1.186 cr) sanctioned to Rajya Sabha, Feb 2024 | https://www.business-standard.com/india-news/11-863-million-houses-sanctioned-under-pmay-u-centre-to-rajya-sabha-124020501496_1.html ; https://www.newsonair.gov.in/over-1-18-crore-houses-have-been-sanctioned-so-far-under-pmay-urban-govt |

### 1.11 Digital / telecom

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Internet | Internet subscribers | 25.15 crore (Mar 2014) → 96.9 crore (Jun 2024) | Govt / TRAI, via Invest India | 2024 | OFFICIAL_CLAIM | Partially — TRAI Year-in-Review is the primary source | https://www.investindia.gov.in/blogs/indias-internet-surge-catalyzing-change-telecom-landscape ; https://www.trai.gov.in/sites/default/files/2025-07/YIR_08072025_0.pdf |
| Data price | Cost of mobile data | ₹269/GB (Mar 2014) → ₹8.31/GB (Jun 2024) | Government, via newsonair | 5 Dec 2024 | OFFICIAL_CLAIM | Partially — TRAI historically reported ~95% price fall over 5 yrs (Business Standard/PTI 2019) | https://www.newsonair.gov.in/cost-of-data-drastically-reduced-from-%e2%82%b9269-gb-in-march-2014-to-%e2%82%b98-31-gb-in-june-2024-govt |
| Data use | Avg monthly data per user | 0.27 GB (2014-15) → 20.27 GB (Mar 2024) | TRAI | 2024 | OFFICIAL_CLAIM | NO | https://www.trai.gov.in/sites/default/files/2025-07/YIR_08072025_0.pdf |
| 5G | 5G BTS deployed | ~4.6–4.69 lakh base transceiver stations; ~25 crore 5G users; near-universal district coverage | DoT / TRAI | Feb 2025 | OFFICIAL_CLAIM | YES — TRAI and Tribune both report rapid 5G expansion | https://www.tribuneindia.com/news/5g-rollout/india-records-rapid-5g-expansion-telecom-sector-sees-all-round-growth-in-2024-25-trai |
| BharatNet | Gram panchayats connected by OFC/satellite | State-wise/year-wise data | PIB / DoT / USOF | Dec 2024 (PRID 2077908) | OFFICIAL_CLAIM | — could not open (PIB blocked) | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2077908&reg=3&lang=2 ; https://usof.gov.in/en/bharatnet-project |

### 1.12 Banking / payments (Jan Dhan, UPI)

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Jan Dhan | PMJDY accounts opened | 54.03 crore (Nov 2024); 57.78 crore by Feb 2026 | Ministry of Finance / MoS Harsh Malhotra; PIB 11-year release | Dec 2024 / Aug 2025 | OFFICIAL_CLAIM | YES — newsonair "more than 54 cr" + PIB 11-years release | https://www.newsonair.gov.in/more-than-54-cr-zero-balance-bank-accounts-opened-under-pmjdy-mos-for-corporate-affairs-harsh-malhotra ; https://www.pib.gov.in/PressReleasePage.aspx?PRID=2161401&reg=48&lang=2 |
| Jan Dhan | Deposits | ₹15,670 cr (Mar 2015) → ₹2.94 lakh cr (Feb 2026) | Ministry of Finance | 2026 | OFFICIAL_CLAIM | NO | (same PIB release) |
| UPI | UPI transaction volume | 535 crore (FY2018-19) → 18,587 crore (FY2024-25); "2 crore in FY17 → 24,162 crore in FY26" | NPCI/Govt, via IBTimes | 2026 | OFFICIAL_CLAIM / MEDIA_REPORT | Partially — the two series use different base years and are not directly comparable | https://www.ibtimes.co.in/upi-transactions-surge-2-crore-fy17-over-24162-crore-fy26-903346 |
| RuPay | RuPay PoS/e-com transactions | 67 crore (FY2017-18) → 93.85 crore (FY2024-25) | Ministry of Finance | 2025 | OFFICIAL_CLAIM | NO | (PIB 11-years release) |

### 1.13 Cross-cutting

| Theme | Claim | Value(s) | Who said it | Date | Flag | Corroborated? | URL |
|---|---|---|---|---|---|---|---|
| Logistics | World Bank Logistics Performance Index rank | 54 (2014) → 44 (2018) → 38 of 139 (2023); score 3.18 (2018) → 3.40 (2023) | World Bank; publicised by PIB and IBEF | 2023–24 | THIRD_PARTY_ANALYSIS (World Bank) amplified as OFFICIAL_CLAIM | YES — PIB and IBEF both | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2003541 ; https://ibef.org/news/india-ranks-38-out-of-139-countries-on-the-world-bank-s-logistics-performance-index-report-2023-india-s-rank-has-improved-by-sixteen-places-from-54-in-2014 |
| Capex | Union capital expenditure | ₹11,11,111 crore in Budget 2024-25 (3.4% of GDP) | Ministry of Finance / PIB | Jul 2024 | OFFICIAL_CLAIM | YES — EY and PRS budget analyses | https://www.pib.gov.in/PressReleasePage.aspx?PRID=2035558 ; https://www.ey.com/en_in/insights/tax/economy-watch/union-budget-2024-25-accelerating-fiscal-consolidation-for-sustained-growth |
| Capex | Capex as share of GDP: 1.6% (FY2014-15) → 3.2% (FY2023-24, FY2024-25); capex share of total spending 11.8% (2014-15) → 21.4% (2023-24) | — | EY / PRS analysis of budget data | 2024–25 | THIRD_PARTY_ANALYSIS | Partially | https://prsindia.org/files/budget/budget_parliament/2025/Union_Budget_Analysis_2025-26.pdf |
| Capex | Centre's "effective capital expenditure" 2014-26 = ₹90.87 lakh cr, of which ₹26.17 lakh cr = grants to states for capital assets | — | Government, via ANI | Jul 2026 | OFFICIAL_CLAIM — **definitionally loaded, see §2.7** | NO | https://aninews.in/news/business/centres-effective-capital-expenditure-rises-over-five-fold-to-rs-9087-lakh-crore-during-2014-26-govt20260720161823/ |
| Overview | EAC-PM framing: "Golden Decade of Infrastructure Development in India" | — | Economic Advisory Council to the PM | Jan 2026 | OFFICIAL_CLAIM | — | https://eacpm.gov.in/wp-content/uploads/2026/01/Golden-Decade-of-Infrastructure-Development-in-India-final-rev.pdf |
| Overview | "A Decade of Infrastructure Development In India: Trends and Insights" | — | Indian School of Business (ISB) | undated in snippet | THIRD_PARTY_ANALYSIS | — | https://www.isb.edu/faculty-and-research/research-directory/a-decade-of-infrastructure-development-in-india-trends-and-insights |

---

## 2. CONTESTED OR DEFINITIONALLY TRICKY

### 2.1 National highway length: the "60% growth" number mixes new build with reclassification
The headline 91,287 km → ~1,46,000 km is repeated consistently across government and media sources, and the 2014 base of 91,287 km appears stable. **But three separate problems sit underneath it:**

1. **End-point drift.** Different official/media restatements give 1,46,145 km (Dec 2023, Deccan Herald/road secretary), 1,46,195 km (DD News), and 1,46,342 km (post-FY25, Swarajya). These are different dates, but the framing "60% in 10 years" is applied to all of them, which makes the growth rate look date-insensitive when it isn't.
2. **Reclassification vs construction.** A road can join the national highway network by being *declared* a national highway (usually an upgraded state highway) rather than being newly built. My searches confirmed the reclassification mechanism exists and works in both directions — Maharashtra reclassified 13.8 km of NH-60 and NH-160 *down* to state highway in a recent case (https://www.constructionworld.in/transport-infrastructure/highways-and-roads-infrastructure/maharashtra-reclassifies-13.8-km-of-two-national-highways/86635). **I could not find a credible published source quantifying how much of the 55,000 km increase is reclassification versus greenfield/upgrade construction.** This is the single biggest unresolved definitional question in the roads theme and should be flagged as such in the dashboard, not asserted in either direction.
3. **"Constructed" vs "network length" are different series.** The km/day series (12 → 37 → 34) measures NH *construction/upgrade* output, which includes widening of existing NH. Adding up km/day over ten years will **not** reconcile with the 55,000 km network increase, and neither series alone tells you how much new tarmac exists.

### 2.2 Railway track: 31,180 km (official) vs 27,057.7 km (RTI)
Ministry-sourced material says **31,180 km of new track commissioned 2014–2024, 8.54 km/day**. An **RTI reply reported in May 2024 by Business Standard and Deccan Herald** says **27,057.7 km over 2014-15 to 2023-24, i.e. 7.41 km/day** — a gap of ~4,100 km. The RTI figure explicitly covers new lines + doubling/tripling + gauge conversion. The discrepancy is most likely a year-boundary and/or category difference (e.g. whether 2024-25 is included, whether third/fourth lines count), but **neither side's definition is published in the snippets I could read**. Use both numbers, or the RTI number as the conservative floor.

### 2.3 Metro: 945 km / 21 cities vs 993 km / 23 cities in the same year
Both circulate as 2024 MoHUA figures. The 248 km base is consistent. The 993/23 figure is from the minister's October 2024 statement; the 945/21 figure appears in a March 2024 PIB document. Almost certainly a within-year growth difference, but the two are quoted interchangeably in secondary coverage as "2024".

### 2.4 Sagarmala project counts
"315 projects completed" (MoPSW, 2025) vs "277 projects completed" (in a 2024-25 analysis piece). Rolling counts with different cut-off dates and possibly different project universes (port modernisation only vs all four Sagarmala pillars).

### 2.5 "Village electrification" — the definitional problem that matters most
The April 2018 claim that **all inhabited un-electrified census villages were electrified** rests on a **Ministry of Power definition in use since October 1997**: a village counts as electrified if (i) basic distribution infrastructure exists in the inhabited locality, (ii) public places (school, panchayat office, health centre) have power, and (iii) **at least 10% of households** are electrified.

- The **Standing Committee on Energy (2013)** observed that under this definition a village is "electrified" even if **up to 90% of its households have no connection** (PRS blog).
- A fact-check by **The News Minute** reported that of 13,523 villages electrified in one tranche, **only 8% had power in all households**.
- The government's own later Saubhagya programme (2017–2022, 2.86 crore household connections) implicitly concedes the village metric was not a household metric.

**Practical implication for the dashboard: "100% village electrification (2018)" and "2.86 crore households connected under Saubhagya" are answers to different questions and must not be presented as one trend line.** Sources: https://prsindia.org/theprsblog/electrification-in-india-%E2%80%98saubhagya%E2%80%99-scheme ; https://www.thenewsminute.com/news/fact-check-out-13523-villages-electrified-modi-only-8-have-power-all-households-62643 ; https://medium.com/energy-access-india/india-a-huge-electrification-milestone-with-big-questions-10-industry-leaders-weigh-in-d343f5b3833a

### 2.6 Sanitation and LPG: access ≠ use, and the two data systems measure different things
- **Toilets.** SBM's administrative system counts **individual household latrines constructed** (11 crore+). NFHS-5 counts **where household members usually defecate** (70% using improved sanitation, up from 49%). These are not competing estimates of one quantity — they are two different quantities, and the gap is the usage gap. Ideas for India and Payal Seth (SSRN/*Indian Economic Journal*) both make this point explicitly.
- **LPG.** The government told Parliament that **86.6% of Ujjwala households use LPG as primary fuel**. NFHS-5 put **all-India clean cooking fuel use at 58.6%** (rural 43.2%). Different universes (PMUY beneficiaries vs all households) and different years, so they are not strictly contradictory — but they are routinely juxtaposed as if they were.
- **A live data-availability problem:** Down To Earth and The Wire report that **the clean-cooking-fuel indicator is missing from the NFHS-6 factsheets**, meaning the independent series that let you check Ujjwala against survey data has stopped. The Wire frames this as "missing indicators shield two Modi govt flagship schemes from scrutiny." This is a contested characterisation, but the absence of the indicator is a factual claim from two outlets. Sources: https://www.downtoearth.org.in/energy/data-on-access-to-clean-cooking-fuel-missing-from-nfhs-6-report ; https://m.thewire.in/article/government/missing-indicators-in-nfhs-6-shield-two-modi-govt-flagship-schemes-from-scrutiny

### 2.7 "Capital expenditure" is doing heavy lifting in the ₹11.11 lakh crore headline
The ₹11,11,111 crore figure is real and official. But:
- The government's own **"effective capital expenditure"** measure (₹90.87 lakh cr for 2014-26) **includes ₹26.17 lakh crore of grants/loans to states for capital assets** — i.e. ~29% of the headline is money transferred to states, not Union asset creation.
- **CSEP (Centre for Social and Economic Progress)** has a working paper, *Bridging the Data Gaps in India: The Case of Capital Spending*, arguing that **loans and capital infusions to PSEs should be excluded from capex**, and that adjusted state capex diverges from reported capex by as much as five percentage points of GSDP in some cases. https://csep.org/working-paper/bridging-the-data-gaps-in-india-the-case-of-capital-spending/
- Janata Weekly (left-leaning) ran a piece titled *"The Real Reason Behind Increase in Capital Expenditure"* making a similar accounting argument. Note the source's clear political orientation. https://janataweekly.org/union-budgets-2014-to-2024-article-6-the-real-reason-behind-increase-in-capital-expenditure/

### 2.8 Airport count: "74 → 157" then "74 → 160"
Two ministerial statements months apart. Consistent as a rolling count. **I could not verify what is included in "airports"** — whether heliports and water aerodromes commissioned under UDAN are counted in the 157/160. This matters for the comparison to the 2014 base of 74 and I am explicitly flagging it as unverified rather than asserting it.

### 2.9 Bridge collapse counts: official vs media tally
**MoRTH reported 42 bridge collapses between 2019 and 2024.** A **Newslaundry** analysis of media reports counted **170 collapses with 202 deaths and 441 injuries between 2021 and 2025**, and **48 collapses in 2024 alone**. That is roughly a fourfold divergence over overlapping periods. The definitions differ (MoRTH's ambit is likely national-highway structures; the media tally includes state/rural/under-construction bridges), but the gap is large and the government does not publish a consolidated all-India series. https://www.newslaundry.com/2025/07/29/4-years-170-collapses-202-deaths-whats-ailing-indias-bridges

---

## 3. CRITICISM AND AUDITS

### 3.1 CAG on Bharatmala (Report No. 19 of 2023) — the most substantive audit finding on roads
Per the CAG report and coverage of it:
- **Only 75.62% of the CCEA-approved length had been awarded**, while **158.24% of the approved financial outlay had been sanctioned** as of 31 March 2023.
- **Sanctioned civil cost ₹23.89 crore/km against CCEA-approved ₹13.98 crore/km**; sanctioned pre-construction cost **₹8.28 crore/km against approved ₹1.39 crore/km**.
- **Dwarka Expressway:** NHAI's choice of an elevated carriageway in the Haryana section pushed cost to **₹250.77 crore/km against the Cabinet-approved ₹18.20 crore/km** — roughly 14×, with the audit noting no justification on record.
- The CAG found **irregular awards**: bidders who did not meet tender conditions, selection on falsified documents, and works awarded **without approved DPRs or on faulty DPRs**.
- Government's counter (Business Standard, Aug 2023): an official attributed overruns to **land acquisition costs rising ~5× from the original ₹30,000 crore estimate** plus material inflation.
- **The Wire** reported that **officers in charge of the Bharatmala and Ayushman Bharat CAG reports were transferred** — a governance allegation, not an audit finding; treat as a contested claim by one outlet.

Sources: https://cag.gov.in/webroot/uploads/download_audit_report/2023/Report-No.-19-of-203--Bharatmala-English-064d5db7bc63c20.06754442.pdf ; https://thewire.in/government/cag-report-nhai-toll-collection-railway-bharatmala-udan ; https://swarajyamag.com/infrastructure/faulty-dprs-irregularities-in-bharatmala-project-tenders-pointed-out-by-cag-report ; https://www.business-standard.com/economy/news/costlier-land-acquisition-led-to-bharatmala-cost-overrun-official-123081700257_1.html ; https://m.thewire.in/article/government/officers-cag-reports-ayushman-bharat-bharatmala-transferred

**Note on balance:** Swarajya is a right-leaning outlet and still reported the CAG's adverse findings — that makes the finding more robust, not less.

### 3.2 Swachh Bharat: toilets built ≠ open defecation ended
- **CNN (Oct 2019):** experts called the ODF statistics "misleading"; the government "focused too much on building toilets and failed to make sure people actually used them."
- **A government survey reported by Hindustan Times (May 2017):** nearly **6 in 10 SBM toilets lacked proper water supply**, making them unusable.
- **NSSO** (per the same HT report): around **55.4% of rural people were still practising open defecation** in the absence of water supply and drainage, in a survey of over one lakh households. *(I could only reach this via PressReader; I have not seen the NSSO report itself. Treat the 55.4% as attributed-to-NSSO-via-HT.)*
- **Frontiers in Environmental Science (2023), systematic review:** government monitoring **overestimates the number of ODF villages and toilet coverage**.
- **Alternatives Humanitaires (Nov 2022)** and **New Security Beat (Dec 2024)** both frame SBM as a genuine, large achievement whose completion claim outran reality — the "undeniable success does not signal the end of open defecation" framing.
- **IMPRI:** "Swachh Bharat's Unfinished Journey: Toilets Built, But Empowerment Needed."

Sources: https://www.cnn.com/2019/10/05/asia/india-modi-open-defecation-free-intl-hnk-scli/ ; https://www.frontiersin.org/journals/environmental-science/articles/10.3389/fenvs.2023.1141825/full ; https://www.alternatives-humanitaires.org/en/2022/11/29/clean-india-why-the-undeniable-success-of-the-swachh-bharat-mission-does-not-signal-the-end-of-open-defecation/ ; https://www.newsecuritybeat.org/2024/12/swachh-bharat-mission-intended-and-unintended-consequences/ ; https://www.pressreader.com/india/hindustan-times-st-jaipur/20170513/281754154245002 ; https://www.impriindia.com/insights/swachh-bharat-toilets-built/

### 3.3 Ujjwala: connections given, cylinders not refilled
- **Down To Earth:** the Centre admitted **9.2 million (92 lakh) beneficiaries took no refill at all in 2021-22**; **20 million of 93.4 million beneficiaries took at most one refill**.
- **Scroll.in:** "Why the Centre's claim of hitting 9.49 crore LPG connections is only half the story."
- **Parliamentary standing committee** (via The Federal) asked the ministry to investigate low refill rates and **recommended a higher LPG subsidy**, finding poor families were not benefiting.
- **Structural diagnosis** (widely reported): beneficiaries must **pay the full cylinder price upfront** and receive the subsidy later — a cash-flow barrier for exactly the households the scheme targets.
- **Government counter (ThePrint):** the Centre defended cutting subsidised refills from **9 to 4 per year** on the grounds that most beneficiaries consume fewer than five cylinders annually — which critics read as normalising under-use rather than fixing it.
- Reported usage gap: households relying exclusively on LPG use **7–8 cylinders/year**; PMUY beneficiaries in most states demand **fewer than 3**, and as few as **1–2** in parts of eastern and north-eastern India.

Sources: https://www.downtoearth.org.in/energy/ujjwala-over-9-million-beneficiaries-did-not-refill-cylinder-last-year-centre-admits-84130 ; https://scroll.in/article/1034532/why-the-centres-claim-of-distributing-9-49-crore-lpg-connections-is-only-half-the-story ; https://thefederal.com/category/news/ujjawala-scheme-parliamentary-panel-recommends-higher-lpg-subsidy-201808 ; https://theprint.in/economy/govt-says-86-6-ujjwala-households-now-use-lpg-as-primary-fuel-defends-9-to-4-refills-subsidy-cut/2995543/

### 3.4 Jal Jeevan Mission: data quality, source sustainability, and procurement
- **Parliamentary standing committee (Aug 2025), via Business Standard:** flagged concerns over **the authenticity of data fed into JJM's Integrated Management Information System (IMIS)**, and recommended the Centre institute checks to verify state-uploaded figures. This is a direct, on-the-record challenge to the headline connection counts.
- **Parliamentary Committee on Water Resources (March 2026), via Policy Circle:** warned that JJM's objectives will remain unfulfilled without sustainable water sources, since **many taps run dry within one to two years**; the committee is reported to have said **₹8.69 trillion had been wasted** on taps installed on sources that ran dry. *(This ₹8.69 trillion figure is very large relative to JJM's total outlay and I could NOT corroborate it against a second source or the committee report itself — flag as single-source and possibly a transcription error in the secondary coverage. Do not put it on a dashboard without verification.)*
- **CAG audit of Karnataka (2024), via Policy Circle:** **9,342 single-bid contracts**, tender premiums **5–61% above estimates**, and no tripartite agreements to enforce quality.
- **Standing committee:** only **20 states** had comprehensive repair-and-maintenance policies by mid-2025; post-pipeline restoration of public infrastructure substandard in many states.
- **Business Standard opinion (Jul 2026):** "Jal Jeevan 2.0 must deliver water, not just more tap connections."
- **Opposition:** Congress called the funding shortfall "monumental mismanagement" (Deccan Herald) — clearly partisan, logged as such.

Sources: https://www.business-standard.com/india-news/parliamentary-panel-questions-accuracy-of-data-in-jal-jeevan-mission-system-125081101373_1.html ; https://www.policycircle.org/policy/jal-jeevan-mission-jjm/ ; https://www.business-standard.com/opinion/columns/jal-jeevan-2-0-must-deliver-water-not-just-more-tap-connections-126071601475_1.html ; https://www.deccanherald.com/india/monumental-mismanagement-congress-slams-government-over-funding-shortfall-in-jal-jeevan-mission-3219738

### 3.5 UDAN: about half of all routes have gone dark
This is the strongest quantified counter-claim I found anywhere in this exercise, and it comes partly from the CAG and partly from the government's own parliamentary answers.
- **CAG report (2023):** of routes awarded up to UDAN-3, **52% (403 of 774) never commenced operations**; of the 371 that did commence, **only 112 (30%) completed the full three-year concession period**. Only ~7% of routes remained operational beyond three years.
- **Parliamentary data (2026), via Business Standard and Business Today:** of **663 routes launched, 327 (~50%) have been discontinued**; separately, of **679 routes operationalised since inception, 348 are presently operational**. **Uttar Pradesh** saw the largest number discontinued (34) before completing their VGF support tenure.
- **Causes cited:** low passenger volumes, subsidy dependence, aircraft shortage, and inadequate small-airport infrastructure (e.g. no night-landing facilities).
- Government response: a **Modified UDAN** with a ₹29,000 crore ten-year commitment, launched at Jodhpur.

**This directly complicates the "74 → 157 airports" headline: airports being counted as operational is not the same as routes being sustainably served.**

Sources: https://www.business-standard.com/industry/aviation/nearly-50-of-udan-routes-no-longer-operational-while-govt-begins-2nd-phase-126070400508_1.html ; https://www.businesstoday.in/india/story/up-saw-the-largest-34-routes-discontinued-under-the-udan-scheme-545282-2026-07-26 ; https://www.ispp.org.in/udan-scheme-regional-connectivity-analysis-india/ ; https://www.tribuneindia.com/news/business/udan-scheme-less-than-50-routes-operational-286224

### 3.6 Metro rail: ridership far below the projections used to justify the projects
- **CAG on Delhi Metro:** DMRC's actual ridership reached only **51.97% of projected ridership**; operating-cost-to-income ratio worsened from **48.9% (2011-12) to 80.5% (2019-20)**.
- **Across systems:** most Indian metros run at **25–30% of original DPR projections**; Delhi, the most mature, is the best at ~47%.
- **Break-even gap:** Bengaluru **0.96 lakh actual daily ridership against 18.64 lakh required to break even**; Hyderabad **0.65 lakh against 19 lakh required**. (Figures via the ridership analyses below; the "required to break even" numbers look implausibly high and I could not verify their derivation — flag before use.)
- **Nagpur Metro:** actual ~1 lakh/day against a DPR projection of 4 lakh by 2026.
- **Structural critique:** DPRs systematically **overestimate ridership and peak-hour peak-direction traffic to secure capital approvals**; poor first/last-mile connectivity and absent station parking compound it.

Sources: https://metrorailnews.in/dmrcs-actual-ridership-is-half-of-the-projected-ridership/ ; https://thedailybrief.zerodha.com/p/indias-metro-ridership-problem ; https://www.impriindia.com/insights/policy-update/metro-boom-losses-and-last-mile-chasm/ ; https://urbanomics.substack.com/p/some-thoughts-on-metro-railway-systems ; https://prsindia.org/policy/report-summaries/implementation-of-metro-rail-projects-an-appraisal ; https://www.thehitavada.com/Encyc/2026/1/21/nagpur-metro-ridership-misses-dpr-target-by.html

### 3.7 Railways: safety spending vs showcase projects
- **CAG:** shortfalls in inspections; failures to submit or accept post-accident inquiry reports; **non-utilisation of the dedicated Rashtriya Rail Sanraksha Kosh (RRSK)** for priority tasks; **declining track-renewal funding**; inadequate safety staffing.
- **CAG (2017–2021 analysis):** **69% of 1,392 incidents were derailments**; **80% of consequential accidents** were derailments and collisions — pointing to maintenance quality and staffing.
- **RRSK:** the ₹1 lakh crore five-year safety fund launched 2017-18 saw **funding fall by 79%** per the 2022 CAG report. Congress cited the same report to allege safety funds were spent on **crockery, car rentals and foot massagers** (Deccan Herald) — partisan framing of a real audit finding.
- **Kavach (anti-collision system):** deployed on **1,465 route-km and 139 locomotives** on South Central Railway as of Feb 2024 — **~1% of the network**, with full rollout estimated to take up to a decade.
- **Outlook India:** "Safety Concerns Tarnish The Sheen Of Indian Railways' High-Profile Projects" — the core critique that Vande Bharat and station redevelopment absorbed attention while safety capex lagged.

Sources: https://www.deccanherald.com/amp/story/india%2Fcag-finds-railways-surrendering-safety-2334880 ; https://www.deccanherald.com/india/govt-spent-railway-safety-funds-on-crockery-car-rentals-foot-massagers-congress-cites-cag-report-1226355 ; https://www.drishtiias.com/daily-updates/daily-news-analysis/railway-accidents-and-kavach-system ; https://www.outlookindia.com/national/safety-concerns-tarnish-the-sheen-of-indian-railways-high-profile-projects ; https://news.yahoo.com/indias-worst-train-crash-20-123500419.html

### 3.8 BharatNet: the connectivity programme that keeps missing deadlines
- Original target: all ~2.5 lakh gram panchayats with high-speed broadband **by March 2019**. It reached **1.18 lakh GPs** by that point (Deccan Herald, "BharatNet: Digital India's biggest miss").
- **Parliamentary Standing Committee on IT:** the state-led model, **barring Gujarat, could not progress at the anticipated pace**; the PSU-led model was constrained by **BSNL's precarious finances**; the committee doubted the revised August 2021 target for all 2.5 lakh GPs would be met. It also criticised DoT for **not preparing a Cabinet note on PPP mode more than a year after approval**.
- **The Wire:** "**Less than half of BharatNet connections are active** despite continued rollout" — i.e. the "GPs connected" count includes links that are not carrying traffic. This is the same access-vs-use gap as toilets and LPG.
- **ICRIER** policy brief: *The Evolution of BharatNet: Lessons from India's Largest [rural broadband project]* — the main independent think-tank treatment.
- Government approved a "revised implementation strategy" on 30 June after multiple missed deadlines.

Sources: https://thewire.in/tech/less-than-half-of-bharatnet-connections-are-active-despite-continued-rollout ; https://m.thewire.in/article/education/why-bharatnet-remains-an-unfinished-dream ; https://icrier.org/pdf/pb-BharatNet.pdf ; https://prsindia.org/policy/report-summaries/progress-of-implementation-of-bharat-net ; https://www.deccanherald.com/india/bharatnet-digital-indias-biggest-miss-1015076

### 3.9 Housing: CAG audits and vacant homes
- **CAG performance audit of PMAY-Gramin in Uttar Pradesh (Report No. 8 of 2025):** 34.71 lakh houses sanctioned 2016-17 to 2022-23; **20,215 (0.58%) still incomplete as of March 2025** despite the 12-month prescribed timeline; **₹9.52 crore released to 1,838 ineligible beneficiaries** due to weak verification.
- **PMAY-Urban vacancy (ThePrint):** of **9.69 lakh houses "completed" 2015–2024 [in the cohort examined], nearly 4.59 lakh (~46%) were lying vacant** — attributed by the ministry to **incomplete infrastructure, non-allotment, and unwillingness of allottees**. A parliamentary standing committee said unoccupancy "will defeat the very purpose of the Mission."
- **PMAY-G deadline slippage:** 23 states/UTs reported to have lost 1.44 lakh PMAY units to a missed deadline (Vajiram & Ravi current-affairs summary — secondary, verify).
- **The AIDEM:** CAG reports on UP and Chhattisgarh "highlight broken government promises and broken homes" — clearly editorialised, logged as commentary.

Sources: https://cag.gov.in/uploads/download_audit_report/2025/Full_PA_PMAY-ReportNo-8_English_05-15-2025-signed-0694bb6ecc93c28.69875526.pdf ; https://cag.gov.in/uploads/download_audit_report/2025/ES_PA_PMAY-ReportNo-8_English_05-15-2025-signed-copy-4-0694bb7331cf6a9.85852145.pdf ; https://theprint.in/india/defeats-the-purpose-of-housing-for-all-mission-46-of-completed-pmay-u-houses-for-urban-poor-lying-vacant/2397536/ ; https://theaidem.com/en-cag-reports-on-up-and-chhattisgarh-failed-pmay-scheme-delivery-promise/

### 3.10 Jan Dhan: accounts opened vs accounts used
- **Inoperative accounts in public-sector banks rose to 26% as of end-September 2025**, up from 21% a year earlier (The Wire / Business Standard, citing a report). RBI treats an account as inoperative after two years without transactions.
- Longer-run trend cuts the other way: inoperative PMJDY accounts in PSBs **fell from 39.62% (Mar 2017) to 20.91% (Nov 2024)** — so 2025 is a reversal of an improving trend, not a continuous failure.
- **Zero-balance accounts:** an RBI report found **only 8.2% of 463 million Jan Dhan accounts were zero-balance** (Business Standard, Dec 2022) — this substantially rebuts the older "half the accounts are empty" line, and should be used to correct that claim rather than repeat it.
- PSBs closed ~1.5 million inoperative zero-balance PMJDY accounts in one month as a one-time clean-up of duplicates.

Sources: https://m.thewire.in/article/banking/share-of-inoperative-jan-dhan-accounts-in-public-sector-banks-increase-to-26-report/amp ; https://www.business-standard.com/amp/finance/news/jan-dhan-inoperative-accounts-psbs-financial-inclusion-rupay-gap-125101500986_1.html ; https://www.business-standard.com/amp/article/economy-policy/only-8-2-of-463-million-jan-dhan-accounts-are-zero-balance-rbi-report-122122700900_1.html

### 3.11 NHAI's balance sheet
- **NHAI debt reached ₹3.49 lakh crore**, stated by Nitin Gadkari in Parliament (Business Standard, Aug 2022). Deccan Herald separately reported borrowings jumping **over 2× to ₹3.38 lakh crore in three years**.
- Government/NHAI position: debt has since been **cut to under ₹2 lakh crore from the FY22 peak of ₹3.5 lakh crore**, via asset monetisation and higher budget support; **₹15,700 crore of bank loans pre-paid** from InvIT proceeds; Gadkari stated NHAI is "not facing financial crises."
- Monetisation raised **₹63,911 crore via TOT (3,175 km)** and **₹59,588 crore via InvIT (2,913 km)**; ~₹92,633 crore total through TOT+InvIT to FY2025 per **ICRA**; total NH asset monetisation crossed ₹1 trillion (Feb 2024).
- **The trade-off worth surfacing on a dashboard:** the network expanded partly on debt that is now being repaid by transferring toll rights to private investors for decades — a cost borne by future road users, not by the capex line.

Sources: https://www.business-standard.com/amp/article/current-affairs/nhai-debt-stands-at-rs-3-49-trillion-nitin-gadkari-informs-parliament-122080301126_1.html ; https://www.deccanherald.com/amp/story/india%2Fnhai-borrowings-jump-over-2-fold-to-rs-338-lakh-crore-in-3-years-1056537 ; https://www.icra.in/Research/ViewResearchReport/nhai-s-asset-monetisation-to-fetch-rs-35-000-40-000-crore-in-fy2026/6529 ; https://www.business-standard.com/amp/india-news/nhai-not-facing-financial-crises-pre-paid-rs-15-700-cr-bank-loan-gadkari-124072500737_1.html

### 3.12 Build quality: bridge collapses
- **Newslaundry (Jul 2025):** 170 collapses, 202 deaths, 441 injuries over four years; 48 collapses in 2024 alone by media tally vs MoRTH's 42 for 2019–2024.
- **Indian Bridge Management System condition data (via the same reporting):** ~30% of culverts, 12% of minor bridges, 8% of major bridges and 5% of extra-long bridges rated **"poor condition."**
- Notable incidents: **Gambhira bridge collapse, Vadodara, 9 July 2025 — 22 deaths**; Bihar saw at least 12 bridge collapses in 20 days in 2024 (24 in three months); the Palava bridge on Kalyan-Shil Road was closed within two hours of opening for structural defects.
- **Free Press Journal** frames it as a national crisis "fuelled by corruption, neglect and greed"; **Moneylife** as "Built To Show, Not To Last." Both are opinion-inflected — the underlying incident counts are the citable part.

Sources: https://www.newslaundry.com/2025/07/29/4-years-170-collapses-202-deaths-whats-ailing-indias-bridges ; https://www.freepressjournal.in/analysis/indias-collapsing-bridges-a-national-infrastructure-crisis-fueled-by-corruption-neglect-greed ; https://www.moneylife.in/article/indias-frequent-infrastructure-failures-built-to-show-not-to-last/81051.html

### 3.13 Sagarmala/Bharatmala: standing committee on stalled progress
Per the PRS summary of the Standing Committee on Sagarmala: only one further port-modernisation project completed in a year; **no progress on the all-weather all-cargo Vadhavan port**; **cost escalation of ₹20,000 crore** on port modernisation projects under Sagarmala. Separately, reporting indicates the ₹10 trillion Bharatmala programme was **shelved amid red tape** and a ₹20 trillion Vision 2047 plan deferred following a policy shift.
Sources: https://prsindia.org/policy/report-summaries/progress-made-in-implementation-of-sagarmala-projects ; https://www.drishtiias.com/daily-updates/daily-news-analysis/india-s-journey-of-infrastructure-development

### 3.14 The counter-indicator that gets least airtime: road deaths rose as roads improved
Road accident deaths went from **~137,572 (2014)** to **1.72 lakh (2023)** to **~1.80 lakh (2024)** — a **~30% increase over the decade in which the highway network grew 60%**. Gadkari himself has repeatedly stated the 2024 figure publicly. Accidents rose 4.2% in 2023 over 2022. This is not a critic's number; it is MoRTH's own annual publication, and it belongs on any honest infrastructure dashboard alongside the km-built series.
Sources: https://morth.gov.in/backend/documents/uploaded/Road-Accident-in-India-2023-Publications.pdf ; https://morth.nic.in/sites/default/files/Road_Accidents_in_India_2014.pdf ; https://www.dataforindia.com/road-accident-deaths/ ; https://www.newsonair.gov.in/over-1-80-lakh-deaths-occurred-due-to-road-accidents-in-2024-union-minister-nitin-gadkari

---

## 4. WHAT I COULD NOT VERIFY — HONEST NOTE

**Methodological limits**
1. **I did not read a single primary document.** `WebFetch` returned `EGRESS_BLOCKED` for **pib.gov.in** and **prsindia.org**, the two most important primary sources for this task, and news domains have been 403-ing this session. **Every number above is from a search-engine summary of a page.** Search summaries paraphrase and occasionally conflate figures from different parts of a page. Before anything here goes on a public dashboard, the PIB / CAG / MoRTH PDFs should be opened directly by someone with network access to them.
2. **Dates are frequently missing.** Many search snippets carried no publication date. Where I wrote "undated in snippet," I mean exactly that — I am not guessing.
3. **The search index extends to ~August 2026.** Some results carry 2025 and 2026 datelines. I have labelled these. Do not read a 2026 figure as a "2024 outcome."
4. **No social media, at all.** X/Twitter, Reddit and Instagram were not accessed. There is **no public-sentiment layer in this deliverable**, and none should be inferred from it.

**Specific figures I flag as unverified or shaky**
- **"Only ~20% of the network was electrified in 2014 / 21,801 rkm."** This appeared only in a search summary. The 2014 electrification baseline is important for the railways chart and I would not publish it as-is.
- **"High-speed corridors 93 km → 2,474 km"** and **"4+ lane NH 18,371 → 48,422 km."** Single-source each, both government-origin.
- **"₹8.69 trillion wasted on taps that ran dry"** (Parliamentary Committee on Water Resources, March 2026, via Policy Circle). This number is implausibly large relative to JJM's total budget and I could not corroborate it. **Do not use without checking the committee report.**
- **Metro "ridership required to break even"** figures for Bengaluru (18.64 lakh) and Hyderabad (19 lakh). The derivation is unclear and the magnitudes look off. The *actual* ridership figures and the CAG's Delhi 51.97% finding are safer.
- **NSSO "55.4% still practising open defecation."** Reached only via a PressReader copy of a 2017 Hindustan Times report. Attributed correctly but not verified against NSSO.
- **What is counted as an "airport" in the 74 → 157/160 series** (heliports? water aerodromes?). Unresolved. I deliberately did not assert an answer.
- **How much of the 55,000 km national-highway increase is reclassification of existing state highways versus new construction.** This is the most important open question for the roads theme and **I found no source that quantifies it in either direction.** The dashboard should say so rather than imply either answer.
- **Total freight loading 1,095 MT (2014-15) → 1,588 MT (FY24).** Single-source (a PIB PDF I could not open).

**Where the evidence is strongest** (multiple independent sources, or an audit body):
national highway length 2014 base; metro 248 km base; airports 74 → 157; port capacity 800.5 → 1,630 MTPA; Saubhagya 2.86 crore; JJM 3.23 crore → 15 crore; PMAY-U 1.18 crore sanctioned; the CAG Bharatmala cost findings; the CAG/parliamentary UDAN route-discontinuation findings; the NFHS-4→NFHS-5 sanitation and clean-fuel series; the railway track RTI discrepancy; and MoRTH's own road-fatality series.
