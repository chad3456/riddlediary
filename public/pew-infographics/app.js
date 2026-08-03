// Pew Infographics — a generic renderer.
//
// Adding a report means dropping a file in reports/ that registers itself on
// window.PEW_REPORTS and listing it in REPORT_INDEX below. No renderer changes:
// every block type here is data-driven, and each chart block automatically
// gets a table-view twin so no value is reachable only by hovering.

(function () {
  "use strict";

  const REPORT_INDEX = [
    { id: "national-pride-2026", name: "What Makes People Proud of Their Country? (2026)" },
  ];

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  // *emphasis* → <em>, so report copy can mark a word without inlining HTML.
  const md = (s) => esc(s).replace(/\*([^*]+)\*/g, "<em>$1</em>");

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
        <div class="bar-row${emph}" title="${esc(d.label)}: ${d.value}${esc(b.unit || "")}">
          <div class="bar-label">${esc(d.label)}</div>
          <div class="bar-track">
            <div class="bar-fill" style="width:${pct.toFixed(1)}%"></div>
            <span class="bar-value">${d.value}${esc(b.unit || "")}</span>
          </div>
        </div>`;
      })
      .join("");

    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        <div class="chart">${rows}</div>
        <div class="bar-axis">
          <div></div>
          <div class="bar-axis-ticks"><span>0</span><span>${max}${esc(b.unit || "")}</span></div>
        </div>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        ${dataTable(tableId, ["Country", "Share", "Source"], b.data.map((d) => [d.label, `${d.value}${b.unit || ""}`, d.src || "—"]))}
      </section>`;
  }

  function renderCompare(b) {
    const max = b.max || Math.max(...b.data.flatMap((d) => b.series.map((s) => d[s.key])));
    const tableId = nextId();
    const colors = ["var(--series-2)", "var(--series-1)"]; // Republicans, Democrats

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
        <div class="bar-axis">
          <div></div>
          <div class="bar-axis-ticks"><span>0</span><span>${max}${esc(b.unit || "")}</span></div>
        </div>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        ${dataTable(
          tableId,
          ["Group", "Share", "Source"],
          b.data.flatMap((d) => b.series.map((s) => [s.name, `${d[s.key]}${b.unit || ""}`, d.src || "—"]))
        )}
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
    notes: renderNotes,
  };

  // ───────── Report rendering ─────────

  function renderReport(id) {
    const report = window.PEW_REPORTS[id];
    const root = document.getElementById("report");
    if (!report) {
      root.innerHTML = `<section class="block"><p class="block-sub">Report “${esc(id)}” is not loaded.</p></section>`;
      return;
    }
    const m = report.meta;

    const head = `
      <header class="report-head">
        <p class="eyebrow">${esc(m.publisher)} · ${esc(m.published)}</p>
        <h1>${esc(m.title)}</h1>
        <p class="report-sub">${esc(m.subtitle)}</p>
        <div class="report-meta">
          <span>${esc(m.method)}</span>
        </div>
        <p class="provenance">
          <strong>On this data:</strong> ${esc(m.completeness)}
          Every figure shown carries its source in the data table beneath its chart.
          Read the full report at <a href="${esc(m.sourceUrl)}" target="_blank" rel="noopener">${esc(m.publisher)}</a>.
        </p>
      </header>`;

    const body = report.blocks
      .map((b) => (RENDERERS[b.type] ? RENDERERS[b.type](b) : ""))
      .join("");

    root.innerHTML = head + `<main>${body}</main>`;
    document.title = `${m.title} — Pew Infographics`;
  }

  // ───────── Wiring ─────────

  const picker = document.getElementById("reportPicker");
  REPORT_INDEX.forEach((r) => {
    const opt = document.createElement("option");
    opt.value = r.id;
    opt.textContent = r.name;
    picker.appendChild(opt);
  });
  picker.addEventListener("change", () => renderReport(picker.value));

  // Table-view toggles (delegated — blocks are re-rendered on report switch).
  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-table-toggle]");
    if (!btn) return;
    const table = document.getElementById(btn.getAttribute("data-table-toggle"));
    if (!table) return;
    const showing = !table.hidden;
    table.hidden = showing;
    btn.setAttribute("aria-expanded", String(!showing));
    btn.textContent = showing ? "Show data table" : "Hide data table";
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

  renderReport(REPORT_INDEX[0].id);
})();
