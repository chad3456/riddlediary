(function () {
  "use strict";

  const STORAGE_KEY = "psychLab.results.v1";
  const catByKey = Object.fromEntries(CATEGORIES.map((c) => [c.key, c]));

  const results = loadResults();

  function loadResults() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveResults() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(results));
    } catch (e) {
      /* storage unavailable — profile just won't persist across reloads */
    }
  }

  function bandFor(test, score) {
    return test.bands.find((b) => score <= b.max) || test.bands[test.bands.length - 1];
  }

  // ───────── Grid ─────────

  const filtersEl = document.getElementById("filters");
  const gridEl = document.getElementById("grid");
  let activeFilter = "all";

  function renderFilters() {
    const chips = [{ key: "all", label: "All tests", color: "#b8925a" }, ...CATEGORIES];
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

  function renderGrid() {
    const list = TESTS.filter((t) => activeFilter === "all" || t.cat === activeFilter);
    gridEl.innerHTML = "";
    list.forEach((t) => {
      const cat = catByKey[t.cat];
      const idx = TESTS.indexOf(t);
      const taken = !!results[t.id];
      const card = document.createElement("article");
      card.className = "card";
      card.style.setProperty("--accent", cat.color);
      card.tabIndex = 0;
      card.innerHTML = `
        <div class="card-top">
          <span class="card-num">TEST No. ${String(idx + 1).padStart(2, "0")}</span>
          <span class="card-status${taken ? " ruled" : ""}">${taken ? "TAKEN" : "OPEN"}</span>
        </div>
        <span class="card-cat">${cat.label}</span>
        <h3>${t.title}</h3>
        <p class="card-thinker">${t.subtitle}</p>
        <p class="card-teaser">${t.teaser}</p>
      `;
      const open = () => openCase(idx);
      card.addEventListener("click", open);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
      });
      gridEl.appendChild(card);
    });
  }

  // ───────── Overlay stages ─────────

  const overlay = document.getElementById("overlay");
  const cfTab = document.getElementById("cfTab");
  const stageCase = document.getElementById("stageCase");
  const stageQuestion = document.getElementById("stageQuestion");
  const stageReading = document.getElementById("stageReading");

  const cfNumber = document.getElementById("cfNumber");
  const cfTitle = document.getElementById("cfTitle");
  const cfSubtitle = document.getElementById("cfSubtitle");
  const cfCase = document.getElementById("cfCase");

  const qProgressText = document.getElementById("qProgressText");
  const qProgressFill = document.getElementById("qProgressFill");
  const qPrompt = document.getElementById("qPrompt");
  const qChoices = document.getElementById("qChoices");

  const rNumber = document.getElementById("rNumber");
  const rName = document.getElementById("rName");
  const rBlurb = document.getElementById("rBlurb");
  const rInsight = document.getElementById("rInsight");

  let currentTestIndex = -1;
  let currentQuestionIndex = 0;
  let currentAnswers = [];

  function showStage(stage) {
    stageCase.hidden = stage !== "case";
    stageQuestion.hidden = stage !== "question";
    stageReading.hidden = stage !== "reading";
  }

  function openCase(index) {
    currentTestIndex = index;
    const t = TESTS[index];
    const cat = catByKey[t.cat];
    cfTab.style.setProperty("--accent", cat.color);
    cfNumber.textContent = `TEST No. ${String(index + 1).padStart(2, "0")} · ${cat.label.toUpperCase()}`;
    cfTitle.textContent = t.title;
    cfSubtitle.textContent = t.subtitle;
    cfCase.textContent = t.case;
    showStage("case");
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    cfTab.parentElement.scrollTop = 0;
  }

  document.getElementById("beginTestBtn").addEventListener("click", () => {
    currentQuestionIndex = 0;
    currentAnswers = [];
    renderQuestion();
    showStage("question");
  });

  function renderQuestion() {
    const t = TESTS[currentTestIndex];
    const q = t.questions[currentQuestionIndex];
    qProgressText.textContent = `Question ${currentQuestionIndex + 1} of ${t.questions.length}`;
    qProgressFill.style.width = `${(currentQuestionIndex / t.questions.length) * 100}%`;
    qPrompt.textContent = q.prompt;
    qChoices.innerHTML = "";
    q.options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.textContent = opt.text;
      btn.addEventListener("click", () => chooseOption(opt));
      qChoices.appendChild(btn);
    });
  }

  function chooseOption(opt) {
    const t = TESTS[currentTestIndex];
    currentAnswers.push(opt);
    if (currentAnswers.length >= t.questions.length) {
      finishTest();
    } else {
      currentQuestionIndex++;
      renderQuestion();
    }
  }

  function finishTest() {
    const t = TESTS[currentTestIndex];
    const score = Math.round(
      currentAnswers.reduce((sum, a) => sum + a.weight, 0) / currentAnswers.length
    );
    const band = bandFor(t, score);
    results[t.id] = { score, bandName: band.name, tags: currentAnswers.map((a) => a.tag) };
    saveResults();
    renderGrid();
    updateDossierCount();

    rNumber.textContent = `YOUR SCORE: ${score} / 100`;
    rName.textContent = band.name;
    rBlurb.textContent = band.blurb;
    rInsight.textContent = t.insight;
    qProgressFill.style.width = "100%";
    showStage("reading");
  }

  document.getElementById("retakeTestBtn").addEventListener("click", () => {
    currentQuestionIndex = 0;
    currentAnswers = [];
    renderQuestion();
    showStage("question");
  });

  document.getElementById("doneTestBtn").addEventListener("click", closeOverlay);
  document.getElementById("closeCaseBtn").addEventListener("click", closeOverlay);
  document.getElementById("closeBtn").addEventListener("click", closeOverlay);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closeOverlay(); });

  function closeOverlay() {
    overlay.hidden = true;
    document.body.style.overflow = "";
  }

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !overlay.hidden) closeOverlay();
  });

  // ───────── Profile ─────────

  const dossierBtn = document.getElementById("dossierBtn");
  const dossierCount = document.getElementById("dossierCount");
  const dossierOverlay = document.getElementById("dossierOverlay");
  const dfProgress = document.getElementById("dfProgress");
  const dfEmpty = document.getElementById("dfEmpty");
  const dfContent = document.getElementById("dfContent");
  const dfTraits = document.getElementById("dfTraits");

  function updateDossierCount() {
    dossierCount.textContent = `(${Object.keys(results).length})`;
  }

  function renderDossier() {
    const takenIds = Object.keys(results);
    dfProgress.textContent = `${takenIds.length} of ${TESTS.length} tests taken`;
    if (takenIds.length === 0) {
      dfEmpty.hidden = false;
      dfContent.hidden = true;
      dossierOverlay.hidden = false;
      document.body.style.overflow = "hidden";
      return;
    }
    dfEmpty.hidden = true;
    dfContent.hidden = false;

    dfTraits.innerHTML = "";
    TESTS.forEach((t) => {
      const r = results[t.id];
      if (!r) return;
      const div = document.createElement("div");
      div.className = "trait-card";
      div.innerHTML = `
        <p class="trait-name">${t.title} <span style="color:var(--ink-dim);font-weight:400;">(${r.score}/100)</span></p>
        <p class="trait-desc">${r.bandName}</p>
      `;
      dfTraits.appendChild(div);
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
    if (!confirm("Clear every test result you've recorded? This can't be undone.")) return;
    Object.keys(results).forEach((k) => delete results[k]);
    saveResults();
    updateDossierCount();
    renderGrid();
    dossierOverlay.hidden = true;
    document.body.style.overflow = "";
  });

  // ───────── Init ─────────

  renderFilters();
  renderGrid();
  updateDossierCount();
})();
