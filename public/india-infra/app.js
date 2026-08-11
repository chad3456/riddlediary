// India Infrastructure Explorer.
//
// Reads window.INFRA_DATA, produced by scripts/build_infra.py. Shape:
//   meta:       { built_at, population_sources: [...] }
//   countries:  { ISO3: { name, population: { year: n } } }
//   indicators: [ { id, name, category, unit, per_capita_basis, definition_note,
//                   sources: [{publisher,url,detail}], quality: {score, tier,
//                   corroborating_sources, completeness, freshness, last_updated,
//                   break_years: [] },
//                  series: { ISO3: { year: value } } } ]
//
// Nothing is computed here that isn't in that file, except the per-capita
// normalisation, which divides by the population stored alongside — so a
// normalised figure is always reconstructible from what ships.

(function () {
  "use strict";

  const D = window.INFRA_DATA;
  const SLOTS = ["--s1", "--s2", "--s3", "--s4", "--s5", "--s6", "--s7", "--s8"];
  const MAX_SERIES = 8; // token ceiling; past this, hues stop being distinguishable

  const esc = (s) =>
    String(s).replace(/[&<>"']/g, (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
    );

  const fmt = (v) => {
    if (v === null || v === undefined || Number.isNaN(v)) return "—";
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(2) + "B";
    if (a >= 1e6) return (v / 1e6).toFixed(2) + "M";
    if (a >= 1e4) return Math.round(v).toLocaleString("en-US");
    if (a >= 100) return v.toFixed(0);
    if (a >= 1) return v.toFixed(1);
    return v.toFixed(2);
  };

  const chartPanel = document.getElementById("chartPanel");
  const metaPanel = document.getElementById("metaPanel");
  const indList = document.getElementById("indList");
  const indSearch = document.getElementById("indSearch");

  // ───────── Empty state ─────────

  if (!D || !D.indicators || !D.indicators.length) {
    document.getElementById("pickerPanel").innerHTML =
      '<p class="panel-title">Indicator</p><p class="empty">No indicators loaded.</p>';
    chartPanel.innerHTML =
      '<div class="empty"><strong>No dataset built yet.</strong><br>' +
      "Run <code>python3 scripts/build_infra.py</code> to generate <code>data.js</code> " +
      "from the vendored sources in <code>data/infra/</code>.</div>";
    metaPanel.style.display = "none";
    wireTheme();
    return;
  }

  // ───────── State ─────────

  let currentId = D.indicators[0].id;
  let selected = ["IND"]; // ISO3 codes on the chart, in add order — colour follows entity, never rank
  let mode = "value"; // value | per_million | per_capita
  let filterText = "";

  const byId = Object.fromEntries(D.indicators.map((i) => [i.id, i]));
  const colorOf = (iso) => `var(${SLOTS[selected.indexOf(iso) % SLOTS.length]})`;

  // ───────── Indicator picker ─────────

  function renderPicker() {
    const q = filterText.trim().toLowerCase();
    const list = D.indicators.filter(
      (i) =>
        !q ||
        i.name.toLowerCase().includes(q) ||
        i.category.toLowerCase().includes(q) ||
        (i.unit || "").toLowerCase().includes(q)
    );
    const groups = {};
    list.forEach((i) => (groups[i.category] = groups[i.category] || []).push(i));

    indList.innerHTML = Object.keys(groups).length
      ? Object.entries(groups)
          .map(
            ([cat, items]) =>
              `<div class="ind-cat">${esc(cat)}</div>` +
              items
                .map(
                  (i) =>
                    `<button class="ind-btn${i.id === currentId ? " active" : ""}" data-ind="${esc(i.id)}">` +
                    `${esc(i.name)}<span class="ind-unit">${esc(i.unit || "")}</span></button>`
                )
                .join("")
          )
          .join("")
      : '<p class="empty" style="padding:20px 6px">No indicator matches that search.</p>';
  }

  indSearch.addEventListener("input", (e) => {
    filterText = e.target.value;
    renderPicker();
  });

  indList.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ind]");
    if (!b) return;
    currentId = b.getAttribute("data-ind");
    renderPicker();
    render();
  });

  // ───────── Value access ─────────

  // Per-capita is derived here, but only from the population that ships in the
  // same file — so any normalised number can be checked against its raw input.
  function valueAt(ind, iso, year) {
    const raw = ((ind.series || {})[iso] || {})[year];
    if (typeof raw !== "number") return null;
    if (mode === "value") return raw;
    const pop = ((D.countries[iso] || {}).population || {})[year];
    if (typeof pop !== "number" || !pop) return null;
    return mode === "per_million" ? (raw / pop) * 1e6 : raw / pop;
  }

  // A per-capita view of something already expressed as a share or a rate would
  // be meaningless, so those indicators only offer their native unit.
  function modesFor(ind) {
    const b = (ind.per_capita_basis || "").toLowerCase();
    const alreadyNormalised = b.includes("%") || b.includes("per ") || b.includes("rate") || b.includes("share");
    return alreadyNormalised ? ["value"] : ["value", "per_million", "per_capita"];
  }

  function unitLabel(ind) {
    if (mode === "per_million") return (ind.unit || "units") + " per million people";
    if (mode === "per_capita") return (ind.unit || "units") + " per person";
    return ind.unit || "";
  }

  // ───────── Chart ─────────

  function render() {
    const ind = byId[currentId];
    if (!ind) return;

    const allowed = modesFor(ind);
    if (!allowed.includes(mode)) mode = "value";

    const years = [
      ...new Set(
        selected.flatMap((iso) => Object.keys((ind.series || {})[iso] || {}).map(Number))
      ),
    ].sort((a, b) => a - b);

    const points = {};
    selected.forEach((iso) => {
      points[iso] = years
        .map((y) => ({ y, v: valueAt(ind, iso, y) }))
        .filter((p) => p.v !== null);
    });

    const withData = selected.filter((iso) => points[iso].length);
    const allVals = withData.flatMap((iso) => points[iso].map((p) => p.v));

    const modeBtns = allowed
      .map(
        (m) =>
          `<button data-mode="${m}" class="${m === mode ? "active" : ""}">${
            m === "value" ? "Total" : m === "per_million" ? "Per million" : "Per person"
          }</button>`
      )
      .join("");

    chartPanel.innerHTML = `
      <div class="chart-head">
        <div>
          <h1 class="chart-title">${esc(ind.name)}</h1>
          <p class="chart-sub">${esc(ind.definition_note || "")}</p>
        </div>
      </div>
      <div class="toolbar">
        ${allowed.length > 1 ? `<div class="seg">${modeBtns}</div>` : ""}
        <span style="font-size:12px;color:var(--text-muted)">${esc(unitLabel(ind))}</span>
      </div>
      <div class="chart-wrap">
        ${
          allVals.length
            ? svgFor(points, withData, years, allVals)
            : '<div class="empty">No data for the selected countries on this indicator.</div>'
        }
        <div class="tip" id="tip" hidden></div>
      </div>
      <div class="legend" id="legend"></div>
      <button class="table-toggle" data-table type="button" aria-expanded="false">Show data table</button>
      <div class="table-scroll" id="tableWrap" hidden></div>
    `;

    renderLegend();
    renderMeta(ind);
    wireChart(points, withData, years);
    buildTable(ind, years);
  }

  function svgFor(points, withData, years, allVals) {
    const W = 860, H = 380, L = 62, R = 118, T = 18, B = 40;
    const pw = W - L - R, ph = H - T - B;
    const y0 = Math.min(0, Math.min(...allVals));
    const y1 = Math.max(...allVals);
    const pad = (y1 - y0) * 0.08 || 1;
    const lo = y0 === 0 ? 0 : y0 - pad;
    const hi = y1 + pad;
    const x0 = years[0], x1 = years[years.length - 1];

    const X = (y) => L + (x1 === x0 ? pw / 2 : ((y - x0) / (x1 - x0)) * pw);
    const Y = (v) => T + ph - ((v - lo) / (hi - lo || 1)) * ph;

    const ticks = 5;
    const grid = Array.from({ length: ticks }, (_, i) => {
      const v = lo + ((hi - lo) * i) / (ticks - 1);
      const y = Y(v);
      return `<line class="grid" x1="${L}" y1="${y.toFixed(1)}" x2="${L + pw}" y2="${y.toFixed(1)}"/>
              <text class="tick" x="${L - 9}" y="${(y + 3.5).toFixed(1)}" text-anchor="end">${fmt(v)}</text>`;
    }).join("");

    const span = x1 - x0;
    const step = span <= 10 ? 2 : span <= 24 ? 5 : 10;
    const xticks = years
      .filter((y) => y % step === 0 || y === x0 || y === x1)
      .map(
        (y) =>
          `<text class="tick" x="${X(y).toFixed(1)}" y="${H - 14}" text-anchor="middle">${y}</text>`
      )
      .join("");

    const lines = withData
      .map((iso) => {
        const d = points[iso]
          .map((p, i) => `${i ? "L" : "M"}${X(p.y).toFixed(1)},${Y(p.v).toFixed(1)}`)
          .join(" ");
        return `<path class="ser" d="${d}" stroke="${colorOf(iso)}" data-iso="${esc(iso)}"/>`;
      })
      .join("");

    // Direct end-labels — also the "relief" the palette validator requires for
    // the light-mode slots that sit under 3:1 contrast.
    const ends = withData
      .map((iso) => {
        const p = points[iso][points[iso].length - 1];
        return `<circle class="dot" cx="${X(p.y).toFixed(1)}" cy="${Y(p.v).toFixed(1)}" r="4.5" fill="${colorOf(iso)}"/>
                <text class="endlab" x="${(X(p.y) + 9).toFixed(1)}" y="${(Y(p.v) + 4).toFixed(1)}">${esc(
                  (D.countries[iso] || {}).name || iso
                )}</text>`;
      })
      .join("");

    return `<svg class="linechart" id="chart" viewBox="0 0 ${W} ${H}" role="img"
                 aria-label="${esc(byId[currentId].name)} over time">
      ${grid}
      <line class="axis-rule" x1="${L}" y1="${T + ph}" x2="${L + pw}" y2="${T + ph}"/>
      ${xticks}
      <g id="cross"></g>
      ${lines}
      ${ends}
    </svg>`;
  }

  function wireChart(points, withData, years) {
    const svg = document.getElementById("chart");
    if (!svg) return;
    const tip = document.getElementById("tip");
    const cross = document.getElementById("cross");
    const W = 860, L = 62, R = 118, T = 18, B = 40, H = 380;
    const pw = W - L - R, ph = H - T - B;
    const x0 = years[0], x1 = years[years.length - 1];

    svg.addEventListener("mousemove", (e) => {
      const r = svg.getBoundingClientRect();
      const sx = ((e.clientX - r.left) / r.width) * W;
      if (sx < L || sx > L + pw) return hide();
      const frac = (sx - L) / pw;
      const yr = Math.round(x0 + frac * (x1 - x0));

      const rows = withData
        .map((iso) => ({ iso, p: points[iso].find((p) => p.y === yr) }))
        .filter((r2) => r2.p);
      if (!rows.length) return hide();

      const cx = L + ((yr - x0) / (x1 - x0 || 1)) * pw;
      cross.innerHTML = `<line class="crosshair" x1="${cx.toFixed(1)}" y1="${T}" x2="${cx.toFixed(1)}" y2="${T + ph}"/>`;

      tip.innerHTML =
        `<div class="tip-year">${yr}</div>` +
        rows
          .map(
            (r2) =>
              `<div class="tip-row"><span class="k"><span class="tip-sw" style="background:${colorOf(
                r2.iso
              )}"></span>${esc((D.countries[r2.iso] || {}).name || r2.iso)}</span>` +
              `<span class="v">${fmt(r2.p.v)}</span></div>`
          )
          .join("");
      tip.hidden = false;
      const wrap = svg.parentElement.getBoundingClientRect();
      const px = ((cx / W) * r.width) + (r.left - wrap.left);
      tip.style.left = Math.min(px + 14, wrap.width - tip.offsetWidth - 8) + "px";
      tip.style.top = "16px";
    });

    svg.addEventListener("mouseleave", hide);
    function hide() {
      tip.hidden = true;
      cross.innerHTML = "";
    }
  }

  // ───────── Legend / country picker ─────────

  function renderLegend() {
    const el = document.getElementById("legend");
    if (!el) return;
    el.innerHTML =
      selected
        .map(
          (iso) =>
            `<span class="chip"><span class="sw" style="background:${colorOf(iso)}"></span>` +
            `${esc((D.countries[iso] || {}).name || iso)}` +
            (selected.length > 1 ? `<button data-drop="${esc(iso)}" aria-label="Remove">×</button>` : "") +
            `</span>`
        )
        .join("") +
      (selected.length < MAX_SERIES
        ? `<span class="chip add" id="addCountry">+ Add country</span>`
        : `<span class="chip" style="border:none;color:var(--text-muted)">max ${MAX_SERIES}</span>`);
  }

  document.addEventListener("click", (e) => {
    const drop = e.target.closest("[data-drop]");
    if (drop) {
      selected = selected.filter((s) => s !== drop.getAttribute("data-drop"));
      return render();
    }

    const mb = e.target.closest("[data-mode]");
    if (mb) {
      mode = mb.getAttribute("data-mode");
      return render();
    }

    const tt = e.target.closest("[data-table]");
    if (tt) {
      const w = document.getElementById("tableWrap");
      const showing = !w.hidden;
      w.hidden = showing;
      tt.setAttribute("aria-expanded", String(!showing));
      tt.textContent = showing ? "Show data table" : "Hide data table";
      return;
    }

    if (e.target.closest("#addCountry")) return openCountryPicker(e.target.closest("#addCountry"));

    const pick = e.target.closest("[data-pick]");
    if (pick) {
      const iso = pick.getAttribute("data-pick");
      if (!selected.includes(iso) && selected.length < MAX_SERIES) selected.push(iso);
      closePop();
      return render();
    }

    if (!e.target.closest(".country-pop")) closePop();
  });

  function closePop() {
    const p = document.querySelector(".country-pop");
    if (p) p.remove();
  }

  function openCountryPicker(anchor) {
    closePop();
    const ind = byId[currentId];
    // Only countries this indicator actually has data for — offering the rest
    // would promise a comparison the data can't deliver.
    const avail = Object.keys(D.countries)
      .filter((iso) => Object.keys((ind.series || {})[iso] || {}).length)
      .sort((a, b) => (D.countries[a].name || a).localeCompare(D.countries[b].name || b));

    const pop = document.createElement("div");
    pop.className = "country-pop";
    pop.innerHTML =
      `<input class="search" id="cSearch" placeholder="Search ${avail.length} countries…" aria-label="Search countries" />` +
      `<div class="country-list" id="cList"></div>`;
    document.body.appendChild(pop);
    const r = anchor.getBoundingClientRect();
    pop.style.left = Math.min(r.left + window.scrollX, window.innerWidth - 276) + "px";
    pop.style.top = r.bottom + window.scrollY + 6 + "px";

    const list = pop.querySelector("#cList");
    const paint = (q) => {
      list.innerHTML = avail
        .filter((iso) => !q || (D.countries[iso].name || iso).toLowerCase().includes(q))
        .slice(0, 300)
        .map(
          (iso) =>
            `<button data-pick="${esc(iso)}"${selected.includes(iso) ? " disabled" : ""}>${esc(
              D.countries[iso].name || iso
            )}</button>`
        )
        .join("");
    };
    paint("");
    const s = pop.querySelector("#cSearch");
    s.addEventListener("input", () => paint(s.value.trim().toLowerCase()));
    s.focus();
  }

  // ───────── Table ─────────

  function buildTable(ind, years) {
    const w = document.getElementById("tableWrap");
    if (!w) return;
    w.innerHTML =
      `<table class="dtable"><thead><tr><th>Year</th>` +
      selected.map((iso) => `<th class="num">${esc((D.countries[iso] || {}).name || iso)}</th>`).join("") +
      `</tr></thead><tbody>` +
      years
        .map(
          (y) =>
            `<tr><td>${y}</td>` +
            selected
              .map((iso) => {
                const v = valueAt(ind, iso, y);
                return `<td class="num">${v === null ? "—" : fmt(v)}</td>`;
              })
              .join("") +
            `</tr>`
        )
        .join("") +
      `</tbody></table>`;
  }

  // ───────── Quality + sources ─────────

  function renderMeta(ind) {
    const q = ind.quality || {};
    const score = typeof q.score === "number" ? q.score : null;
    const scoreColor =
      score === null ? "var(--deemph)" : score >= 75 ? "var(--good)" : score >= 50 ? "var(--warn)" : "var(--bad)";
    // tolerate freshness arriving as a string or as an object with .state
    const freshRaw = q.freshness && typeof q.freshness === "object" ? q.freshness.state : q.freshness;
    const fresh = String(freshRaw || "unknown").toLowerCase();
    const badge = fresh === "blocked" ? "blocked" : fresh === "stale" || fresh === "due" ? "stale" : "fresh";

    metaPanel.innerHTML = `
      <p class="panel-title">Data quality &amp; provenance</p>
      <div class="meta-grid">
        <div class="meta-cell">
          <div class="meta-k">Quality score</div>
          <div class="meta-v">${score === null ? "—" : score + " / 100"}</div>
          <div class="score-bar"><div class="score-fill" style="width:${score || 0}%;background:${scoreColor}"></div></div>
          <div class="meta-note">${esc(q.tier || "provenance tier not recorded")}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-k">Freshness</div>
          <div class="meta-v"><span class="badge ${badge}">${esc(freshRaw || "unknown")}</span></div>
          <div class="meta-note">${esc(q.last_updated ? "Last updated " + q.last_updated : "No update timestamp")}</div>
        </div>
        <div class="meta-cell">
          <div class="meta-k">Corroboration</div>
          <div class="meta-v">${q.corroborating_sources ?? "—"}</div>
          <div class="meta-note">independent sources agreeing</div>
        </div>
        <div class="meta-cell">
          <div class="meta-k">Completeness</div>
          <div class="meta-v">${q.completeness != null ? Math.round(q.completeness * 100) + "%" : "—"}</div>
          <div class="meta-note">of expected years present</div>
        </div>
      </div>
      ${
        (q.break_years || []).length
          ? `<p class="meta-note" style="margin-top:12px"><strong>Series break:</strong> definition or methodology changed in ${q.break_years.join(
              ", "
            )}. Values either side are not strictly comparable.</p>`
          : ""
      }
      <p class="panel-title" style="margin-top:20px">Sources</p>
      <ul class="src-list">
        ${(ind.sources || [])
          .map(
            (s) =>
              `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)}</a>` +
              `<span class="d">${esc(s.detail || "")}</span></li>`
          )
          .join("") || '<li><span class="d">No source recorded.</span></li>'}
        ${(D.meta && D.meta.population_sources ? D.meta.population_sources : [])
          .map(
            (s) =>
              `<li><a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.publisher)}</a>` +
              `<span class="d">Population denominator for per-capita and per-million views. ${esc(
                s.detail || ""
              )}</span></li>`
          )
          .join("")}
      </ul>`;
  }

  // ───────── Theme ─────────

  function wireTheme() {
    const btn = document.getElementById("themeBtn");
    btn.addEventListener("click", () => {
      const cur =
        document.documentElement.getAttribute("data-theme") ||
        (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      const next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      btn.textContent = next === "dark" ? "Light mode" : "Dark mode";
    });
  }

  renderPicker();
  render();
  wireTheme();
})();
