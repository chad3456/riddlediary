/* Geopolitical lenses: joins Natural Earth country shapes with live signals
   (theatre risk, advisories, unrest/kinetic events, outages, satellite
   coverage) and static reference layers (blocs, sanctions, nuclear status)
   into one choropleth model used by both the globe and the 2D map. */
(() => {
  'use strict';
  const REF = window.GEOREF;

  // Ramps for dark surfaces: low → high gets brighter. One hue per lens.
  const RAMP = {
    unrest: ['#3b2a17', '#6b4520', '#a5651f', '#dd861f', '#ffb15c'],
    kinetic: ['#3a1a20', '#6c2232', '#a52b42', '#dc3653', '#ff6b82'],
    satcov: ['#14283a', '#1c4566', '#226797', '#3a8fd0', '#7cc4ff'],
    sanctions: ['#3a1838', '#7a2a72', '#c344b5'],
    nuclear: ['#2c2147', '#5a3f99', '#9a7cf0'],
  };
  const STATUS = () => {
    const c = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
    return { good: c('--good'), guarded: c('--guarded'), warning: c('--warning'), serious: c('--serious'), critical: c('--critical') };
  };
  const BLOC_COL = { member: '#2ec4b6', partner: 'rgba(46,196,182,0.38)' };

  const LENSES = [
    { id: 'risk', label: 'Country risk index', kind: 'status', note: 'Composite of theatre risk, US travel advisory, kinetic & unrest events (24h) and internet outages — renormalised over available signals.' },
    { id: 'advisory', label: 'US travel advisory', kind: 'status', note: 'US State Department advisory level (1–4).' },
    { id: 'unrest', label: 'Civil unrest (24h)', kind: 'seq', note: 'Protest + riot events geocoded by GDELT in the last 24h.' },
    { id: 'kinetic', label: 'Kinetic activity (24h)', kind: 'seq', note: 'Airstrike / drone-strike, armed-clash and mass-violence events (GDELT, 24h).' },
    { id: 'outages', label: 'Internet outages', kind: 'status', note: 'IODA alerts (24h) and ongoing Cloudflare Radar outages.' },
    { id: 'bloc', label: 'Alliances & blocs', kind: 'bloc', note: 'Membership (reference).' },
    { id: 'sanctions', label: 'Sanctions exposure', kind: 'seq', note: 'Breadth of US / EU / UK / UN sanctions programmes (reference — verify with OFAC & EU Sanctions Map).' },
    { id: 'nuclear', label: 'Nuclear weapons status', kind: 'seq', note: 'NPT nuclear-weapon states, non-NPT nuclear states, NATO nuclear-sharing hosts (reference).' },
    { id: 'satcov', label: 'Satellites overhead now', kind: 'seq', note: 'Tracked satellites whose sub-point is within 1,500 km of the country centroid. Updates every few seconds.' },
  ];

  let features = []; let byIso = {};
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/^the\s+/, '').replace(/[^a-z ]/g, ' ').replace(/\s+/g, ' ').trim();
  const ADV_ALIAS = { burma: ['MM'], 'cote d ivoire': ['CI'], 'israel the west bank and gaza': ['IL', 'PS'], 'mainland china': ['CN'], 'republic of the congo': ['CG'],
    'democratic republic of the congo': ['CD'], 'north korea': ['KP'], 'south korea': ['KR'], 'bosnia and herzegovina': ['BA'], 'timor leste': ['TL'], 'eswatini': ['SZ'],
    'czechia': ['CZ'], 'north macedonia': ['MK'], 'turkiye': ['TR'], 'cabo verde': ['CV'], 'gambia': ['GM'], 'bahamas': ['BS'] };

  async function load() {
    const g = await fetch('data/countries-110m.geojson').then((r) => r.json());
    features = g.features.filter((f) => f.properties.name !== 'Antarctica');
    for (const f of features) {
      f.properties.centroid = centroidOf(f.geometry);
      if (f.properties.iso) byIso[f.properties.iso] = f;
    }
    return features;
  }
  function centroidOf(geom) {
    const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates;
    let best = polys[0]; let bestA = 0;
    for (const p of polys) { const a = Math.abs(area(p[0])); if (a > bestA) { bestA = a; best = p; } }
    let x = 0; let y = 0; const r = best[0];
    for (const [lo, la] of r) { x += lo; y += la; }
    return { lat: y / r.length, lon: x / r.length };
  }
  function area(r) { let s = 0; for (let i = 0; i < r.length - 1; i++) s += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]; return s / 2; }

  // ---- join live + reference signals into per-country stats ----
  function stats({ summary, events, outages, advisories, sats }) {
    const out = {};
    const advIso = {};
    for (const [name, a] of Object.entries(advisories || {})) {
      const n = norm(name);
      const isos = ADV_ALIAS[n] || features.filter((f) => [f.properties.name, f.properties.long].some((x) => norm(x) === n)).map((f) => f.properties.iso);
      for (const iso of isos) advIso[iso] = Math.max(advIso[iso] || 0, a.level);
    }
    const byFips = {};
    for (const e of events || []) {
      const k = e.cc; if (!k) continue;
      const s = byFips[k] || (byFips[k] = { unrest: 0, kinetic: 0, aerial: 0 });
      if (e.kind === 'protest' || e.kind === 'riot') s.unrest++; else s.kinetic++;
      if (e.kind === 'aerial') s.aerial++;
    }
    const outIso = {};
    for (const o of outages || []) outIso[o.code] = o;
    const theatre = {};
    for (const h of summary?.hotspots || []) for (const iso of h.iso || []) if (h.score !== null) {
      if (!theatre[iso] || h.score > theatre[iso].score) theatre[iso] = { score: h.score, name: h.name, id: h.id };
    }
    const hasEvents = !!(events && events.length); const hasOut = !!outages; const hasAdv = !!advisories && Object.keys(advisories).length > 0;

    for (const f of features) {
      const p = f.properties; const iso = p.iso;
      const ev = [byFips[p.fips], byFips[p.fipsAlt]].filter(Boolean).reduce((a, b) => ({ unrest: a.unrest + b.unrest, kinetic: a.kinetic + b.kinetic, aerial: a.aerial + b.aerial }), { unrest: 0, kinetic: 0, aerial: 0 });
      const o = outIso[iso];
      const outageLevel = !hasOut ? null : o ? (o.ongoing ? 3 : o.critical ? 2 : 1) : 0;
      const blocs = Object.entries(REF.blocs).filter(([, b]) => b.members.includes(iso)).map(([k]) => k);
      const partners = Object.entries(REF.blocs).filter(([, b]) => (b.partners || []).includes(iso)).map(([k]) => k);
      const sanc = REF.sanctions.comprehensive.includes(iso) ? 3 : REF.sanctions.extensive.includes(iso) ? 2 : REF.sanctions.targeted.includes(iso) ? 1 : 0;
      const nuke = REF.nuclear.nws.includes(iso) ? 3 : REF.nuclear.nonNpt.includes(iso) ? 2 : REF.nuclear.sharing.includes(iso) ? 1 : 0;
      const c = p.centroid;
      const satsOver = sats && sats.length ? sats.filter((s) => hav(s.lat, s.lon, c.lat, c.lon) <= 1500).length : null;
      const adv = hasAdv ? (advIso[iso] || null) : null;
      // Composite, renormalised over available components (same rule as the server model).
      const comps = [
        ['Theatre risk', 30, theatre[iso] ? theatre[iso].score / 100 : null],
        ['Travel advisory', 25, adv ? (adv - 1) / 3 : null],
        ['Kinetic events', 20, hasEvents ? Math.min(1, (ev.kinetic + ev.aerial) / 25) : null],
        ['Civil unrest', 15, hasEvents ? Math.min(1, ev.unrest / 40) : null],
        ['Internet outages', 10, outageLevel === null ? null : outageLevel / 3],
      ];
      const have = comps.filter((x) => x[2] !== null); const w = have.reduce((a, x) => a + x[1], 0);
      const risk = w ? Math.round((have.reduce((a, x) => a + x[1] * x[2], 0) / w) * 100) : null;
      out[iso || p.name] = { name: p.name, iso, fips: p.fips, risk, riskComps: comps, coverage: Math.round((w / 100) * 100), theatre: theatre[iso] || null,
        advisory: adv, unrest: hasEvents ? ev.unrest : null, kinetic: hasEvents ? ev.kinetic : null, aerial: hasEvents ? ev.aerial : null,
        outage: o || null, outageLevel, blocs, partners, sanctions: sanc, nuclear: nuke, satsOver, pop: p.pop, cont: p.cont, sub: p.sub, centroid: c };
    }
    return out;
  }
  function hav(a, b, c, d) {
    const r = Math.PI / 180;
    return 6371 * 2 * Math.asin(Math.sqrt(Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2));
  }

  // ---- lens → value, colour, legend ----
  const RISK_BINS = [[80, 'SEVERE', 'critical'], [60, 'HIGH', 'serious'], [40, 'ELEVATED', 'warning'], [20, 'GUARDED', 'guarded'], [0, 'LOW', 'good']];
  const seqBin = (v, edges) => { let i = 0; while (i < edges.length && v >= edges[i]) i++; return i; };
  const EDGES = { unrest: [1, 5, 15, 40], kinetic: [1, 3, 10, 25], satcov: [1, 3, 6, 10] };

  function style(lens, s, bloc) {
    const S = STATUS();
    if (!s) return { fill: null };
    switch (lens) {
      case 'risk': { if (s.risk === null) return { fill: null }; const [, l, st] = RISK_BINS.find(([t]) => s.risk >= t); return { fill: S[st], label: `${l} ${s.risk}`, v: s.risk }; }
      case 'advisory': return s.advisory ? { fill: S[['good', 'warning', 'serious', 'critical'][s.advisory - 1]], label: `Level ${s.advisory}`, v: s.advisory } : { fill: null };
      case 'unrest': case 'kinetic': case 'satcov': {
        const v = lens === 'unrest' ? s.unrest : lens === 'kinetic' ? s.kinetic : s.satsOver;
        if (v === null || v === undefined) return { fill: null };
        return v === 0 ? { fill: 'rgba(120,130,140,0.10)', label: '0', v } : { fill: RAMP[lens][seqBin(v, EDGES[lens])], label: String(v), v };
      }
      case 'outages': return s.outageLevel === null ? { fill: null } : s.outageLevel === 0 ? { fill: 'rgba(120,130,140,0.10)', label: 'none', v: 0 }
        : { fill: S[['warning', 'serious', 'critical'][s.outageLevel - 1]], label: ['alerts', 'critical', 'ongoing'][s.outageLevel - 1], v: s.outageLevel };
      case 'bloc': { const b = REF.blocs[bloc]; if (!b) return { fill: null };
        if (b.members.includes(s.iso)) return { fill: BLOC_COL.member, label: 'member', v: 2 };
        if ((b.partners || []).includes(s.iso)) return { fill: BLOC_COL.partner, label: b.partnerLabel || 'partner', v: 1 };
        return { fill: 'rgba(120,130,140,0.07)', v: 0 }; }
      case 'sanctions': return s.sanctions ? { fill: RAMP.sanctions[s.sanctions - 1], label: ['targeted', 'extensive', 'comprehensive'][s.sanctions - 1], v: s.sanctions } : { fill: 'rgba(120,130,140,0.07)', v: 0 };
      case 'nuclear': return s.nuclear ? { fill: RAMP.nuclear[s.nuclear - 1], label: ['NATO sharing host', 'non-NPT nuclear', 'NPT nuclear-weapon state'][s.nuclear - 1], v: s.nuclear } : { fill: 'rgba(120,130,140,0.07)', v: 0 };
      default: return { fill: null };
    }
  }

  function legend(lens, bloc) {
    const S = STATUS();
    const sw = (c, t) => `<span class="lg-i"><i style="background:${c}"></i>${t}</span>`;
    const L = LENSES.find((x) => x.id === lens);
    let items = '';
    if (lens === 'risk') items = RISK_BINS.slice().reverse().map(([t, l, st]) => sw(S[st], `${l} ${t}+`)).join('');
    if (lens === 'advisory') items = ['Exercise normal precautions', 'Increased caution', 'Reconsider travel', 'Do not travel'].map((t, i) => sw(S[['good', 'warning', 'serious', 'critical'][i]], `L${i + 1} ${t}`)).join('');
    if (lens === 'unrest' || lens === 'kinetic' || lens === 'satcov') {
      const e = EDGES[lens]; const labels = [`${e[0]}–${e[1] - 1}`, `${e[1]}–${e[2] - 1}`, `${e[2]}–${e[3] - 1}`, `${e[3]}+`];
      items = sw('rgba(120,130,140,0.25)', '0') + RAMP[lens].slice(1).map((c, i) => sw(c, labels[i])).join('');
    }
    if (lens === 'outages') items = sw('rgba(120,130,140,0.25)', 'none') + ['alerts', 'critical alerts', 'ongoing outage'].map((t, i) => sw(S[['warning', 'serious', 'critical'][i]], t)).join('');
    if (lens === 'bloc') { const b = REF.blocs[bloc]; items = sw(BLOC_COL.member, `${b.name} member`) + (b.partners ? sw(BLOC_COL.partner, b.partnerLabel || 'partner') : ''); }
    if (lens === 'sanctions') items = ['targeted', 'extensive / sectoral', 'comprehensive'].map((t, i) => sw(RAMP.sanctions[i], t)).join('');
    if (lens === 'nuclear') items = ['NATO nuclear-sharing host', 'non-NPT nuclear state', 'NPT nuclear-weapon state'].map((t, i) => sw(RAMP.nuclear[i], t)).join('');
    const ref = ['bloc', 'sanctions', 'nuclear'].includes(lens) ? ` · reference as of ${REF.asOf}` : '';
    return `<div class="lg-t">${L.label}${ref}</div><div class="lg-items">${items}<span class="lg-i"><i class="nodata"></i>no data</span></div>`;
  }

  window.SentinelGeo = { LENSES, load, stats, style, legend, get features() { return features; }, byIso: () => byIso, REF };
})();
