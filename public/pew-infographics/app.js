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

  // Thousands-separated, so a 7-digit case count never renders as 2975711.
  // Values below 10,000 keep their decimals (crime *rates* live in that range).
  const fmtNum = (v) =>
    Math.abs(v) >= 10000 ? Math.round(v).toLocaleString("en-US") : String(v);

  // Compact form for chart labels, where a full 9-character number collides.
  const fmtCompact = (v) => {
    const a = Math.abs(v);
    if (a >= 1e6) return `${(v / 1e6).toFixed(2)}M`;
    if (a >= 1e4) return `${Math.round(v / 1e3)}k`;
    return String(v);
  };

  // "~30%" for figures the source stated only in words ("roughly three-in-ten").
  const fmt = (d, unit) => `${d.approx ? "~" : ""}${fmtNum(d.value)}${unit || ""}`;

  let uid = 0;
  const nextId = () => `viz-${++uid}`;

  // ───────── Block renderers ─────────

  function renderHero(b) {
    return `
      <section class="hero">
        <div class="hero-value">${esc(b.value)}</div>
        <div class="hero-label">${esc(b.label)}</div>
        ${b.note ? `<p class="hero-note">${md(b.note)}</p>` : ""}
      </section>`;
  }

  function renderStats(b) {
    const tiles = b.items
      .map(
        (it) => `
        <div class="stat">
          <div class="stat-value">${esc(it.value)}</div>
          <div class="stat-label">${esc(it.label)}</div>
          ${it.note ? `<p class="stat-note">${md(it.note)}</p>` : ""}
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
           <text x="${PAD_L - 8}" y="${(y(t) + 4).toFixed(1)}" class="axis-text" text-anchor="end">${fmtCompact(t)}</text>`
      )
      .join("");

    const path = b.data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.value).toFixed(1)}`).join(" ");

    const dots = b.data
      .map(
        (d, i) =>
          `<circle cx="${x(i).toFixed(1)}" cy="${y(d.value).toFixed(1)}" r="5" class="dot"><title>${esc(d.label)}: ${fmtNum(d.value)}${esc(b.unit || "")}</title></circle>`
      )
      .join("");

    const xLabels = b.data
      .map(
        (d, i) =>
          `<text x="${x(i).toFixed(1)}" y="${H - 8}" class="axis-text" text-anchor="middle">${esc(d.label)}</text>`
      )
      .join("");

    const last = b.data[b.data.length - 1];
    const endLabel = `<text x="${(x(b.data.length - 1) + 12).toFixed(1)}" y="${(y(last.value) + 4).toFixed(1)}" class="end-label">${fmtCompact(last.value)}${esc(b.unit || "")}</text>`;

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
          ["Wave", "Value", "Source"],
          b.data.map((d) => [d.label, `${fmtNum(d.value)}${b.unit || ""}`, d.src || b.src || "—"])
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
                  // unit defaults to "%" so survey reports keep their old shape;
                  // count-based reports pass unit: "" explicitly.
                  `<span class="chip"><span class="chip-k">${esc(f.k)}</span><span class="chip-v">${f.approx ? "~" : ""}${fmtNum(f.v)}${f.unit === undefined ? "%" : esc(f.unit)}</span></span>`
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
        <p class="cov-count"><strong>${sourced}</strong> of <strong>${b.data.length}</strong> ${esc(b.unitLabel || "countries")} have at least one sourced figure.</p>
        <table class="coverage-table">
          <thead><tr><th>${esc(b.columns[0])}</th><th>${esc(b.columns[1])}</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
      </section>`;
  }

  // Choropleth. Magnitude across an ordered domain → sequential, one hue,
  // light→dark, with a scale legend and a distinct (non-ramp) no-data tone.
  // Bins are computed once over ALL years so a colour means the same thing in
  // 2001 as in 2015 — re-binning per year would make the animation lie.
  const RAMP = ["#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#104281"];

  function renderMap(b) {
    const M = window.INDIA_CRIME_MAP;
    if (!M) return "";
    const tableId = nextId();
    const mapId = nextId();
    const heads = M.meta.heads;
    const years = M.meta.years;

    const headOpts = heads
      .map(
        (h, i) =>
          `<option value="${esc(h)}"${i === heads.indexOf("murder") ? " selected" : ""}>${esc(M.meta.labels[h] || h)}</option>`
      )
      .join("");

    return `
      <section class="block" data-map="${mapId}">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}

        <div class="map-controls">
          <label class="mc-field">
            <span class="mc-label">Crime</span>
            <select class="control" data-map-head>${headOpts}</select>
          </label>
          <label class="mc-field mc-grow">
            <span class="mc-label">Year <strong data-map-year>${years[years.length - 1]}</strong></span>
            <input class="mc-slider" type="range" data-map-slider
                   min="0" max="${years.length - 1}" value="${years.length - 1}" step="1"
                   aria-label="Year" />
          </label>
          <button class="control" data-map-play type="button">▶ Play</button>
        </div>
        <p class="map-range" data-map-gaps></p>

        <div class="map-wrap">
          <svg class="india-map" data-map-svg viewBox="0 0 100 100" role="img"
               aria-label="Choropleth of recorded crime by state"></svg>
          <div class="map-tip" data-map-tip hidden></div>
        </div>

        <div class="map-legend" data-map-legend></div>

        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
        ${tableToggle(tableId)}
        <table class="data-table" id="${tableId}" hidden>
          <thead><tr><th>State / UT</th><th class="num">Cases</th><th>Year</th></tr></thead>
          <tbody data-map-tbody></tbody>
        </table>
      </section>`;
  }

  // Wire every map block on the page after its HTML is in the DOM.
  function initMaps() {
    const M = window.INDIA_CRIME_MAP;
    if (!M) return;

    document.querySelectorAll("[data-map]").forEach((root) => {
      const svg = root.querySelector("[data-map-svg]");
      const tip = root.querySelector("[data-map-tip]");
      const legendEl = root.querySelector("[data-map-legend]");
      const slider = root.querySelector("[data-map-slider]");
      const yearEl = root.querySelector("[data-map-year]");
      const headSel = root.querySelector("[data-map-head]");
      const playBtn = root.querySelector("[data-map-play]");
      const gapEl = root.querySelector("[data-map-gaps]");
      const tbody = root.querySelector("[data-map-tbody]");
      const years = M.meta.years;

      // Equirectangular, x scaled by cos(mean latitude) so India isn't stretched.
      let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
      Object.values(M.shapes).forEach((rings) =>
        rings.forEach((r) =>
          r.forEach(([lon, lat]) => {
            if (lon < minX) minX = lon;
            if (lon > maxX) maxX = lon;
            if (lat < minY) minY = lat;
            if (lat > maxY) maxY = lat;
          })
        )
      );
      const kx = Math.cos((((minY + maxY) / 2) * Math.PI) / 180);
      const w = (maxX - minX) * kx;
      const h = maxY - minY;
      const PAD = 2;
      const scale = (100 - PAD * 2) / Math.max(w, h);
      const offX = PAD + ((100 - PAD * 2) - w * scale) / 2;
      const offY = PAD + ((100 - PAD * 2) - h * scale) / 2;
      const px = (lon) => offX + (lon - minX) * kx * scale;
      const py = (lat) => offY + (maxY - lat) * scale;

      svg.setAttribute("viewBox", `0 0 100 ${100}`);

      // Build the paths once; only fills change on year/head switches.
      const groups = Object.entries(M.shapes)
        .map(([state, rings]) => {
          const d = rings
            .map((r) => "M" + r.map(([lo, la]) => `${px(lo).toFixed(2)},${py(la).toFixed(2)}`).join("L") + "Z")
            .join(" ");
          return `<path class="state-path" data-state="${esc(state)}" d="${d}"></path>`;
        })
        .join("");
      svg.innerHTML = groups;

      // Each head reports its own years — the source sheets disagree about
      // which crimes they carry, so the slider is rebuilt per head rather than
      // offering years that would silently read as zero.
      const yearsFor = (head) => (M.meta.headYears && M.meta.headYears[head]) || years;

      function valuesFor(head) {
        const out = [];
        yearsFor(head).forEach((y) => {
          Object.keys(M.series).forEach((st) => {
            const v = (M.series[st][String(y)] || {})[head];
            if (typeof v === "number") out.push(v);
          });
        });
        return out.sort((a, b2) => a - b2);
      }

      // Quantile bin edges over the pooled multi-year distribution. Counts are
      // heavily right-skewed (UP and MP dwarf the small UTs), so equal-width
      // bins would put almost every state in the lightest class.
      function binsFor(head) {
        const vals = valuesFor(head).filter((v) => v > 0);
        if (!vals.length) return [];
        const q = (p) => vals[Math.min(vals.length - 1, Math.floor(p * vals.length))];
        const edges = [q(0.2), q(0.4), q(0.6), q(0.8), q(0.93)];
        return edges.filter((e, i) => i === 0 || e > edges[i - 1]);
      }

      let bins = [];
      const colorFor = (v) => {
        if (typeof v !== "number") return null;
        let i = 0;
        while (i < bins.length && v > bins[i]) i++;
        return RAMP[Math.min(i, RAMP.length - 1)];
      };

      function drawLegend(head) {
        const label = M.meta.labels[head] || head;
        const swatches = RAMP.map((c, i) => {
          const lo = i === 0 ? 0 : bins[i - 1];
          const hi = i < bins.length ? bins[i] : null;
          const txt = hi === null ? `${fmtNum(lo)}+` : `${fmtNum(lo)}–${fmtNum(hi)}`;
          return `<span class="lg-item"><span class="lg-sw" style="background:${c}"></span>${txt}</span>`;
        }).join("");
        legendEl.innerHTML =
          `<span class="lg-title">${esc(label)} — cases recorded</span>` +
          `<span class="lg-scale">${swatches}` +
          `<span class="lg-item"><span class="lg-sw lg-nodata"></span>no data</span></span>`;
      }

      // States created part-way through the series. Before a split, the
      // territory's crime was reported under the parent, so the parent's
      // figure is what covers that ground — shade it as such and say so in the
      // tooltip, rather than leaving a hole that reads as "no crime here".
      const PARENT_OF = {
        Telangana: "Andhra Pradesh",
        Ladakh: "Jammu and Kashmir",
      };

      function lookup(state, year, head) {
        const own = ((M.series[state] || {})[String(year)] || {})[head];
        if (typeof own === "number") return { value: own, via: null };
        const parent = PARENT_OF[state];
        if (parent) {
          const pv = ((M.series[parent] || {})[String(year)] || {})[head];
          if (typeof pv === "number") return { value: pv, via: parent };
        }
        return { value: null, via: null };
      }

      function paint() {
        const head = headSel.value;
        const ys = yearsFor(head);
        const year = ys[Math.min(Number(slider.value), ys.length - 1)];
        yearEl.textContent = year;

        const rows = [];
        svg.querySelectorAll(".state-path").forEach((p) => {
          const st = p.getAttribute("data-state");
          const { value, via } = lookup(st, year, head);
          p.style.fill = colorFor(value) || "var(--map-nodata)";
          // stroke matches fill so districts of one state merge into a solid
          // shape — the data is state-level, so a district mesh would imply a
          // resolution this map does not have
          p.style.stroke = p.style.fill;
          p.setAttribute("data-value", value === null ? "" : value);
          p.setAttribute("data-via", via || "");
          // Only the state's own reported figure enters the table, so a parent
          // value is never counted twice in the ranking.
          if (typeof value === "number" && !via) rows.push([st, value]);
        });

        rows.sort((a, b2) => b2[1] - a[1]);
        tbody.innerHTML = rows
          .map(
            ([st, v]) =>
              `<tr><td>${esc(st)}</td><td class="num">${fmtNum(v)}</td><td>${year}</td></tr>`
          )
          .join("");
      }

      function rebin() {
        const head = headSel.value;
        const ys = yearsFor(head);
        const prev = Number(slider.value);
        slider.max = String(ys.length - 1);
        slider.value = String(Math.min(prev, ys.length - 1));
        bins = binsFor(head);
        drawLegend(head);
        // Name any year the source skips for this head, so a jump in the
        // slider is explained rather than looking like missing years.
        const gaps = [];
        for (let y = ys[0]; y <= ys[ys.length - 1]; y++) if (!ys.includes(y)) gaps.push(y);
        gapEl.textContent = gaps.length
          ? `${ys[0]}\u2013${ys[ys.length - 1]}, except ${gaps.join(", ")} \u2014 not reported for this crime`
          : `${ys[0]}\u2013${ys[ys.length - 1]}`;
        paint();
      }

      // hover / focus
      svg.addEventListener("mousemove", (e) => {
        const p = e.target.closest(".state-path");
        if (!p) {
          tip.hidden = true;
          svg.querySelectorAll(".is-hover").forEach((n) => n.classList.remove("is-hover"));
          return;
        }
        svg.querySelectorAll(".is-hover").forEach((n) => n.classList.remove("is-hover"));
        p.classList.add("is-hover");
        const v = p.getAttribute("data-value");
        const via = p.getAttribute("data-via");
        const label = M.meta.labels[headSel.value] || headSel.value;
        const ysT = yearsFor(headSel.value);
        const yr = ysT[Math.min(Number(slider.value), ysT.length - 1)];
        tip.innerHTML =
          `<strong>${esc(p.getAttribute("data-state"))}</strong>` +
          `<span>${label}, ${yr}: ${v === "" ? "no data" : fmtNum(Number(v))}</span>` +
          (via ? `<span class="tip-via">reported under ${esc(via)} in ${yr}</span>` : "");
        const r = svg.getBoundingClientRect();
        tip.style.left = `${e.clientX - r.left + 14}px`;
        tip.style.top = `${e.clientY - r.top + 14}px`;
        tip.hidden = false;
      });
      svg.addEventListener("mouseleave", () => {
        tip.hidden = true;
        svg.querySelectorAll(".is-hover").forEach((n) => n.classList.remove("is-hover"));
      });

      slider.addEventListener("input", paint);
      headSel.addEventListener("change", rebin);

      let timer = null;
      playBtn.addEventListener("click", () => {
        if (timer) {
          clearInterval(timer);
          timer = null;
          playBtn.textContent = "▶ Play";
          return;
        }
        playBtn.textContent = "❚❚ Pause";
        timer = setInterval(() => {
          const next = (Number(slider.value) + 1) % yearsFor(headSel.value).length;
          slider.value = String(next);
          paint();
        }, 850);
      });

      rebin();
    });
  }

  // Pipeline output vs independently published totals. The published column is
  // cited reference data, not pipeline output, and is labelled as such.
  function renderVerify(b) {
    const rows = b.rows
      .map(
        (r) => `
        <tr>
          <td>${esc(r.head.replace(/_/g, " "))}</td>
          <td>${r.year}</td>
          <td class="num">${fmtNum(r.pipeline)}</td>
          <td class="num">${fmtNum(r.published)}</td>
          <td class="num ${r.diff_pct === 0 ? "is-exact" : ""}">${
            r.diff_pct === 0 ? "exact" : r.diff_pct + "%"
          }</td>
          <td class="src"><a href="${esc(r.url)}" target="_blank" rel="noopener">${esc(r.cite)}</a></td>
        </tr>`
      )
      .join("");
    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        <div class="table-scroll">
          <table class="data-table verify-table">
            <thead><tr>
              <th>Crime</th><th>Year</th>
              <th class="num">This pipeline</th>
              <th class="num">NCRB published</th>
              <th class="num">Diff</th>
              <th>Published figure cited from</th>
            </tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
      </section>`;
  }

  function renderSources(b) {
    const groups = b.groups
      .map(
        (g) => `
        <div class="src-group">
          <h3 class="src-heading">${esc(g.heading)}</h3>
          <ul class="src-list">
            ${g.items
              .map(
                (it) => `
              <li class="src-item">
                <a href="${esc(it.url)}" target="_blank" rel="noopener">${esc(it.label)}</a>
                <span class="src-detail">${esc(it.detail)}</span>
              </li>`
              )
              .join("")}
          </ul>
        </div>`
      )
      .join("");
    return `
      <section class="block">
        <h2 class="block-title">${md(b.title)}</h2>
        ${b.subtitle ? `<p class="block-sub">${md(b.subtitle)}</p>` : ""}
        ${groups}
        ${b.note ? `<p class="block-note">${md(b.note)}</p>` : ""}
      </section>`;
  }

  function renderNotes(b) {
    const items = b.items
      .map(
        (it) => `
        <div class="note-item">
          <h3 class="note-heading">${esc(it.heading)}</h3>
          <p class="note-body">${md(it.body)}</p>
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
        <div class="bar-axis-ticks"><span>0</span><span>${fmtCompact(max)}${esc(unit || "")}</span></div>
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
    map: renderMap,
    verify: renderVerify,
    sources: renderSources,
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
    initMaps();
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
