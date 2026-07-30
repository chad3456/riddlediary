// Reveal-on-scroll
const revealEls = document.querySelectorAll(".reveal");
const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("in"), i * 30);
        revealIO.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);
revealEls.forEach((el) => revealIO.observe(el));

// Theory toggle
const theoryBtns = document.querySelectorAll(".theory-btn");
const theoryViews = document.querySelectorAll(".theory-view");
theoryBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    theoryBtns.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    const target = btn.dataset.theory;
    theoryViews.forEach((v) => {
      v.hidden = v.dataset.view !== target;
    });
  });
});

// Dossier of minds: click a card to reveal its description
const mindCards = document.querySelectorAll(".mind-card");
const mindDetail = document.getElementById("mindDetail");
mindCards.forEach((card) => {
  card.addEventListener("click", () => {
    mindCards.forEach((c) => c.classList.remove("active"));
    card.classList.add("active");
    mindDetail.style.opacity = 0;
    setTimeout(() => {
      mindDetail.textContent = card.dataset.desc;
      mindDetail.style.opacity = 1;
    }, 120);
  });
});

// Fever chart: draws in as the section scrolls, with annotated points
const feverPoints = [
  { x: 0, y: 300, label: "Part I — the theory becomes a plan. Anxiety rising, resolve building toward the murder." },
  { x: 166, y: 40, label: "Part I climax — the axe. The theory stops being an idea." },
  { x: 333, y: 120, label: "Part II — fever, delirium, the first unravelling. The body reacts before the mind admits anything." },
  { x: 500, y: 90, label: "Parts III–IV — Porfiry begins circling. Paranoia sharpens into a duel of nerves." },
  { x: 666, y: 200, label: "Part V — confession to Sonya. The first crack toward being known." },
  { x: 833, y: 60, label: "Part VI — Svidrigailov's shadow, then his suicide. The theory's other ending, refused." },
  { x: 1000, y: 320, label: "Epilogue — Siberia, and something closer to peace than punishment." },
];

const feverLine = document.getElementById("feverLine");
const feverArea = document.getElementById("feverArea");
const feverPointsGroup = document.getElementById("feverPoints");
const feverCaption = document.getElementById("feverCaption");
const chartTrack = document.getElementById("chartTrack");

function catmullRomPath(points) {
  if (points.length < 2) return "";
  let d = `M${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];
    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;
    d += ` C${cp1x} ${cp1y} ${cp2x} ${cp2y} ${p2.x} ${p2.y}`;
  }
  return d;
}

const fullPath = catmullRomPath(feverPoints);
const fullArea = `${fullPath} L1000 420 L0 420 Z`;

feverPointsGroup.innerHTML = feverPoints
  .map(
    (p) =>
      `<circle cx="${p.x}" cy="${p.y}" r="5" fill="#a83c32" opacity="0"></circle>`
  )
  .join("");
const pointEls = feverPointsGroup.querySelectorAll("circle");

// Use a hidden path length trick to reveal the line progressively
const tempPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
tempPath.setAttribute("d", fullPath);
const totalLength = (() => {
  document.body.appendChild(tempPath);
  const len = tempPath.getTotalLength();
  document.body.removeChild(tempPath);
  return len;
})();

feverLine.setAttribute("d", fullPath);
feverArea.setAttribute("d", fullArea);
feverLine.style.strokeDasharray = `${totalLength}`;
feverLine.style.strokeDashoffset = `${totalLength}`;
feverArea.style.opacity = 0;

function onChartScroll() {
  const rect = chartTrack.getBoundingClientRect();
  const total = rect.height - window.innerHeight;
  const progress = Math.min(Math.max(-rect.top / total, 0), 1);

  feverLine.style.strokeDashoffset = `${totalLength * (1 - progress)}`;
  feverArea.style.opacity = progress > 0.05 ? Math.min(progress * 1.4, 0.9) : 0;

  const activeIndex = Math.min(
    feverPoints.length - 1,
    Math.floor(progress * feverPoints.length)
  );
  pointEls.forEach((el, i) => {
    el.setAttribute("opacity", i <= activeIndex && progress > 0.02 ? "1" : "0");
  });
  if (progress > 0.02) {
    feverCaption.textContent = feverPoints[activeIndex].label;
  } else {
    feverCaption.textContent = "Scroll to trace the line.";
  }
}
window.addEventListener("scroll", onChartScroll, { passive: true });
onChartScroll();

// Subtle film-grain canvas overlay
(function initGrain() {
  const canvas = document.getElementById("grain");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function drawGrain() {
    const w = canvas.width, h = canvas.height;
    const imageData = ctx.createImageData(w, h);
    const buffer = new Uint32Array(imageData.data.buffer);
    for (let i = 0; i < buffer.length; i++) {
      const v = (Math.random() * 255) | 0;
      buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  if (prefersReducedMotion) {
    drawGrain();
    return;
  }

  let last = 0;
  function loop(t) {
    if (t - last > 90) {
      drawGrain();
      last = t;
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
