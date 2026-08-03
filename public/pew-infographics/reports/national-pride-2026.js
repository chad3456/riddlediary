// Pew Research Center — "What Makes People Proud of Their Country?" (Feb 17, 2026)
//
// DATA PROVENANCE — read before extending this file.
// pewresearch.org is not reachable from the environment this file was authored
// in, so nothing here was transcribed from the report itself. Every figure was
// taken from published secondary coverage and carries a `src` field naming
// where it came from. Figures reported only as words ("roughly three-in-ten")
// are marked `approx: true` and rendered with a ~ so they are never mistaken
// for a stated percentage. Countries the coverage gave no figure for are
// listed in the coverage block as unsourced — NOT estimated. Do not add a
// number to this file without a source for it.

window.PEW_REPORTS = window.PEW_REPORTS || {};

window.PEW_REPORTS["national-pride-2026"] = {
  meta: {
    title: "What Makes People Proud of Their Country?",
    subtitle:
      "Asked in their own words, people across 25 countries name their culture, their history, their institutions — and, most often, each other.",
    publisher: "Pew Research Center",
    published: "February 17, 2026",
    sourceUrl:
      "https://www.pewresearch.org/global/2026/02/17/what-makes-people-proud-of-their-country/",
    lens: ["Country & region", "Politics & ideology"],
    topic: "National identity",
    year: 2026,
    method:
      "Open-ended question fielded as part of the Spring 2025 Global Attitudes Survey; 33,486 respondents across 25 countries. Answers were coded into categories, so one person can contribute to several themes and columns do not sum to 100%.",
    completeness:
      "Partial. Figures below come from published coverage of the report, not the report's own topline — 17 of the 25 countries have at least one sourced figure, and the coverage table names the 8 that do not.",
  },

  blocks: [
    {
      type: "hero",
      value: "33,486",
      label: "people surveyed across 25 countries",
      note: "Argentina · Australia · Brazil · Canada · France · Germany · Greece · Hungary · India · Indonesia · Israel · Italy · Japan · Kenya · Mexico · Netherlands · Nigeria · Poland · South Africa · South Korea · Spain · Sweden · Turkey · United Kingdom · United States",
      src: "Pew Research Center summary",
    },

    {
      type: "stats",
      title: "The headline findings",
      items: [
        {
          value: "53%",
          label: "of Swedes name how their country is governed",
          note: "The largest share to name any single source of pride in any country surveyed.",
          src: "Pew via The Local",
        },
        {
          value: "41%",
          label: "of Japanese adults name their fellow citizens",
          note: "Citing respectfulness, modesty, honesty and diligence.",
          src: "Pew via Pew topic pages",
        },
        {
          value: "38%",
          label: "of Italians name arts and culture",
          note: "Including the Renaissance and their artistic heritage.",
          src: "Pew via The Local / Euronews",
        },
      ],
    },

    {
      type: "bar",
      title: "Pride in one's fellow citizens",
      subtitle:
        "Share naming the people of their country — their character, solidarity or willingness to help — as a source of national pride.",
      unit: "%",
      max: 55,
      note: "Japanese respondents describe respectfulness, modesty and diligence. Argentines describe “solidarity” and neighbors who are “supportive and empathetic.” Australians describe “mateship” and people who “lend a hand” in a natural disaster. Greeks describe a public that is “hospitable and warm.” Spaniards describe people who are “hardworking” and “welcoming.”",
      emphasisIndex: 0,
      data: [
        { label: "Japan", value: 41, src: "Pew topic pages" },
        { label: "Argentina", value: 35, src: "Pew via Monocle" },
        { label: "Spain", value: 32, src: "Pew via Euronews" },
        { label: "Greece", value: 31, src: "Pew via Greek City Times" },
        { label: "Australia", value: 25, src: "Pew via Monocle" },
        { label: "Hungary", value: 20, src: "Pew via Euronews" },
      ],
    },

    {
      type: "bar",
      title: "Pride in the political system",
      subtitle:
        "Share naming how their country is governed — its democracy, institutions or political system — as a source of pride.",
      unit: "%",
      max: 55,
      note: "Pride in the political system clusters in a handful of high-income countries. Sweden's 53% is the single largest share recorded for any one source of pride in any country in this survey.",
      emphasisIndex: 0,
      data: [
        { label: "Sweden", value: 53, src: "Pew via The Local" },
        { label: "Germany", value: 36, src: "Pew via The Local" },
      ],
    },

    {
      type: "bar",
      title: "Pride in culture, history and the arts",
      subtitle:
        "Share naming their national arts, culture or history. Culture and history were coded separately.",
      unit: "%",
      max: 55,
      note: "Greeks reach for the ancient civilization, their philosophers, and the heroism of their ancestors — including the Greek War of Independence and the Second World War. Italians reach for the Renaissance and their artistic heritage.",
      emphasisIndex: 0,
      data: [
        { label: "Italy — culture", value: 38, src: "Pew via Euronews" },
        { label: "Greece — history", value: 37, src: "Pew via Greek City Times" },
        { label: "France — culture", value: 26, src: "Pew via The Local" },
        { label: "Hungary — history", value: 21, src: "Pew via Euronews" },
        { label: "Spain — culture", value: 16, src: "Pew via Euronews" },
      ],
    },

    {
      type: "bar",
      title: "Pride in peace, safety and diversity",
      subtitle:
        "Two themes that show up strongly in particular countries rather than across the board.",
      unit: "%",
      max: 55,
      note: "Japanese adults emphasize peace and safety more than people in most other countries surveyed, saying they are proud that Japan is “peaceful” and that they “renounce war.” Kenyans cite having comparatively little conflict. Canadians and Indonesians are the most likely to point to a multicultural society.",
      emphasisIndex: 0,
      data: [
        { label: "Canada — diversity", value: 30, approx: true, src: "Pew, “roughly three-in-ten”" },
        { label: "Indonesia — diversity", value: 30, approx: true, src: "Pew, “roughly three-in-ten”" },
        { label: "Kenya — peace & safety", value: 26, src: "Pew topic pages" },
        { label: "Japan — peace & safety", value: 18, src: "Pew topic pages" },
      ],
    },

    {
      type: "bar",
      title: "Where people say they are *not* proud",
      subtitle:
        "Share who answered the open-ended question with no source of pride, or with an explicitly negative sentiment.",
      unit: "%",
      max: 55,
      note: "Britons were the most likely of any nation surveyed to answer this way. Pew notes that in the UK, Nigeria, Spain, Hungary and the United States, at least two-in-ten gave no source of pride — and that Americans were more likely than people in many other surveyed nations to offer a negative sentiment.",
      emphasisIndex: 0,
      data: [
        { label: "United Kingdom", value: 29, src: "Pew via Monocle" },
        { label: "Nigeria", value: 25, src: "Pew via Monocle" },
        { label: "Spain", value: 25, src: "Pew via Monocle" },
        { label: "Hungary", value: 23, src: "Pew via Euronews" },
        { label: "South Africa", value: 19, src: "Pew via Monocle" },
      ],
    },

    {
      type: "compare",
      title: "Freedom is a partisan answer in the United States",
      subtitle:
        "Share of Americans naming freedom as what makes them proud of their country.",
      unit: "%",
      max: 40,
      note: "22% of Americans overall named freedom — among the highest of any nation surveyed. Pew notes this partisan gap on sources of pride is not as pronounced in most other countries. About two-in-ten French respondents also named the level of freedom in their country. The U.S. sample was 5,153 adults, surveyed Aug. 18–24, 2025.",
      series: [
        { name: "Republicans", key: "rep" },
        { name: "Democrats", key: "dem" },
      ],
      data: [
        {
          label: "Proud of freedom",
          rep: 32,
          dem: 15,
          src: "Pew, '6 facts about national pride in the US'",
        },
      ],
    },

    {
      type: "coverage",
      title: "All 25 countries surveyed",
      subtitle:
        "Every country in the study, with the figures this page was able to source. Blank cells are not zeroes and not estimates — they are figures the available coverage did not state.",
      note: "To complete this table, open the report's topline and append the missing values to reports/national-pride-2026.js. Nothing in this app fills a gap with an estimate.",
      columns: ["Country", "Sourced figures"],
      data: [
        { country: "Argentina", figures: [{ k: "People", v: 35 }] },
        { country: "Australia", figures: [{ k: "People", v: 25 }] },
        { country: "Brazil", figures: [], qualitative: "Mentions involvement in BRICS." },
        { country: "Canada", figures: [{ k: "Diversity", v: 30, approx: true }] },
        { country: "France", figures: [{ k: "Culture", v: 26 }, { k: "Freedom", v: 20, approx: true }] },
        { country: "Germany", figures: [{ k: "Political system", v: 36 }] },
        { country: "Greece", figures: [{ k: "History", v: 37 }, { k: "People", v: 31 }] },
        { country: "Hungary", figures: [{ k: "Not proud", v: 23 }, { k: "History", v: 21 }, { k: "People", v: 20 }] },
        { country: "India", figures: [], qualitative: "Pride in the flag and in economic growth; no percentage stated in available coverage." },
        { country: "Indonesia", figures: [{ k: "Diversity", v: 30, approx: true }], qualitative: "Also mentions involvement in BRICS." },
        { country: "Israel", figures: [], qualitative: "No figure found in available coverage." },
        { country: "Italy", figures: [{ k: "Culture", v: 38 }] },
        { country: "Japan", figures: [{ k: "People", v: 41 }, { k: "Peace & safety", v: 18 }] },
        { country: "Kenya", figures: [{ k: "Peace & safety", v: 26 }] },
        { country: "Mexico", figures: [], qualitative: "No figure found in available coverage." },
        { country: "Netherlands", figures: [], qualitative: "No figure found in available coverage." },
        { country: "Nigeria", figures: [{ k: "Not proud", v: 25 }] },
        { country: "Poland", figures: [], qualitative: "Pride in economic growth; no percentage stated in available coverage." },
        { country: "South Africa", figures: [{ k: "Not proud", v: 19 }], qualitative: "Also mentions involvement in BRICS." },
        { country: "South Korea", figures: [], qualitative: "Pride in economic growth; no percentage stated in available coverage." },
        { country: "Spain", figures: [{ k: "People", v: 32 }, { k: "Not proud", v: 25 }, { k: "Culture", v: 16 }, { k: "Lifestyle", v: 14 }, { k: "Geography", v: 13 }] },
        { country: "Sweden", figures: [{ k: "Political system", v: 53 }] },
        { country: "Turkey", figures: [], qualitative: "Pride in the flag; no percentage stated in available coverage." },
        { country: "United Kingdom", figures: [{ k: "Not proud", v: 29 }] },
        { country: "United States", figures: [{ k: "Freedom", v: 22 }], qualitative: "Republicans 32% vs Democrats 15% on freedom." },
      ],
    },

    {
      type: "notes",
      title: "What each place tends to reach for",
      items: [
        {
          heading: "Sweden and Germany — the political system",
          body: "The political system is a common source of national pride in several high-income countries, and is named far more often in Sweden (53%) and Germany (36%) than anywhere else surveyed.",
          src: "Pew via The Local",
        },
        {
          heading: "Japan — a peaceful country, and a particular kind of neighbor",
          body: "41% name the Japanese people, describing respectfulness, modesty, honesty and diligence. A further 18% name peace and safety, saying they are proud that Japan is peaceful and that they renounce war.",
          src: "Pew topic pages",
        },
        {
          heading: "Canada and Indonesia — a multicultural society",
          body: "Canadians and Indonesians are the most likely of any nations surveyed to point to their country's multicultural society, with roughly three-in-ten in each saying so.",
          src: "Pew topic pages",
        },
        {
          heading: "Poland, South Korea and India — economic growth",
          body: "In several fast-growing economies, many express pride specifically in their country's economic growth rather than its institutions or culture.",
          src: "Pew topic pages",
        },
        {
          heading: "Brazil, Indonesia and South Africa — a place in the world",
          body: "People in these three countries mention their country's involvement in BRICS as a source of pride — a form of pride in international standing rather than in anything domestic.",
          src: "Pew topic pages",
        },
        {
          heading: "Hungary and the UK — the negative answer",
          body: "Hungary is unusual in the survey for combining high negative sentiment (23% not proud) with substantial pride in history (21%) and people (20%). Britons were the most likely of any nation to say they were not proud, at 29%.",
          src: "Pew via Euronews / Monocle",
        },
      ],
    },
  ],
};
