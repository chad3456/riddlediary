// Generic reveal-on-scroll for standalone elements
const revealEls = document.querySelectorAll(".reveal");
const revealIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, i) => {
      if (entry.isIntersecting) {
        setTimeout(() => entry.target.classList.add("in"), i * 40);
        revealIO.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);
revealEls.forEach((el) => revealIO.observe(el));

// Context section: map zooms in and stats count up once the final panel is reached
const contextMap = document.querySelector(".context-map");
const contextStats = document.querySelector(".context-stats");
const statValues = document.querySelectorAll(".cs-value");
let statsAnimated = false;

function animateStats() {
  if (statsAnimated) return;
  statsAnimated = true;
  statValues.forEach((el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || "0", 10);
    const suffix = el.dataset.suffix || "";
    const duration = 1300;
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = (eased * target).toFixed(decimals) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  });
}

const contextPanels = document.querySelectorAll(".context-panel");
const contextIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      contextMap.classList.add("zoomed");
      if (entry.target.dataset.revealStats) {
        contextStats.classList.add("visible");
        animateStats();
      }
    });
  },
  { threshold: 0.5 }
);
contextPanels.forEach((p) => contextIO.observe(p));

// Painterly story: tide recedes and roots appear as each act scrolls through
const storyPanels = document.querySelectorAll(".story-panel");
const storyTide = document.querySelector(".story-tide");
const storyTide2 = document.querySelector(".story-tide-2");
const storyRoots = document.querySelector(".story-roots");

const storyActStates = {
  1: {
    tide: "M0 380 C150 358 250 400 400 380 C560 358 660 400 820 380 C900 370 950 378 1000 373 V600 H0 Z",
    tide2: "M0 430 C150 410 260 440 400 428 C560 410 660 440 820 428 C900 420 950 426 1000 422 V600 H0 Z",
    roots: 0,
  },
  2: {
    tide: "M0 400 C150 382 250 418 400 400 C560 380 660 418 820 400 C900 392 950 398 1000 394 V600 H0 Z",
    tide2: "M0 450 C150 434 260 460 400 450 C560 434 660 460 820 450 C900 442 950 448 1000 444 V600 H0 Z",
    roots: 1,
  },
  3: {
    tide: "M0 420 C150 400 250 440 400 420 C560 398 660 440 820 420 C900 410 950 420 1000 415 V600 H0 Z",
    tide2: "M0 470 C150 452 260 480 400 468 C560 452 660 480 820 468 C900 460 950 466 1000 462 V600 H0 Z",
    roots: 1,
  },
};

function applyStoryAct(act) {
  const s = storyActStates[act];
  if (!s) return;
  storyTide.setAttribute("d", s.tide);
  storyTide2.setAttribute("d", s.tide2);
  storyRoots.style.opacity = s.roots;
}

const storyIO = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) applyStoryAct(entry.target.dataset.act);
    });
  },
  { threshold: 0.5 }
);
storyPanels.forEach((p) => storyIO.observe(p));

// Ambient drifting particles: silt and firefly-like motes over the whole page
(function initParticles() {
  const canvas = document.getElementById("particleCanvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (prefersReducedMotion) return;

  const colors = ["#e0754a", "#5ce6c2", "#eef2ef"];
  let w, h, particles;
  const COUNT = 70;

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }

  function spawn() {
    return {
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.6 + Math.random() * 1.8,
      vy: -(0.08 + Math.random() * 0.22),
      vx: (Math.random() - 0.5) * 0.12,
      drift: Math.random() * Math.PI * 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      alpha: 0.15 + Math.random() * 0.4,
    };
  }

  function build() {
    particles = Array.from({ length: COUNT }, spawn);
  }

  function step() {
    ctx.clearRect(0, 0, w, h);
    for (const p of particles) {
      p.drift += 0.01;
      p.x += p.vx + Math.sin(p.drift) * 0.15;
      p.y += p.vy;
      if (p.y < -10) {
        p.y = h + 10;
        p.x = Math.random() * w;
      }
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;

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
