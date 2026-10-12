/* SENTINEL visual modes: sensor-style filters applied to the map/globe viewport.
   Each mode = an SVG/CSS filter on the rendered scene + optional overlays
   (scanlines, noise, vignette, radar sweep, glitch, data rain…) + a HUD accent. */
(() => {
  'use strict';

  const LUM = '0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0.30 0.59 0.11 0 0  0 0 0 1 0';
  const tint = (r, g, b, gain = 1) => `${0.3 * r * gain} ${0.59 * r * gain} ${0.11 * r * gain} 0 0  ${0.3 * g * gain} ${0.59 * g * gain} ${0.11 * g * gain} 0 0  ${0.3 * b * gain} ${0.59 * b * gain} ${0.11 * b * gain} 0 0  0 0 0 1 0`;
  const table = (r, g, b) => `<feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="table" tableValues="${r}"/><feFuncG type="table" tableValues="${g}"/><feFuncB type="table" tableValues="${b}"/></feComponentTransfer>`;

  // SVG filter bodies, referenced as url(#fx-<id>).
  const SVG = {
    nv: `<feColorMatrix type="matrix" values="${tint(0.25, 1, 0.35, 1.9)}"/><feComponentTransfer><feFuncG type="gamma" amplitude="1.1" exponent="0.7"/><feFuncR type="gamma" amplitude="1" exponent="0.9"/></feComponentTransfer>`,
    nvwhite: `<feColorMatrix type="matrix" values="${tint(0.92, 0.97, 1, 1.9)}"/><feComponentTransfer><feFuncR type="gamma" exponent="0.65"/><feFuncG type="gamma" exponent="0.65"/><feFuncB type="gamma" exponent="0.65"/></feComponentTransfer>`,
    whitehot: `<feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="gamma" amplitude="1.4" exponent="0.6"/><feFuncG type="gamma" amplitude="1.4" exponent="0.6"/><feFuncB type="gamma" amplitude="1.4" exponent="0.6"/></feComponentTransfer>`,
    blackhot: `<feColorMatrix type="matrix" values="${LUM}"/><feComponentTransfer><feFuncR type="table" tableValues="0.95 0.35 0"/><feFuncG type="table" tableValues="0.95 0.35 0"/><feFuncB type="table" tableValues="0.95 0.35 0"/></feComponentTransfer>`,
    ironbow: table('0 0.25 0.65 0.95 1 1 1', '0 0 0.05 0.3 0.6 0.85 1', '0.1 0.45 0.55 0.2 0 0.2 0.9'),
    rainbow: table('0 0 0 0.1 0.9 1 1', '0 0.2 0.8 1 1 0.5 0.1', '0.3 0.9 1 0.3 0 0 0.1'),
    arctic: table('0 0 0.05 0.4 0.9 1', '0 0.1 0.35 0.75 0.95 1', '0.1 0.35 0.75 0.95 1 1'),
    lava: table('0 0.4 0.85 1 1', '0 0 0.15 0.55 0.95', '0 0 0 0.05 0.6'),
    amber: `<feColorMatrix type="matrix" values="${tint(1, 0.62, 0.08, 1.7)}"/>`,
    crt: `<feColorMatrix type="matrix" values="${tint(0.2, 1, 0.45, 1.7)}"/><feGaussianBlur stdDeviation="0.5"/>`,
    sonar: `<feColorMatrix type="matrix" values="${tint(0.05, 0.75, 1, 1.8)}"/>`,
    holo: `<feColorMatrix type="matrix" values="${tint(0.35, 1, 1, 1.8)}"/><feGaussianBlur stdDeviation="0.35"/>`,
    redlight: `<feColorMatrix type="matrix" values="${tint(1, 0.06, 0.03, 1.6)}"/>`,
    blueprint: table('0.05 0.25 0.85 1', '0.2 0.45 0.9 1', '0.42 0.7 1 1'),
    recon: `<feColorMatrix type="matrix" values="${LUM}"/><feConvolveMatrix order="3" kernelMatrix="0 -1 0 -1 5 -1 0 -1 0" preserveAlpha="true"/><feComponentTransfer><feFuncR type="linear" slope="1.25" intercept="-0.05"/><feFuncG type="linear" slope="1.25" intercept="-0.05"/><feFuncB type="linear" slope="1.2" intercept="-0.03"/></feComponentTransfer>`,
    sar: `<feColorMatrix type="matrix" values="${LUM}" result="g"/><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="1" seed="3" result="n"/><feColorMatrix in="n" type="matrix" values="${LUM}" result="ng"/><feBlend in="g" in2="ng" mode="multiply" result="m"/><feComponentTransfer in="m"><feFuncR type="gamma" amplitude="2.3" exponent="0.7"/><feFuncG type="gamma" amplitude="2.3" exponent="0.7"/><feFuncB type="gamma" amplitude="2.3" exponent="0.7"/></feComponentTransfer>`,
    glitch: `<feTurbulence id="fxGlitchTurb" type="fractalNoise" baseFrequency="0.002 0.35" numOctaves="1" seed="2" result="t"/><feDisplacementMap in="SourceGraphic" in2="t" scale="18" xChannelSelector="R" yChannelSelector="G" result="d"/>
      <feColorMatrix in="d" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="-4" result="ro"/>
      <feColorMatrix in="d" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0" result="gb"/><feOffset in="gb" dx="3" result="gbo"/>
      <feBlend in="ro" in2="gbo" mode="screen"/>`,
    chroma: `<feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0" result="r"/><feOffset in="r" dx="-2.5" dy="0" result="ro"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0" result="g"/>
      <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0" result="b"/><feOffset in="b" dx="2.5" result="bo"/>
      <feBlend in="ro" in2="g" mode="screen" result="rg"/><feBlend in="rg" in2="bo" mode="screen"/>`,
  };

  // id, label, hotkey, CSS filter, overlays, HUD accent
  const MODES = [
    ['standard', 'Standard EO', '1', '', ['vignette-soft'], '#46c2ff'],
    ['nv', 'Night Vision · Gen-3 green', '2', 'url(#fx-nv) contrast(1.15)', ['noise', 'scan', 'vignette', 'bloom'], '#7dff7a'],
    ['nvwhite', 'Night Vision · white phosphor', '3', 'url(#fx-nvwhite) contrast(1.1)', ['noise', 'vignette', 'bloom'], '#e8f3ff'],
    ['whitehot', 'Thermal · white-hot', '4', 'url(#fx-whitehot) contrast(1.3)', ['noise-light', 'vignette-soft'], '#ffffff'],
    ['blackhot', 'Thermal · black-hot', '5', 'url(#fx-blackhot) contrast(1.2)', ['noise-light', 'vignette-soft'], '#111111'],
    ['ironbow', 'Thermal · ironbow', '6', 'url(#fx-ironbow) contrast(1.15)', ['noise-light'], '#ffcf4a'],
    ['rainbow', 'Thermal · rainbow HC', '7', 'url(#fx-rainbow)', ['noise-light'], '#ffffff'],
    ['arctic', 'Thermal · arctic', '8', 'url(#fx-arctic) contrast(1.1)', ['noise-light'], '#bfe9ff'],
    ['lava', 'Thermal · lava', '9', 'url(#fx-lava) contrast(1.2)', ['noise-light'], '#ffb347'],
    ['recon', 'Satellite recon (pan-sharpened)', '0', 'url(#fx-recon)', ['grain', 'reticle-grid'], '#e9e9e9'],
    ['sar', 'SAR radar imagery', 'q', 'url(#fx-sar) contrast(1.2)', ['grain', 'vignette-soft'], '#d8d8d8'],
    ['radar', 'Radar sweep · PPI', 'w', 'saturate(0.6) brightness(0.85)', ['sweep', 'rings', 'vignette'], '#5cff8a'],
    ['sonar', 'Sonar', 'e', 'url(#fx-sonar) contrast(1.2)', ['sweep-cyan', 'rings', 'vignette'], '#5fe3ff'],
    ['crt', 'CRT terminal', 'r', 'url(#fx-crt) contrast(1.2)', ['scan-heavy', 'flicker', 'vignette', 'curve'], '#7dff9a'],
    ['amber', 'Amber monitor', 't', 'url(#fx-amber) contrast(1.15)', ['scan-heavy', 'vignette', 'curve'], '#ffb000'],
    ['holo', 'Hologram table', 'y', 'url(#fx-holo) contrast(1.15)', ['scan', 'flicker', 'holo'], '#7ff9ff'],
    ['redlight', 'Red-light (dark-adapted)', 'u', 'url(#fx-redlight) brightness(0.9)', ['vignette'], '#ff3b2f'],
    ['blueprint', 'Blueprint', 'i', 'url(#fx-blueprint)', ['grid'], '#ffffff'],
    ['ew', 'EW jamming / spoofed feed', 'o', 'url(#fx-glitch) contrast(1.2)', ['noise', 'tears', 'scan'], '#ff4fd8'],
    ['chroma', 'Lens · chromatic aberration', 'p', 'url(#fx-chroma)', ['vignette'], '#ffffff'],
    ['spectral', 'Hyperspectral false-colour', 'a', 'hue-rotate(160deg) saturate(2.6) contrast(1.1)', ['grain'], '#ff9cf0'],
    ['datarain', 'Data rain', 's', 'url(#fx-crt) brightness(0.7)', ['rain', 'scan'], '#6bff8f'],
    ['sepia', 'Archive film', 'd', 'sepia(0.85) contrast(1.1) brightness(0.95)', ['grain', 'scratches', 'vignette'], '#f3d9a4'],
    ['invert', 'Inverted / negative', 'f', 'invert(1) hue-rotate(180deg)', [], '#111111'],
  ].map(([id, label, key, filter, overlays, hud]) => ({ id, label, key, filter, overlays, hud }));

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  let target; let overlay; let current = MODES[0];
  let noiseCanvas; let noiseRaf; let rainCanvas; let rainRaf; let glitchT;

  function init(viewportEl, overlayEl) {
    target = viewportEl; overlay = overlayEl;
    const ns = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(ns, 'svg');
    svg.setAttribute('width', '0'); svg.setAttribute('height', '0'); svg.style.position = 'absolute';
    svg.innerHTML = `<defs>${Object.entries(SVG).map(([k, v]) => `<filter id="fx-${k}" color-interpolation-filters="sRGB" x="0" y="0" width="100%" height="100%">${v}</filter>`).join('')}</defs>`;
    document.body.appendChild(svg);
    overlay.innerHTML = `<canvas class="fx-noise"></canvas><canvas class="fx-rain"></canvas>
      <div class="fx-scan"></div><div class="fx-vignette"></div><div class="fx-sweep"></div><div class="fx-rings"></div>
      <div class="fx-grid"></div><div class="fx-tears"></div><div class="fx-bloom"></div><div class="fx-holo"></div><div class="fx-scratches"></div>`;
    noiseCanvas = overlay.querySelector('.fx-noise'); rainCanvas = overlay.querySelector('.fx-rain');
    document.addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, select, textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
      const m = MODES.find((x) => x.key === e.key.toLowerCase());
      if (m) { set(m.id); e.preventDefault(); }
      if (e.key === '[' || e.key === ']') { const i = MODES.indexOf(current); set(MODES[(i + (e.key === ']' ? 1 : MODES.length - 1)) % MODES.length].id); }
    });
  }

  function set(id) {
    const m = MODES.find((x) => x.id === id) || MODES[0];
    current = m;
    target.style.filter = m.filter || '';
    overlay.className = `fx-overlay ${m.overlays.map((o) => `fx-on-${o}`).join(' ')}`;
    document.documentElement.style.setProperty('--hud', m.hud);
    document.documentElement.dataset.fx = m.id;
    const wantsNoise = m.overlays.some((o) => o.startsWith('noise') || o === 'grain');
    cancelAnimationFrame(noiseRaf); if (wantsNoise) noiseLoop();
    cancelAnimationFrame(rainRaf); if (m.overlays.includes('rain')) rainLoop();
    clearInterval(glitchT);
    if (m.id === 'ew' && !reduceMotion) glitchT = setInterval(() => {
      const t = document.getElementById('fxGlitchTurb');
      if (t) { t.setAttribute('seed', String(Math.floor(Math.random() * 100))); t.setAttribute('baseFrequency', `0.002 ${(0.05 + Math.random() * 0.6).toFixed(2)}`); }
    }, 140);
    try { localStorage.setItem('sentinel.fx', m.id); } catch { /* ignore */ }
    window.dispatchEvent(new CustomEvent('sentinel:fx', { detail: m }));
  }

  function noiseLoop() {
    const c = noiseCanvas; const w = 240; const h = 160; c.width = w; c.height = h;
    const ctx = c.getContext('2d'); const img = ctx.createImageData(w, h);
    let last = 0;
    const frame = (t) => {
      if (t - last > 70) {
        last = t;
        const d = img.data;
        for (let i = 0; i < d.length; i += 4) { const v = Math.random() * 255; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
        ctx.putImageData(img, 0, 0);
      }
      if (!reduceMotion) noiseRaf = requestAnimationFrame(frame);
    };
    noiseRaf = requestAnimationFrame(frame);
  }

  function rainLoop() {
    const c = rainCanvas; const r = c.getBoundingClientRect();
    c.width = r.width; c.height = r.height;
    const ctx = c.getContext('2d'); const fs = 14; const cols = Math.ceil(r.width / fs);
    const y = Array.from({ length: cols }, () => Math.random() * -50);
    const glyphs = '0123456789ABCDEF◈▲▼◆░▒アイウエオカキクケコサシスセソ';
    let last = 0;
    const frame = (t) => {
      if (t - last > 55) {
        last = t;
        ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(0, 0, c.width, c.height);
        ctx.font = `${fs}px IBM Plex Mono, monospace`;
        for (let i = 0; i < cols; i++) {
          ctx.fillStyle = Math.random() < 0.05 ? '#d8ffe0' : '#3dff6e';
          ctx.fillText(glyphs[Math.floor(Math.random() * glyphs.length)], i * fs, y[i] * fs);
          if (y[i] * fs > c.height && Math.random() > 0.975) y[i] = 0; else y[i]++;
        }
      }
      if (!reduceMotion) rainRaf = requestAnimationFrame(frame);
    };
    rainRaf = requestAnimationFrame(frame);
  }

  window.SentinelFX = { MODES, init, set, get current() { return current; } };
})();
