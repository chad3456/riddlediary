// The Diary of Tom Riddle — client.
// You write; the page drinks the ink; Claude answers as Riddle in a flowing
// hand that then fades. Nothing is stored, in the browser or on the server.

const page = document.getElementById("page");
const canvas = document.getElementById("ink");
const reply = document.getElementById("reply");
const hint = document.getElementById("hint");
const think = document.getElementById("think");
const ctx = canvas.getContext("2d");

const IDLE_MS = 2500; // stillness before the page drinks your ink
const INK_COLOR = "#1b1a17";

let dpr = 1;
let drawing = false;
let hasInk = false;
let busy = false; // true from "drink" through reply-fade; input ignored
let idleTimer = null;
let lastPoint = null;

/* ---------- canvas sizing ---------- */
function sizeCanvas() {
  dpr = Math.min(window.devicePixelRatio || 1, 3);
  const rect = page.getBoundingClientRect();
  canvas.width = Math.round(rect.width * dpr);
  canvas.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = INK_COLOR;
}
sizeCanvas();

let resizeRAF = null;
window.addEventListener("resize", () => {
  // Resizing clears the (unstored) canvas; only reset if the page is idle.
  cancelAnimationFrame(resizeRAF);
  resizeRAF = requestAnimationFrame(() => {
    if (busy) return;
    sizeCanvas();
    if (hasInk) clearInk();
  });
});

/* ---------- drawing ---------- */
function pos(e) {
  const rect = canvas.getBoundingClientRect();
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function widthFor(e) {
  // Use pen pressure when available; a lively default otherwise.
  const p = e.pressure && e.pressure > 0 ? e.pressure : 0.5;
  return 1.6 + p * 4.2;
}

function onDown(e) {
  if (busy) return;
  e.preventDefault();
  drawing = true;
  clearTimeout(idleTimer);
  hideHint();
  lastPoint = pos(e);
  // A dot, so a tap still leaves a mark.
  ctx.beginPath();
  ctx.arc(lastPoint.x, lastPoint.y, widthFor(e) / 2, 0, Math.PI * 2);
  ctx.fillStyle = INK_COLOR;
  ctx.fill();
  hasInk = true;
}

function onMove(e) {
  if (!drawing || busy) return;
  e.preventDefault();
  const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
  for (const ev of events) {
    const p = pos(ev);
    ctx.lineWidth = widthFor(ev);
    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    // quadratic smoothing toward the midpoint
    const mid = { x: (lastPoint.x + p.x) / 2, y: (lastPoint.y + p.y) / 2 };
    ctx.quadraticCurveTo(lastPoint.x, lastPoint.y, mid.x, mid.y);
    ctx.stroke();
    lastPoint = p;
  }
  hasInk = true;
}

function onUp(e) {
  if (!drawing) return;
  e && e.preventDefault();
  drawing = false;
  lastPoint = null;
  if (hasInk && !busy) {
    clearTimeout(idleTimer);
    idleTimer = setTimeout(commit, IDLE_MS);
  }
}

canvas.addEventListener("pointerdown", onDown);
canvas.addEventListener("pointermove", onMove);
canvas.addEventListener("pointerup", onUp);
canvas.addEventListener("pointercancel", onUp);
canvas.addEventListener("pointerleave", onUp);

/* ---------- helpers ---------- */
function hideHint() {
  hint.classList.add("gone");
}
function showHint() {
  hint.classList.remove("gone");
}

function clearInk() {
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  hasInk = false;
}

// Composite the ink onto a light parchment tone so the handwriting reads well
// for the vision model, and trim to just the inked region.
function exportWriting() {
  const bounds = inkBounds();
  if (!bounds) return null;
  const pad = 24 * dpr;
  const x = Math.max(0, bounds.minX - pad);
  const y = Math.max(0, bounds.minY - pad);
  const w = Math.min(canvas.width, bounds.maxX + pad) - x;
  const h = Math.min(canvas.height, bounds.maxY + pad) - y;

  const out = document.createElement("canvas");
  out.width = w;
  out.height = h;
  const octx = out.getContext("2d");
  octx.fillStyle = "#efe6cf";
  octx.fillRect(0, 0, w, h);
  octx.drawImage(canvas, x, y, w, h, 0, 0, w, h);
  return out.toDataURL("image/png");
}

function inkBounds() {
  const { width, height } = canvas;
  const img = ctx.getImageData(0, 0, width, height).data;
  let minX = width,
    minY = height,
    maxX = 0,
    maxY = 0,
    found = false;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const a = img[(y * width + x) * 4 + 3];
      if (a > 12) {
        found = true;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return found ? { minX, minY, maxX, maxY } : null;
}

/* ---------- commit: the page drinks the ink and answers ---------- */
async function commit() {
  if (busy || !hasInk) return;
  busy = true;

  const image = exportWriting();
  if (!image) {
    busy = false;
    return;
  }

  // The page drinks the ink.
  canvas.classList.add("drink");
  await wait(1100);
  clearInk();
  canvas.classList.remove("drink");

  // The page considers.
  think.hidden = false;

  let text;
  try {
    const res = await fetch("/api/oracle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ image }),
    });
    const data = await res.json();
    text = data.reply || data.error || "…";
  } catch (err) {
    text = "The ink runs thin, and the page will not answer just now.";
  }

  think.hidden = true;

  await typeReply(text);
  await wait(readingPause(text));
  await fadeReply();

  busy = false;
  showHint();
}

/* ---------- reply, appearing then sinking away ---------- */
function typeReply(text) {
  return new Promise((resolve) => {
    reply.classList.remove("fade");
    reply.textContent = "";
    const cursor = document.createElement("span");
    cursor.className = "cursor";
    cursor.style.height = "1em";
    reply.appendChild(cursor);

    let i = 0;
    function step() {
      if (i >= text.length) {
        cursor.remove();
        return resolve();
      }
      // reveal a character (a touch faster on spaces)
      const ch = text[i++];
      cursor.insertAdjacentText("beforebegin", ch);
      const delay = ch === " " ? 14 : 26 + Math.random() * 34;
      setTimeout(step, delay);
    }
    step();
  });
}

function fadeReply() {
  return new Promise((resolve) => {
    reply.classList.add("fade");
    setTimeout(() => {
      reply.textContent = "";
      reply.classList.remove("fade");
      resolve();
    }, 4600);
  });
}

function readingPause(text) {
  // Give a moment to read before the ink sinks: ~55ms/char, 3s–11s.
  return Math.min(11000, Math.max(3000, text.length * 55));
}

function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}
