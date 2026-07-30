// Mobile nav toggle
const navToggle = document.getElementById("navToggle");
const mobileNav = document.getElementById("mobileNav");
navToggle.addEventListener("click", () => {
  const open = mobileNav.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(open));
});
mobileNav.querySelectorAll("a").forEach((a) =>
  a.addEventListener("click", () => {
    mobileNav.classList.remove("open");
    navToggle.setAttribute("aria-expanded", "false");
  })
);

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

// Count-up stats
const counters = document.querySelectorAll(".stat-num");
const countIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * target).toLocaleString();
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      countIO.unobserve(el);
    });
  },
  { threshold: 0.6 }
);
counters.forEach((el) => countIO.observe(el));

// Hero parallax: sky/birds/water/mangroves drift at different speeds
const birdsLayer = document.querySelector(".layer-birds");
const waterLayer = document.querySelector(".layer-water");
const mangroveRow = document.getElementById("mangroveRow");
const hero = document.querySelector(".hero");

function onHeroScroll() {
  const rect = hero.getBoundingClientRect();
  const progress = Math.min(Math.max(-rect.top / rect.height, 0), 1);
  birdsLayer.style.transform = `translate3d(${progress * -40}px, ${progress * -10}px, 0)`;
  waterLayer.style.transform = `translate3d(0, ${progress * 30}px, 0)`;
  mangroveRow.style.transform = `translate3d(0, ${progress * 16}px, 0)`;
}
window.addEventListener("scroll", onHeroScroll, { passive: true });
onHeroScroll();

// Ambient drifting particles over the hero: fireflies and silt motes
(function initHeroParticles() {
  const canvas = document.getElementById("heroParticles");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const colors = ["#e0754a", "#5ce6c2", "#f2e8d5"];
  let w, h, particles;
  const COUNT = 46;

  function resize() {
    w = canvas.width = hero.clientWidth;
    h = canvas.height = hero.clientHeight;
  }

  function spawn() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.6,
      vy: -(0.06 + Math.random() * 0.16),
      vx: (Math.random() - 0.5) * 0.1,
      drift: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.15 + Math.random() * 0.35,
    };
  }

  function build() {
    particles = Array.from({ length: COUNT }, spawn);
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.drift += 0.012;
      p.x += p.vx + Math.sin(p.drift) * 0.12;
      p.y += p.vy;
      if (p.y < -8) {
        p.y = h + 8;
        p.x = Math.random() * w;
      }
      if (p.x < -8) p.x = w + 8;
      if (p.x > w + 8) p.x = -8;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(step);
  }

  resize();
  build();
  window.addEventListener("resize", () => {
    resize();
    build();
  });
  requestAnimationFrame(step);
})();

// Build a simple procedural row of mangrove trees in the hero
(function buildMangroves() {
  const count = 24;
  const svgNS = "http://www.w3.org/2000/svg";
  for (let i = 0; i < count; i++) {
    const wrap = document.createElement("div");
    wrap.className = "tree";
    const h = 60 + Math.random() * 40;
    wrap.style.height = `${h}%`;
    const svg = document.createElementNS(svgNS, "svg");
    svg.setAttribute("viewBox", "0 0 40 100");
    svg.setAttribute("preserveAspectRatio", "xMidYMax meet");
    const path = document.createElementNS(svgNS, "path");
    const lean = (Math.random() - 0.5) * 10;
    path.setAttribute(
      "d",
      `M20 100 C${20 + lean} 80 ${18 - lean} 60 ${20 + lean} 40 M${20 + lean} 55 C${10 + lean} 50 6 42 6 42 M${20 + lean} 45 C${30 + lean} 40 34 32 34 32`
    );
    path.setAttribute("stroke", "#0f3d3e");
    path.setAttribute("stroke-width", "3.5");
    path.setAttribute("fill", "none");
    path.setAttribute("stroke-linecap", "round");
    svg.appendChild(path);
    wrap.appendChild(svg);
    mangroveRow.appendChild(wrap);
  }
})();

// Sticky story: swap illustration state as each act scrolls through
const storyPanels = document.querySelectorAll(".story-panel");
const storyWater = document.querySelector(".story-water");
const storyCanopy = document.querySelector(".story-canopy");
const storyBirds = document.querySelector(".story-birds");
const storyHouses = document.querySelector(".story-houses");
const storyRoots = document.querySelector(".story-roots");

const actStates = {
  1: { water: "M0 460 Q150 440 300 460 T600 460 V600 H0 Z", roots: 1, canopy: 0, birds: 0, houses: 0 },
  2: { water: "M0 440 Q150 410 300 440 T600 440 V600 H0 Z", roots: 1, canopy: 0.4, birds: 0, houses: 0 },
  3: { water: "M0 420 Q150 390 300 420 T600 420 V600 H0 Z", roots: 1, canopy: 1, birds: 1, houses: 0 },
  4: { water: "M0 400 Q150 370 300 400 T600 400 V600 H0 Z", roots: 1, canopy: 1, birds: 1, houses: 1 },
};

function applyAct(act) {
  const s = actStates[act];
  if (!s) return;
  storyWater.setAttribute("d", s.water);
  storyCanopy.style.opacity = s.canopy;
  storyBirds.style.opacity = s.birds;
  storyHouses.style.opacity = s.houses;
  storyRoots.style.opacity = s.roots;
}

const storyIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) applyAct(entry.target.dataset.act);
    });
  },
  { threshold: 0.5 }
);
storyPanels.forEach((p) => storyIO.observe(p));

// Animated cumulative carbon chart
const chartValues = [4200, 12800, 27600, 44100, 61500, 76200, 86400];
const chartLine = document.getElementById("chartLine");
const chartArea = document.getElementById("chartArea");
const chartSection = document.querySelector(".chart-block");

function buildChartPath(values, animT) {
  const max = Math.max(...values);
  const w = 800, h = 280, pad = 20;
  const n = values.length;
  const points = values.map((v, i) => {
    const x = (i / (n - 1)) * w;
    const y = h - pad - (v / max) * (h - pad * 2);
    return [x, y];
  });
  const visibleCount = Math.max(1, Math.floor(animT * (n - 1)) + 1);
  const visible = points.slice(0, visibleCount);
  let line = `M${visible[0][0]} ${visible[0][1]}`;
  for (let i = 1; i < visible.length; i++) line += ` L${visible[i][0]} ${visible[i][1]}`;
  let area = line + ` L${visible[visible.length - 1][0]} ${h} L0 ${h} Z`;
  return { line, area };
}

let chartAnimated = false;
const chartIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting || chartAnimated) return;
      chartAnimated = true;
      const duration = 1600;
      const start = performance.now();
      function tick(now) {
        const p = Math.min((now - start) / duration, 1);
        const { line, area } = buildChartPath(chartValues, p);
        chartLine.setAttribute("d", line);
        chartArea.setAttribute("d", area);
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
      chartIO.unobserve(entry.target);
    });
  },
  { threshold: 0.4 }
);
if (chartSection) chartIO.observe(chartSection);
