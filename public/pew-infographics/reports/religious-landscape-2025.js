// Pew Research Center — Religious Landscape Study (2023–24), published Feb 26, 2025
//
// DATA PROVENANCE — same rule as every report in this app.
// pewresearch.org is unreachable from the authoring environment, so figures
// come from published coverage of the study (Pew's own executive summary as
// surfaced in search, NPR, OPB, Episcopal News Service). Each carries a `src`.
// No figure here is estimated or interpolated.

window.PEW_REPORTS = window.PEW_REPORTS || {};

window.PEW_REPORTS["religious-landscape-2025"] = {
  meta: {
    title: "The Decline of Christianity in the U.S. Has Slowed",
    subtitle:
      "After nearly two decades of steady decline, the Christian share of American adults has held roughly steady since 2019 — and the growth of the religiously unaffiliated has levelled off with it.",
    publisher: "Pew Research Center",
    published: "February 26, 2025",
    sourceUrl:
      "https://www.pewresearch.org/religion/2025/02/26/decline-of-christianity-in-the-us-has-slowed-may-have-leveled-off/",
    lens: ["Religion", "Generation & age"],
    topic: "Religion",
    year: 2025,
    method:
      "The Religious Landscape Study, a survey of nearly 37,000 U.S. adults fielded July 2023 – March 2024. Comparisons draw on the same study's 2007 and 2014 waves.",
    completeness:
      "Good for the headline composition and trend. Sub-group detail beyond the age split below was not sourced.",
  },

  blocks: [
    {
      type: "hero",
      value: "62%",
      label: "of U.S. adults describe themselves as Christian",
      note: "40% Protestant · 19% Catholic · 3% other Christian. Nearly 37,000 U.S. adults were surveyed between July 2023 and March 2024.",
      src: "Pew, Religious Landscape Study executive summary",
    },

    {
      type: "stats",
      title: "How American adults describe themselves",
      items: [
        {
          value: "62%",
          label: "Christian",
          note: "Protestant 40% · Catholic 19% · other Christian 3%. Roughly stable since 2019, after years of decline.",
          src: "Pew RLS executive summary",
        },
        {
          value: "29%",
          label: "Religiously unaffiliated",
          note: "Atheist 5% · agnostic 6% · “nothing in particular” 19%. Pew's term for this group is the “nones.”",
          src: "Pew RLS executive summary",
        },
        {
          value: "~37,000",
          label: "U.S. adults surveyed",
          note: "Fielded July 2023 through March 2024 — one of the largest religion surveys of its kind.",
          src: "Pew RLS executive summary",
        },
      ],
    },

    {
      type: "line",
      title: "The rise of the “nones” has levelled off",
      subtitle:
        "Share of U.S. adults who are religiously unaffiliated, across the three waves of the Religious Landscape Study.",
      unit: "%",
      max: 40,
      note: "The religiously unaffiliated population, after rising rapidly for decades, has levelled off — at least temporarily. The same plateau appears on the Christian side of the ledger, which has been roughly stable since 2019.",
      data: [
        { label: "2007", value: 16 },
        { label: "2014", value: 23 },
        { label: "2023–24", value: 29 },
      ],
      src: "Pew RLS executive summary",
    },

    {
      type: "compare",
      title: "The generational gap is the widest split in the study",
      subtitle:
        "Share who are religiously unaffiliated, youngest adults versus oldest adults.",
      unit: "%",
      max: 50,
      note: "A 30-point gap. This is the clearest single reason the long-run trend has not simply reversed: each arriving cohort is markedly less affiliated than the one leaving.",
      series: [
        { name: "Youngest adults", key: "young" },
        { name: "Oldest adults", key: "old" },
      ],
      data: [
        {
          label: "Religiously unaffiliated",
          young: 43,
          old: 13,
          src: "Pew RLS executive summary",
        },
      ],
    },

    {
      type: "notes",
      title: "What the study concluded",
      items: [
        {
          heading: "The decline has slowed, not reversed",
          body: "The Christian share of the U.S. population has been relatively stable since 2019 after years of decline. Pew's framing is deliberately cautious: the decline may have levelled off, not that it has ended.",
          src: "Pew RLS executive summary",
        },
        {
          heading: "The plateau may be temporary",
          body: "Pew notes the unaffiliated share has levelled off “at least temporarily.” The 43%-vs-13% age gap is the reason for that hedge — generational replacement continues to push in one direction.",
          src: "Pew RLS executive summary",
        },
      ],
    },
  ],
};
