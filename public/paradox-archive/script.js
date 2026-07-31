(function () {
  "use strict";

  const STORAGE_KEY = "paradoxArchive.answers.v1";
  const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));
  const caseById = Object.fromEntries(CASES.map((c) => [c.id, c]));

  let activeFilter = "all";
  let searchTerm = "";
  let currentCaseIndex = -1;

  const answers = loadAnswers();

  function loadAnswers() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveAnswers() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (e) {
      /* storage unavailable — dossier just won't persist across reloads */
    }
  }

  // ───────── Filters ─────────

  const filtersEl = document.getElementById("filters");

  function renderFilters() {
    const chips = [{ key: "all", label: "All cases", color: "#b8925a" }, ...CATEGORIES];
    filtersEl.innerHTML = "";
    chips.forEach((c) => {
      const btn = document.createElement("button");
      btn.className = "filter-chip" + (activeFilter === c.key ? " active" : "");
      btn.textContent = c.label;
      btn.style.setProperty("--accent", c.color);
      btn.addEventListener("click", () => {
        activeFilter = c.key;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  // ───────── Grid ─────────

  const gridEl = document.getElementById("grid");
  const emptyStateEl = document.getElementById("emptyState");

  function filteredCases() {
    const term = searchTerm.trim().toLowerCase();
    return CASES.filter((c) => {
      if (activeFilter !== "all" && c.cat !== activeFilter) return false;
      if (!term) return true;
      const haystack = (c.title + " " + c.thinker + " " + c.scenario + " " + c.question).toLowerCase();
      return haystack.includes(term);
    });
  }

  function renderGrid() {
    const list = filteredCases();
    gridEl.innerHTML = "";
    emptyStateEl.hidden = list.length > 0;
    list.forEach((c) => {
      const cat = catByKey[c.cat];
      const idx = CASES.indexOf(c);
      const card = document.createElement("article");
      card.className = "card";
      card.style.setProperty("--accent", cat.color);
      card.tabIndex = 0;
      const ruled = !!answers[c.id];
      card.innerHTML = `
        <div class="card-top">
          <span class="card-num">CASE No. ${String(idx + 1).padStart(2, "0")}</span>
          <span class="card-status${ruled ? " ruled" : ""}">${ruled ? "RULED" : "OPEN"}</span>
        </div>
        <span class="card-cat">${cat.label}</span>
        <h3>${c.title}</h3>
        <p class="card-thinker">${c.thinker}</p>
        <p class="card-teaser">${c.question}</p>
      `;
      const open = () => openCase(idx);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      gridEl.appendChild(card);
    });
  }

  document.getElementById("search").addEventListener("input", (e) => {
    searchTerm = e.target.value;
    renderGrid();
  });

  // ───────── Case overlay ─────────

  const overlay = document.getElementById("overlay");
  const cfTab = document.getElementById("cfTab");
  const cfNumber = document.getElementById("cfNumber");
  const cfTitle = document.getElementById("cfTitle");
  const cfThinker = document.getElementById("cfThinker");
  const cfScenario = document.getElementById("cfScenario");
  const cfQuestion = document.getElementById("cfQuestion");
  const cfChoices = document.getElementById("cfChoices");
  const cfResult = document.getElementById("cfResult");
  const cfBars = document.getElementById("cfBars");
  const cfNote = document.getElementById("cfNote");

  function openCase(index) {
    currentCaseIndex = index;
    const c = CASES[index];
    const cat = catByKey[c.cat];
    cfTab.style.setProperty("--accent", cat.color);
    cfNumber.textContent = `CASE No. ${String(index + 1).padStart(2, "0")} · ${cat.label.toUpperCase()}`;
    cfTitle.textContent = c.title;
    cfThinker.textContent = c.thinker;
    cfScenario.textContent = c.scenario;
    cfQuestion.textContent = c.question;

    const existing = answers[c.id];
    renderChoices(c, existing ? existing.choiceIndex : null);
    if (existing) {
      showResult(c, existing.choiceIndex);
    } else {
      cfResult.hidden = true;
    }

    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    cfTab.parentElement.scrollTop = 0;
  }

  function renderChoices(c, pickedIndex) {
    cfChoices.innerHTML = "";
    c.choices.forEach((choice, i) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn" + (pickedIndex === i ? " picked" : "");
      btn.textContent = choice.text;
      btn.disabled = pickedIndex !== null;
      if (pickedIndex === null) {
        btn.addEventListener("click", () => {
          answers[c.id] = { choiceIndex: i, tag: choice.tag };
          saveAnswers();
          renderChoices(c, i);
          showResult(c, i);
          renderGrid();
          updateDossierCount();
        });
      }
      cfChoices.appendChild(btn);
    });
  }

  function showResult(c, pickedIndex) {
    cfBars.innerHTML = "";
    c.choices.forEach((choice, i) => {
      const row = document.createElement("div");
      row.className = "bar-row" + (i === pickedIndex ? " mine" : "");
      row.innerHTML = `
        <div class="bar-label">
          <span>${choice.text}${i === pickedIndex ? " — your ruling" : ""}</span>
          <span class="pct">${choice.pct}%</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${choice.pct}%"></div></div>
      `;
      cfBars.appendChild(row);
    });
    cfNote.textContent = c.note;
    cfResult.hidden = false;
  }

  document.getElementById("prevCaseBtn").addEventListener("click", () => {
    const prev = (currentCaseIndex - 1 + CASES.length) % CASES.length;
    openCase(prev);
  });
  document.getElementById("nextCaseBtn").addEventListener("click", () => {
    const next = (currentCaseIndex + 1) % CASES.length;
    openCase(next);
  });

  function closeOverlay() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }
  document.getElementById("closeBtn").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });

  // ───────── Dossier ─────────

  const dossierBtn = document.getElementById("dossierBtn");
  const dossierCount = document.getElementById("dossierCount");
  const dossierOverlay = document.getElementById("dossierOverlay");
  const dfProgress = document.getElementById("dfProgress");
  const dfEmpty = document.getElementById("dfEmpty");
  const dfContent = document.getElementById("dfContent");
  const dfTraits = document.getElementById("dfTraits");
  const dfAllBars = document.getElementById("dfAllBars");

  function updateDossierCount() {
    dossierCount.textContent = `(${Object.keys(answers).length})`;
  }

  function tagCounts() {
    const counts = {};
    Object.values(answers).forEach((a) => {
      counts[a.tag] = (counts[a.tag] || 0) + 1;
    });
    return counts;
  }

  function renderDossier() {
    const total = Object.keys(answers).length;
    dfProgress.textContent = `${total} of ${CASES.length} cases ruled on`;
    if (total < 3) {
      dfEmpty.hidden = false;
      dfContent.hidden = true;
      dossierOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      return;
    }
    dfEmpty.hidden = true;
    dfContent.hidden = false;

    const counts = tagCounts();
    const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const top = sorted.slice(0, 3);

    dfTraits.innerHTML = "";
    top.forEach(([tag, count]) => {
      const desc = TAGS[tag] || "";
      const [name, rest] = desc.split(" — ");
      const div = document.createElement("div");
      div.className = "trait-card";
      div.innerHTML = `
        <p class="trait-name">${name} <span style="color:var(--ink-dim);font-weight:400;">(${count} ruling${count === 1 ? "" : "s"})</span></p>
        <p class="trait-desc">${rest || ""}</p>
      `;
      dfTraits.appendChild(div);
    });

    dfAllBars.innerHTML = "";
    sorted.forEach(([tag, count]) => {
      const pct = Math.round((count / total) * 100);
      const desc = TAGS[tag] || tag;
      const name = desc.split(" — ")[0];
      const row = document.createElement("div");
      row.className = "bar-row";
      row.innerHTML = `
        <div class="bar-label">
          <span>${name}</span>
          <span class="pct">${count}&times;</span>
        </div>
        <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
      `;
      dfAllBars.appendChild(row);
    });

    dossierOverlay.hidden = false;
    document.body.style.overflow = "hidden";
  }

  dossierBtn.addEventListener("click", renderDossier);
  document.getElementById("dossierCloseBtn").addEventListener("click", () => {
    dossierOverlay.hidden = true;
    document.body.style.overflow = "";
  });
  dossierOverlay.addEventListener("click", (e) => {
    if (e.target === dossierOverlay) {
      dossierOverlay.hidden = true;
      document.body.style.overflow = "";
    }
  });
  document.getElementById("resetBtn").addEventListener("click", () => {
    if (!confirm("Clear every ruling you've recorded? This can't be undone.")) return;
    Object.keys(answers).forEach((k) => delete answers[k]);
    saveAnswers();
    updateDossierCount();
    renderGrid();
    dossierOverlay.hidden = true;
    document.body.style.overflow = "";
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (!overlay.hidden) closeOverlay();
      if (!dossierOverlay.hidden) { dossierOverlay.hidden = true; document.body.style.overflow = ""; }
    }
  });

  // ───────── Init ─────────

  renderFilters();
  renderGrid();
  updateDossierCount();
})();
