// GENERATED FILE — do not edit by hand.
// Produced by scripts/build_ncrb.py from data/ncrb/source/*.csv.
// Every figure here was computed from those CSVs; none was typed in.
// Regenerate with:  python3 scripts/build_ncrb.py

window.PEW_REPORTS = window.PEW_REPORTS || {};

window.PEW_REPORTS["india-crime-ncrb"] = {
  "meta": {
    "title": "Two Decades of Recorded Crime in India",
    "subtitle": "NCRB's own tables, 2004–2016 — what they show, and the two places where the official record does not agree with itself.",
    "publisher": "National Crime Records Bureau (India)",
    "published": "Crime in India volumes 2004–2016",
    "sourceUrl": "https://www.ncrb.gov.in/",
    "lens": [
      "Country & region",
      "Crime & justice"
    ],
    "topic": "Crime & justice",
    "year": 2016,
    "method": "Derived by scripts/build_ncrb.py from four NCRB tables vendored in data/ncrb/source/. National series 2004–2016; state-level 2001–2012 from district returns. Every figure on this page is computed from those files at build time — none is entered by hand.",
    "completeness": "National IPC series is complete for 2004–2016 and state-level for 2001–2012. 2017 onward is not vendored here, and no NCRB data exists for 2025–26 at all. The coverage table lists every year explicitly."
  },
  "blocks": [
    {
      "type": "hero",
      "value": "2,975,711",
      "label": "IPC crimes recorded across India in 2016",
      "note": "Up 62.4% from 1,832,015 in 2004. Over the same period the estimated population grew 17.4%, so the crime *rate* per lakh people rose 38.4% — from 168.8 to 233.6.",
      "src": "NCRB Crime in India, national time-series tables (2004–2016)"
    },
    {
      "type": "stats",
      "title": "The long view",
      "items": [
        {
          "value": "+62.4%",
          "label": "IPC crimes, 2004 → 2016",
          "note": "1,832,015 to 2,975,711 cases recorded.",
          "src": "NCRB national tables"
        },
        {
          "value": "+38.4%",
          "label": "Crime rate per lakh people",
          "note": "168.8 to 233.6. Rate controls for the 17.4% population growth.",
          "src": "NCRB national tables"
        },
        {
          "value": "-3.09%",
          "label": "to -2.27% — district-vs-national gap",
          "note": "State returns consistently fall short of the published national total. Shown, not silently reconciled.",
          "src": "Computed from both source files"
        }
      ]
    },
    {
      "type": "line",
      "title": "IPC crimes recorded, 2004–2016",
      "subtitle": "Total cognizable crimes under the Indian Penal Code. IPC is the only series NCRB defined consistently across this whole span — see the definitional break below.",
      "unit": "",
      "max": 3300000,
      "note": "The rise is not merely demographic: population grew 17.4% over the period while recorded IPC crime grew 62.4%. Recorded crime also reflects reporting and registration practice, not only underlying offending — a rise can mean more crime, better recording, or both.",
      "data": [
        {
          "label": "2004",
          "value": 1832015
        },
        {
          "label": "2005",
          "value": 1822602
        },
        {
          "label": "2006",
          "value": 1878293
        },
        {
          "label": "2007",
          "value": 1989673
        },
        {
          "label": "2008",
          "value": 2093379
        },
        {
          "label": "2009",
          "value": 2121345
        },
        {
          "label": "2010",
          "value": 2224831
        },
        {
          "label": "2011",
          "value": 2325575
        },
        {
          "label": "2012",
          "value": 2387188
        },
        {
          "label": "2013",
          "value": 2647722
        },
        {
          "label": "2014",
          "value": 2851563
        },
        {
          "label": "2015",
          "value": 2949400
        },
        {
          "label": "2016",
          "value": 2975711
        }
      ],
      "src": "NCRB Crime in India national time-series tables"
    },
    {
      "type": "line",
      "title": "Crime rate per lakh population",
      "subtitle": "IPC cases recorded per 100,000 people — the population-adjusted view of the series above.",
      "unit": "",
      "max": 269,
      "note": "Rate rather than count is the fairer comparison across years, and it still rises: 168.8 in 2004 to 233.6 in 2016.",
      "data": [
        {
          "label": "2004",
          "value": 168.8
        },
        {
          "label": "2005",
          "value": 165.3
        },
        {
          "label": "2006",
          "value": 167.7
        },
        {
          "label": "2007",
          "value": 175.1
        },
        {
          "label": "2008",
          "value": 181.5
        },
        {
          "label": "2009",
          "value": 181.4
        },
        {
          "label": "2010",
          "value": 187.6
        },
        {
          "label": "2011",
          "value": 192.2
        },
        {
          "label": "2012",
          "value": 196.7
        },
        {
          "label": "2013",
          "value": 215.5
        },
        {
          "label": "2014",
          "value": 229.2
        },
        {
          "label": "2015",
          "value": 234.2
        },
        {
          "label": "2016",
          "value": 233.6
        }
      ],
      "src": "NCRB Crime in India national time-series tables"
    },
    {
      "type": "compare",
      "title": "The same year, two different answers: SLL crimes in 2014",
      "subtitle": "What NCRB counted as a Special &amp; Local Laws cognizable crime changed between the 2015 and 2016 editions of Crime in India. The IPC count for the same year is identical to the digit; the SLL count is not close.",
      "unit": "",
      "max": 4800000,
      "note": "A gap of 2,657,530 cases in a single year, from a definition change rather than anything that happened on the ground. This is why every long trend on this page uses IPC only, and why SLL and Total are never plotted across the break.",
      "series": [
        {
          "name": "Crime in India 2015 edition",
          "key": "a"
        },
        {
          "name": "Crime in India 2016 edition",
          "key": "b"
        }
      ],
      "data": [
        {
          "label": "SLL crimes, 2014",
          "a": 4377630,
          "b": 1720100,
          "src": "Both NCRB national tables, compared by build_ncrb.py"
        }
      ]
    },
    {
      "type": "bar",
      "title": "IPC crimes by state and union territory, 2012",
      "subtitle": "From NCRB district-level returns, summed to state level. These are counts, not rates — large states appear high partly because they are large.",
      "unit": "",
      "max": 240000,
      "note": "Summed from the per-state TOTAL rows of the district returns. These state figures total -2.27% below NCRB's published national count for 2012, a gap consistent with central and railway police units being outside state returns.",
      "emphasisIndex": 0,
      "data": [
        {
          "label": "Madhya Pradesh",
          "value": 220335,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Maharashtra",
          "value": 202700,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Tamil Nadu",
          "value": 200474,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Uttar Pradesh",
          "value": 198093,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Andhra Pradesh",
          "value": 192522,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Rajasthan",
          "value": 170948,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "West Bengal",
          "value": 161427,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Kerala",
          "value": 158989,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Bihar",
          "value": 146614,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Karnataka",
          "value": 134021,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Gujarat",
          "value": 130121,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Assam",
          "value": 77682,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Odisha",
          "value": 67957,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Haryana",
          "value": 62480,
          "src": "NCRB district-wise IPC returns"
        },
        {
          "label": "Chhattisgarh",
          "value": 54598,
          "src": "NCRB district-wise IPC returns"
        }
      ]
    },
    {
      "type": "bar",
      "title": "Fastest-rising states, 2001 → 2012",
      "subtitle": "Percentage change in recorded IPC crimes, among states recording at least 10,000 cases in 2001 so the base is large enough for a percentage to mean something.",
      "unit": "%",
      "max": 187,
      "note": "Change in *recorded* crime. A state that improves its registration practice will rise here without offending having risen, which is why this chart names movement rather than blame.",
      "emphasisIndex": 0,
      "data": [
        {
          "label": "West Bengal",
          "value": 162.2,
          "src": "61,563 → 161,427 cases"
        },
        {
          "label": "Assam",
          "value": 110.7,
          "src": "36,877 → 77,682 cases"
        },
        {
          "label": "Bihar",
          "value": 65.8,
          "src": "88,432 → 146,614 cases"
        },
        {
          "label": "Haryana",
          "value": 61.2,
          "src": "38,759 → 62,480 cases"
        },
        {
          "label": "Jharkhand",
          "value": 60.9,
          "src": "25,447 → 40,946 cases"
        },
        {
          "label": "Kerala",
          "value": 53.1,
          "src": "103,847 → 158,989 cases"
        },
        {
          "label": "Andhra Pradesh",
          "value": 48.0,
          "src": "130,089 → 192,522 cases"
        },
        {
          "label": "Odisha",
          "value": 45.6,
          "src": "46,661 → 67,957 cases"
        },
        {
          "label": "Chhattisgarh",
          "value": 42.0,
          "src": "38,460 → 54,598 cases"
        },
        {
          "label": "Tamil Nadu",
          "value": 29.5,
          "src": "154,801 → 200,474 cases"
        }
      ]
    },
    {
      "type": "map",
      "title": "Crime by state, year by year",
      "subtitle": "Recorded cases for nine IPC crime heads from NCRB district returns, 2001 to 2018. Drag the year, switch the crime head, or press play to watch the map move.",
      "note": "These are *counts, not rates* — no state population series by year is vendored here, so Uttar Pradesh and Maharashtra read dark partly because they are populous. Colour bins are fixed across all years, so a shade means the same number in 2001 as it does in 2018; they are quantile bins because the distribution is heavily right-skewed. Each crime head offers only the years NCRB actually reports it for — the caption under the slider names any year the source skips, and no gap is filled in. Two territories are shaded from their parent state, because that is who reported them at the time: Telangana before 2014 (part of Andhra Pradesh until June that year) and Ladakh throughout (part of Jammu & Kashmir until 2019). Hovering either says so, and neither is double-counted in the table."
    },
    {
      "type": "coverage",
      "unitLabel": "years",
      "title": "Year-by-year coverage in this repository",
      "subtitle": "Every year from the requested window. Years with no entry are years whose NCRB tables are not vendored in this repo — they are gaps in the source data, not zeroes.",
      "note": "To extend the report, drop the corresponding NCRB tables into data/ncrb/source/ and re-run scripts/build_ncrb.py. No figure on this page is entered by hand.",
      "columns": [
        "Year",
        "Data available"
      ],
      "data": [
        {
          "country": "2004",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 1832015,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 168.8,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2005",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 1822602,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 165.3,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2006",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 1878293,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 167.7,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2007",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 1989673,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 175.1,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2008",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2093379,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 181.5,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2009",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2121345,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 181.4,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2010",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2224831,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 187.6,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2011",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2325575,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 192.2,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2012",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2387188,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 196.7,
              "unit": ""
            },
            {
              "k": "States reporting",
              "v": 34,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2013",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2647722,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 215.5,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2014",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2851563,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 229.2,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2015",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2949400,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 234.2,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2016",
          "figures": [
            {
              "k": "IPC crimes",
              "v": 2975711,
              "unit": ""
            },
            {
              "k": "Rate per lakh",
              "v": 233.6,
              "unit": ""
            }
          ],
          "qualitative": null
        },
        {
          "country": "2017",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2018",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2019",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2020",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2021",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2022",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2023",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2024",
          "figures": [],
          "qualitative": "NCRB published a Crime in India volume for this year, but its tables are not vendored in this repository."
        },
        {
          "country": "2025",
          "figures": [],
          "qualitative": "No NCRB data exists: Crime in India 2024, released 6 May 2026, is the most recent volume."
        },
        {
          "country": "2026",
          "figures": [],
          "qualitative": "No NCRB data exists: Crime in India 2024, released 6 May 2026, is the most recent volume."
        }
      ]
    },
    {
      "type": "notes",
      "title": "How to read this report",
      "items": [
        {
          "heading": "Recorded crime is not the same as crime",
          "body": "NCRB counts cases registered by police. Changes reflect reporting willingness, registration practice and legal definitions as much as underlying offending. A rise can be a sign of better access to justice rather than a more dangerous country.",
          "src": "Methodological note"
        },
        {
          "heading": "Only the IPC series spans the whole period",
          "body": "The SLL and Total series break between the 2015 and 2016 editions — by 2,657,530 cases in 2014 alone. Every multi-year chart here uses IPC.",
          "src": "Computed from the source tables"
        },
        {
          "heading": "State and national figures come from different tables",
          "body": "District returns summed to state level run -3.09% to -2.27% below the published national totals, consistently across every year. The two are never mixed within a single chart.",
          "src": "Computed from both source files"
        },
        {
          "heading": "The data ends before the question does",
          "body": "NCRB's most recent publication is Crime in India 2024, released 6 May 2026. No 2025 or 2026 figures exist anywhere — the reporting year trails the calendar year by about 18 months. The tables vendored here end earlier still, at 2016 nationally and 2012 for states.",
          "src": "NCRB publication schedule"
        }
      ]
    }
  ]
};
