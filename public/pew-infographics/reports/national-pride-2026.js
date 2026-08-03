// Pew Research Center — "What Makes People Proud of Their Country?" (Feb 17, 2026)
//
// DATA PROVENANCE — read before extending this file.
// pewresearch.org is not reachable from the environment this file was authored
// in, so nothing here was transcribed from the report itself. Every figure below
// was taken from published secondary coverage of the report and carries a
// `src` field naming where it came from. Figures the sources did not state are
// simply absent — this file has no estimated, interpolated, or illustrative
// numbers in it, and must not acquire any. To complete the dataset, open the
// report's own topline PDF and append the missing countries.

window.PEW_REPORTS = window.PEW_REPORTS || {};

window.PEW_REPORTS["national-pride-2026"] = {
  meta: {
    title: "What Makes People Proud of Their Country?",
    subtitle:
      "Asked in their own words, people across 25 countries name their culture, their history and — most often — each other.",
    publisher: "Pew Research Center",
    published: "February 17, 2026",
    sourceUrl:
      "https://www.pewresearch.org/global/2026/02/17/what-makes-people-proud-of-their-country/",
    method:
      "Open-ended question fielded as part of the Spring 2025 Global Attitudes Survey. Responses were coded into categories, so a single person can contribute to more than one theme.",
    completeness:
      "Partial. This infographic shows only the country-level figures stated in published coverage of the report; the remaining countries are in the report's topline but were not accessible when this page was built.",
  },

  blocks: [
    {
      type: "hero",
      value: "33,486",
      label: "people surveyed across 25 countries",
      note: "Argentina · Australia · Brazil · Canada · France · Germany · Greece · Hungary · India · Indonesia · Israel · Italy · Japan · Kenya · Mexico · Netherlands · Nigeria · Poland · South Africa · South Korea · Spain · Sweden · Turkey · United Kingdom · United States",
      src: "Pew Research Center summary; Monocle",
    },

    {
      type: "stats",
      title: "The headline findings",
      items: [
        {
          value: "38%",
          label: "of Italians name arts and culture",
          note: "The single largest source of pride recorded in any one country in the available coverage.",
          src: "Pew via The Local / Visual Capitalist",
        },
        {
          value: "37%",
          label: "of Greeks name their history",
          note: "Respondents cited the ancient civilization and the wars of their ancestors.",
          src: "Pew via Greek City Times",
        },
        {
          value: "22%",
          label: "of Americans name freedom",
          note: "Americans are among the most likely of any nation surveyed to lead with freedom.",
          src: "Pew, '6 facts about national pride in the US'",
        },
      ],
    },

    {
      type: "bar",
      title: "Pride in one's fellow citizens",
      subtitle:
        "Share naming the people of their country — their solidarity, warmth or willingness to help — as a source of national pride.",
      unit: "%",
      max: 40,
      note: "Argentines describe “solidarity” and neighbors who are “supportive and empathetic.” Australians describe “mateship” and people who “lend a hand” in a natural disaster. Greeks describe a public that is “hospitable and warm.”",
      emphasisIndex: 0,
      data: [
        { label: "Argentina", value: 35, src: "Pew via Monocle" },
        { label: "Spain", value: 32, src: "Pew via The Local" },
        { label: "Greece", value: 31, src: "Pew via Greek City Times" },
        { label: "Australia", value: 25, src: "Pew via Monocle" },
      ],
    },

    {
      type: "bar",
      title: "Where people say they are *not* proud",
      subtitle:
        "Share who answered the open-ended question with no source of pride, or with an explicitly negative sentiment.",
      unit: "%",
      max: 40,
      note: "Britons were the most likely of any nation surveyed to answer this way. Americans were also more likely than people in many other surveyed nations to offer a negative sentiment.",
      emphasisIndex: 0,
      data: [
        { label: "United Kingdom", value: 29, src: "Pew via Monocle" },
        { label: "Nigeria", value: 25, src: "Pew via Monocle" },
        { label: "Spain", value: 25, src: "Pew via Monocle" },
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
      note: "Pew notes this partisan gap on sources of pride is not as pronounced in most other countries surveyed. The U.S. sample was 5,153 adults, surveyed Aug. 18–24, 2025.",
      series: [
        { name: "Republicans", key: "rep" },
        { name: "Democrats", key: "dem" },
      ],
      data: [{ label: "Proud of freedom", rep: 32, dem: 15, src: "Pew, '6 facts about national pride in the US'" }],
    },

    {
      type: "notes",
      title: "What each region tends to reach for",
      items: [
        {
          heading: "Italy — arts and culture",
          body: "Italians are the most likely of any nation surveyed to mention their national arts and culture, including the Renaissance and their artistic heritage.",
          src: "Pew via The Local",
        },
        {
          heading: "Greece — history",
          body: "Greeks are exceptionally proud of their history, boasting about their ancient civilization as well as the wars of their ancestors, including the Greek War of Independence and the Second World War.",
          src: "Pew via Greek City Times",
        },
        {
          heading: "Spain and Australia — the way of life",
          body: "Spaniards and Australians are particularly likely to praise the way of life in their country rather than any single institution or achievement.",
          src: "Pew Research Center summary",
        },
        {
          heading: "Sweden and Germany — the political system",
          body: "The political system is a common source of national pride in several high-income countries, and is named especially often in Sweden and Germany.",
          src: "Pew Research Center summary",
        },
      ],
    },
  ],
};
