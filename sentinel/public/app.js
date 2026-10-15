/* SENTINEL client — map, panels and live updates over SSE. No build step. */
(() => {
  'use strict';

  // ---------------- helpers ----------------
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const fmt = (v, d = 1) => {
    if (v === null || v === undefined || Number.isNaN(v)) return '—';
    if (typeof v !== 'number') return esc(v);
    const a = Math.abs(v);
    if (a >= 1e9) return (v / 1e9).toFixed(1) + 'B';
    if (a >= 1e6) return (v / 1e6).toFixed(1) + 'M';
    if (a >= 10000) return Math.round(v).toLocaleString('en-US');
    if (Number.isInteger(v)) return String(v);
    return v.toFixed(a < 1 ? Math.max(d, 3) : d);
  };
  const pct = (v) => (v === null || v === undefined ? '—' : `<span class="${v > 0 ? 'up' : v < 0 ? 'down' : ''}">${v > 0 ? '+' : ''}${v.toFixed(2)}%</span>`);
  const ago = (t) => {
    if (!t) return 'never';
    const s = Math.round((Date.now() - t) / 1000);
    return s < 60 ? `${s}s ago` : s < 3600 ? `${Math.round(s / 60)}m ago` : s < 86400 ? `${Math.round(s / 3600)}h ago` : `${Math.round(s / 86400)}d ago`;
  };
  const pill = (level) => `<span class="lvl s-${level?.status || 'null'}">${esc(level?.label || 'NO DATA')}</span>`;
  const SEV = { 4: { label: 'CRITICAL', status: 'critical' }, 3: { label: 'HIGH', status: 'serious' }, 2: { label: 'ELEVATED', status: 'warning' }, 1: { label: 'NOTE', status: 'guarded' } };
  const STATUS_LABEL = { good: 'NORMAL', guarded: 'GUARDED', warning: 'WATCH', serious: 'ALERT', critical: 'CRITICAL' };

  function spark(values, { color = 'var(--accent)', h = 40, labels = null, unit = '', area = true } = {}) {
    const v = (values || []).map((x) => (x && typeof x === 'object' ? x.v : x));
    const pts = v.map((y, i) => [i, y]).filter(([, y]) => y !== null && y !== undefined);
    if (pts.length < 2) return '<div class="muted mono" style="font-size:11px">collecting history…</div>';
    const ys = pts.map((p) => p[1]);
    let lo = Math.min(...ys); let hi = Math.max(...ys);
    if (hi === lo) { hi += 1; lo -= 1; }
    const W = 300; const n = v.length - 1;
    const X = (i) => (i / n) * W; const Y = (y) => h - 3 - ((y - lo) / (hi - lo)) * (h - 6);
    const d = pts.map(([i, y], k) => `${k ? 'L' : 'M'}${X(i).toFixed(1)},${Y(y).toFixed(1)}`).join('');
    const fill = area ? `<path d="${d}L${X(pts[pts.length - 1][0])},${h}L${X(pts[0][0])},${h}Z" fill="${color}" opacity=".12"/>` : '';
    const [li, ly] = pts[pts.length - 1];
    const lab = labels || (values[0] && typeof values[0] === 'object' ? values.map((p) => new Date(p.t).toISOString().slice(11, 16) + 'Z') : null);
    return `<div class="spark-wrap" data-v='${JSON.stringify(v)}' data-l='${esc(JSON.stringify(lab || []))}' data-u="${esc(unit)}">
      <svg class="spark" viewBox="0 0 ${W} ${h}" preserveAspectRatio="none" style="height:${h}px">${fill}
      <path d="${d}" fill="none" stroke="${color}" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>
      <circle cx="${X(li)}" cy="${Y(ly)}" r="3" fill="${color}" vector-effect="non-scaling-stroke"/>
      <line class="xh" x1="0" x2="0" y1="0" y2="${h}" stroke="var(--text-muted)" stroke-width="1" vector-effect="non-scaling-stroke" visibility="hidden"/></svg></div>`;
  }
  // One delegated hover layer for every sparkline on the page.
  document.addEventListener('mousemove', (e) => {
    const w = e.target.closest?.('.spark-wrap');
    document.querySelectorAll('.spark-tip').forEach((t) => { if (!w || t.parentNode !== w) t.remove(); });
    document.querySelectorAll('.spark .xh').forEach((l) => { if (!w || !w.contains(l)) l.setAttribute('visibility', 'hidden'); });
    if (!w) return;
    const v = JSON.parse(w.dataset.v); const l = JSON.parse(w.dataset.l || '[]');
    const r = w.getBoundingClientRect();
    const i = Math.max(0, Math.min(v.length - 1, Math.round(((e.clientX - r.left) / r.width) * (v.length - 1))));
    let tip = w.querySelector('.spark-tip');
    if (!tip) { tip = document.createElement('div'); tip.className = 'spark-tip'; w.appendChild(tip); }
    tip.style.left = `${(i / (v.length - 1)) * 100}%`;
    tip.textContent = `${l[i] ? l[i] + ' · ' : ''}${v[i] === null ? '—' : fmt(v[i])}${w.dataset.u || ''}`;
    const xh = w.querySelector('.xh');
    const x = (i / (v.length - 1)) * 300;
    xh.setAttribute('x1', x); xh.setAttribute('x2', x); xh.setAttribute('visibility', 'visible');
  });

  // ---------------- state ----------------
  const S = {
    summary: null, params: null, air: [], ships: [], hazards: { quakes: [], eonet: [], gdacs: [], fires: [] },
    versions: {}, tab: 'brief', drawer: null, kindFilter: 'All', paramQ: '', paramType: 'all', paramFlagged: false,
    vis: { choke: true, hot: true, milair: true, civair: true, ships: true, fires: true, quakes: true, eonet: true, gdacs: true,
      unrest: true, kinetic: true, drones: true, gnss: true, outages: true, sats: true, lanes: true, newsgeo: false,
      countries: true, contested: true, bases: false, terminator: true, footprints: false },
    view: 'globe', activity: { events: [], geo: {}, outages: [] }, satRecs: [], sats: [], liveFilter: 'All', selSat: null,
    lens: 'risk', bloc: 'NATO', extrude: false, countryStats: {}, country: null, imagery: 'night', imgDate: null,
    satQ: '', satGroup: 'All', passTarget: null, passes: null, passTs: 0, follow: false,
  };
  try { S.view = localStorage.getItem('sentinel.view') || 'globe'; } catch { /* storage unavailable */ }
  try { Object.assign(S, JSON.parse(localStorage.getItem('sentinel.geo') || '{}')); } catch { /* storage unavailable */ }
  const saveGeo = () => { try { localStorage.setItem('sentinel.geo', JSON.stringify({ lens: S.lens, bloc: S.bloc, extrude: S.extrude, imagery: S.imagery })); } catch { /* ignore */ } };
  try { Object.assign(S.vis, JSON.parse(localStorage.getItem('sentinel.vis') || '{}')); } catch { /* storage unavailable */ }
  try { S.tab = localStorage.getItem('sentinel.tab') || 'brief'; } catch { /* storage unavailable */ }

  // ---------------- map ----------------
  const map = L.map('map', { worldCopyJump: true, minZoom: 2, maxZoom: 12, zoomSnap: 0.5, attributionControl: true }).setView([24, 45], 3);
  // ---- imagery: dark cartography, or satellite imagery on both views ----
  const yesterday = () => new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
  const GIBS = (layer, date, level, ext) => (z, x, y) => `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/GoogleMapsCompatible_Level${level}/${z}/${y}/${x}.${ext}`;
  const IMAGERY = {
    night: { label: 'Night lights (globe) · dark map', globeTex: 'night' },
    dark: { label: 'Dark cartography', globeTex: 'dark' },
    marble: { label: 'Blue Marble (globe) · Esri map', globeTex: 'marble', map: 'esri' },
    esri: { label: 'Esri World Imagery (high-res)', tiles: () => (z, x, y) => `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${z}/${y}/${x}`, max: 17,
      attr: 'Imagery © Esri, Maxar, Earthstar Geographics' },
    s2: { label: 'Sentinel-2 cloudless (EOX, 2016)', tiles: () => (z, x, y) => `https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless_3857/default/g/${z}/${y}/${x}.jpg`, max: 14,
      attr: '<a href="https://s2maps.eu">Sentinel-2 cloudless</a> by EOX (CC BY 4.0, contains Copernicus data)' },
    modis: { label: 'NASA MODIS Terra true colour (daily)', dated: true, tiles: (d) => GIBS('MODIS_Terra_CorrectedReflectance_TrueColor', d, 9, 'jpg'), max: 9, attr: 'NASA GIBS / EOSDIS' },
    viirs: { label: 'NASA VIIRS SNPP true colour (daily)', dated: true, tiles: (d) => GIBS('VIIRS_SNPP_CorrectedReflectance_TrueColor', d, 9, 'jpg'), max: 9, attr: 'NASA GIBS / EOSDIS' },
    blackmarble: { label: 'NASA Black Marble night lights', tiles: () => GIBS('VIIRS_Black_Marble', '2016-01-01', 8, 'png'), max: 8, attr: 'NASA Black Marble / GIBS' },
  };
  const cartoDark = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', maxZoom: 12,
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OSM</a> © <a href="https://carto.com/">CARTO</a>' }).addTo(map);
  let imageryLayer = null;
  function applyImagery() {
    const def = IMAGERY[S.imagery] || IMAGERY.night;
    const date = S.imgDate || yesterday();
    if (imageryLayer) { map.removeLayer(imageryLayer); imageryLayer = null; }
    const mapDef = def.map ? IMAGERY[def.map] : def;
    if (mapDef.tiles) {
      const fn = mapDef.tiles(date);
      const TL = L.TileLayer.extend({ getTileUrl: (c) => fn(c.z, c.x, c.y) });
      imageryLayer = new TL('', { maxNativeZoom: mapDef.max, maxZoom: 12, attribution: mapDef.attr }).addTo(map);
      imageryLayer.bringToBack(); cartoDark.setOpacity(0);
    } else cartoDark.setOpacity(1);
    const G = window.SentinelGlobe;
    if (G) { if (def.tiles) { const fn = def.tiles(date); G.setTiles((x, y, l) => fn(l, x, y), Math.min(def.max, 12)); } else G.setTexture(def.globeTex); }
    const dt = $('#imgDateWrap'); if (dt) dt.hidden = !def.dated;
  }
  map.createPane('labels'); map.getPane('labels').style.zIndex = 390; map.getPane('labels').style.pointerEvents = 'none';
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png', { subdomains: 'abcd', pane: 'labels', maxZoom: 12, opacity: 0.55 }).addTo(map);

  // Canvas layer for thousands of moving glyphs (aircraft, ships, fires) with hit-testing.
  const GlyphLayer = L.Layer.extend({
    initialize(draw, radius = 8) { this._draw = draw; this._items = []; this._r = radius; },
    onAdd(m) {
      this._map = m;
      this._c = L.DomUtil.create('canvas', 'leaflet-zoom-hide');
      this._c.style.pointerEvents = 'none';
      m.getPanes().overlayPane.appendChild(this._c);
      m.on('move zoomend resize viewreset', this._schedule, this);
      this._reset();
    },
    onRemove(m) { this._c.remove(); m.off('move zoomend resize viewreset', this._schedule, this); },
    setData(items) { this._items = items; this._schedule(); },
    _schedule() { if (!this._raf) this._raf = requestAnimationFrame(() => { this._raf = null; this._reset(); }); },
    _reset() {
      const m = this._map; if (!m) return;
      const size = m.getSize(); const dpr = window.devicePixelRatio || 1;
      const c = this._c;
      L.DomUtil.setPosition(c, m.containerPointToLayerPoint([0, 0]));
      c.width = size.x * dpr; c.height = size.y * dpr; c.style.width = `${size.x}px`; c.style.height = `${size.y}px`;
      const ctx = c.getContext('2d'); ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const b = m.getBounds().pad(0.05); const z = m.getZoom();
      this._screen = [];
      for (const it of this._items) {
        if (!b.contains([it.lat, it.lon]) && !b.contains([it.lat, it.lon + 360]) && !b.contains([it.lat, it.lon - 360])) continue;
        const p = m.latLngToContainerPoint([it.lat, it.lon]);
        this._draw(ctx, p, it, z);
        this._screen.push([p.x, p.y, it]);
      }
    },
    hit(pt) {
      let best = null; let bd = this._r * this._r;
      for (const [x, y, it] of this._screen || []) {
        const d = (x - pt.x) ** 2 + (y - pt.y) ** 2;
        if (d < bd) { bd = d; best = it; }
      }
      return best;
    },
  });

  const COLORS = {};
  const loadColors = () => Object.assign(COLORS, {
    airCivil: css('--air-civil'), airMil: css('--air-mil'), cargo: css('--ship-cargo'), tanker: css('--ship-tanker'),
    shipMil: css('--ship-mil'), shipOther: css('--ship-other'), fire: css('--fire'), quake: css('--quake'),
    good: css('--good'), guarded: css('--guarded'), warning: css('--warning'), serious: css('--serious'), critical: css('--critical'), muted: css('--text-muted'),
    protest: css('--protest'), riot: css('--riot'), kinetic: css('--kinetic'), clash: css('--clash'), drone: css('--drone'), gnss: css('--gnss'),
    outage: css('--outage'), sat: css('--sat'), lane: css('--accent'), contested: css('--contested'),
    geo_protest: css('--protest'), geo_shutdown: css('--outage'), geo_cyber: '#8be9fd', geo_jamming: css('--gnss'),
  });
  loadColors();

  function shipClass(t) {
    if (t === null || t === undefined) return 'unknown';
    if (t >= 80 && t <= 89) return 'tanker';
    if (t >= 70 && t <= 79) return 'cargo';
    if (t >= 60 && t <= 69) return 'passenger';
    if (t === 35 || t === 55) return 'military';
    if (t === 30) return 'fishing';
    return 'other';
  }
  const shipColor = (c) => ({ tanker: COLORS.tanker, cargo: COLORS.cargo, military: COLORS.shipMil }[c] || COLORS.shipOther);

  function drawPlane(ctx, p, a, z) {
    const s = a.mil ? (z >= 6 ? 7 : 5.5) : (z >= 6 ? 5 : 3.2);
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(((a.hdg || 0) * Math.PI) / 180);
    ctx.beginPath(); ctx.moveTo(0, -s * 1.4); ctx.lineTo(s, s); ctx.lineTo(0, s * 0.45); ctx.lineTo(-s, s); ctx.closePath();
    ctx.fillStyle = a.mil ? COLORS.airMil : COLORS.airCivil; ctx.globalAlpha = a.mil ? 1 : 0.75; ctx.fill();
    if (a.sq === '7700' || a.sq === '7500' || a.sq === '7600') { ctx.globalAlpha = 1; ctx.strokeStyle = COLORS.critical; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, s * 2.2, 0, 7); ctx.stroke(); }
    ctx.restore();
    if (a.mil && z >= 6 && a.cs) { ctx.font = '10px IBM Plex Mono, monospace'; ctx.fillStyle = COLORS.airMil; ctx.fillText(a.cs, p.x + 8, p.y - 6); }
  }
  function drawShip(ctx, p, s, z) {
    const c = shipColor(shipClass(s.type)); const r = z >= 7 ? 5 : 3.5;
    ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = c; ctx.strokeStyle = c;
    if ((s.sog ?? 0) >= 1 && s.cog !== null && s.cog !== undefined) {
      ctx.rotate((s.cog * Math.PI) / 180);
      ctx.beginPath(); ctx.moveTo(0, -r * 1.6); ctx.lineTo(r * 0.8, r); ctx.lineTo(-r * 0.8, r); ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, r * 0.7, 0, 7); ctx.globalAlpha = 0.9; ctx.lineWidth = 1.5; ctx.stroke();
    }
    ctx.restore();
  }
  function drawEvent(ctx, p, e) {
    const col = { protest: COLORS.protest, riot: COLORS.riot, aerial: COLORS.kinetic, clash: COLORS.clash, mass: COLORS.critical }[e.kind];
    const r = 2.5 + Math.min(4, e.articles / 2);
    ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = col; ctx.strokeStyle = col; ctx.globalAlpha = 0.85;
    if (e.kind === 'aerial') { ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-r, -r); ctx.lineTo(r, r); ctx.moveTo(r, -r); ctx.lineTo(-r, r); ctx.stroke(); }
    else if (e.kind === 'clash' || e.kind === 'mass') { ctx.rotate(Math.PI / 4); ctx.fillRect(-r * 0.75, -r * 0.75, r * 1.5, r * 1.5); }
    else { ctx.beginPath(); ctx.arc(0, 0, r, 0, 7); ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; ctx.lineWidth = 1; ctx.stroke(); }
    ctx.restore();
  }
  function drawGeo(ctx, p, g) {
    const r = 3 + Math.min(8, Math.sqrt(g.count) * 2);
    ctx.beginPath(); ctx.rect(p.x - r / 2, p.y - r / 2, r, r);
    ctx.strokeStyle = COLORS[`geo_${g.topic}`] || COLORS.drone; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.9; ctx.stroke(); ctx.globalAlpha = 1;
  }
  function drawUav(ctx, p, a) {
    ctx.save(); ctx.translate(p.x, p.y); ctx.strokeStyle = COLORS.drone; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, 7); ctx.stroke();
    ctx.rotate(((a.hdg || 0) * Math.PI) / 180); ctx.fillStyle = COLORS.drone;
    ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, 4); ctx.lineTo(0, 1); ctx.lineTo(-6, 4); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function drawGnss(ctx, p) {
    ctx.strokeStyle = COLORS.gnss; ctx.lineWidth = 1.5; ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y); ctx.lineTo(p.x + 5, p.y); ctx.moveTo(p.x, p.y - 5); ctx.lineTo(p.x, p.y + 5); ctx.stroke();
    ctx.beginPath(); ctx.arc(p.x, p.y, 7, 0, 7); ctx.globalAlpha = 0.5; ctx.stroke(); ctx.globalAlpha = 1;
  }
  function drawSat(ctx, p, s) {
    ctx.fillStyle = s.group === 'Military' ? '#ffffff' : '#b8c7d6'; ctx.globalAlpha = 0.9;
    ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3); ctx.fillRect(p.x - 5, p.y - 0.5, 10, 1); ctx.globalAlpha = 1;
  }
  function drawFire(ctx, p, f) {
    ctx.beginPath(); ctx.arc(p.x, p.y, 2 + Math.min(4, (f.frp || 0) / 15), 0, 7);
    ctx.fillStyle = COLORS.fire; ctx.globalAlpha = 0.65; ctx.fill(); ctx.globalAlpha = 1;
  }

  const L_ = {
    civair: new GlyphLayer(drawPlane, 7), milair: new GlyphLayer(drawPlane, 9), ships: new GlyphLayer(drawShip, 7), fires: new GlyphLayer(drawFire, 5),
    choke: L.layerGroup(), hot: L.layerGroup(), quakes: L.layerGroup(), eonet: L.layerGroup(), gdacs: L.layerGroup(), focus: L.layerGroup().addTo(map),
    unrest: new GlyphLayer(drawEvent, 7), kinetic: new GlyphLayer(drawEvent, 7), drones: new GlyphLayer((c, p, it, z) => (it._t === 'geo' ? drawGeo(c, p, it) : drawUav(c, p, it, z)), 10),
    gnss: new GlyphLayer(drawGnss, 8), sats: new GlyphLayer(drawSat, 7), newsgeo: new GlyphLayer(drawGeo, 8), outages: L.layerGroup(), lanes: L.layerGroup(),
    countries: L.layerGroup(), contested: L.layerGroup(), bases: L.layerGroup(), terminator: L.layerGroup(), footprints: L.layerGroup(),
  };
  const LAYER_META = [
    ['choke', 'Chokepoints', 'var(--accent)'], ['hot', 'Conflict theatres', 'var(--serious)'], ['milair', 'Military aircraft', 'var(--air-mil)'],
    ['civair', 'Air traffic (chokepoints)', 'var(--air-civil)'], ['ships', 'Vessels (AIS)', 'var(--ship-cargo)'], ['fires', 'Thermal anomalies', 'var(--fire)'],
    ['quakes', 'Earthquakes', 'var(--quake)'], ['eonet', 'Natural events', '#d9dee3'], ['gdacs', 'GDACS alerts', 'var(--warning)'],
    ['unrest', 'Protests & riots', 'var(--protest)'], ['kinetic', 'Airstrikes & clashes', 'var(--kinetic)'], ['drones', 'Drones (UAV + reports)', 'var(--drone)'],
    ['gnss', 'GPS jamming / spoofing', 'var(--gnss)'], ['outages', 'Internet outages', 'var(--outage)'], ['sats', 'Recon satellites', 'var(--sat)'],
    ['lanes', 'Sea lanes', 'var(--accent)'], ['newsgeo', 'Geo-reports: protest/shutdown/cyber/EW', '#8be9fd'],
    ['countries', 'Country lens (choropleth)', 'linear-gradient(90deg,var(--good),var(--warning),var(--critical))'], ['contested', 'Disputed areas & lines', 'var(--contested)'],
    ['bases', 'Overseas military bases', '#9fb3c8'], ['terminator', 'Day / night terminator', '#0a1830'], ['footprints', 'Sensor footprints (LEO, ±30°)', 'var(--sat)'],
  ];
  const LAYER_GROUPS = [['Geopolitics', ['countries', 'contested', 'bases']], ['Theatres', ['choke', 'hot', 'lanes']], ['Live activity', ['unrest', 'kinetic', 'drones', 'gnss', 'outages', 'newsgeo']],
    ['Tracks', ['milair', 'civair', 'ships']], ['Space', ['sats', 'footprints', 'terminator']], ['Hazards', ['fires', 'quakes', 'eonet', 'gdacs']]];
  const applyVis = () => {
    for (const [k] of LAYER_META) { if (S.vis[k]) L_[k].addTo(map); else map.removeLayer(L_[k]); }
    window.SentinelGlobe?.setVis(S.vis);
    try { localStorage.setItem('sentinel.vis', JSON.stringify(S.vis)); } catch { /* ignore */ }
  };
  applyVis();

  // Hover + click on canvas glyphs
  const hover = $('#hoverCard');
  const glyphHit = (pt) => {
    for (const k of ['drones', 'milair', 'kinetic', 'unrest', 'gnss', 'ships', 'sats', 'newsgeo', 'civair', 'fires']) {
      if (!S.vis[k]) continue;
      const it = L_[k].hit(pt); if (it) return [k, it];
    }
    return null;
  };
  const kv = (rows) => `<div class="kv">${rows.filter(([, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => `<span>${esc(k)}</span><b>${esc(v)}</b>`).join('')}</div>`;
  const NAV = { 0: 'Under way (engine)', 1: 'At anchor', 2: 'Not under command', 3: 'Restricted manoeuvrability', 5: 'Moored', 7: 'Fishing', 8: 'Under way (sail)' };
  const KIND = { protest: 'PROTEST', riot: 'RIOT / VIOLENT PROTEST', aerial: 'AIRSTRIKE / DRONE STRIKE', clash: 'ARMED CLASH', mass: 'MASS VIOLENCE' };
  function itemCard(it) {
    if (it._t === 'air') return glyphCard([it.uav ? 'drones' : it.degraded ? 'gnss' : it.mil ? 'milair' : 'civair', it]);
    if (it._t === 'ship') return glyphCard(['ships', it]);
    if (it._t === 'fire') return glyphCard(['fires', it]);
    if (it._t === 'event') return glyphCard(['kinetic', it]);
    if (it._t === 'geo') return glyphCard(['newsgeo', it]);
    if (it._t === 'sat') return glyphCard(['sats', it]);
    if (it._t === 'outage') return outageCard(it);
    if (it._t === 'quake') return `<div class="h" style="color:${COLORS.quake}">M${fmt(it.mag)} — ${esc(it.place)}</div>${kv([['Depth', `${Math.round(it.depth)} km`], ['Time', new Date(it.time).toUTCString().slice(5, 22)], ['Tsunami flag', it.tsunami ? 'yes' : 'no']])}`;
    if (it._t === 'gdacs') return `<div class="h">GDACS ${esc(it.level)} — ${esc(it.name)}</div>${kv([['Type', it.type], ['Country', it.country], ['Severity', it.severity]])}`;
    if (it._t === 'eonet') return `<div class="h">${esc(it.title)}</div>${kv([['Category', it.cat]])}`;
    return '';
  }
  function outageCard(o) {
    return `<div class="h" style="color:${COLORS.outage}">INTERNET OUTAGE — ${esc(o.name)}</div>${kv([['Status', o.ongoing ? 'ONGOING' : o.critical ? 'critical alerts' : 'alerts'], ['IODA alerts 24h', o.alerts], ['Critical', o.critical], ['Signals', o.sources.join(', ')]])}`
      + o.causes.slice(0, 3).map((c) => `<div class="det">${esc((c.cause || '').replace(/_/g, ' ').toLowerCase())}: ${esc(c.description || '')}${c.end ? '' : ' <b>(ongoing)</b>'}</div>`).join('');
  }
  function glyphCard([k, it]) {
    if (it._t === 'event' || k === 'unrest' || k === 'kinetic') {
      const col = { protest: COLORS.protest, riot: COLORS.riot, aerial: COLORS.kinetic, clash: COLORS.clash, mass: COLORS.critical }[it.kind];
      return `<div class="h" style="color:${col}">${KIND[it.kind]}</div><div style="margin-bottom:4px">${esc(it.place)}</div>`
        + kv([['CAMEO', it.code], ['Actors', [it.actor1, it.actor2].filter(Boolean).join(' → ')], ['Articles', it.articles], ['Tone', it.tone], ['Coded', ago(it.ts)], ['Geo precision', it.precise ? 'city' : 'region']])
        + '<div class="det muted">Machine-coded from news (GDELT). Corroborate.</div>';
    }
    if (it._t === 'geo' || k === 'newsgeo') return `<div class="h" style="color:${COLORS[`geo_${it.topic}`]}">${esc(it.topic.toUpperCase())} REPORTS — ${esc(it.name)}</div>${kv([['Articles (24h)', it.count]])}${it.title ? `<div class="det">${esc(it.title)}</div>` : ''}`;
    if (it._t === 'sat' || k === 'sats') return `<div class="h" style="color:${COLORS.sat}">🛰 ${esc(it.name)}</div>${kv([['Group', it.group], ['Altitude', `${fmt(Math.round(it.altKm))} km`], ['Velocity', `${fmt(it.vel)} km/s`], ['Sub-point', `${it.lat.toFixed(2)}, ${it.lon.toFixed(2)}`], ['NORAD', it.norad]])}`;
    if (k === 'gnss') return glyphCard(['milair', it]).replace('</div>', ` · <span style="color:${COLORS.gnss}">GNSS DEGRADED</span></div>`);
    if (k === 'drones' && it.uav) return glyphCard(['milair', it]).replace('</div>', ` · <span style="color:${COLORS.drone}">UAV</span></div>`);
    if (k === 'milair' || k === 'civair') return `<div class="h" style="color:${it.mil ? COLORS.airMil : COLORS.airCivil}">${esc(it.cs || it.id)} ${it.mil ? '· MIL' : ''}</div>`
      + kv([['Type', it.type], ['Reg', it.reg], ['Hex', it.id], ['Altitude', it.alt === 0 ? 'ground' : it.alt ? `${fmt(it.alt)} ft` : null], ['Speed', it.spd ? `${Math.round(it.spd)} kt` : null], ['Heading', it.hdg !== null ? `${Math.round(it.hdg)}°` : null], ['Squawk', it.sq], ['NACp', it.nacp], ['Source', it.src]]);
    if (k === 'ships') return `<div class="h" style="color:${shipColor(shipClass(it.type))}">${esc(it.name || `MMSI ${it.id}`)}</div>`
      + kv([['Class', shipClass(it.type)], ['MMSI', it.id], ['Speed', it.sog !== null ? `${fmt(it.sog)} kn` : null], ['Course', it.cog !== null ? `${Math.round(it.cog)}°` : null], ['Status', NAV[it.nav]], ['Destination', it.dest], ['Source', it.src]]);
    return `<div class="h" style="color:${COLORS.fire}">Thermal anomaly</div>` + kv([['FRP', `${fmt(it.frp)} MW`], ['Detected', `${it.date} ${it.time}Z`], ['Sensor', 'VIIRS S-NPP']]);
  }
  map.on('mousemove', (e) => {
    const h = glyphHit(e.containerPoint);
    if (!h) { hover.hidden = true; map.getContainer().style.cursor = ''; return; }
    showHover(glyphCard(h), e.containerPoint.x, e.containerPoint.y); map.getContainer().style.cursor = 'pointer';
  });
  map.on('mousemove', (e) => setCursor(e.latlng.lat, e.latlng.lng));
  function showHover(html, x, y) {
    hover.innerHTML = html; hover.hidden = false;
    const W = $('#viewport').clientWidth;
    hover.style.left = `${x > W - 300 ? x - 290 : x + 14}px`; hover.style.top = `${y + 14}px`;
  }
  map.on('mouseout', () => { hover.hidden = true; });
  map.on('click', (e) => {
    const h = glyphHit(e.containerPoint);
    if (h) { L.popup({ className: 'glyph-pop' }).setLatLng(e.latlng).setContent(glyphCard(h) + extLink(h)).openOn(map); if (h[1]._t === 'sat') selectSat(h[1]); }
  });
  const extLink = ([k, it]) => (k === 'milair' || k === 'civair' ? `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="https://globe.adsb.lol/?icao=${encodeURIComponent(it.id)}">Track on adsb.lol ↗</a></div>`
    : it._t === 'event' && it.url ? `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="${esc(it.url)}">Source article ↗</a></div>`
    : it._t === 'geo' && it.url ? `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="${esc(it.url)}">Report ↗</a></div>`
    : k === 'ships' ? `<div style="margin-top:6px"><a target="_blank" rel="noopener" href="https://www.marinetraffic.com/en/ais/details/ships/mmsi:${encodeURIComponent(it.id)}">Vessel record ↗</a></div>` : '');

  // ---------------- rendering: map entities ----------------
  const statusColor = (st) => COLORS[st] || COLORS.muted;

  // Sea lanes linking chokepoints; coloured by the riskier end.
  const LANES = [['hormuz', 'babelmandeb'], ['hormuz', 'malacca'], ['hormuz', 'goodhope'], ['babelmandeb', 'suez'], ['suez', 'gibraltar'], ['suez', 'bosporus'],
    ['gibraltar', 'dover'], ['dover', 'danish'], ['malacca', 'taiwan'], ['taiwan', 'korea'], ['malacca', 'lombok'], ['lombok', 'goodhope'], ['goodhope', 'gibraltar'],
    ['bosporus', 'kerch'], ['panama', 'gibraltar'], ['malacca', 'babelmandeb']];
  function renderLanes() {
    const sm = S.summary; if (!sm) return;
    const by = Object.fromEntries(sm.chokepoints.map((c) => [c.id, c]));
    const lanes = LANES.map(([a, b]) => { const A = by[a]; const B = by[b]; const w = (A.score ?? 0) > (B.score ?? 0) ? A : B; return { a: A, b: B, color: statusColor(w.level.status) }; });
    L_.lanes.clearLayers();
    for (const l of lanes) L.polyline(greatCircle(l.a, l.b), { color: l.color, weight: 1.2, opacity: 0.55, dashArray: '2 6', interactive: false }).addTo(L_.lanes);
    window.SentinelGlobe?.update('lanes', lanes);
  }
  function greatCircle(a, b, n = 48) {
    const r = Math.PI / 180; const [la1, lo1, la2, lo2] = [a.lat * r, a.lon * r, b.lat * r, b.lon * r];
    const d = 2 * Math.asin(Math.sqrt(Math.sin((la2 - la1) / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin((lo2 - lo1) / 2) ** 2));
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const f = i / n; const A = Math.sin((1 - f) * d) / Math.sin(d); const B = Math.sin(f * d) / Math.sin(d);
      const x = A * Math.cos(la1) * Math.cos(lo1) + B * Math.cos(la2) * Math.cos(lo2); const y = A * Math.cos(la1) * Math.sin(lo1) + B * Math.cos(la2) * Math.sin(lo2); const z = A * Math.sin(la1) + B * Math.sin(la2);
      pts.push([Math.atan2(z, Math.sqrt(x * x + y * y)) / r, Math.atan2(y, x) / r]);
    }
    for (let i = 1; i < pts.length; i++) { while (pts[i][1] - pts[i - 1][1] > 180) pts[i][1] -= 360; while (pts[i][1] - pts[i - 1][1] < -180) pts[i][1] += 360; }
    return pts;
  }

  // ---------------- geopolitical lens ----------------
  const GEOREF = window.GEOREF;
  let countryGeo = null;
  function lensStyle(props) {
    const st = window.SentinelGeo.style(S.lens, S.countryStats[props.iso || props.name], S.bloc);
    const max = { risk: 100, advisory: 4, unrest: 60, kinetic: 30, outages: 3, bloc: 2, sanctions: 3, nuclear: 3, satcov: 12 }[S.lens] || 1;
    return { ...st, norm: st.v === undefined ? 0 : Math.min(1, st.v / max) };
  }
  function recomputeCountries() {
    const G = window.SentinelGeo; if (!G?.features.length) return;
    S.countryStats = G.stats({ summary: S.summary, events: S.events, outages: S.activity.outages, advisories: S.activity.advisories, sats: S.sats });
    if (countryGeo) countryGeo.setStyle(mapCountryStyle);
    window.SentinelGlobe?.setCountryStyle(lensStyle, S.extrude);
    $('#lensLegend').innerHTML = G.legend(S.lens, S.bloc);
    if (S.tab === 'geo') renderTab();
    if (S.country) renderCountry();
  }
  // Coalesce bursts; recompute at most every 2 s.
  const scheduleCountries = (() => { let t = null; let last = 0; return () => { if (t) return; t = setTimeout(() => { t = null; last = Date.now(); recomputeCountries(); }, Math.max(400, 2000 - (Date.now() - last))); }; })();
  function mapCountryStyle(f) {
    const st = lensStyle(f.properties); const sel = f.properties.iso && f.properties.iso === S.country;
    return { color: sel ? '#ffffff' : 'rgba(170,190,210,0.35)', weight: sel ? 2 : 0.6, fillColor: st.fill || '#000', fillOpacity: st.fill ? (st.fill.startsWith('rgba') ? 1 : 0.5) : 0 };
  }
  async function initCountries() {
    const G = window.SentinelGeo; if (!G) return;
    try { await G.load(); } catch (e) { console.warn('countries', e); return; }
    map.createPane('countries'); map.getPane('countries').style.zIndex = 350;
    countryGeo = L.geoJSON({ type: 'FeatureCollection', features: G.features }, { pane: 'countries', style: mapCountryStyle,
      onEachFeature: (f, layer) => {
        layer.on('mouseover', (e) => { if (!glyphHit(e.containerPoint)) { layer.setStyle({ weight: 1.6, color: '#fff' }); showHover(countryHover(f.properties), e.containerPoint.x, e.containerPoint.y); } });
        layer.on('mouseout', () => { countryGeo.resetStyle(layer); });
        layer.on('click', (e) => { if (!glyphHit(e.containerPoint)) openCountry(f.properties.iso || f.properties.name); });
      } }).addTo(L_.countries);
    window.SentinelGlobe?.update('countries', G.features.map((f) => Object.assign(f, { _k: 'country' })));
    // Reference layers
    for (const c of GEOREF.contested) {
      const col = COLORS.contested; const tip = `<div class="h" style="color:${col}">DISPUTED — ${esc(c.name)}</div><div>${esc(c.parties)}</div><div class="det muted">Approximate; for orientation only.</div>`;
      const lyr = c.ring ? L.polygon(c.ring, { color: col, weight: 1.5, dashArray: '4 3', fillColor: col, fillOpacity: 0.15 })
        : c.line ? L.polyline(c.line, { color: col, weight: 2, dashArray: c.dashed ? '6 6' : null })
          : L.circleMarker(c.at, { radius: 6, color: col, weight: 2, fillOpacity: 0.2 });
      lyr.bindPopup(tip).addTo(L_.contested);
    }
    for (const b of GEOREF.bases) {
      const col = baseColor(b.operator);
      L.marker([b.lat, b.lon], { icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="base-mark" style="border-color:${col}"></div>` }) })
        .bindPopup(`<div class="h" style="color:${col}">${esc(b.name)}</div>${kv([['Operator', b.operator], ['Host', b.host], ['Position', `${b.lat.toFixed(2)}, ${b.lon.toFixed(2)}`]])}<div class="det muted">Reference: public reporting, approximate.</div>`)
        .addTo(L_.bases);
    }
    window.SentinelGlobe?.update('contested', GEOREF.contested);
    window.SentinelGlobe?.update('bases', GEOREF.bases.map((b) => ({ ...b, color: baseColor(b.operator) })));
    recomputeCountries(); renderRail();
  }
  const baseColor = (op) => (/^US/.test(op) ? '#6fa8ff' : /^RU/.test(op) ? '#ff6b6b' : /^CN/.test(op) ? '#ffb347' : '#c9d4df');
  function countryHover(p) {
    const s = S.countryStats[p.iso || p.name] || {};
    const st = window.SentinelGeo.style(S.lens, s, S.bloc);
    const L = window.SentinelGeo.LENSES.find((x) => x.id === S.lens);
    return `<div class="h">${esc(p.name)}</div>${kv([[L.label, st.label ?? 'no data'], ['Risk index', s.risk], ['Advisory', s.advisory ? `Level ${s.advisory}` : null], ['Unrest / kinetic 24h', s.unrest === null ? null : `${s.unrest} / ${s.kinetic}`],
      ['Blocs', (s.blocs || []).join(', ') || null], ['Satellites overhead', s.satsOver]])}<div class="det muted">Click for country card</div>`;
  }

  function renderEntitiesOnMap() {
    const sm = S.summary; if (!sm) return;
    scheduleCountries();
    window.SentinelGlobe?.update('entities', [...sm.chokepoints, ...sm.hotspots]);
    renderLanes();
    L_.choke.clearLayers();
    for (const c of sm.chokepoints) {
      const col = statusColor(c.level.status);
      L.circle([c.lat, c.lon], { radius: c.radiusKm * 1000, color: col, weight: 1.5, opacity: 0.9, fillColor: col, fillOpacity: 0.07, dashArray: '4 4' })
        .on('click', () => openEntity('chokepoint', c.id)).addTo(L_.choke);
      L.marker([c.lat, c.lon], { icon: L.divIcon({ className: '', html: `<div class="cp-label" style="color:${col}"><span class="t">${esc(c.name)}</span><b>${c.score ?? '—'}</b></div>`, iconSize: [0, 0] }) })
        .on('click', () => openEntity('chokepoint', c.id)).addTo(L_.choke);
    }
    L_.hot.clearLayers();
    for (const h of sm.hotspots) {
      const col = statusColor(h.level.status);
      L.marker([h.lat, h.lon], { icon: L.divIcon({ className: '', html: `<div class="hs-mark" style="color:${col}"></div>`, iconSize: [0, 0] }), title: `${h.name}: ${h.level.label} ${h.score ?? ''}` })
        .on('click', () => openEntity('hotspot', h.id)).addTo(L_.hot);
      L.marker([h.lat, h.lon], { interactive: false, icon: L.divIcon({ className: '', html: `<div class="hs-name">${esc(h.name)} <span style="color:${col}">${h.score ?? '—'}</span></div>`, iconSize: [0, 0] }) }).addTo(L_.hot);
    }
  }

  function renderHazardsOnMap() {
    const hz = S.hazards;
    L_.quakes.clearLayers();
    for (const q of hz.quakes) {
      L.circleMarker([q.lat, q.lon], { radius: Math.max(3, (q.mag - 2) * 3), color: COLORS.quake, weight: 1.5, fillOpacity: q.mag >= 6 ? 0.45 : 0.15 })
        .bindPopup(`<div class="h">M${fmt(q.mag)} — ${esc(q.place)}</div>${kv([['Depth', `${Math.round(q.depth)} km`], ['Time', new Date(q.time).toUTCString().slice(5, 22)], ['Tsunami flag', q.tsunami ? 'yes' : 'no'], ['PAGER', q.alert]])}${q.url ? `<a target="_blank" rel="noopener" href="${esc(q.url)}">USGS event ↗</a>` : ''}`)
        .addTo(L_.quakes);
    }
    L_.eonet.clearLayers();
    for (const e of hz.eonet) {
      L.circleMarker([e.lat, e.lon], { radius: 4, color: '#d9dee3', weight: 1, fillColor: '#d9dee3', fillOpacity: 0.5 })
        .bindPopup(`<div class="h">${esc(e.title)}</div>${kv([['Category', e.cat], ['Updated', e.date?.slice(0, 16)]])}${e.url ? `<a target="_blank" rel="noopener" href="${esc(e.url)}">Source ↗</a>` : ''}`)
        .addTo(L_.eonet);
    }
    L_.gdacs.clearLayers();
    const gcol = { Red: COLORS.critical, Orange: COLORS.serious, Green: COLORS.good };
    for (const g of hz.gdacs) {
      L.marker([g.lat, g.lon], { icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div style="width:11px;height:11px;transform:translate(-50%,-50%) rotate(45deg);border:2px solid ${gcol[g.level] || COLORS.muted};background:rgba(0,0,0,.5)"></div>` }) })
        .bindPopup(`<div class="h">GDACS ${esc(g.level)} — ${esc(g.name)}</div>${kv([['Type', g.type], ['Country', g.country], ['Severity', g.severity], ['From', g.from?.slice(0, 10)]])}${g.url ? `<a target="_blank" rel="noopener" href="${esc(g.url)}">Report ↗</a>` : ''}`)
        .addTo(L_.gdacs);
    }
    const fires = hz.fires.map(([lat, lon, frp, date, time]) => ({ _t: 'fire', lat, lon, frp, date, time }));
    L_.fires.setData(fires);
    const G = window.SentinelGlobe;
    if (G) { G.update('fires', fires); G.update('quakes', hz.quakes.map((q) => ({ ...q, _t: 'quake' }))); G.update('gdacs', hz.gdacs.map((g) => ({ ...g, _t: 'gdacs' }))); G.update('eonet', hz.eonet.map((e) => ({ ...e, _t: 'eonet' }))); }
  }

  function renderActivity() {
    const a = S.activity;
    const ev = a.events.map(([id, kind, lat, lon, place, code, actor1, actor2, articles, tone, ts, url, precise, cc]) => ({ _t: 'event', id, kind, lat, lon, place, code, actor1, actor2, articles, tone, ts, url, precise: !!precise, cc }));
    S.events = ev;
    L_.unrest.setData(ev.filter((e) => e.kind === 'protest' || e.kind === 'riot'));
    L_.kinetic.setData(ev.filter((e) => e.kind === 'aerial' || e.kind === 'clash' || e.kind === 'mass'));
    const geo = Object.fromEntries(Object.entries(a.geo || {}).map(([k, pts]) => [k, pts.map((p) => ({ ...p, _t: 'geo' }))]));
    L_.newsgeo.setData(['protest', 'shutdown', 'cyber', 'jamming'].flatMap((t) => geo[t] || []));
    L_.outages.clearLayers();
    for (const o of a.outages) {
      const col = COLORS.outage; const big = o.ongoing || o.critical;
      L.circleMarker([o.lat, o.lon], { radius: big ? 14 : 9, color: col, weight: big ? 2.5 : 1.5, fillColor: col, fillOpacity: big ? 0.25 : 0.1, dashArray: o.ongoing ? null : '3 3' })
        .bindPopup(outageCard(o)).addTo(L_.outages);
      L.marker([o.lat, o.lon], { interactive: false, icon: L.divIcon({ className: '', iconSize: [0, 0], html: `<div class="out-label" style="color:${col}">⌁ ${esc(o.name)}</div>` }) }).addTo(L_.outages);
    }
    const G = window.SentinelGlobe;
    if (G) { G.update('events', ev); G.update('geo', geo); G.update('outages', a.outages.map((o) => ({ ...o, _t: 'outage' }))); }
    updateDrones();
    scheduleCountries();
  }
  function updateDrones() {
    const geo = (S.activity.geo?.drone || []).map((p) => ({ ...p, _t: 'geo' }));
    L_.drones.setData([...(S.airObjs || []).filter((a) => a.uav), ...geo]);
  }

  // ---------------- satellites (SGP4 in the browser) ----------------
  function loadSatRecs(list) {
    if (typeof satellite === 'undefined') return;
    S.satRecs = list.map((t) => { try { const rec = satellite.twoline2satrec(t.l1, t.l2); return rec.error ? null : { rec, name: t.name, group: t.group, norad: t.l1.slice(2, 7).trim(), orbit: window.SentinelOrbits.classify(rec) }; } catch { return null; } }).filter(Boolean);
    propagateSats();
  }
  function satAt(s, when) {
    const pv = satellite.propagate(s.rec, when);
    if (!pv || !pv.position) return null;
    const g = satellite.eciToGeodetic(pv.position, satellite.gstime(when));
    const v = pv.velocity; const vel = v ? Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z) : null;
    return { lat: satellite.degreesLat(g.latitude), lon: satellite.degreesLong(g.longitude), altKm: g.height, vel: vel && +vel.toFixed(2) };
  }
  function propagateSats() {
    if (!S.satRecs.length) return;
    const now = new Date();
    S.sats = S.satRecs.map((s) => { const p = satAt(s, now); return p && Number.isFinite(p.lat) ? { _t: 'sat', name: s.name, group: s.group, norad: s.norad, orbit: s.orbit.cls, sso: s.orbit.sso, ...p } : null; }).filter(Boolean);
    L_.sats.setData(S.sats);
    if (Date.now() - (S.fpTs || 0) > 10_000) { S.fpTs = Date.now(); renderFootprints(); }
    if (S.follow && S.selSat) { const cur = S.sats.find((x) => x.name === S.selSat.name); if (cur) { if (S.view === 'globe') window.SentinelGlobe?.flyTo(cur.lat, cur.lon, 1.6); else map.panTo([cur.lat, cur.lon]); } }
    window.SentinelGlobe?.update('sats', S.sats);
    if (S.selSat) selectSat(S.selSat, true);
    if (Date.now() - (S.covTs || 0) > 8000 && S.lens === 'satcov') { S.covTs = Date.now(); recomputeCountries(); }
  }
  function selectSat(sat, quiet) {
    const s = S.satRecs.find((x) => x.name === sat.name); if (!s) return;
    S.selSat = sat;
    const t0 = Date.now(); const pts = [];
    for (let m = -10; m <= 100; m += 1) { const p = satAt(s, new Date(t0 + m * 60_000)); if (p) pts.push([p.lat, p.lon, window.SentinelGlobe ? window.SentinelGlobe.kmToAlt(p.altKm) : 0]); }
    window.SentinelGlobe?.update('track', pts);
    L_.focus.clearLayers();
    const segs = [[]];
    for (let i = 0; i < pts.length; i++) { if (i && Math.abs(pts[i][1] - pts[i - 1][1]) > 180) segs.push([]); segs[segs.length - 1].push([pts[i][0], pts[i][1]]); }
    for (const seg of segs) L.polyline(seg, { color: '#ffffff', weight: 1, opacity: 0.7, dashArray: '4 4', interactive: false }).addTo(L_.focus);
    if (!quiet) toast(`Ground track: ${sat.name} (next 100 min)`);
  }
  function renderFootprints() {
    const O = window.SentinelOrbits; const fps = [];
    L_.footprints.clearLayers();
    if (!S.vis.footprints) { window.SentinelGlobe?.update('footprints', []); return; }
    for (const s of S.sats.filter((x) => x.orbit === 'LEO' && x.group !== 'GNSS')) {
      const km = O.fieldOfRegardKm(s.altKm, 30);
      const col = s.group === 'Military' ? 'rgba(255,255,255,0.55)' : s.group === 'Radar calibration' ? 'rgba(139,233,253,0.5)' : 'rgba(255,214,140,0.5)';
      fps.push({ pts: O.circle(s.lat, s.lon, km, 36).map(([a, b]) => [a, b, 0.0015]), color: col });
      L.circle([s.lat, s.lon], { radius: km * 1000, color: col, weight: 1, fill: false, interactive: false }).addTo(L_.footprints);
    }
    window.SentinelGlobe?.update('footprints', fps);
  }
  function renderTerminator() {
    const ring = window.SentinelOrbits.nightRing(new Date());
    L_.terminator.clearLayers();
    // Draw three copies so the shading wraps with worldCopyJump.
    for (const off of [-360, 0, 360]) L.polygon(ring.map(([a, b]) => [a, b + off]), { stroke: false, fillColor: '#000814', fillOpacity: 0.38, interactive: false }).addTo(L_.terminator);
    const s = window.SentinelOrbits.sun(new Date());
    L.circleMarker([s.lat, s.lon], { radius: 6, color: '#ffd166', weight: 2, fillColor: '#ffd166', fillOpacity: 0.6, interactive: false }).addTo(L_.terminator);
    window.SentinelGlobe?.update('night', ring);
  }
  function satsOverhead(lat, lon, km = 1500) {
    const r = Math.PI / 180;
    return S.sats.filter((s) => 6371 * 2 * Math.asin(Math.sqrt(Math.sin(((s.lat - lat) * r) / 2) ** 2 + Math.cos(lat * r) * Math.cos(s.lat * r) * Math.sin(((s.lon - lon) * r) / 2) ** 2)) <= km);
  }

  function renderAir() {
    const all = S.air.map(([id, lat, lon, hdg, alt, spd, cs, type, reg, mil, sq, src, nacp, uav, gpsLost]) => ({ _t: 'air', id, lat, lon, hdg, alt, spd, cs, type, reg, mil: !!mil, sq, src, nacp, uav: !!uav,
      degraded: (nacp !== null && nacp !== undefined && nacp < 8) || !!gpsLost }));
    S.airObjs = all;
    L_.milair.setData(all.filter((a) => a.mil && !a.uav));
    L_.civair.setData(all.filter((a) => !a.mil));
    L_.gnss.setData(all.filter((a) => a.degraded));
    updateDrones();
    window.SentinelGlobe?.update('air', all);
  }
  function renderShips() {
    const ships = S.ships.map(([id, lat, lon, cog, sog, name, type, nav, dest, src]) => ({ _t: 'ship', id, lat, lon, cog, sog, name, type, nav, dest, src, cls: shipClass(type) }));
    L_.ships.setData(ships);
    window.SentinelGlobe?.update('ships', ships);
  }

  // ---------------- rendering: chrome ----------------
  function renderTop() {
    const sm = S.summary; if (!sm) return;
    const lvl = levelOf(sm.gti);
    $('#gtiVal').textContent = sm.gti ?? '--';
    $('#gtiVal').className = `gti-val s-${lvl.status || 'null'}`;
    $('#gtiLvl').outerHTML = `<span class="lvl s-${lvl.status || 'null'}" id="gtiLvl">${lvl.label}</span>`;
    const hv = sm.gtiHistory.map((p) => p.v).filter((v) => v !== null);
    if (hv.length > 1) {
      const lo = Math.min(...hv) - 2; const hi = Math.max(...hv) + 2;
      $('#gtiSpark').innerHTML = `<polyline fill="none" stroke="${statusColor(lvl.status)}" stroke-width="1.5" vector-effect="non-scaling-stroke" points="${hv.map((v, i) => `${(i / (hv.length - 1)) * 120},${26 - ((v - lo) / (hi - lo)) * 24}`).join(' ')}"/>`;
    }
    const c = sm.counts;
    $('#counters').innerHTML = [
      [`${fmt(c.liveParameters)}<span class="muted">/${fmt(c.parameters)}</span>`, 'LIVE PARAMETERS'], [fmt(c.milAircraft), 'MIL AIRCRAFT'], [fmt(c.aircraft), 'AIRCRAFT'],
      [fmt(c.ships), 'VESSELS'], [fmt(c.protests), 'UNREST EVENTS'], [fmt(c.kinetic), 'KINETIC EVENTS'], [fmt(c.uav), 'UAVs'], [fmt(c.outages), 'NET OUTAGES'],
      [fmt(c.satellites), 'SATELLITES'], [fmt(c.insights), 'INSIGHTS'], [fmt(c.quakes), 'QUAKES 24H'], [`${c.sourcesOnline}/${c.sources}`, 'SOURCES UP'],
    ].map(([v, k]) => `<div class="counter"><b>${v}</b><span>${k}</span></div>`).join('');
    $('#demoBanner').hidden = !sm.demo; document.body.classList.toggle('has-demo', !!sm.demo);
  }

  const LEVELS = [[80, 'SEVERE', 'critical'], [60, 'HIGH', 'serious'], [40, 'ELEVATED', 'warning'], [20, 'GUARDED', 'guarded'], [0, 'LOW', 'good']];
  function levelOf(s) { if (s === null || s === undefined) return { label: 'NO DATA', status: null }; const [, label, status] = LEVELS.find(([t]) => s >= t); return { label, status }; }

  function renderRail() {
    const sm = S.summary;
    const ev = S.events || []; const air = S.airObjs || [];
    const counts = { choke: sm?.chokepoints.length, hot: sm?.hotspots.length, milair: air.filter((a) => a.mil && !a.uav).length, civair: air.filter((a) => !a.mil).length,
      ships: S.ships.length, fires: S.hazards.fires.length, quakes: S.hazards.quakes.length, eonet: S.hazards.eonet.length, gdacs: S.hazards.gdacs.length,
      unrest: ev.filter((e) => e.kind === 'protest' || e.kind === 'riot').length, kinetic: ev.filter((e) => e.kind === 'aerial' || e.kind === 'clash' || e.kind === 'mass').length,
      drones: air.filter((a) => a.uav).length + (S.activity.geo?.drone || []).length, gnss: air.filter((a) => a.degraded).length, outages: S.activity.outages.length,
      sats: S.sats.length, lanes: LANES.length, countries: (window.SentinelGeo?.features || []).length, contested: GEOREF.contested.length, bases: GEOREF.bases.length,
      terminator: 1, footprints: S.sats.filter((x) => x.orbit === 'LEO' && x.group !== 'GNSS').length, newsgeo: ['protest', 'shutdown', 'cyber', 'jamming'].reduce((n, t) => n + (S.activity.geo?.[t] || []).length, 0) };
    const meta = Object.fromEntries(LAYER_META.map((m) => [m[0], m]));
    $('#layers').innerHTML = LAYER_GROUPS.map(([g, keys]) => `<div class="lgroup">${g}</div>` + keys.map((k) => { const [, name, col] = meta[k]; return `<label class="layer-row"><input type="checkbox" data-layer="${k}" ${S.vis[k] ? 'checked' : ''}>
      <span class="sw" style="background:${col}"></span><span class="name">${name}</span><span class="n">${fmt(counts[k] ?? 0)}</span></label>`; }).join('')).join('');
    $('#riskLegend').innerHTML = LEVELS.slice().reverse().map(([t, l, st], i, a) => `<div style="display:flex;justify-content:space-between;align-items:center"><span class="lvl s-${st}">${l}</span><span class="mono muted" style="font-size:10px">${t}–${i < a.length - 1 ? a[i + 1][0] - 1 : 100}</span></div>`).join('');
    if (!sm) return;
    $('#srcCount').textContent = `${sm.counts.sourcesOnline}/${sm.counts.sources}`;
    $('#sources').innerHTML = sm.health.map((h) => `<div class="src" title="${esc(h.lastError || `${h.name} — ${h.source}`)}">
      <span class="d ${h.disabled ? 'off' : h.ok ? 'ok' : 'err'}"></span>
      <span class="nm">${esc(h.name)}<small>${esc(h.disabled ? `needs ${h.needsKey}` : h.ok ? h.source : (h.lastError || 'waiting…'))}</small></span>
      <span class="ct">${h.ok ? `${fmt(h.count)}<br>${ago(h.lastOk)}` : h.disabled ? 'off' : '—'}</span></div>`).join('');
  }
  $('#layers').addEventListener('change', (e) => { const k = e.target.dataset.layer; if (k) { S.vis[k] = e.target.checked; applyVis(); if (k === 'footprints') renderFootprints(); } });
  $('#railToggle').addEventListener('click', () => $('#rail').classList.toggle('open'));

  function renderTicker() {
    const sm = S.summary; if (!sm) return;
    const items = sm.markets.filter((m) => m.price !== null).map((m) => `<span><span class="s">${esc(m.name)}</span>${fmt(m.price, 2)} ${pct(m.chg)}</span>`);
    if (sm.crypto) for (const [k, v] of Object.entries(sm.crypto)) items.push(`<span><span class="s">${esc(k.toUpperCase())}</span>${fmt(v.price, 2)} ${pct(v.chg)}</span>`);
    if (sm.spaceWx?.kp !== null && sm.spaceWx) items.push(`<span><span class="s">Kp INDEX</span>${fmt(sm.spaceWx.kp)}</span>`);
    const html = items.join('') || '<span class="muted">Waiting for market data…</span>';
    const t = $('#ticker'); if (t.dataset.h !== html) { t.innerHTML = html; t.dataset.h = html; }
  }

  // ---------------- tabs ----------------
  $('#tabs').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-tab]'); if (!b) return;
    S.tab = b.dataset.tab; try { localStorage.setItem('sentinel.tab', S.tab); } catch { /* ignore */ }
    closeDrawer(); renderTab(true);
  });

  function renderTab(scrollTop) {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.toggle('on', b.dataset.tab === S.tab));
    const body = $('#tabbody'); const sm = S.summary;
    if (!sm) { body.innerHTML = '<div class="muted">Connecting to fusion engine…</div>'; return; }
    const keepScroll = body.scrollTop;
    const focused = document.activeElement && body.contains(document.activeElement) ? document.activeElement.id : null;
    const html = ({ brief: tabBrief, live: tabLive, geo: tabGeo, orbits: tabOrbits, choke: tabChoke, theatres: tabTheatres, markets: tabMarkets, params: tabParams, intel: tabIntel, cyber: tabCyber }[S.tab] || tabBrief)(sm);
    // Skip identical re-renders so hover state, focus and clicks are not disturbed by live updates.
    if (html === S.lastTabHtml && !scrollTop) return;
    S.lastTabHtml = html;
    body.innerHTML = html;
    body.scrollTop = scrollTop ? 0 : keepScroll;
    if (focused) { const el = document.getElementById(focused); if (el) { el.focus(); if (el.setSelectionRange && el.value) el.setSelectionRange(el.value.length, el.value.length); } }
    if (S.tab === 'params' && !S.params) loadParams();
  }

  function tabBrief(sm) {
    const bySev = (s) => sm.insights.filter((i) => i.sev === s).length;
    const kinds = ['All', ...new Set(sm.insights.map((i) => i.kind))];
    const list = sm.insights.filter((i) => S.kindFilter === 'All' || i.kind === S.kindFilter);
    const top = [...sm.chokepoints, ...sm.hotspots].filter((e) => e.score !== null).sort((a, b) => b.score - a.score).slice(0, 6);
    return `<div class="cards">
        <div class="card"><div class="k">Critical / High</div><div class="v"><span class="s-critical">${bySev(4)}</span> / <span class="s-serious">${bySev(3)}</span></div></div>
        <div class="card"><div class="k">Elevated</div><div class="v s-warning">${bySev(2)}</div></div>
        <div class="card"><div class="k">Updated</div><div class="v" style="font-size:14px;padding-top:4px">${new Date(sm.generatedAt).toISOString().slice(11, 19)}Z</div></div>
      </div>
      <h3>Highest-risk theatres</h3>
      ${top.map(entRow).join('')}
      <h3 style="margin-top:18px">Insights <span class="muted">${list.length}</span></h3>
      <div class="toolbar">${kinds.map((k) => `<button class="chip ${S.kindFilter === k ? 'on' : ''}" data-kind="${esc(k)}">${esc(k)}</button>`).join('')}</div>
      ${list.length ? list.map(insightRow).join('') : '<div class="muted">No anomalies above threshold. The board flags only what crosses a rule — silence is a finding.</div>'}`;
  }

  function insightRow(i) {
    const s = SEV[i.sev] || SEV[1];
    return `<div class="insight s-${s.status}" data-entity="${esc(i.entity)}" data-lat="${i.lat ?? ''}" data-lon="${i.lon ?? ''}">
      <div class="bar"></div><div>
      <div class="meta"><span class="lvl s-${s.status}">${s.label}</span><span class="kind">${esc(i.kind)}</span><span>${esc(i.entityName || '')}</span></div>
      <div class="ttl" style="color:var(--text-primary)">${esc(i.title)}</div>
      <div class="det">${esc(i.detail || '')}</div></div></div>`;
  }

  function entRow(e) {
    const sub = e.kind === 'chokepoint'
      ? [['Vessels', e.vessels || '—'], ['Mil air', e.milNear], ['Waves', e.weather?.wave != null ? `${fmt(e.weather.wave)} m` : '—'], ['Oil ref', e.oilMbd ? `${e.oilMbd} mb/d` : '—']]
      : [['Mil air', e.milIn], ['Fires', e.fires], ['Advisory', e.advisory ? `L${e.advisory}` : '—'], ['Coverage', `${e.coverage}%`]];
    return `<div class="ent" data-kind="${e.kind}" data-id="${e.id}">
      <div><div class="nm">${esc(e.name)}</div></div>
      <div class="right">${pill(e.level)}<span class="score s-${e.level.status || 'null'}">${e.score ?? '—'}</span></div>
      <div class="meter s-${e.level.status || 'null'}"><i style="width:${e.score ?? 0}%"></i></div>
      <div class="sub">${sub.map(([k, v]) => `<span>${k} <b>${esc(v)}</b></span>`).join('')}</div></div>`;
  }

  function tabChoke(sm) {
    const list = [...sm.chokepoints].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return `<h3>Maritime chokepoints <span class="muted">${list.length}</span></h3>
      <p class="muted" style="margin:-4px 0 10px;font-size:12px">Score fuses news surge, media tone, military air activity, sea state, traffic stoppage and hazards. Oil flows are reference baselines, not live.</p>
      ${list.map(entRow).join('')}`;
  }
  function tabTheatres(sm) {
    const list = [...sm.hotspots].sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
    return `<h3>Conflict & tension theatres <span class="muted">${list.length}</span></h3>
      <p class="muted" style="margin:-4px 0 10px;font-size:12px">Score fuses reporting surge & tone (GDELT), military aircraft, thermal anomalies, travel advisories, internet outages and hazards.</p>
      ${list.map(entRow).join('')}`;
  }

  function tabMarkets(sm) {
    const groups = {};
    for (const m of sm.markets) (groups[m.group] = groups[m.group] || []).push(m);
    const why = { Energy: 'Chokepoint & sanctions sensitivity', Metals: 'Safe-haven demand', Agri: 'Black Sea / food security', Risk: 'Global risk appetite',
      FX: 'Stress in exposed economies', Shipping: 'Freight & rerouting proxies', Defense: 'Escalation expectations' };
    let html = '';
    for (const [g, ms] of Object.entries(groups)) {
      html += `<h3 style="margin-top:14px">${esc(g)} <span class="muted">· ${why[g] || ''}</span></h3><table class="tbl"><thead><tr><th>Instrument</th><th style="text-align:right">Last</th><th style="text-align:right">1D</th><th style="text-align:right">1M</th><th style="width:90px">30D</th></tr></thead><tbody>`
        + ms.map((m) => `<tr><td>${esc(m.name)} <span class="muted mono" style="font-size:10px">${esc(m.sym)}</span></td><td class="num">${fmt(m.price, 2)}</td><td class="num">${pct(m.chg)}</td><td class="num">${pct(m.chg1m)}</td>
          <td>${m.spark?.length > 1 ? spark(m.spark, { h: 22, area: false, color: (m.chg1m ?? 0) >= 0 ? '#5fd35f' : '#ff7a7a' }) : ''}</td></tr>`).join('')
        + '</tbody></table>';
    }
    if (sm.crypto) {
      html += `<h3 style="margin-top:14px">Crypto <span class="muted">· capital-flight & sanctions-evasion proxy</span></h3><table class="tbl"><tbody>`
        + Object.entries(sm.crypto).map(([k, v]) => `<tr><td>${esc(k)}</td><td class="num">$${fmt(v.price, 2)}</td><td class="num">${pct(v.chg)}</td><td class="num muted">vol ${fmt(v.vol)}</td></tr>`).join('') + '</tbody></table>';
    }
    return html;
  }

  function tabParams() {
    if (!S.params) return '<div class="muted">Loading parameter registry…</div>';
    const q = S.paramQ.toLowerCase();
    const rows = S.params.filter((p) => (S.paramType === 'all' || p.entityType === S.paramType)
      && (!S.paramFlagged || ['warning', 'serious', 'critical'].includes(p.status))
      && (!q || `${p.entityName} ${p.label} ${p.group} ${p.source}`.toLowerCase().includes(q)));
    const live = S.params.filter((p) => p.value !== null && p.value !== undefined).length;
    return `<h3>Parameter registry <span class="muted">${S.params.length} tracked · ${live} live · ${rows.length} shown</span></h3>
      <div class="toolbar">
        <input id="pq" type="search" placeholder="Filter: hormuz, tone, tanker, kp…" value="${esc(S.paramQ)}">
        <select id="pt"><option value="all">All scopes</option>${['chokepoint', 'hotspot', 'global'].map((t) => `<option value="${t}" ${S.paramType === t ? 'selected' : ''}>${t}</option>`).join('')}</select>
        <button class="chip ${S.paramFlagged ? 'on' : ''}" id="pf">Flagged only</button>
      </div>
      <table class="tbl"><thead><tr><th>Entity</th><th>Parameter</th><th style="text-align:right">Value</th><th>State</th><th>Source</th></tr></thead><tbody>
      ${rows.slice(0, 900).map((p) => `<tr class="${p.entityType !== 'global' ? 'click' : ''}" data-kind="${p.entityType}" data-id="${esc(p.entity)}">
        <td>${esc(p.entityName)}</td><td>${esc(p.label)}</td><td class="num">${fmt(p.value)}${p.value !== null && p.unit ? ` <span class="muted">${esc(p.unit)}</span>` : ''}</td>
        <td>${p.status ? `<span class="lvl s-${p.status}">${STATUS_LABEL[p.status]}</span>` : ''}</td><td class="muted" style="font-size:11px">${esc(p.source)}</td></tr>`).join('')}
      </tbody></table>`;
  }

  function tabLive() {
    const ev = (S.events || []).map((e) => ({ t: e.ts, kind: e.kind, cat: e.kind === 'protest' || e.kind === 'riot' ? 'Unrest' : 'Kinetic', title: `${KIND[e.kind]} — ${e.place}`,
      sub: `${[e.actor1, e.actor2].filter(Boolean).join(' → ') || 'actors n/a'} · ${e.articles} article${e.articles > 1 ? 's' : ''} · tone ${e.tone}`, lat: e.lat, lon: e.lon, url: e.url,
      col: { protest: COLORS.protest, riot: COLORS.riot, aerial: COLORS.kinetic, clash: COLORS.clash, mass: COLORS.critical }[e.kind] }));
    for (const o of S.activity.outages) ev.push({ t: o.causes[0]?.start ? Date.parse(o.causes[0].start) : Date.now(), now: !o.causes[0]?.start, cat: 'Outage', title: `INTERNET OUTAGE — ${o.name}`,
      sub: o.causes.length ? o.causes.map((c) => (c.cause || '').replace(/_/g, ' ').toLowerCase()).join(', ') : `${o.alerts} IODA alerts, ${o.critical} critical`, lat: o.lat, lon: o.lon, col: COLORS.outage });
    for (const a of (S.airObjs || []).filter((x) => x.uav)) ev.push({ t: Date.now(), now: true, cat: 'Drone', title: `UAV AIRBORNE — ${a.cs || a.id} (${a.type || 'UAV'})`, sub: `${fmt(a.alt)} ft · ${a.spd ? Math.round(a.spd) + ' kt' : ''} · ADS-B`, lat: a.lat, lon: a.lon, col: COLORS.drone });
    for (const p of (S.activity.geo?.drone || []).sort((a, b) => b.count - a.count).slice(0, 40)) ev.push({ t: Date.now() - 1, now: true, cat: 'Drone', title: `DRONE REPORTS — ${p.name}`, sub: `${p.count} geolocated article${p.count > 1 ? 's' : ''} (24h)${p.title ? ` · ${p.title}` : ''}`, lat: p.lat, lon: p.lon, url: p.url, col: COLORS.drone });
    const jam = (S.airObjs || []).filter((a) => a.degraded);
    if (jam.length) ev.push({ t: Date.now(), now: true, cat: 'EW', title: `GNSS DEGRADED — ${jam.length} aircraft`, sub: 'NACp < 8 or GPS lost; clusters indicate jamming/spoofing', lat: jam[0].lat, lon: jam[0].lon, col: COLORS.gnss });
    const cats = ['All', 'Unrest', 'Kinetic', 'Drone', 'Outage', 'EW'];
    const list = ev.filter((e) => S.liveFilter === 'All' || e.cat === S.liveFilter).sort((a, b) => b.t - a.t).slice(0, 300);
    const count = (c) => ev.filter((e) => c === 'All' || e.cat === c).length;
    return `<h3>Live activity <span class="muted">${list.length} shown · 24h · auto-updating</span></h3>
      <div class="toolbar">${cats.map((c) => `<button class="chip ${S.liveFilter === c ? 'on' : ''}" data-live="${c}">${c} <span class="muted">${count(c)}</span></button>`).join('')}</div>
      ${list.map((e) => `<div class="live-row" data-lat="${e.lat}" data-lon="${e.lon}"><span class="live-dot" style="background:${e.col}"></span><div>
        <div class="ttl">${esc(e.title)}</div><div class="m">${esc(e.cat)} · ${e.now ? 'LIVE' : ago(e.t)} · ${esc(e.sub)}${e.url ? ` · <a target="_blank" rel="noopener" href="${esc(e.url)}">source ↗</a>` : ''}</div></div></div>`).join('') || '<div class="muted">Waiting for GDELT event stream (first files arrive within a minute; 24h backfill fills over ~45 min)…</div>'}`;
  }

  function tabGeo() {
    const G = window.SentinelGeo; if (!G?.features.length) return '<div class="muted">Loading country boundaries…</div>';
    const L = G.LENSES.find((x) => x.id === S.lens);
    const rows = Object.values(S.countryStats).map((s) => ({ s, st: G.style(S.lens, s, S.bloc) })).filter((r) => r.st.v).sort((a, b) => b.st.v - a.st.v || (b.s.risk ?? 0) - (a.s.risk ?? 0)).slice(0, 40);
    return `<h3>Geopolitical lens</h3>
      <div class="toolbar">${G.LENSES.map((l) => `<button class="chip ${S.lens === l.id ? 'on' : ''}" data-lens="${l.id}">${esc(l.label)}</button>`).join('')}</div>
      ${S.lens === 'bloc' ? `<div class="toolbar">${Object.entries(GEOREF.blocs).map(([k, b]) => `<button class="chip ${S.bloc === k ? 'on' : ''}" data-bloc="${k}">${esc(k === 'OPEC' ? 'OPEC+' : k === 'QUAD' ? 'Quad/AUKUS' : k)}</button>`).join('')}</div>` : ''}
      <p class="muted" style="font-size:12px;margin:0 0 8px">${esc(L.note)}${S.lens === 'bloc' && GEOREF.blocs[S.bloc].note ? ' ' + esc(GEOREF.blocs[S.bloc].note) + '.' : ''}</p>
      <div class="toolbar"><button class="chip ${S.extrude ? 'on' : ''}" id="extrudeBtn">3D extrusion by value</button></div>
      <h3 style="margin-top:12px">Ranking <span class="muted">${rows.length} countries with a value</span></h3>
      <table class="tbl"><thead><tr><th>Country</th><th>${esc(L.label)}</th><th style="text-align:right">Risk idx</th></tr></thead><tbody>
      ${rows.map(({ s, st }) => `<tr class="click" data-country="${esc(s.iso || s.name)}"><td>${esc(s.name)}</td><td><span class="sw-inline" style="background:${st.fill}"></span>${esc(st.label ?? '')}</td><td class="num">${s.risk ?? '—'}</td></tr>`).join('') || '<tr><td class="muted">No countries have a value for this lens yet.</td></tr>'}
      </tbody></table>
      <h3 style="margin-top:18px">Disputed areas <span class="muted">approximate · orientation only</span></h3>
      ${GEOREF.contested.map((c) => { const [la, lo] = c.at || (c.ring || c.line)[0]; return `<div class="live-row" data-ref="${c.id}" data-lat="${la}" data-lon="${lo}"><span class="live-dot" style="background:var(--contested)"></span><div><div class="ttl">${esc(c.name)}</div><div class="m">${esc(c.parties)}</div></div></div>`; }).join('')}
      <h3 style="margin-top:18px">Overseas military bases <span class="muted">reference</span></h3>
      ${GEOREF.bases.map((b) => `<div class="live-row" data-ref="b" data-lat="${b.lat}" data-lon="${b.lon}"><span class="live-dot" style="background:${baseColor(b.operator)}"></span><div><div class="ttl">${esc(b.name)}</div><div class="m">${esc(b.operator)} in ${esc(b.host)}</div></div></div>`).join('')}`;
  }

  // ---------------- orbits tab: catalogue, classes, pass planner ----------------
  function passTargets() {
    const t = [];
    for (const h of S.summary?.hotspots || []) t.push({ id: `h:${h.id}`, name: h.name, lat: h.lat, lon: h.lon });
    for (const c of S.summary?.chokepoints || []) t.push({ id: `k:${c.id}`, name: c.name, lat: c.lat, lon: c.lon });
    for (const s of Object.values(S.countryStats)) if (s.iso) t.push({ id: `c:${s.iso}`, name: s.name, lat: s.centroid.lat, lon: s.centroid.lon });
    return t;
  }
  function runPasses() {
    const t = passTargets().find((x) => x.id === S.passTarget) || passTargets()[0];
    if (!t || !S.satRecs.length) return;
    S.passTarget = t.id;
    setTimeout(() => { S.passes = { t, list: computePasses(t.lat, t.lon, 12), at: Date.now() }; if (S.tab === 'orbits') renderTab(); }, 20);
  }
  const GROUP_COL = { Military: '#3987e5', 'Earth observation': '#d95926', 'Radar calibration': '#199e70' };
  function gantt(list, t0) {
    const rows = [...new Set(list.filter((p) => !p.persistent).map((p) => p.name))].slice(0, 28);
    if (!rows.length) return '<div class="muted">No passes above 10° in the next 12 h.</div>';
    const W = 420; const LBL = 112; const RH = 13; const H = rows.length * RH + 22; const span = 12 * 3600_000;
    const x = (t) => LBL + ((t - t0) / span) * (W - LBL - 4);
    let svg = `<svg class="gantt" viewBox="0 0 ${W} ${H}" width="100%" style="max-height:${H * 1.4}px">`;
    for (let h = 0; h <= 12; h += 2) svg += `<line x1="${x(t0 + h * 3600_000)}" x2="${x(t0 + h * 3600_000)}" y1="0" y2="${H - 16}" stroke="var(--line)" stroke-width="1"/><text x="${x(t0 + h * 3600_000)}" y="${H - 4}" font-size="8" fill="var(--text-muted)" text-anchor="middle" font-family="IBM Plex Mono, monospace">+${h}h</text>`;
    rows.forEach((n, i) => {
      const y = i * RH;
      svg += `<text x="${LBL - 6}" y="${y + 9}" font-size="8" fill="var(--text-secondary)" text-anchor="end" font-family="IBM Plex Mono, monospace">${esc(n.slice(0, 20))}</text>`;
      for (const p of list.filter((q) => q.name === n && !q.persistent)) {
        const c = GROUP_COL[p.group] || '#8a9bb0'; const w = Math.max(2, x(p.los) - x(p.aos));
        const idx = list.indexOf(p);
        svg += `<rect data-pi="${idx}" x="${x(p.aos)}" y="${y + 2}" width="${w}" height="${RH - 5}" rx="2" fill="${p.daylight ? c : 'transparent'}" stroke="${c}" stroke-width="1.5"/>`;
      }
    });
    return svg + '</svg>';
  }
  function tabOrbits() {
    if (!S.satRecs.length) return '<div class="muted">Waiting for CelesTrak TLEs…</div>';
    const cls = {}; for (const s of S.sats) cls[s.orbit] = (cls[s.orbit] || 0) + 1;
    const sso = S.sats.filter((s) => s.sso).length;
    if (!S.passes) runPasses();
    const P = S.passes;
    const targets = passTargets();
    const groups = ['All', ...new Set(S.satRecs.map((x) => x.group))];
    const q = S.satQ.toLowerCase();
    const cat = S.sats.filter((s) => (S.satGroup === 'All' || s.group === S.satGroup) && (!q || s.name.toLowerCase().includes(q) || String(s.norad).includes(q))).slice(0, 200);
    const recBy = Object.fromEntries(S.satRecs.map((r) => [r.name, r]));
    return `<div class="cards">${['LEO', 'MEO', 'GEO', 'HEO'].map((c) => `<div class="card"><div class="k">${c}</div><div class="v">${cls[c] || 0}</div></div>`).join('')}
        <div class="card"><div class="k">Sun-synchronous</div><div class="v">${sso}</div></div><div class="card"><div class="k">Tracked</div><div class="v">${S.sats.length}</div></div></div>
      <h3>Overhead pass planner <span class="muted">next 12 h · ≥10° elevation · SGP4</span></h3>
      <div class="toolbar"><select id="passSel" aria-label="Pass target">${targets.map((t) => `<option value="${t.id}" ${t.id === S.passTarget ? 'selected' : ''}>${esc(t.name)}</option>`).join('')}</select></div>
      ${P ? `<div class="legend-row">${Object.entries(GROUP_COL).map(([g, c]) => `<span class="lg-i"><i style="background:${c}"></i>${g}</span>`).join('')}<span class="lg-i"><i style="background:transparent;border:1.5px solid var(--text-secondary)"></i>night pass (outline)</span></div>
        ${gantt(P.list, P.at)}
        <div class="pass-tip mono" id="passTip">Hover a bar for details. Filled = target in daylight (optical imaging possible).</div>
        <table class="tbl" style="margin-top:8px"><thead><tr><th>AOS (UTC)</th><th>Satellite</th><th style="text-align:right">Max el</th><th>Light</th></tr></thead><tbody>
        ${P.list.filter((p) => !p.persistent).slice(0, 25).map((p) => `<tr class="click" data-sat="${esc(p.name)}"><td class="mono">${new Date(p.aos).toISOString().slice(11, 16)}–${new Date(p.los).toISOString().slice(11, 16)}</td><td>${esc(p.name)} <span class="muted" style="font-size:10px">${esc(p.group)}${p.sso ? ' · SSO' : ''}</span></td><td class="num">${p.maxEl}°</td><td>${p.daylight ? '☀ day' : '☾ night'}</td></tr>`).join('')}
        </tbody></table>
        ${P.list.some((p) => p.persistent) ? `<div class="muted" style="font-size:11px;margin-top:6px">In view continuously (GEO): ${P.list.filter((p) => p.persistent).map((p) => esc(p.name)).join(', ')}</div>` : ''}` : '<div class="muted">Computing passes…</div>'}
      <h3 style="margin-top:18px">Satellite catalogue <span class="muted">${cat.length} shown · click to track</span></h3>
      <div class="toolbar"><input id="satq" type="search" placeholder="Name or NORAD id" value="${esc(S.satQ)}"><select id="satg">${groups.map((g) => `<option ${g === S.satGroup ? 'selected' : ''}>${esc(g)}</option>`).join('')}</select>
        <button class="chip ${S.follow ? 'on' : ''}" id="followBtn">Camera follows selected</button></div>
      <table class="tbl"><thead><tr><th>Satellite</th><th>Orbit</th><th style="text-align:right">Alt km</th><th style="text-align:right">Incl</th><th style="text-align:right">Period</th></tr></thead><tbody>
      ${cat.map((s) => { const o = recBy[s.name]?.orbit || {}; return `<tr class="click ${S.selSat?.name === s.name ? 'sel' : ''}" data-sat="${esc(s.name)}"><td>${esc(s.name)} <span class="muted" style="font-size:10px">${esc(s.group)}</span></td><td>${esc(o.cls || '')}${o.sso ? ' · SSO' : ''}</td><td class="num">${fmt(Math.round(s.altKm))}</td><td class="num">${o.inc ?? ''}°</td><td class="num">${o.period ?? ''} min</td></tr>`; }).join('')}
      </tbody></table>`;
  }

  function tabIntel(sm) {
    const all = [...sm.globalNews.map((a) => ({ ...a, tag: 'Global' }))];
    for (const e of [...sm.chokepoints, ...sm.hotspots]) for (const a of e.news || []) all.push({ ...a, tag: e.name });
    const seen = new Set();
    const list = all.filter((a) => a.url && !seen.has(a.url) && seen.add(a.url)).sort((a, b) => (b.ts || 0) - (a.ts || 0)).slice(0, 200);
    return `<h3>Open-source reporting <span class="muted">${list.length} · GDELT, last 24h</span></h3>
      ${list.map((a) => `<div class="news"><a target="_blank" rel="noopener" href="${esc(a.url)}">${esc(a.title)}</a>
        <div class="m">${esc(a.tag)} · ${esc(a.domain)} · ${esc(a.country || '')} · ${a.ts ? ago(a.ts) : ''}</div></div>`).join('') || '<div class="muted">Waiting for GDELT…</div>'}`;
  }

  function tabCyber(sm) {
    const k = sm.kev; const sw = sm.spaceWx; const out = sm.outages ? Object.values(sm.outages).sort((a, b) => b.critical - a.critical || b.alerts - a.alerts) : null;
    return `<div class="cards">
        <div class="card"><div class="k">KEV · 7 days</div><div class="v">${fmt(k?.d7)}</div></div>
        <div class="card"><div class="k">KEV · 30 days</div><div class="v">${fmt(k?.d30)}</div></div>
        <div class="card"><div class="k">Ransomware-linked</div><div class="v">${fmt(k?.ransomware30)}</div></div>
      </div>
      <h3>Newly exploited vulnerabilities <span class="muted">CISA KEV</span></h3>
      <table class="tbl"><tbody>${(k?.latest || []).map((x) => `<tr><td class="mono" style="white-space:nowrap"><a target="_blank" rel="noopener" href="https://nvd.nist.gov/vuln/detail/${esc(x.id)}">${esc(x.id)}</a></td><td>${esc(x.vendor)} ${esc(x.product)}${x.ransomware ? ' <span class="lvl s-serious">RANSOMWARE</span>' : ''}</td><td class="num muted">${esc(x.added)}</td></tr>`).join('') || '<tr><td class="muted">Waiting for CISA…</td></tr>'}</tbody></table>
      <h3 style="margin-top:18px">Internet outages <span class="muted">IODA · 24h</span></h3>
      <table class="tbl"><tbody>${out ? out.slice(0, 25).map((o) => `<tr><td>${esc(o.name)}</td><td class="num">${o.critical ? `<span class="lvl s-serious">${o.critical} CRITICAL</span>` : ''}</td><td class="num">${o.alerts} alerts</td><td class="muted mono" style="font-size:10px">${esc(o.sources.join(', '))}</td></tr>`).join('') || '<tr><td class="muted">No outage alerts</td></tr>' : '<tr><td class="muted">Waiting for IODA…</td></tr>'}</tbody></table>
      <h3 style="margin-top:18px">Space weather <span class="muted">NOAA SWPC · affects GNSS & HF</span></h3>
      <div class="cards"><div class="card"><div class="k">Kp now</div><div class="v ${sw?.kp >= 5 ? 's-serious' : ''}">${fmt(sw?.kp)}</div></div><div class="card"><div class="k">Kp max 24h</div><div class="v">${fmt(sw?.kpMax24)}</div></div><div class="card"><div class="k">Alerts 24h</div><div class="v">${sw ? sw.alerts.length : '—'}</div></div></div>
      ${sw?.series ? spark(sw.series, { h: 44, color: 'var(--accent)' }) : ''}
      ${(sw?.alerts || []).map((a) => `<div class="news"><span class="mono">${esc(a.title)}</span><div class="m">${esc(a.id)} · ${esc(a.ts)} UTC</div></div>`).join('')}`;
  }

  // ---------------- entity drawer ----------------
  function findEntity(kind, id) {
    const sm = S.summary; if (!sm) return null;
    return (kind === 'chokepoint' ? sm.chokepoints : sm.hotspots).find((e) => e.id === id);
  }
  function openEntity(kind, id) {
    const e = findEntity(kind, id); if (!e) return;
    S.drawer = { kind, id };
    L_.focus.clearLayers(); S.selSat = null; window.SentinelGlobe?.update('track', []);
    window.SentinelGlobe?.update('focus', { lat: e.lat, lon: e.lon });
    if (S.view === 'globe') window.SentinelGlobe?.flyTo(e.lat, e.lon, kind === 'chokepoint' ? 0.7 : 0.9);
    if (e.box) L.rectangle(e.box, { color: COLORS[e.level.status] || COLORS.muted, weight: 1, dashArray: '3 5', fill: false }).addTo(L_.focus);
    if (S.view === 'map') map.flyTo([e.lat, e.lon], kind === 'chokepoint' ? 6.5 : 5, { duration: 0.8 });
    if (!S.params) loadParams();
    renderDrawer();
  }
  function closeDrawer() { S.drawer = null; S.country = null; $('#drawer').hidden = true; L_.focus.clearLayers(); window.SentinelGlobe?.update('focus', null); window.SentinelGlobe?.selectCountry(null); if (countryGeo) countryGeo.setStyle(mapCountryStyle); }

  function openCountry(iso) {
    const s = S.countryStats[iso]; if (!s) return;
    S.drawer = null; S.country = iso;
    window.SentinelGlobe?.selectCountry(s.iso); if (countryGeo) countryGeo.setStyle(mapCountryStyle);
    flyTo(s.centroid.lat, s.centroid.lon);
    S.countryPasses = null; renderCountry();
    setTimeout(() => { S.countryPasses = computePasses(s.centroid.lat, s.centroid.lon, 12); renderCountry(); }, 30);
  }
  function renderCountry() {
    const s = S.countryStats[S.country]; if (!s) return;
    const d = $('#drawer'); const st = d.scrollTop; d.hidden = false;
    const lv = levelOf(s.risk);
    const blocName = (k) => GEOREF.blocs[k].name;
    const theatreEnts = (S.summary?.hotspots || []).filter((h) => (h.iso || []).includes(s.iso));
    const passes = S.countryPasses;
    const nextDayEO = passes?.find((p) => p.group === 'Earth observation' && p.daylight && !p.persistent);
    const nextMil = passes?.find((p) => p.group === 'Military' && !p.persistent);
    const nextRadar = passes?.find((p) => p.group === 'Radar calibration' && !p.persistent);
    const when = (p) => (p ? `${new Date(p.aos).toISOString().slice(11, 16)}Z (in ${Math.max(0, Math.round((p.aos - Date.now()) / 60000))} min) · ${esc(p.name)} · max ${p.maxEl}°` : 'none in 12 h');
    const sanc = ['—', 'Targeted', 'Extensive / sectoral', 'Comprehensive'][s.sanctions];
    const nuke = ['—', 'NATO nuclear-sharing host', 'Nuclear-armed (non-NPT)', 'NPT nuclear-weapon state'][s.nuclear];
    d.innerHTML = `<button class="back" id="back">← BACK</button>
      <h2>${esc(s.name)}</h2><div class="lead">${esc(s.sub || s.cont || '')} · population ${fmt(s.pop)}</div>
      <div style="display:flex;gap:10px;align-items:center">${pill(lv)}<span class="score s-${lv.status || 'null'}" style="font-size:24px">${s.risk ?? '—'}</span><span class="muted mono" style="font-size:11px">/100 country risk index · coverage ${s.coverage}%</span></div>
      <section><h3>Why this index</h3>${s.riskComps.map(([n, w, v]) => `<div class="comp ${v === null ? 'na' : ''}"><span>${n} <span class="muted mono" style="font-size:10px">w${w}</span></span><span class="track"><i style="width:${v === null ? 0 : v * 100}%"></i></span><span class="pct">${v === null ? 'n/a' : Math.round(v * 100) + '%'}</span></div>`).join('')}</section>
      <section><h3>Live signals <span class="muted">24h</span></h3><div class="cards">
        <div class="card"><div class="k">Travel advisory</div><div class="v" style="font-size:15px">${s.advisory ? 'Level ' + s.advisory : '—'}</div></div>
        <div class="card"><div class="k">Protest / riot events</div><div class="v" style="font-size:15px">${fmt(s.unrest)}</div></div>
        <div class="card"><div class="k">Kinetic events</div><div class="v" style="font-size:15px">${fmt(s.kinetic)} <span class="muted" style="font-size:11px">${s.aerial ? `(${s.aerial} air)` : ''}</span></div></div>
        <div class="card"><div class="k">Internet</div><div class="v" style="font-size:13px">${s.outageLevel === null ? '—' : ['normal', 'alerts', 'critical', 'ONGOING OUTAGE'][s.outageLevel]}</div></div>
        <div class="card"><div class="k">Satellites overhead</div><div class="v" style="font-size:15px">${fmt(s.satsOver)}</div></div>
        <div class="card"><div class="k">Conflict theatres</div><div class="v" style="font-size:13px">${theatreEnts.map((h) => `<a href="#" data-open-hs="${h.id}">${esc(h.name)}</a>`).join(', ') || '—'}</div></div>
      </div></section>
      <section><h3>Overhead satellite passes <span class="muted">next 12 h, centroid, ≥10° elevation</span></h3>
        ${passes ? `<table class="tbl"><tbody>
          <tr><td>Next daylight EO imaging pass</td><td class="mono" style="font-size:11px">${when(nextDayEO)}</td></tr>
          <tr><td>Next military satellite pass</td><td class="mono" style="font-size:11px">${when(nextMil)}</td></tr>
          <tr><td>Next radar-calibration pass</td><td class="mono" style="font-size:11px">${when(nextRadar)}</td></tr>
          <tr><td>Total passes (all groups)</td><td class="mono">${passes.filter((p) => !p.persistent).length}${passes.some((p) => p.persistent) ? ` + ${passes.filter((p) => p.persistent).length} GEO in view` : ''}</td></tr>
        </tbody></table><button class="chip" style="margin-top:8px" data-plan="${s.iso}">Open pass timeline →</button>` : '<div class="muted">Computing passes…</div>'}
      </section>
      <section><h3>Alignments <span class="muted">reference as of ${GEOREF.asOf}</span></h3><table class="tbl"><tbody>
        <tr><td>Member of</td><td>${s.blocs.map(blocName).join(', ') || '—'}</td></tr>
        <tr><td>Partner / candidate / observer</td><td>${s.partners.map(blocName).join(', ') || '—'}</td></tr>
        <tr><td>Sanctions exposure</td><td>${sanc}</td></tr>
        <tr><td>Nuclear status</td><td>${nuke}</td></tr>
        <tr><td>Foreign bases hosted</td><td>${GEOREF.bases.filter((b) => b.host === s.iso).map((b) => `${esc(b.name)} (${esc(b.operator)})`).join('; ') || '—'}</td></tr>
      </tbody></table></section>`;
    d.scrollTop = st;
    $('#back').onclick = closeDrawer;
  }
  function computePasses(lat, lon, hours) {
    if (!S.satRecs.length || !window.SentinelOrbits) return [];
    return window.SentinelOrbits.passes(S.satRecs.filter((x) => x.group !== 'GNSS'), lat, lon, { hours, minEl: 10 });
  }

  function renderDrawer() {
    if (!S.drawer) return;
    const { kind, id } = S.drawer; const e = findEntity(kind, id); if (!e) return;
    const params = (S.params || []).filter((p) => p.entity === id && p.entityType === kind);
    const w = e.weather;
    const d = $('#drawer'); const st = d.scrollTop;
    d.hidden = false;
    d.innerHTML = `<button class="back" id="back">← BACK</button>
      <h2>${esc(e.name)}</h2>
      <div style="display:flex;gap:10px;align-items:center">${pill(e.level)}<span class="score s-${e.level.status || 'null'}" style="font-size:24px">${e.score ?? '—'}</span><span class="muted mono" style="font-size:11px">/100 · model coverage ${e.coverage}%</span></div>
      ${e.tradeShare ? `<div class="lead" style="margin-top:8px">${esc(e.tradeShare)}${e.oilMbd ? ` · ~${e.oilMbd} mb/d oil (reference)` : ''}</div>` : ''}
      <section><h3>Why this score</h3>
        ${e.components.map((c) => `<div class="comp ${c.value === null ? 'na' : ''}"><span>${esc(c.name)} <span class="muted mono" style="font-size:10px">w${c.weight}</span></span>
          <span class="track"><i style="width:${c.value === null ? 0 : c.value * 100}%"></i></span><span class="pct">${c.value === null ? 'n/a' : `${Math.round(c.value * 100)}%`}</span></div>`).join('')}
      </section>
      <section><h3>Risk score · last 24h</h3>${spark(e.history, { h: 46, color: statusColor(e.level.status) })}</section>
      <section><h3>Reporting volume · 7 days <span class="muted">articles/day</span></h3>${spark(e.newsVolSeries, { h: 40, labels: dayLabels(e.newsVolSeries.length) })}</section>
      <section><h3>Media tone · 7 days <span class="muted">GDELT, lower = more negative</span></h3>${spark(e.toneSeries, { h: 40, color: 'var(--serious)', labels: dayLabels(e.toneSeries.length) })}</section>
      ${w ? `<section><h3>Conditions</h3><div class="cards">
        <div class="card"><div class="k">Wind / gust</div><div class="v" style="font-size:15px">${fmt(w.wind)} / ${fmt(w.gust)} kn</div></div>
        <div class="card"><div class="k">Waves</div><div class="v" style="font-size:15px">${fmt(w.wave)} m</div></div>
        <div class="card"><div class="k">Visibility</div><div class="v" style="font-size:15px">${w.vis != null ? fmt(w.vis / 1000) : '—'} km</div></div></div></section>` : ''}
      <section><h3>Parameters <span class="muted">${params.length}</span></h3>
        <table class="tbl"><tbody>${params.map((p) => `<tr><td>${esc(p.label)}</td><td class="num">${fmt(p.value)}${p.value !== null && p.unit ? ` <span class="muted">${esc(p.unit)}</span>` : ''}</td><td>${p.status ? `<span class="lvl s-${p.status}">${STATUS_LABEL[p.status]}</span>` : ''}</td><td class="muted" style="font-size:10.5px">${esc(p.source)}</td></tr>`).join('') || '<tr><td class="muted">Loading…</td></tr>'}</tbody></table></section>
      <section><h3>Live activity in area <span class="muted">24h</span></h3><div class="cards">
        ${kind === 'hotspot' ? `<div class="card"><div class="k">Protest / riot</div><div class="v" style="font-size:15px">${fmt(e.protests)} / ${fmt(e.riots)}</div></div>
        <div class="card"><div class="k">Strikes / clashes</div><div class="v" style="font-size:15px">${fmt(e.aerial)} / ${fmt(e.clashes)}</div></div>
        <div class="card"><div class="k">UAVs airborne</div><div class="v" style="font-size:15px">${fmt(e.uav)}</div></div>`
        : `<div class="card"><div class="k">GNSS degraded</div><div class="v" style="font-size:15px">${e.gnss == null ? '—' : Math.round(e.gnss * 100) + '%'}</div></div>
        <div class="card"><div class="k">Kinetic events</div><div class="v" style="font-size:15px">${fmt(e.kinetic)}</div></div>
        <div class="card"><div class="k">Mil aircraft</div><div class="v" style="font-size:15px">${fmt(e.milNear)}</div></div>`}
        <div class="card"><div class="k">Satellites overhead</div><div class="v" style="font-size:15px">${S.sats.length ? satsOverhead(e.lat, e.lon).length : '—'}</div></div>
        <div class="card"><div class="k">Mil sats overhead</div><div class="v" style="font-size:15px">${S.sats.length ? satsOverhead(e.lat, e.lon).filter((x) => x.group === 'Military').length : '—'}</div></div>
      </div><div class="muted" style="font-size:11px">Satellites within 1,500 km ground distance right now (SGP4 from CelesTrak TLEs).</div></section>
      <section><h3>Latest reporting</h3>${(e.news || []).map((a) => `<div class="news"><a target="_blank" rel="noopener" href="${esc(a.url)}">${esc(a.title)}</a><div class="m">${esc(a.domain)} · ${a.ts ? ago(a.ts) : ''}</div></div>`).join('') || '<div class="muted">Waiting for GDELT…</div>'}</section>`;
    d.scrollTop = st;
    $('#back').onclick = closeDrawer;
  }
  const dayLabels = (n) => Array.from({ length: n }, (_, i) => new Date(Date.now() - (n - 1 - i) * 86_400_000).toISOString().slice(5, 10));

  // Delegated clicks inside the panel.
  $('#tabbody').addEventListener('click', (e) => {
    const chip = e.target.closest('[data-kind-filter], .chip[data-kind]');
    if (chip) { S.kindFilter = chip.dataset.kind; renderTab(); return; }
    if (e.target.id === 'pf') { S.paramFlagged = !S.paramFlagged; renderTab(); return; }
    const ent = e.target.closest('.ent, tr.click');
    if (ent && ent.dataset.kind && ent.dataset.kind !== 'global') { openEntity(ent.dataset.kind, ent.dataset.id); return; }
    const ins = e.target.closest('.insight');
    if (ins) {
      const cp = findEntity('chokepoint', ins.dataset.entity); const hs = findEntity('hotspot', ins.dataset.entity);
      if (cp) openEntity('chokepoint', cp.id); else if (hs) openEntity('hotspot', hs.id);
      else if (ins.dataset.lat) flyTo(+ins.dataset.lat, +ins.dataset.lon);
    }
    const hsLink = e.target.closest('[data-open-hs]'); if (hsLink) { e.preventDefault(); openEntity('hotspot', hsLink.dataset.openHs); return; }
    const lensB = e.target.closest('[data-lens]'); if (lensB) { S.lens = lensB.dataset.lens; S.vis.countries = true; applyVis(); saveGeo(); recomputeCountries(); renderTab(); renderRail(); return; }
    const blocB = e.target.closest('[data-bloc]'); if (blocB) { S.bloc = blocB.dataset.bloc; S.lens = 'bloc'; saveGeo(); recomputeCountries(); return; }
    if (e.target.id === 'extrudeBtn') { S.extrude = !S.extrude; saveGeo(); recomputeCountries(); renderTab(); return; }
    const cRow = e.target.closest('[data-country]'); if (cRow) { openCountry(cRow.dataset.country); return; }
    const refRow = e.target.closest('[data-ref]'); if (refRow) { flyTo(+refRow.dataset.lat, +refRow.dataset.lon, true); return; }
    const satRow = e.target.closest('[data-sat]'); if (satRow) { const sat = S.sats.find((x) => x.name === satRow.dataset.sat); if (sat) { selectSat(sat); flyTo(sat.lat, sat.lon); } return; }
    const tgt = e.target.closest('[data-target]'); if (tgt) { S.passTarget = tgt.dataset.target; S.passes = null; renderTab(); runPasses(); return; }
    if (e.target.id === 'followBtn') { S.follow = !S.follow; renderTab(); return; }
    const lv = e.target.closest('[data-live]');
    if (lv) { S.liveFilter = lv.dataset.live; renderTab(); return; }
    const row = e.target.closest('.live-row');
    if (row && !e.target.closest('a')) flyTo(+row.dataset.lat, +row.dataset.lon, true);
  });
  $('#tabbody').addEventListener('mousemove', (e) => {
    const r = e.target.closest?.('rect[data-pi]'); const tip = $('#passTip'); if (!tip || !S.passes) return;
    if (!r) return;
    const p = S.passes.list[+r.dataset.pi];
    tip.innerHTML = `<b>${esc(p.name)}</b> · ${esc(p.group)}${p.sso ? ' · sun-synchronous' : ''} · AOS ${new Date(p.aos).toISOString().slice(11, 16)}Z · LOS ${new Date(p.los).toISOString().slice(11, 16)}Z · max ${p.maxEl}° at ${new Date(p.tMax).toISOString().slice(11, 16)}Z · ${p.daylight ? 'target in daylight' : 'target in darkness'}`;
  });
  $('#drawer').addEventListener('click', (e) => {
    const hsLink = e.target.closest('[data-open-hs]'); if (hsLink) { e.preventDefault(); openEntity('hotspot', hsLink.dataset.openHs); return; }
    const plan = e.target.closest('[data-plan]'); if (plan) { S.passTarget = `c:${plan.dataset.plan}`; S.passes = null; S.tab = 'orbits'; closeDrawer(); renderTab(true); runPasses(); }
  });
  $('#tabbody').addEventListener('input', (e) => {
    if (e.target.id === 'satq') { S.satQ = e.target.value; renderTab(); }
    if (e.target.id === 'passSel') { S.passTarget = e.target.value; S.passes = null; renderTab(); runPasses(); }
    if (e.target.id === 'satg') { S.satGroup = e.target.value; renderTab(); }
    if (e.target.id === 'pq') { S.paramQ = e.target.value; renderTab(); }
    if (e.target.id === 'pt') { S.paramType = e.target.value; renderTab(); }
  });
  $('#gti').addEventListener('click', () => { S.tab = 'brief'; closeDrawer(); renderTab(true); });

  // ---------------- data plumbing ----------------
  const getJSON = (u) => fetch(u, { cache: 'no-store' }).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); });

  async function loadSummary() {
    S.summary = await getJSON('/api/summary');
    renderTop(); renderRail(); renderTicker(); renderEntitiesOnMap();
    if (!(S.tab === 'params' && document.activeElement?.id === 'pq')) renderTab();
    renderDrawer();
  }
  async function loadParams() {
    S.params = await getJSON('/api/parameters');
    if (S.tab === 'params') renderTab(); renderDrawer();
  }
  async function loadLayer(name) {
    const d = await getJSON(`/api/layer/${name}`);
    if (name === 'activity') { S.activity = d; renderActivity(); if (S.tab === 'live') renderTab(); }
    if (name === 'sats') { if (JSON.stringify(d.map((x) => x.l1)) !== S.satKey) { S.satKey = JSON.stringify(d.map((x) => x.l1)); loadSatRecs(d); } }
    if (name === 'air') { S.air = d; renderAir(); }
    if (name === 'ships') { S.ships = d; renderShips(); }
    if (name === 'hazards') { S.hazards = d; renderHazardsOnMap(); }
    renderRail();
  }

  // Coalesce bursts of version bumps: at most one fetch per resource per 2.5 s.
  const pending = new Set(); let flushT = null;
  function want(r) { pending.add(r); if (!flushT) flushT = setTimeout(flush, 600); }
  async function flush() {
    const list = [...pending]; pending.clear();
    for (const r of list) {
      try {
        if (r === 'summary') await loadSummary();
        else if (r === 'params') { if (S.tab === 'params' || S.drawer) await loadParams(); else S.params = null; }
        else await loadLayer(r);
      } catch (e) { console.warn('load', r, e); }
    }
    flushT = setTimeout(() => { flushT = null; if (pending.size) want([...pending][0]); }, 2500);
  }

  function onVersions(v) {
    for (const [k, n] of Object.entries(v)) if (S.versions[k] !== n) want(k);
    S.versions = v;
  }

  const live = $('#live');
  function connect() {
    const es = new EventSource('/api/stream');
    es.addEventListener('versions', (e) => { live.className = 'live on'; $('#liveTxt').textContent = 'LIVE'; onVersions(JSON.parse(e.data)); });
    es.onerror = () => { live.className = 'live off'; $('#liveTxt').textContent = 'RECONNECTING'; };
  }

  // ---------------- boot ----------------
  setInterval(() => { $('#clock').textContent = new Date().toISOString().slice(11, 19); }, 1000);
  setInterval(() => { renderRail(); }, 15_000); // refresh "x ago" labels
  renderTab(); renderRail();
  setInterval(propagateSats, 2000);
  initViews();
  Promise.allSettled([loadSummary(), loadLayer('air'), loadLayer('ships'), loadLayer('hazards'), loadLayer('activity'), loadLayer('sats')]).then(connect);

  // ---------------- views, HUD and visual modes ----------------
  function flyTo(lat, lon, close) {
    if (S.view === 'globe') window.SentinelGlobe?.flyTo(lat, lon, close ? 0.45 : 0.9);
    else map.flyTo([lat, lon], close ? 7 : 5, { duration: 0.8 });
  }
  function setCursor(lat, lon) {
    const c = $('#hudCursor'); if (!c) return;
    c.textContent = lat === null || lat === undefined ? '—' : `${Math.abs(lat).toFixed(3)}°${lat >= 0 ? 'N' : 'S'}  ${Math.abs(lon).toFixed(3)}°${lon >= 0 ? 'E' : 'W'}  ${mgrsish(lat, lon)}`;
  }
  // Coarse grid reference (zone + band), enough for a HUD readout.
  function mgrsish(lat, lon) {
    const zone = Math.floor((lon + 180) / 6) + 1; const bands = 'CDEFGHJKLMNPQRSTUVWX';
    return `${zone}${bands[Math.max(0, Math.min(19, Math.floor((lat + 80) / 8)))]}`;
  }
  function toast(msg) {
    const t = $('#toast'); t.textContent = msg; t.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => { t.hidden = true; }, 2600);
  }
  function setView(v) {
    S.view = v; try { localStorage.setItem('sentinel.view', v); } catch { /* ignore */ }
    const globeOk = !!window.SentinelGlobe && $('#globe').dataset.ok === '1';
    if (v === 'globe' && !globeOk) v = S.view = 'map';
    $('#globe').hidden = v !== 'globe'; $('#map').style.visibility = v === 'map' ? 'visible' : 'hidden';
    document.querySelectorAll('[data-view]').forEach((b) => b.classList.toggle('on', b.dataset.view === v));
    $('#rotBtn').hidden = v !== 'globe';
    window.SentinelGlobe?.setActive(v === 'globe');
    if (v === 'map') setTimeout(() => map.invalidateSize(), 50);
    hover.hidden = true;
  }
  function initViews() {
    const G = window.SentinelGlobe;
    if (G) {
      const ok = G.init($('#globe'), {
        colors: COLORS,
        onEntity: (k, id) => openEntity(k, id),
        onHover: (it, x, y) => { if (!it) { hover.hidden = true; return; } showHover(itemCard(it), x, y); },
        onClick: (it) => { if (it._t === 'sat') selectSat(it); else if (it._t === 'outage') toast(`${it.name}: ${it.ongoing ? 'ongoing outage' : `${it.alerts} outage alerts`}`); else showHover(itemCard(it) + extLink([it._t === 'ship' ? 'ships' : it._t === 'air' ? 'milair' : '', it]), 20, 20); },
        onCursor: (c) => setCursor(c?.lat, c?.lon),
        onCountry: (p) => openCountry(p.iso || p.name),
        onCountryHover: (p, x, y) => showHover(countryHover(p), x, y),
        onRef: (d) => { if (d.kind === 'base') showHover(`<div class="h" style="color:${d.color}">${esc(d.name)}</div>${kv([['Operator', d.operator], ['Host', d.host]])}`, 20, 60); else if (d.parties) showHover(`<div class="h" style="color:${COLORS.contested}">DISPUTED — ${esc(d.name)}</div><div>${esc(d.parties)}</div><div class="det muted">Approximate; for orientation only.</div>`, 20, 60); },
        onAutoRotate: (on) => { $('#rotBtn').classList.toggle('on', on); },
      });
      $('#globe').dataset.ok = ok ? '1' : '0';
      G.setVis(S.vis);
    }
    setView(S.view);
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    const imgSel = $('#imgSel');
    imgSel.innerHTML = Object.entries(IMAGERY).map(([k, v]) => `<option value="${k}">${esc(v.label)}</option>`).join('');
    if (!IMAGERY[S.imagery]) S.imagery = 'night';
    imgSel.value = S.imagery;
    imgSel.addEventListener('change', (e) => { S.imagery = e.target.value; saveGeo(); applyImagery(); toast(`Imagery: ${IMAGERY[S.imagery].label}`); });
    const dateIn = $('#imgDate'); dateIn.value = yesterday(); dateIn.max = new Date().toISOString().slice(0, 10);
    const setDate = (d) => { S.imgDate = d; dateIn.value = d; applyImagery(); };
    dateIn.addEventListener('change', () => setDate(dateIn.value));
    $('#imgPrev').addEventListener('click', () => setDate(new Date(Date.parse(dateIn.value) - 86_400_000).toISOString().slice(0, 10)));
    $('#imgNext').addEventListener('click', () => { const n = new Date(Date.parse(dateIn.value) + 86_400_000).toISOString().slice(0, 10); if (n <= dateIn.max) setDate(n); });
    applyImagery();
    renderTerminator(); setInterval(renderTerminator, 60_000);
    initCountries();
    $('#rotBtn').addEventListener('click', () => { const on = !$('#rotBtn').classList.contains('on'); $('#rotBtn').classList.toggle('on', on); G?.setAutoRotate(on); });
    $('#rotBtn').classList.add('on');

    const FX = window.SentinelFX;
    FX.init($('#viewport'), $('#fxOverlay'));
    const sel = $('#fxSel');
    sel.innerHTML = FX.MODES.map((m) => `<option value="${m.id}">[${m.key.toUpperCase()}] ${m.label}</option>`).join('');
    sel.addEventListener('change', (e) => FX.set(e.target.value));
    window.addEventListener('sentinel:fx', (e) => { sel.value = e.detail.id; $('#hudMode').textContent = e.detail.label.toUpperCase(); toast(`Mode: ${e.detail.label}`); });
    let fx = 'standard'; try { fx = localStorage.getItem('sentinel.fx') || 'standard'; } catch { /* ignore */ }
    FX.set(fx); $('#toast').hidden = true;
    $('#hudBtn').addEventListener('click', () => { document.body.classList.toggle('no-hud'); $('#hudBtn').classList.toggle('on', !document.body.classList.contains('no-hud')); });
    setInterval(() => {
      $('#hudTime').textContent = `${new Date().toISOString().slice(0, 19).replace('T', ' ')}Z`;
      const alt = S.view === 'globe' ? G?.altitude() : null;
      $('#hudAlt').textContent = alt ? `ALT ${fmt(Math.round(alt * 6371))} KM` : `Z ${map.getZoom()}`;
    }, 1000);
  }
})();
