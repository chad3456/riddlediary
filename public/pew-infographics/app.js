// Pew Infographics — a curated library + generic report renderer.
//
// Adding a report: drop a file in reports/ that registers itself on
// window.PEW_REPORTS, add a <script> tag for it, and give its meta a `lens`,
// `topic` and `year`. The library's facets are derived from the registered
// reports themselves, so no catalog needs maintaining by hand and a new
// report becomes filterable the moment it loads.
//
// Every chart block gets a table-view twin, so no value is reachable by
// hover alone.

(function () {
  "use strict";

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // *emphasis* → <em>, so report copy can stress a word without inlining HTML.
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

  // "~30%" for figures the source stated only in words ("roughly three-in-ten").
  const fmt = (d, unit) => `${d.approx ? "~" : ""}${d.value}${unit || ""}`;

  let uid = 0;
  const nextId = () => `viz-${++uid}`;

  // ───────── Block renderers ─────────

  function renderHero(b) {
    return `
      <section class="hero">
        <div class="hero-value">${esc(b.value)}</div>
        <div class="hero-label">${esc(b.label)}</div>
        ${b.note ? `<p class="hero-note">${esc(b.note)}</p>` : ""}
      </section>`;
  }

  function renderStats(b) {
    const tiles = b.items
      .map(
        (it) => `
        <div class="stat">
          <div class="stat-value">${esc(it.value)}</div>
          <div class="stat-label">${esc(it.label)}</div>
          ${it.note ? `<p class="stat-note">${esc(it.note)}</p>` : ""}
        </div>`
      )
      .join("");
    return `
      <section class="block">
        ${b.title ? `<h2 class="block-title">${md(b.title)}</h2>` : ""}
        <div class="stat-grid">${tiles}</div>
        ${srcLine(b.items)}
      </section>`;
  }

  function renderBar(b) {
    const max = b.max || Math.max(...b.data.map((d) => d.value));
    const tableId = nextId();
    const rows = b.data
      .map((d, i) => {
        const pct = (d.value / max) * 100;
        const emph = b.emphasisIndex === i ? " is-emphasis" : "";
        return `
        <div class="bar-row${emph}" title="${esc(d.label)}: ${fmt(d, b.unit)}">
          <div class="bar-label">${esc(d.label)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct.toFixed(1)}%"></div>
            <span class="bar-value">${fmt(d, b.unit)}</span>
          </div>
        </div>`;
      })
      .join("");

    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        <div class="chart">${rows}</div>
        ${axis(max, b.unit)}
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        ${dataTable(
          tableId,
          ["Series", "Share", "Source"],
          b.data.map((d) => [d.label, fmt(d, b.unit), d.src || "—"])
        )}
      </section>`;
  }

  function renderCompare(b) {
    const max = b.max || Math.max(...b.data.flatMap((d) => b.series.map((s) => d[s.key])));
    const tableId = nextId();
    const colors = ["var(--series-2)", "var(--series-1)"];

    const legend = `
      <div class="legend">
        ${b.series
          .map(
            (s, i) =>
              `<span class="legend-item"><span class="legend-swatch" style="background:${colors[i]}"></span>${esc(s.name)}</span>`
          )
          .join("")}
      </div>`;

    const groups = b.data
      .map(
        (d) => `
      <div class="cmp-group">
        ${b.series
          .map(
            (s, i) => `
          <div class="cmp-bar-row" title="${esc(s.name)}: ${d[s.key]}${esc(b.unit || "")}">
            <div class="cmp-name">${esc(s.name)}</div>
            <div class="cmp-track">
              <div class="cmp-fill" style="width:${((d[s.key] / max) * 100).toFixed(1)}%;background:${colors[i]}"></div>
              <span class="bar-value">${d[s.key]}${esc(b.unit || "")}</span>
            </div>
          </div>`
          )
          .join("")}
      </div>`
      )
      .join("");

    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        ${legend}
        <div class="chart">${groups}</div>
        ${axis(max, b.unit)}
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        ${dataTable(
          tableId,
          ["Group", "Share", "Source"],
          b.data.flatMap((d) => b.series.map((s) => [s.name, `${d[s.key]}${b.unit || ""}`, d.src || "—"]))
        )}
      </section>`;
  }

  // Trend over time → line. Single series, so no legend; the endpoint is
  // direct-labeled and the rest are carried by the axis and the table.
  function renderLine(b) {
    const tableId = nextId();
    const max = b.max || Math.max(...b.data.map((d) => d.value));
    const W = 640, H = 210, PAD_L = 34, PAD_R = 52, PAD_T = 16, PAD_B = 30;
    const plotW = W - PAD_L - PAD_R;
    const plotH = H - PAD_T - PAD_B;

    const x = (i) => PAD_L + (b.data.length === 1 ? plotW / 2 : (i / (b.data.length - 1)) * plotW);
    const y = (v) => PAD_T + plotH - (v / max) * plotH;

    const ticks = [0, max / 2, max];
    const grid = ticks
      .map(
        (t) =>
          `<line x1="${PAD_L}" y1="${y(t).toFixed(1)}" x2="${PAD_L + plotW}" y2="${y(t).toFixed(1)}" class="gridline"/>
           <text x="${PAD_L - 8}" y="${(y(t) + 4).toFixed(1)}" class="axis-text" text-anchor="end">${t}</text>`
      )
      .join("");

    const path = b.data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");

    const dots = b.data
      .map(
        (d, i) =>
          `<circle cx="${x(i).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="5" class="dot"><title>${esc(d.label)}: ${d.value}${esc(b.unit || "")}</title></circle>`
      )
      .join("");

    const xLabels = b.data
      .map(
        (d, i) =>
          `<text x="${x(i).toFixed(1)}" y="${H - 8}" class="axis-text" text-anchor="middle">${esc(d.label)}</text>`
      )
      .join("");

    const last = b.data[b.data.length - 1];
    const endLabel = `<text x="${(x(b.data.length - 1) + 12).toFixed(1)}" y="${(y(last.value) + 4).toFixed(1)}" class="end-label">${last.value}${esc(b.unit || "")}</text>`;

    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        <svg class="linechart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(b.title)}">
          ${grid}
          <path d="${path}" class="line-path"/>
          ${dots}
          ${xLabels}
          ${endLabel}
        </svg>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        ${dataTable(
          tableId,
          ["Wave", "Share", "Source"],
          b.data.map((d) => [d.label, `${d.value}${b.unit || ""}`, d.src || b.src || "—"])
        )}
      </section>`;
  }

  // Full-universe table: every unit in the study, with gaps shown as gaps.
  function renderCoverage(b) {
    const rows = b.data
      .map((r) => {
        const figs = r.figures.length
          ? r.figures
              .map(
                (f) =>
                  `<span class="chip"><span class="chip-k">${esc(f.k)}</span><span class="chip-v">${f.approx ? "~" : ""}${f.v}%</span></span>`
              )
              .join("")
          : `<span class="chip chip-empty">no figure sourced</span>`;
        return `
        <tr>
          <th scope="row">${esc(r.country)}</th>
          <td>
            <div class="chips">${figs}</div>
            ${r.qualitative ? `<p class="cov-qual">${esc(r.qualitative)}</p>` : ""}
          </td>
        </tr>`;
      })
      .join("");

    const sourced = b.data.filter((r) => r.figures.length).length;

    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        <p class="cov-count"><strong>${sourced}</strong> of <strong>${b.data.length}</strong> countries have at least one sourced figure.</p>
        <table class="coverage-table">
          <thead><tr><th>${esc(b.columns[0])}</th><th>${esc(b.columns[1])}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
      </section>`;
  }

  function renderNotes(b) {
    const items = b.items
      .map(
        (it) => `
        <div class="note-item">
          <h3 class="note-heading">${esc(it.heading)}</h3>
          <p class="note-body">${esc(it.body)}</p>
        </div>`
      )
      .join("");
    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${items}
        ${srcLine(b.items)}
      </section>`;
  }

  // ───────── Shared pieces ─────────

  function axis(max, unit) {
    return `
      <div class="bar-axis">
        <div></div>
        <div class="bar-axis-ticks"><span>0</span><span>${max}${esc(unit || "")}</span></div>
      </div>`;
  }

  function tableToggle(id) {
    return `<button class="table-toggle" type="button" data-table-toggle="${id}" aria-expanded="false" aria-controls="${id}">Show data table</button>`;
  }

  function dataTable(id, headers, rows) {
    return `
      <table class="data-table" id="${id}" hidden>
        <thead><tr>${headers.map((h, i) => `<th${i === 1 ? ' class="num"' : ""}>${esc(h)}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows
            .map(
              (r) =>
                `<tr>${r
                  .map((c, i) => `<td class="${i === 1 ? "num" : i === 2 ? "src" : ""}">${esc(c)}</td>`)
                  .join("")}</tr>`
            )
            .join("")}
        </tbody>
      </table>`;
  }

  function srcLine(items) {
    const srcs = [...new Set(items.map((i) => i.src).filter(Boolean))];
    return srcs.length ? `<p class="block-src">Source: ${esc(srcs.join(" · "))}</p>` : "";
  }

  const RENDERERS = {
    hero: renderHero,
    stats: renderStats,
    bar: renderBar,
    compare: renderCompare,
    line: renderLine,
    coverage: renderCoverage,
    notes: renderNotes,
  };

  // ───────── Library ─────────

  const LENS_ORDER = [
    "Generation & age",
    "Race & ethnicity",
    "Religion",
    "Country & region",
    "Politics & ideology",
    "Gender",
    "Education & income",
  ];

  function allReports() {
    return Object.entries(window.PEW_REPORTS || {}).map(([id, r]) => ({ id, meta: r.meta }));
  }

  function allLenses() {
    const present = new Set(allReports().flatMap((r) => r.meta.lens || []));
    // keep the canonical order, then anything new a report introduces
    return [
      ...LENS_ORDER.filter((l) => present.has(l)),
      ...[...present].filter((l) => !LENS_ORDER.includes(l)),
    ];
  }

  let activeLens = "all";

  function renderLibrary() {
    const reports = allReports();
    const lenses = allLenses();
    const shown =
      activeLens === "all" ? reports : reports.filter((r) => (r.meta.lens || []).includes(activeLens));

    const chips = ["all", ...lenses]
      .map(
        (l) =>
          `<button class="chip-filter${activeLens === l ? " active" : ""}" data-lens="${esc(l)}" type="button">${l === "all" ? "All lenses" : esc(l)}</button>`
      )
      .join("");

    const cards = shown
      .map(
        (r) => `
      <button class="report-card" data-open="${esc(r.id)}" type="button">
        <span class="rc-topic">${esc(r.meta.topic)} · ${r.meta.year}</span>
        <span class="rc-title">${esc(r.meta.title)}</span>
        <span class="rc-sub">${esc(r.meta.subtitle)}</span>
        <span class="rc-lenses">${(r.meta.lens || []).map((l) => `<span class="rc-lens">${esc(l)}</span>`).join("")}</span>
      </button>`
      )
      .join("");

    const empty = shown.length
      ? ""
      : `<p class="block-sub">No report in the library carries that lens yet.</p>`;

    return `
      <header class="report-head">
        <p class="eyebrow">Pew Infographics</p>
        <h1>A curated library of Pew Research reports</h1>
        <p class="report-sub">Browse by the lens the data is cut along — generation, religion, country, politics — and open any report as a full infographic.</p>
      </header>
      <main>
        <div class="filter-row">${chips}</div>
        <div class="report-grid">${cards}</div>
        ${empty}
        <p class="library-note">The lens filters are derived from the reports themselves: register a new report with a <code>lens</code> and it becomes filterable here automatically. Lenses with no report yet — race &amp; ethnicity, gender, education &amp; income — are not shown rather than shown empty.</p>
      </main>`;
  }

  // ───────── Report view ─────────

  function renderReport(id) {
    const report = window.PEW_REPORTS[id];
    if (!report) return `<section class="block"><p class="block-sub">Report “${esc(id)}” is not loaded.</p></section>`;
    const m = report.meta;

    const head = `
      <header class="report-head">
        <button class="back-link" type="button" data-back>&larr; All reports</button>
        <p class="eyebrow">${esc(m.publisher)} · ${esc(m.published)}</p>
        <h1>${esc(m.title)}</h1>
        <p class="report-sub">${esc(m.subtitle)}</p>
        <div class="report-meta"><span>${esc(m.method)}</span></div>
        <p class="provenance">
          <strong>On this data:</strong> ${esc(m.completeness)}
          Every figure carries its source in the data table beneath its chart; a figure stated only in words is shown with a “~”.
          Read the full report at <a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener">${esc(m.publisher)}</a>.
        </p>
      </header>`;

    const body = report.blocks.map((b) => (RENDERERS[b.type] ? RENDERERS[b.type](b) : "")).join("");
    return head + `<main>${body}</main>`;
  }

  // ───────── Routing ─────────

  const root = document.getElementById("report");

  function show(view, id) {
    root.innerHTML = view === "report" ? renderReport(id) : renderLibrary();
    document.title =
      view === "report" && window.PEW_REPORTS[id]
        ? `${window.PEW_REPORTS[id].meta.title} — Pew Infographics`
        : "Pew Infographics — a curated library";
    window.scrollTo(0, 0);
  }

  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) return show("report", open.getAttribute("data-open"));

    if (e.target.closest("[data-back]")) return show("library");

    const lens = e.target.closest("[data-lens]");
    if (lens) {
      activeLens = lens.getAttribute("data-lens");
      return show("library");
    }

    const btn = e.target.closest("[data-table-toggle]");
    if (btn) {
      const table = document.getElementById(btn.getAttribute("data-table-toggle"));
      if (!table) return;
      const showing = !table.hidden;
      table.hidden = showing;
      btn.setAttribute("aria-expanded", String(!showing));
      btn.textContent = showing ? "Show data table" : "Hide data table";
    }
  });

  // Theme toggle — an explicit stamp that beats the OS setting either way.
  const themeBtn = document.getElementById("themeBtn");
  themeBtn.addEventListener("click", () => {
    const current =
      document.documentElement.getAttribute("data-theme") ||
      (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    themeBtn.textContent = next === "dark" ? "Light mode" : "Dark mode";
  });

  show("library");
})();
