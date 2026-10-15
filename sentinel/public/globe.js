/* SENTINEL 3D globe (globe.gl / three.js).
   Bulk tracks (aircraft, ships, satellites, fires, GNSS-degraded) are GPU
   particles; incidents are extruded columns and hex bins; theatres pulse as
   rings; sea lanes are animated arcs. Hover/click use a nearest-item search on
   globe coordinates so every layer is inspectable without per-object meshes. */
(() => {
  'use strict';
  const TEX = 'https://cdn.jsdelivr.net/npm/three-globe@2.45.4/example/img/';
  const TEXTURES = { night: 'earth-night.jpg', marble: 'earth-blue-marble.jpg', dark: 'earth-dark.jpg', day: 'earth-day.jpg' };

  let globe = null; let el; let ready = false; let active = false;
  const D = { entities: [], air: [], ships: [], fires: [], events: [], geo: {}, outages: [], sats: [], quakes: [], gdacs: [], eonet: [], lanes: [], track: [], focus: null,
    countries: [], countryStyle: () => ({ fill: null }), extrude: false, contested: [], bases: [], night: null, footprints: [], selCountry: null };
  let hoverCountry = null;
  let vis = {}; let colors = {}; let cb = {};
  let pending = false;

  const ftToAlt = (ft) => 0.004 + Math.min(45000, Math.max(0, ft || 0)) / 45000 * 0.025; // exaggerated for legibility
  const kmToAlt = (km) => (km < 2000 ? km / 6371 : 0.31 + Math.log10(km / 2000) * 0.25); // MEO/GEO compressed

  function init(container, opts) {
    el = container; colors = opts.colors; cb = opts;
    if (typeof Globe === 'undefined') { el.innerHTML = '<div class="globe-err">3D engine failed to load (globe.gl CDN unreachable). Use 2D map.</div>'; return false; }
    globe = new Globe(el, { animateIn: false, waitForGlobeReady: true })
      .backgroundColor('rgba(0,0,0,0)')
      .globeImageUrl(TEX + TEXTURES.night).bumpImageUrl(TEX + 'earth-topology.png')
      .backgroundImageUrl(TEX + 'night-sky.png')
      .showAtmosphere(true).atmosphereColor('#3a9bff').atmosphereAltitude(0.17)
      .showGraticules(true)
      // labels: chokepoints + theatres
      .labelLat('lat').labelLng('lon').labelText((d) => (d.kind === 'chokepoint' || d.kind === 'hotspot' ? `${ascii(d.name)}  ${d.score ?? ''}` : ascii(d.name)))
      .labelSize((d) => ({ chokepoint: 0.55, hotspot: 0.5, base: 0.32, contested: 0.42 }[d.kind] || 0.4))
      .labelDotRadius((d) => (d.kind === 'base' ? 0.22 : 0.32)).labelColor((d) => (d.kind === 'base' ? d.color : d.kind === 'contested' ? colors.contested : statusCol(d.level?.status)))
      .labelResolution(2).labelAltitude(0.004)
      .onLabelClick((d) => (d.kind === 'chokepoint' || d.kind === 'hotspot' ? cb.onEntity?.(d.kind, d.id) : cb.onRef?.(d)))
      // polygons: country choropleth, disputed areas, night side
      .polygonGeoJsonGeometry('geometry').polygonCapColor(capColor).polygonSideColor(sideColor).polygonStrokeColor(strokeColor)
      .polygonAltitude(polyAlt).polygonCapCurvatureResolution(3).polygonsTransitionDuration(250)
      .onPolygonHover((d) => { hoverCountry = d && d._k === 'country' ? d : null; refreshPolys(); })
      .onPolygonClick((d, ev, c) => {
        const hit = c ? nearest(c.lat, c.lng) : null;
        if (hit) cb.onClick?.(hit, ev);
        else if (d._k === 'country') cb.onCountry?.(d.properties);
        else if (d._k === 'contested') cb.onRef?.(d.ref);
      })
      // rings: theatre pulses, quakes, outages, recent strikes
      .ringLat('lat').ringLng('lon').ringColor((d) => (t) => rgba(d.color, 1 - t)).ringMaxRadius('r').ringPropagationSpeed('speed').ringRepeatPeriod('period').ringAltitude(0.0025)
      // columns: kinetic events, outages, disaster alerts, geolocated drone reports
      .pointLat('lat').pointLng('lon').pointColor('color').pointAltitude('h').pointRadius('rad').pointsMerge(true).pointResolution(6).pointsTransitionDuration(0)
      // hex bins: civil unrest density
      .hexBinPointLat('lat').hexBinPointLng('lon').hexBinPointWeight('w').hexBinResolution(3).hexMargin(0.25)
      .hexAltitude((d) => Math.min(0.12, 0.004 + d.sumWeight * 0.0022)).hexTopColor((d) => unrestCol(d)).hexSideColor((d) => rgba(unrestCol(d), 0.55))
      .hexBinMerge(true).hexTransitionDuration(0)
      // particles: tracks
      .particlesList('list').particleLat('lat').particleLng('lon').particleAltitude('a').particlesSize('size').particlesColor('color').particlesSizeAttenuation(false)
      // arcs: sea lanes
      .arcStartLat((d) => d.a.lat).arcStartLng((d) => d.a.lon).arcEndLat((d) => d.b.lat).arcEndLng((d) => d.b.lon).arcColor((d) => [rgba(d.color, 0.15), rgba(d.color, 0.9)])
      .arcDashLength(0.35).arcDashGap(0.15).arcDashAnimateTime(5000).arcStroke(0.35).arcAltitudeAutoScale(0.25)
      // paths: selected satellite ground track
      .pathPoints('pts').pathPointLat((p) => p[0]).pathPointLng((p) => p[1]).pathPointAlt((p) => p[2] ?? 0.002).pathColor('color').pathStroke('stroke')
      .pathDashLength('dash').pathDashGap('gap').pathDashAnimateTime('anim').pathTransitionDuration(0);

    const ctl = globe.controls(); ctl.autoRotate = true; ctl.autoRotateSpeed = 0.25; ctl.enableDamping = true;
    el.addEventListener('pointerdown', () => { ctl.autoRotate = false; cb.onAutoRotate?.(false); });
    globe.pointOfView({ lat: 25, lng: 45, altitude: 2.2 });
    new ResizeObserver(() => { if (active) globe.width(el.clientWidth).height(el.clientHeight); }).observe(el);

    el.addEventListener('mousemove', (e) => {
      const r = el.getBoundingClientRect();
      const c = globe.toGlobeCoords(e.clientX - r.left, e.clientY - r.top);
      cb.onCursor?.(c ? { lat: c.lat, lon: c.lng } : null);
      const hit = c ? nearest(c.lat, c.lng) : null;
      if (hit || !hoverCountry) cb.onHover?.(hit, e.clientX - r.left, e.clientY - r.top);
      else cb.onCountryHover?.(hoverCountry.properties, e.clientX - r.left, e.clientY - r.top);
      el.style.cursor = hit || hoverCountry ? 'pointer' : '';
    });
    el.addEventListener('mouseleave', () => cb.onHover?.(null));
    globe.onGlobeClick(({ lat, lng }, ev) => { const hit = nearest(lat, lng); if (hit) cb.onClick?.(hit, ev); });
    ready = true;
    window.__sentinelGlobe = globe; // debugging handle
    return true;
  }

  // The label font only covers ASCII; strip anything else so glyph lookups never fail.
  const ascii = (t) => String(t || '').normalize('NFD').replace(/[^\x20-\x7e]/g, '').replace(/\s+/g, ' ').trim();
  const ok = (o) => Number.isFinite(o.lat) && Number.isFinite(o.lon);
  const okAll = (arr) => arr.filter((o) => ok(o) && (o.a === undefined || Number.isFinite(o.a)) && (o.h === undefined || Number.isFinite(o.h)));

  function rgba(hex, a) {
    if (!hex) return `rgba(150,160,170,${a})`;
    if (hex.startsWith('rgb')) return hex.replace(/rgba?\(([^)]+?)(,\s*[\d.]+)?\)/, `rgba($1,${a})`);
    const h = hex.replace('#', ''); const n = parseInt(h.length === 3 ? h.split('').map((x) => x + x).join('') : h, 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
  }
  const statusCol = (s) => colors[s] || colors.muted;

  // ---- polygon styling ----
  function capColor(d) {
    if (d._k === 'night') return 'rgba(0,3,12,0.42)';
    if (d._k === 'contested') return 'rgba(255,209,102,0.22)';
    const st = D.countryStyle(d.properties);
    if (!st.fill) return 'rgba(0,0,0,0)';
    const hov = d === hoverCountry || d.properties.iso === D.selCountry;
    if (st.fill.startsWith('rgba')) return hov ? rgba(st.fill, 0.6) : st.fill; // already carries its own alpha
    return rgba(st.fill, hov ? 0.95 : 0.62);
  }
  function sideColor(d) {
    if (d._k !== 'country' || !D.extrude) return 'rgba(0,0,0,0)';
    const st = D.countryStyle(d.properties); return st.fill ? rgba(st.fill, 0.35) : 'rgba(0,0,0,0)';
  }
  function strokeColor(d) {
    if (d._k === 'night') return false;
    if (d._k === 'contested') return colors.contested;
    return d === hoverCountry || d.properties.iso === D.selCountry ? '#ffffff' : 'rgba(170,190,210,0.28)';
  }
  function polyAlt(d) {
    if (d._k === 'night') return 0.0015;
    if (d._k === 'contested') return 0.007;
    const base = d === hoverCountry || d.properties.iso === D.selCountry ? 0.012 : 0.004;
    if (!D.extrude) return base;
    const st = D.countryStyle(d.properties);
    return base + (st.norm ?? 0) * 0.06;
  }
  // Fresh closures each time: the layer only re-evaluates when the accessor reference changes.
  function refreshPolys() { if (globe) globe.polygonCapColor((d) => capColor(d)).polygonSideColor((d) => sideColor(d)).polygonStrokeColor((d) => strokeColor(d)).polygonAltitude((d) => polyAlt(d)); }
  // Rings must wind clockwise in lon/lat (as Natural Earth does); a counter-clockwise ring would fill the rest of the globe.
  const toGeo = (ring) => {
    const r = [...ring.map(([la, lo]) => [lo, la]), [ring[0][1], ring[0][0]]];
    let a = 0; for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1];
    return { type: 'Polygon', coordinates: [a > 0 ? r.reverse() : r] };
  };
  const unrestCol = (d) => (d.points.some((p) => p.kind === 'riot') ? colors.riot : colors.protest);

  // Visible, inspectable items for hover search.
  function candidates() {
    const out = [];
    const add = (layer, arr) => { if (vis[layer]) for (const it of arr) out.push(it); };
    add('milair', D.air.filter((a) => a.mil)); add('civair', D.air.filter((a) => !a.mil)); add('ships', D.ships);
    add('kinetic', D.events.filter((e) => e.kind === 'aerial' || e.kind === 'clash' || e.kind === 'mass'));
    add('unrest', D.events.filter((e) => e.kind === 'protest' || e.kind === 'riot'));
    add('drones', D.air.filter((a) => a.uav)); add('drones', (D.geo.drone || []).map((p) => ({ ...p, _t: 'geo' })));
    add('outages', D.outages); add('sats', D.sats); add('gnss', D.air.filter((a) => a.degraded)); add('fires', D.fires);
    add('quakes', D.quakes); add('gdacs', D.gdacs); add('eonet', D.eonet);
    add('newsgeo', ['protest', 'shutdown', 'cyber', 'jamming'].flatMap((t) => (D.geo[t] || []).map((p) => ({ ...p, _t: 'geo' }))));
    return out;
  }
  function nearest(lat, lon) {
    const alt = globe.pointOfView().altitude;
    const thr = Math.max(0.15, alt * 1.6); // degrees
    let best = null; let bd = thr * thr;
    const cl = Math.cos((lat * Math.PI) / 180);
    for (const it of candidates()) {
      let dl = it.lon - lon; if (dl > 180) dl -= 360; if (dl < -180) dl += 360;
      const d = (it.lat - lat) ** 2 + (dl * cl) ** 2;
      if (d < bd) { bd = d; best = it; }
    }
    return best;
  }

  function schedule() { if (!pending && active && ready) { pending = true; requestAnimationFrame(apply); } }

  function apply() {
    pending = false;
    if (!globe) return;
    const C = colors;
    globe.labelsData(okAll([...(vis.choke ? D.entities.filter((e) => e.kind === 'chokepoint') : []), ...(vis.hot ? D.entities.filter((e) => e.kind === 'hotspot') : []),
      ...(vis.contested ? D.contested.map((c) => ({ ...c, kind: 'contested', lat: c.at ? c.at[0] : (c.ring || c.line)[0][0], lon: c.at ? c.at[1] : (c.ring || c.line)[0][1] })) : []),
      ...(vis.bases ? D.bases.map((b) => ({ ...b, kind: 'base' })) : [])]));
    const polys = [];
    if (vis.countries) for (const f of D.countries) polys.push(f);
    if (vis.contested) for (const c of D.contested.filter((x) => x.ring)) polys.push({ _k: 'contested', ref: c, geometry: toGeo(c.ring) });
    if (vis.terminator && D.night) polys.push({ _k: 'night', geometry: toGeo(D.night) });
    globe.polygonsData(polys);

    const rings = [];
    if (vis.hot) for (const h of D.entities.filter((e) => e.kind === 'hotspot' && e.score >= 40)) rings.push({ lat: h.lat, lon: h.lon, color: statusCol(h.level.status), r: 2 + h.score / 25, speed: 1.2, period: 1600 });
    if (vis.quakes) for (const q of D.quakes.filter((x) => x.mag >= 4)) rings.push({ lat: q.lat, lon: q.lon, color: C.quake, r: (q.mag - 3) * 2.2, speed: 2, period: 2400 });
    if (vis.outages) for (const o of D.outages.filter((x) => x.critical || x.ongoing)) rings.push({ lat: o.lat, lon: o.lon, color: C.outage, r: 6, speed: 3, period: 1200 });
    if (vis.kinetic) for (const e of D.events.filter((x) => x.kind === 'aerial' && Date.now() - x.ts < 3 * 3_600_000).slice(0, 80)) rings.push({ lat: e.lat, lon: e.lon, color: C.kinetic, r: 1.6, speed: 1.5, period: 900 });
    if (D.focus) rings.push({ lat: D.focus.lat, lon: D.focus.lon, color: '#ffffff', r: 5, speed: 2.5, period: 1400 });
    globe.ringsData(okAll(rings).filter((r) => Number.isFinite(r.r)));

    const cols = [];
    if (vis.kinetic) for (const e of D.events) if (e.kind === 'aerial' || e.kind === 'clash' || e.kind === 'mass')
      cols.push({ lat: e.lat, lon: e.lon, color: e.kind === 'aerial' ? C.kinetic : e.kind === 'mass' ? C.critical : C.clash, h: 0.006 + Math.min(0.05, e.articles * 0.005), rad: 0.12 });
    if (vis.outages) for (const o of D.outages) cols.push({ lat: o.lat, lon: o.lon, color: C.outage, h: 0.04 + Math.min(0.25, (o.alerts + o.critical * 3 + (o.ongoing ? 6 : 0)) * 0.012), rad: 0.9 });
    if (vis.drones) for (const p of D.geo.drone || []) cols.push({ lat: p.lat, lon: p.lon, color: C.drone, h: 0.01 + Math.min(0.1, p.count * 0.008), rad: 0.3 });
    if (vis.newsgeo) for (const t of ['protest', 'shutdown', 'cyber', 'jamming']) for (const p of D.geo[t] || []) cols.push({ lat: p.lat, lon: p.lon, color: C[`geo_${t}`], h: 0.006 + Math.min(0.06, p.count * 0.005), rad: 0.22 });
    if (vis.gdacs) for (const g of D.gdacs) cols.push({ lat: g.lat, lon: g.lon, color: { Red: C.critical, Orange: C.serious, Green: C.good }[g.level] || C.muted, h: 0.02, rad: 0.5 });
    if (vis.eonet) for (const e of D.eonet) cols.push({ lat: e.lat, lon: e.lon, color: '#d9dee3', h: 0.008, rad: 0.25 });
    globe.pointsData(okAll(cols));

    globe.hexBinPointsData(vis.unrest ? okAll(D.events).filter((e) => e.kind === 'protest' || e.kind === 'riot').map((e) => ({ lat: e.lat, lon: e.lon, w: e.kind === 'riot' ? 3 : 1, kind: e.kind })) : []);

    const P = [];
    const set = (list, color, size) => { const l = okAll(list); if (l.length) P.push({ list: l, color, size }); };
    if (vis.civair) set(D.air.filter((a) => !a.mil).map((a) => ({ lat: a.lat, lon: a.lon, a: ftToAlt(a.alt) })), C.airCivil, 2.5);
    if (vis.milair) set(D.air.filter((a) => a.mil && !a.uav).map((a) => ({ lat: a.lat, lon: a.lon, a: ftToAlt(a.alt) })), C.airMil, 4.5);
    if (vis.drones) set(D.air.filter((a) => a.uav).map((a) => ({ lat: a.lat, lon: a.lon, a: ftToAlt(a.alt) })), C.drone, 7);
    if (vis.gnss) set(D.air.filter((a) => a.degraded).map((a) => ({ lat: a.lat, lon: a.lon, a: ftToAlt(a.alt) + 0.002 })), C.gnss, 6);
    if (vis.ships) for (const [cls, col] of [['tanker', C.tanker], ['cargo', C.cargo], ['military', C.shipMil], ['other', C.shipOther]])
      set(D.ships.filter((s) => (cls === 'other' ? !['tanker', 'cargo', 'military'].includes(s.cls) : s.cls === cls)).map((s) => ({ lat: s.lat, lon: s.lon, a: 0.0012 })), col, 3);
    if (vis.fires) set(D.fires.map((f) => ({ lat: f.lat, lon: f.lon, a: 0.001 })), C.fire, 3);
    if (vis.sats) set(D.sats.map((s) => ({ lat: s.lat, lon: s.lon, a: kmToAlt(s.altKm) })), C.sat, 3);
    globe.particlesData(P);

    globe.arcsData(vis.lanes ? D.lanes : []);
    const paths = [];
    if (D.track.length) {
      const pts = D.track.filter((p) => p.every(Number.isFinite));
      paths.push({ pts, color: ['rgba(255,255,255,0.15)', 'rgba(255,255,255,0.95)'], stroke: 1.4, dash: 0.02, gap: 0.004, anim: 30000 });
      paths.push({ pts: pts.map(([a, b]) => [a, b, 0.002]), color: 'rgba(255,255,255,0.45)', stroke: 0.6, dash: 0.01, gap: 0.01, anim: 0 });
    }
    if (vis.contested) for (const c of D.contested.filter((x) => x.line)) paths.push({ pts: c.line, color: colors.contested, stroke: 1.1, dash: c.dashed ? 0.02 : 1, gap: c.dashed ? 0.015 : 0, anim: 0 });
    if (vis.footprints) for (const fp of D.footprints) paths.push({ pts: fp.pts, color: fp.color, stroke: 0.5, dash: 1, gap: 0, anim: 0 });
    globe.pathsData(paths);
  }

  function update(part, value) { D[part] = value; schedule(); }
  function setVis(v) { vis = { ...v }; schedule(); }
  function setActive(on) {
    active = on;
    if (!globe) return;
    if (on) { globe.width(el.clientWidth).height(el.clientHeight); globe.resumeAnimation?.(); schedule(); } else globe.pauseAnimation?.();
  }
  function flyTo(lat, lon, alt = 1.1) { if (globe) { globe.pointOfView({ lat, lng: lon, altitude: alt }, 1200); globe.controls().autoRotate = false; cb.onAutoRotate?.(false); } }
  function setTexture(k) { if (globe && TEXTURES[k]) globe.globeTileEngineUrl(null).globeImageUrl(TEX + TEXTURES[k]); }
  // Slippy-map imagery (Web Mercator XYZ) streamed onto the globe at the current zoom.
  function setTiles(urlFn, maxLevel) { if (globe) globe.globeTileEngineMaxLevel(maxLevel).globeTileEngineUrl(urlFn); }
  function setCountryStyle(fn, extrude) { D.countryStyle = fn; D.extrude = !!extrude; refreshPolys(); }
  function selectCountry(iso) { D.selCountry = iso; refreshPolys(); }
  function setAutoRotate(on) { if (globe) globe.controls().autoRotate = on; }
  function altitude() { return globe ? globe.pointOfView().altitude : null; }

  window.SentinelGlobe = { init, update, setVis, setActive, flyTo, setTexture, setTiles, setCountryStyle, selectCountry, setAutoRotate, altitude, kmToAlt,
    pointOfView: () => globe?.pointOfView() };
})();
