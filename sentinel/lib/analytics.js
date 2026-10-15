'use strict';
// Fusion layer: turns raw feed state into (1) a flat registry of live parameters,
// (2) explainable composite risk scores per chokepoint / hotspot, and
// (3) rule-based insights with the evidence that triggered them.

const { CHOKEPOINTS, HOTSPOTS, MARKETS } = require('./catalog');
const { haversineKm, inBox } = require('./geo');

const LEVELS = [
  [80, 'SEVERE', 'critical'], [60, 'HIGH', 'serious'], [40, 'ELEVATED', 'warning'], [20, 'GUARDED', 'guarded'], [0, 'LOW', 'good'],
];
const levelOf = (s) => (s === null ? { label: 'NO DATA', status: null } : (([, label, status]) => ({ label, status }))(LEVELS.find(([t]) => s >= t)));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const r1 = (v) => (v === null || v === undefined ? null : Math.round(v * 10) / 10);

function shipClass(t) {
  if (t === null || t === undefined) return 'unknown';
  if (t >= 80 && t <= 89) return 'tanker';
  if (t >= 70 && t <= 79) return 'cargo';
  if (t >= 60 && t <= 69) return 'passenger';
  if (t === 35 || t === 55) return 'military';
  if (t === 30) return 'fishing';
  if (t === 31 || t === 32 || t === 52) return 'tug';
  if (t >= 50 && t <= 59) return 'service';
  if (t === 36 || t === 37) return 'leisure';
  return 'other';
}

// Composite score: each component is 0..1 times its weight. Components with no
// data are dropped and the score is renormalised; coverage says how much of the
// model actually had data, so a thin score is never mistaken for a calm one.
function composite(components) {
  const have = components.filter((c) => c.value !== null && c.value !== undefined);
  const wTot = components.reduce((a, c) => a + c.weight, 0);
  const wHave = have.reduce((a, c) => a + c.weight, 0);
  if (!wHave) return { score: null, coverage: 0, components };
  const pts = have.reduce((a, c) => a + c.value * c.weight, 0);
  return { score: Math.round((pts / wHave) * 100), coverage: Math.round((wHave / wTot) * 100),
    components: components.map((c) => ({ ...c, value: c.value === null || c.value === undefined ? null : Math.round(c.value * 100) / 100 })) };
}

function analyze(state, history = {}) {
  const f = state.feeds;
  const params = [];
  const P = (o) => { params.push({ status: null, unit: '', ...o }); return o.value; };
  const insights = [];
  const I = (o) => insights.push({ ts: Date.now(), ...o });

  const mil = f.mil_air || [];
  const quakes = f.quakes || [];
  const eonet = f.eonet || [];
  const gdacs = f.gdacs || [];
  const fires = f.firms || [];
  const news = f.gdelt || {};
  const sea = f.sea_state || {};
  const density = f.air_density || {};
  const adv = f.advisories || {};
  const ioda = f.ioda || {};
  const ships = state.ships || [];
  const events = f.gdelt_events || [];
  const geo = f.gdelt_geo || {};
  const cfOut = f.cf_outages || [];
  const geoPts = (topic) => geo[topic]?.points || [];
  const evCount = (list, kind) => list.filter((e) => e.kind === kind).length;

  const newsStats = (key) => {
    const n = news[key] || {};
    return { vol: n.volume?.last24 ?? null, surge: n.volume?.surge ?? null, tone: n.tone?.last24 ?? null,
      toneWeek: n.tone?.week ?? null, articles: n.articles || [], volSeries: n.volume?.series || [], toneSeries: n.tone?.series || [] };
  };

  // ---------------- Chokepoints ----------------
  const chokepoints = CHOKEPOINTS.map((cp) => {
    const E = { entity: cp.id, entityName: cp.name, entityType: 'chokepoint' };
    const vs = ships.filter((s) => inBox(s.lat, s.lon, cp.box));
    const hasAis = state.aisCoverage?.has(cp.id) || vs.length > 0;
    const underway = vs.filter((s) => (s.sog ?? 0) >= 1).length;
    const stationary = vs.length - underway;
    const slowShare = vs.length ? stationary / vs.length : null;
    const cls = (c) => vs.filter((s) => shipClass(s.type) === c).length;
    const meanSog = underway ? vs.filter((s) => (s.sog ?? 0) >= 1).reduce((a, s) => a + s.sog, 0) / underway : null;
    const milNear = mil.filter((a) => haversineKm(a.lat, a.lon, cp.lat, cp.lon) <= cp.radiusKm * 1.5);
    const air = density[cp.id]?.aircraft;
    const w = sea[cp.id] || {};
    const ns = newsStats(`cp:${cp.id}`);
    const qNear = quakes.filter((q) => q.mag >= 4 && haversineKm(q.lat, q.lon, cp.lat, cp.lon) <= 500);
    const hz = gdacs.filter((g) => g.level !== 'Green' && haversineKm(g.lat, g.lon, cp.lat, cp.lon) <= 800).length
      + eonet.filter((e) => haversineKm(e.lat, e.lon, cp.lat, cp.lon) <= cp.radiusKm * 2).length;

    const g = 'Chokepoint';
    P({ ...E, group: g, key: 'vessels', label: 'Vessels tracked', value: hasAis ? vs.length : null, source: 'AIS' });
    P({ ...E, group: g, key: 'underway', label: 'Vessels underway (≥1 kn)', value: hasAis ? underway : null, source: 'AIS' });
    P({ ...E, group: g, key: 'stationary', label: 'Vessels stopped / anchored', value: hasAis ? stationary : null, source: 'AIS' });
    P({ ...E, group: g, key: 'slow_share', label: 'Stopped share', value: slowShare === null ? null : Math.round(slowShare * 100), unit: '%', source: 'AIS',
      status: slowShare === null ? null : slowShare > 0.7 ? 'serious' : slowShare > 0.5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'mean_sog', label: 'Mean speed (underway)', value: r1(meanSog), unit: 'kn', source: 'AIS' });
    P({ ...E, group: g, key: 'tankers', label: 'Tankers', value: hasAis ? cls('tanker') : null, source: 'AIS' });
    P({ ...E, group: g, key: 'cargo', label: 'Cargo / container', value: hasAis ? cls('cargo') : null, source: 'AIS' });
    P({ ...E, group: g, key: 'mil_vessels', label: 'Military / law-enforcement vessels (self-reported)', value: hasAis ? cls('military') : null, source: 'AIS' });
    P({ ...E, group: g, key: 'air_traffic', label: 'Aircraft overhead (all)', value: air ? air.length : null, source: 'ADS-B' });
    P({ ...E, group: g, key: 'mil_air', label: 'Military aircraft nearby', value: f.mil_air ? milNear.length : null, source: 'ADS-B',
      status: milNear.length >= 5 ? 'serious' : milNear.length >= 2 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'wind', label: 'Wind', value: r1(w.wind), unit: 'kn', source: 'Open-Meteo' });
    P({ ...E, group: g, key: 'gust', label: 'Gusts', value: r1(w.gust), unit: 'kn', source: 'Open-Meteo',
      status: w.gust == null ? null : w.gust >= 40 ? 'serious' : w.gust >= 28 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'wave', label: 'Significant wave height', value: r1(w.wave), unit: 'm', source: 'Open-Meteo Marine',
      status: w.wave == null ? null : w.wave >= 4 ? 'serious' : w.wave >= 2.5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'visibility', label: 'Visibility', value: w.vis == null ? null : r1(w.vis / 1000), unit: 'km', source: 'Open-Meteo',
      status: w.vis == null ? null : w.vis < 1000 ? 'serious' : w.vis < 4000 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'sst', label: 'Sea surface temp', value: r1(w.sst), unit: '°C', source: 'Open-Meteo Marine' });
    P({ ...E, group: g, key: 'news_vol', label: 'News articles (24h)', value: ns.vol, source: 'GDELT' });
    P({ ...E, group: g, key: 'news_surge', label: 'News surge vs 6-day avg', value: ns.surge, unit: '×', source: 'GDELT',
      status: ns.surge == null ? null : ns.surge >= 2.5 ? 'serious' : ns.surge >= 1.5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'tone', label: 'Media tone (24h)', value: ns.tone, source: 'GDELT',
      status: ns.tone == null ? null : ns.tone <= -6 ? 'serious' : ns.tone <= -4 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'quakes', label: 'M4+ quakes within 500 km', value: f.quakes ? qNear.length : null, source: 'USGS' });
    P({ ...E, group: g, key: 'hazards', label: 'Active hazard alerts nearby', value: f.gdacs || f.eonet ? hz : null, source: 'GDACS/EONET' });
    P({ ...E, group: g, key: 'oil_ref', label: 'Oil flow (reference baseline)', value: cp.oilMbd, unit: 'mb/d', source: 'EIA (reference)' });

    // GNSS interference: aircraft reporting degraded navigation accuracy.
    const nav = (air || []).filter((a) => a.nacp !== null && a.nacp !== undefined);
    const degraded = nav.filter((a) => a.nacp < 8 || a.gpsLost);
    const gnssShare = nav.length >= 5 ? degraded.length / nav.length : null;
    const evNear = events.filter((e) => haversineKm(e.lat, e.lon, cp.lat, cp.lon) <= cp.radiusKm * 2);
    const kinetic = evCount(evNear, 'aerial') + evCount(evNear, 'clash');
    const uavNear = milNear.filter((a) => a.uav);
    P({ ...E, group: g, key: 'gnss_reporting', label: 'Aircraft reporting nav accuracy', value: air ? nav.length : null, source: 'ADS-B' });
    P({ ...E, group: g, key: 'gnss_degraded', label: 'GNSS interference (aircraft with NACp<8)', value: gnssShare === null ? null : Math.round(gnssShare * 100), unit: '%', source: 'ADS-B (gpsjam method)',
      status: gnssShare === null ? null : gnssShare >= 0.3 ? 'serious' : gnssShare >= 0.1 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'kinetic', label: 'Airstrike / armed-clash events nearby (24h)', value: f.gdelt_events ? kinetic : null, source: 'GDELT events',
      status: !f.gdelt_events ? null : kinetic >= 10 ? 'serious' : kinetic >= 3 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'unrest', label: 'Protest / riot events nearby (24h)', value: f.gdelt_events ? evCount(evNear, 'protest') + evCount(evNear, 'riot') : null, source: 'GDELT events' });
    P({ ...E, group: g, key: 'uav', label: 'UAVs broadcasting nearby', value: f.mil_air ? uavNear.length : null, source: 'ADS-B',
      status: !f.mil_air ? null : uavNear.length ? 'warning' : 'good' });

    const risk = composite([
      { name: 'Kinetic events nearby', weight: 10, value: f.gdelt_events ? clamp01(kinetic / 12) : null },
      { name: 'GNSS interference', weight: 10, value: gnssShare === null ? null : clamp01(gnssShare / 0.4) },
      { name: 'News surge', weight: 25, value: ns.surge == null ? null : clamp01((ns.surge - 1) / 2) },
      { name: 'Negative tone', weight: 20, value: ns.tone == null ? null : clamp01((-ns.tone - 1.5) / 6) },
      { name: 'Military air activity', weight: 20, value: f.mil_air ? clamp01(milNear.length / 6) : null },
      { name: 'Weather / sea state', weight: 15, value: w.gust == null && w.wave == null ? null : Math.max(clamp01(((w.gust ?? 0) - 25) / 30), clamp01(((w.wave ?? 0) - 1.5) / 3.5)) },
      { name: 'Traffic stoppage', weight: 10, value: slowShare === null ? null : clamp01((slowShare - 0.35) / 0.5) },
      { name: 'Natural hazards', weight: 10, value: f.quakes || f.gdacs ? clamp01((qNear.length + hz) / 4) : null },
    ]);
    P({ ...E, group: g, key: 'risk', label: 'Composite risk score', value: risk.score, unit: '/100', source: 'SENTINEL model', status: levelOf(risk.score).status });

    // ---- insights ----
    const loc = { entity: cp.id, entityName: cp.name, lat: cp.lat, lon: cp.lon };
    if (milNear.length >= 3) I({ ...loc, id: `cp-mil-${cp.id}`, sev: milNear.length >= 6 ? 3 : 2, kind: 'Air',
      title: `${milNear.length} military aircraft broadcasting near ${cp.name}`,
      detail: `Types: ${[...new Set(milNear.map((a) => a.type).filter(Boolean))].slice(0, 6).join(', ') || 'unidentified'}. Callsigns: ${milNear.map((a) => a.cs).filter(Boolean).slice(0, 5).join(', ') || 'n/a'}.` });
    if (ns.surge >= 1.8 && ns.vol >= 20) I({ ...loc, id: `cp-news-${cp.id}`, sev: ns.surge >= 3 ? 3 : 2, kind: 'Intel',
      title: `Media attention on ${cp.name} up ${ns.surge}× vs 6-day average`,
      detail: `${ns.vol} articles in 24h; tone ${ns.tone ?? 'n/a'}. Lead headline: "${ns.articles[0]?.title || '—'}"` });
    if (slowShare !== null && vs.length >= 15 && slowShare >= 0.6) I({ ...loc, id: `cp-stop-${cp.id}`, sev: slowShare >= 0.75 ? 3 : 2, kind: 'Maritime',
      title: `${Math.round(slowShare * 100)}% of vessels at ${cp.name} are stopped`,
      detail: `${stationary} of ${vs.length} AIS contacts below 1 kn — possible queueing, anchorage build-up or transit disruption.` });
    if (gnssShare !== null && nav.length >= 8 && gnssShare >= 0.25) I({ ...loc, id: `cp-gnss-${cp.id}`, sev: gnssShare >= 0.5 ? 3 : 2, kind: 'EW',
      title: `GNSS interference likely around ${cp.name} (${Math.round(gnssShare * 100)}% of aircraft degraded)`,
      detail: `${degraded.length} of ${nav.length} aircraft report NACp below 8 or lost GPS — consistent with jamming or spoofing. Ships in the area may see the same; a geomagnetic storm can also degrade GNSS.` });
    if (uavNear.length) I({ ...loc, id: `cp-uav-${cp.id}`, sev: 2, kind: 'Drone',
      title: `${uavNear.length} UAV${uavNear.length > 1 ? 's' : ''} broadcasting near ${cp.name}`, detail: uavNear.map((a) => `${a.cs || a.id} (${a.type || 'UAV'}) at ${a.alt ?? '?'} ft`).join(', ') });
    if (kinetic >= 5) I({ ...loc, id: `cp-kin-${cp.id}`, sev: kinetic >= 12 ? 3 : 2, kind: 'Conflict',
      title: `${kinetic} airstrike / clash events coded near ${cp.name} in 24h`, detail: topPlaces(evNear.filter((e) => e.kind === 'aerial' || e.kind === 'clash')) });
    if ((w.wave ?? 0) >= 3.5 || (w.gust ?? 0) >= 40) I({ ...loc, id: `cp-wx-${cp.id}`, sev: 2, kind: 'Weather',
      title: `Hazardous sea state at ${cp.name}`, detail: `Waves ${w.wave ?? '–'} m, gusts ${w.gust ?? '–'} kn, visibility ${w.vis != null ? r1(w.vis / 1000) : '–'} km.` });
    if (qNear.some((q) => q.mag >= 6)) I({ ...loc, id: `cp-eq-${cp.id}`, sev: 3, kind: 'Hazard',
      title: `Strong earthquake near ${cp.name}`, detail: qNear.map((q) => `M${q.mag} ${q.place}`).join('; ') });

    return { ...cp, kind: 'chokepoint', ...risk, level: levelOf(risk.score), news: ns.articles.slice(0, 8), gnss: gnssShare, kinetic,
      newsVolSeries: ns.volSeries, toneSeries: ns.toneSeries, weather: w, vessels: vs.length, milNear: milNear.length,
      history: history[`cp:${cp.id}`] || [] };
  });

  // ---------------- Hotspots ----------------
  const hotspots = HOTSPOTS.map((hs) => {
    const E = { entity: hs.id, entityName: hs.name, entityType: 'hotspot' };
    const g = 'Hotspot';
    const ns = newsStats(`hs:${hs.id}`);
    const milIn = mil.filter((a) => inBox(a.lat, a.lon, hs.box));
    const qIn = quakes.filter((q) => inBox(q.lat, q.lon, hs.box));
    const evIn = eonet.filter((e) => inBox(e.lat, e.lon, hs.box));
    const gdIn = gdacs.filter((e) => inBox(e.lat, e.lon, hs.box));
    const fIn = fires.filter((x) => x.hs === hs.id);
    const frp = fIn.reduce((a, x) => a + (x.frp || 0), 0);
    const advLevel = f.advisories ? Math.max(0, ...hs.countries.map((c) => adv[c]?.level || 0)) || null : null;
    const outs = hs.iso.map((c) => ioda[c]).filter(Boolean);
    const outAlerts = outs.reduce((a, o) => a + o.alerts, 0);
    const outCrit = outs.reduce((a, o) => a + o.critical, 0);
    const shipsIn = ships.filter((s) => inBox(s.lat, s.lon, hs.box)).length;
    const toneShift = ns.tone != null && ns.toneWeek != null ? r1(ns.tone - ns.toneWeek) : null;

    P({ ...E, group: g, key: 'news_vol', label: 'News articles (24h)', value: ns.vol, source: 'GDELT' });
    P({ ...E, group: g, key: 'news_surge', label: 'News surge vs 6-day avg', value: ns.surge, unit: '×', source: 'GDELT',
      status: ns.surge == null ? null : ns.surge >= 2.5 ? 'serious' : ns.surge >= 1.5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'tone', label: 'Media tone (24h)', value: ns.tone, source: 'GDELT',
      status: ns.tone == null ? null : ns.tone <= -6 ? 'serious' : ns.tone <= -4 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'tone_shift', label: 'Tone shift vs 7-day mean', value: toneShift, source: 'GDELT',
      status: toneShift == null ? null : toneShift <= -1.5 ? 'serious' : toneShift <= -0.7 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'mil_air', label: 'Military aircraft in area', value: f.mil_air ? milIn.length : null, source: 'ADS-B',
      status: milIn.length >= 8 ? 'serious' : milIn.length >= 3 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'isr_air', label: 'ISR / tanker / AEW aircraft in area', value: f.mil_air ? milIn.filter(isIsr).length : null, source: 'ADS-B' });
    P({ ...E, group: g, key: 'quakes', label: 'Earthquakes (24h)', value: f.quakes ? qIn.length : null, source: 'USGS' });
    P({ ...E, group: g, key: 'nat_events', label: 'Open natural events', value: f.eonet ? evIn.length : null, source: 'NASA EONET' });
    P({ ...E, group: g, key: 'gdacs', label: 'Disaster alerts', value: f.gdacs ? gdIn.length : null, source: 'GDACS' });
    P({ ...E, group: g, key: 'fires', label: 'Thermal anomalies (24h)', value: f.firms ? fIn.length : null, source: 'NASA FIRMS',
      status: !f.firms ? null : fIn.length >= 150 ? 'serious' : fIn.length >= 50 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'fire_frp', label: 'Fire radiative power (sum)', value: f.firms ? Math.round(frp) : null, unit: 'MW', source: 'NASA FIRMS' });
    P({ ...E, group: g, key: 'advisory', label: 'US travel advisory (max)', value: advLevel, unit: '/4', source: 'US State Dept',
      status: advLevel == null ? null : advLevel >= 4 ? 'critical' : advLevel === 3 ? 'serious' : advLevel === 2 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'outages', label: 'Internet outage alerts (24h)', value: f.ioda ? outAlerts : null, source: 'IODA',
      status: !f.ioda ? null : outCrit > 0 ? 'serious' : outAlerts > 0 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'outages_crit', label: 'Critical outage alerts (24h)', value: f.ioda ? outCrit : null, source: 'IODA' });
    P({ ...E, group: g, key: 'vessels', label: 'Vessels in area (AIS coverage)', value: ships.length ? shipsIn : null, source: 'AIS' });

    const gIn = events.filter((e) => inBox(e.lat, e.lon, hs.box));
    const n = (k) => (f.gdelt_events ? evCount(gIn, k) : null);
    const uavIn = milIn.filter((a) => a.uav);
    const geoIn = (t) => (geo[t] ? geoPts(t).filter((p) => inBox(p.lat, p.lon, hs.box)).reduce((a, p) => a + p.count, 0) : null);
    const cfIn = cfOut.filter((o) => o.ongoing && o.countries.some((c) => hs.iso.includes(c.code)));
    const EV = 'GDELT events';
    P({ ...E, group: g, key: 'protests', label: 'Protest events (24h)', value: n('protest'), source: EV,
      status: n('protest') == null ? null : n('protest') >= 40 ? 'serious' : n('protest') >= 15 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'riots', label: 'Riot / violent-protest events (24h)', value: n('riot'), source: EV,
      status: n('riot') == null ? null : n('riot') >= 10 ? 'serious' : n('riot') >= 3 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'aerial', label: 'Airstrike / drone-strike events (24h)', value: n('aerial'), source: EV,
      status: n('aerial') == null ? null : n('aerial') >= 10 ? 'critical' : n('aerial') >= 3 ? 'serious' : 'good' });
    P({ ...E, group: g, key: 'clashes', label: 'Armed-clash events (24h)', value: n('clash'), source: EV,
      status: n('clash') == null ? null : n('clash') >= 20 ? 'serious' : n('clash') >= 5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'mass_violence', label: 'Mass-violence events (24h)', value: n('mass'), source: EV,
      status: n('mass') == null ? null : n('mass') >= 1 ? 'critical' : 'good' });
    P({ ...E, group: g, key: 'uav', label: 'UAVs broadcasting in area', value: f.mil_air ? uavIn.length : null, source: 'ADS-B' });
    P({ ...E, group: g, key: 'drone_reports', label: 'Geolocated drone reports (24h)', value: geoIn('drone'), source: 'GDELT GEO',
      status: geoIn('drone') == null ? null : geoIn('drone') >= 20 ? 'serious' : geoIn('drone') >= 5 ? 'warning' : 'good' });
    P({ ...E, group: g, key: 'shutdown_reports', label: 'Geolocated shutdown reports (24h)', value: geoIn('shutdown'), source: 'GDELT GEO' });
    P({ ...E, group: g, key: 'jamming_reports', label: 'Geolocated GPS-jamming reports (24h)', value: geoIn('jamming'), source: 'GDELT GEO' });
    P({ ...E, group: g, key: 'cf_outages', label: 'Ongoing outages (Cloudflare)', value: f.cf_outages ? cfIn.length : null, source: 'Cloudflare Radar',
      status: !f.cf_outages ? null : cfIn.length ? 'serious' : 'good' });
    const violence = (n('aerial') ?? 0) * 2 + (n('clash') ?? 0) + (n('mass') ?? 0) * 4;
    const unrest = (n('protest') ?? 0) + (n('riot') ?? 0) * 3;

    const risk = composite([
      { name: 'Armed violence events', weight: 15, value: f.gdelt_events ? clamp01(violence / 30) : null },
      { name: 'Civil unrest', weight: 10, value: f.gdelt_events ? clamp01(unrest / 50) : null },
      { name: 'Drone activity', weight: 10, value: f.gdelt_geo || f.mil_air ? clamp01(((geoIn('drone') ?? 0) + uavIn.length * 5) / 20) : null },
      { name: 'News surge', weight: 20, value: ns.surge == null ? null : clamp01((ns.surge - 1) / 2) },
      { name: 'Negative tone', weight: 20, value: ns.tone == null ? null : clamp01((-ns.tone - 2) / 6) },
      { name: 'Military air activity', weight: 15, value: f.mil_air ? clamp01(milIn.length / 10) : null },
      { name: 'Thermal anomalies', weight: 10, value: f.firms ? clamp01(fIn.length / 200) : null },
      { name: 'Travel advisory', weight: 15, value: advLevel == null ? null : (advLevel - 1) / 3 },
      { name: 'Internet outages', weight: 10, value: f.ioda || f.cf_outages ? clamp01((outAlerts + outCrit * 2 + cfIn.length * 4) / 8) : null },
      { name: 'Natural hazards', weight: 10, value: f.quakes || f.gdacs ? clamp01((qIn.filter((q) => q.mag >= 5).length + gdIn.filter((x) => x.level !== 'Green').length) / 3) : null },
    ]);
    P({ ...E, group: g, key: 'risk', label: 'Composite risk score', value: risk.score, unit: '/100', source: 'SENTINEL model', status: levelOf(risk.score).status });

    const loc = { entity: hs.id, entityName: hs.name, lat: hs.lat, lon: hs.lon };
    if (ns.surge >= 2 && ns.vol >= 30) I({ ...loc, id: `hs-news-${hs.id}`, sev: ns.surge >= 3 ? 3 : 2, kind: 'Intel',
      title: `${hs.name}: reporting volume ${ns.surge}× normal`, detail: `${ns.vol} articles/24h, tone ${ns.tone ?? 'n/a'}. "${ns.articles[0]?.title || '—'}"` });
    if (toneShift !== null && toneShift <= -1.5) I({ ...loc, id: `hs-tone-${hs.id}`, sev: 2, kind: 'Intel',
      title: `${hs.name}: coverage turning sharply negative`, detail: `24h tone ${ns.tone} vs 7-day ${ns.toneWeek} (Δ ${toneShift}).` });
    if (milIn.filter(isIsr).length >= 2) I({ ...loc, id: `hs-isr-${hs.id}`, sev: 2, kind: 'Air',
      title: `${hs.name}: ${milIn.filter(isIsr).length} ISR / tanker / AEW aircraft airborne`,
      detail: milIn.filter(isIsr).map((a) => `${a.cs || a.id} (${a.type})`).slice(0, 6).join(', ') });
    if (outCrit > 0) I({ ...loc, id: `hs-net-${hs.id}`, sev: 3, kind: 'Cyber',
      title: `${hs.name}: critical internet disruption detected`, detail: outs.map((o) => `${o.name}: ${o.critical} critical / ${o.alerts} alerts via ${o.sources.join(', ')}`).join('; ') });
    if ((n('aerial') ?? 0) >= 5) I({ ...loc, id: `hs-air-${hs.id}`, sev: n('aerial') >= 15 ? 4 : 3, kind: 'Conflict',
      title: `${hs.name}: ${n('aerial')} airstrike / drone-strike events coded in 24h`, detail: topPlaces(gIn.filter((e) => e.kind === 'aerial')) });
    if ((n('riot') ?? 0) >= 5 || (n('protest') ?? 0) >= 30) I({ ...loc, id: `hs-unrest-${hs.id}`, sev: (n('riot') ?? 0) >= 12 ? 3 : 2, kind: 'Unrest',
      title: `${hs.name}: ${n('protest')} protest and ${n('riot')} riot events in 24h`, detail: topPlaces(gIn.filter((e) => e.kind === 'protest' || e.kind === 'riot')) });
    if (uavIn.length) I({ ...loc, id: `hs-uav-${hs.id}`, sev: 2, kind: 'Drone',
      title: `${hs.name}: ${uavIn.length} UAV${uavIn.length > 1 ? 's' : ''} broadcasting ADS-B`, detail: uavIn.map((a) => `${a.cs || a.id} (${a.type || 'UAV'})`).join(', ') });
    if ((geoIn('drone') ?? 0) >= 10) I({ ...loc, id: `hs-dronenews-${hs.id}`, sev: 2, kind: 'Drone',
      title: `${hs.name}: ${geoIn('drone')} geolocated drone reports in 24h`, detail: geoPts('drone').filter((p) => inBox(p.lat, p.lon, hs.box)).sort((a, b) => b.count - a.count).slice(0, 4).map((p) => `${p.name} (${p.count})`).join('; ') });
    if (fIn.length >= 100) I({ ...loc, id: `hs-fire-${hs.id}`, sev: 2, kind: 'Hazard',
      title: `${hs.name}: ${fIn.length} thermal anomalies in 24h`, detail: `Total FRP ${Math.round(frp)} MW. Clusters can indicate shelling, strikes on fuel/infrastructure, or wildfire — corroborate before attributing.` });

    return { ...hs, kind: 'hotspot', ...risk, level: levelOf(risk.score), news: ns.articles.slice(0, 8),
      newsVolSeries: ns.volSeries, toneSeries: ns.toneSeries, milIn: milIn.length, fires: fIn.length, advisory: advLevel,
      protests: n('protest'), riots: n('riot'), aerial: n('aerial'), clashes: n('clash'), uav: uavIn.length,
      history: history[`hs:${hs.id}`] || [] };
  });

  // ---------------- Global ----------------
  const G = (o) => P({ entity: 'global', entityName: 'Global', entityType: 'global', ...o });

  const mk = f.markets || {};
  for (const m of MARKETS) {
    const q = mk[m.sym];
    G({ group: `Markets · ${m.group}`, key: `px_${m.sym}`, label: `${m.name}`, value: q?.price ?? null, unit: m.unit, source: 'Yahoo Finance' });
    G({ group: `Markets · ${m.group}`, key: `chg_${m.sym}`, label: `${m.name} 1-day change`, value: q?.chg ?? null, unit: '%', source: 'Yahoo Finance',
      status: q?.chg == null ? null : Math.abs(q.chg) >= 5 ? 'serious' : Math.abs(q.chg) >= 2.5 ? 'warning' : 'good' });
    if (q && Math.abs(q.chg) >= (m.group === 'Energy' ? 3 : m.group === 'FX' ? 1.5 : 4)) {
      I({ entity: 'global', entityName: 'Markets', id: `mk-${m.sym}`, sev: Math.abs(q.chg) >= 6 ? 3 : 2, kind: 'Markets',
        title: `${m.name} ${q.chg > 0 ? '+' : ''}${q.chg}% on the day`,
        detail: `${q.price} ${m.unit}; 1-month ${q.chg1m > 0 ? '+' : ''}${q.chg1m}%. ${m.group === 'Energy' ? 'Watch Hormuz / Bab el-Mandeb / Russian export signals.' : m.group === 'Shipping' ? 'Freight-sensitive equity — reads through to chokepoint disruption.' : ''}` });
    }
  }
  for (const [k, v] of Object.entries(f.crypto || {})) {
    G({ group: 'Markets · Crypto', key: `px_${k}`, label: `${k[0].toUpperCase()}${k.slice(1)} price`, value: v.price, unit: '$', source: 'CoinGecko' });
    G({ group: 'Markets · Crypto', key: `chg_${k}`, label: `${k[0].toUpperCase()}${k.slice(1)} 24h change`, value: v.chg, unit: '%', source: 'CoinGecko' });
  }
  if (f.markets) {
    const vix = mk['^VIX']?.price;
    G({ group: 'Markets · Risk', key: 'risk_off', label: 'Risk-off signal (VIX > 25)', value: vix == null ? null : vix > 25 ? 1 : 0, source: 'derived',
      status: vix == null ? null : vix > 30 ? 'serious' : vix > 25 ? 'warning' : 'good' });
  }

  const sw = f.space_wx;
  G({ group: 'Space weather', key: 'kp', label: 'Planetary Kp index', value: sw?.kp ?? null, source: 'NOAA SWPC',
    status: sw?.kp == null ? null : sw.kp >= 7 ? 'critical' : sw.kp >= 5 ? 'serious' : sw.kp >= 4 ? 'warning' : 'good' });
  G({ group: 'Space weather', key: 'kp_max', label: 'Kp max (24h)', value: sw?.kpMax24 ?? null, source: 'NOAA SWPC' });
  G({ group: 'Space weather', key: 'swpc_alerts', label: 'SWPC alerts / warnings (24h)', value: sw ? sw.alerts.length : null, source: 'NOAA SWPC' });
  if (sw?.kp >= 5) I({ entity: 'global', entityName: 'Space weather', id: 'sw-storm', sev: sw.kp >= 7 ? 3 : 2, kind: 'Space',
    title: `Geomagnetic storm in progress (Kp ${sw.kp})`, detail: 'Expect GNSS accuracy loss, HF radio degradation at high latitudes; can mask or mimic GPS jamming reports.' });

  const kev = f.cisa_kev;
  G({ group: 'Cyber', key: 'kev_total', label: 'Known exploited CVEs (catalog)', value: kev?.total ?? null, source: 'CISA KEV' });
  G({ group: 'Cyber', key: 'kev_7d', label: 'New exploited CVEs (7d)', value: kev?.d7 ?? null, source: 'CISA KEV',
    status: kev == null ? null : kev.d7 >= 10 ? 'serious' : kev.d7 >= 5 ? 'warning' : 'good' });
  G({ group: 'Cyber', key: 'kev_30d', label: 'New exploited CVEs (30d)', value: kev?.d30 ?? null, source: 'CISA KEV' });
  G({ group: 'Cyber', key: 'kev_ransom', label: 'Ransomware-linked additions (30d)', value: kev?.ransomware30 ?? null, source: 'CISA KEV' });
  if (kev?.d7 >= 5) I({ entity: 'global', entityName: 'Cyber', id: 'kev-burst', sev: 2, kind: 'Cyber',
    title: `${kev.d7} vulnerabilities added to CISA KEV this week`, detail: kev.latest.slice(0, 4).map((x) => `${x.id} ${x.vendor} ${x.product}`).join('; ') });
  const outCountries = Object.values(ioda);
  G({ group: 'Cyber', key: 'outage_countries', label: 'Countries with internet outage alerts (24h)', value: f.ioda ? outCountries.length : null, source: 'IODA' });
  G({ group: 'Cyber', key: 'outage_critical', label: 'Countries with critical outages (24h)', value: f.ioda ? outCountries.filter((o) => o.critical).length : null, source: 'IODA' });

  G({ group: 'Hazards', key: 'quakes', label: 'Earthquakes M2.5+ (24h)', value: f.quakes ? quakes.length : null, source: 'USGS' });
  G({ group: 'Hazards', key: 'quakes_m5', label: 'Earthquakes M5+ (24h)', value: f.quakes ? quakes.filter((q) => q.mag >= 5).length : null, source: 'USGS' });
  G({ group: 'Hazards', key: 'quakes_m6', label: 'Earthquakes M6+ (24h)', value: f.quakes ? quakes.filter((q) => q.mag >= 6).length : null, source: 'USGS',
    status: !f.quakes ? null : quakes.some((q) => q.mag >= 7) ? 'serious' : quakes.some((q) => q.mag >= 6) ? 'warning' : 'good' });
  G({ group: 'Hazards', key: 'quake_max', label: 'Largest quake (24h)', value: f.quakes && quakes.length ? Math.max(...quakes.map((q) => q.mag)) : null, unit: 'M', source: 'USGS' });
  G({ group: 'Hazards', key: 'tsunami', label: 'Quakes with tsunami flag', value: f.quakes ? quakes.filter((q) => q.tsunami).length : null, source: 'USGS' });
  for (const q of quakes.filter((x) => x.mag >= 6.5)) I({ entity: 'global', entityName: q.place, lat: q.lat, lon: q.lon, id: `eq-${q.id}`, sev: q.mag >= 7.5 ? 4 : 3, kind: 'Hazard',
    title: `M${q.mag} earthquake — ${q.place}`, detail: `Depth ${Math.round(q.depth)} km${q.tsunami ? ', tsunami flag set' : ''}${q.alert ? `, PAGER ${q.alert}` : ''}.` });
  for (const lvl of ['Red', 'Orange', 'Green']) G({ group: 'Hazards', key: `gdacs_${lvl.toLowerCase()}`, label: `GDACS ${lvl} alerts`, value: f.gdacs ? gdacs.filter((x) => x.level === lvl).length : null, source: 'GDACS',
    status: lvl === 'Red' && f.gdacs ? (gdacs.some((x) => x.level === 'Red') ? 'critical' : 'good') : null });
  for (const x of gdacs.filter((g) => g.level === 'Red')) I({ entity: 'global', entityName: x.country || x.name, lat: x.lat, lon: x.lon, id: `gdacs-${x.id}`, sev: 3, kind: 'Hazard',
    title: `GDACS RED alert: ${x.name}`, detail: `${x.severity || ''} ${x.country || ''}`.trim() });
  const cats = {};
  for (const e of eonet) cats[e.cat] = (cats[e.cat] || 0) + 1;
  for (const c of ['Wildfires', 'Severe Storms', 'Volcanoes', 'Floods', 'Sea and Lake Ice', 'Dust and Haze'])
    G({ group: 'Hazards', key: `eonet_${c}`, label: `Open events: ${c}`, value: f.eonet ? cats[c] || 0 : null, source: 'NASA EONET' });

  G({ group: 'Air', key: 'mil_total', label: 'Military aircraft broadcasting (global)', value: f.mil_air ? mil.length : null, source: 'ADS-B' });
  G({ group: 'Air', key: 'mil_airborne', label: 'Military aircraft airborne', value: f.mil_air ? mil.filter((a) => (a.alt ?? 0) > 0).length : null, source: 'ADS-B' });
  G({ group: 'Air', key: 'mil_isr', label: 'ISR / tanker / AEW aircraft airborne', value: f.mil_air ? mil.filter(isIsr).length : null, source: 'ADS-B' });
  G({ group: 'Air', key: 'mil_heavy', label: 'Strategic airlift aircraft airborne', value: f.mil_air ? mil.filter((a) => /^(C17|C5M|A400|IL76|C130|C30J|KC39)/.test(a.type || '')).length : null, source: 'ADS-B' });
  G({ group: 'Air', key: 'emergency', label: 'Aircraft squawking emergency (7500/7600/7700)', value: f.mil_air || f.air_density ? emergencies(mil, density).length : null, source: 'ADS-B',
    status: emergencies(mil, density).length ? 'serious' : 'good' });
  for (const a of emergencies(mil, density)) I({ entity: 'global', entityName: a.cs || a.id, lat: a.lat, lon: a.lon, id: `sq-${a.id}`, sev: a.sq === '7500' ? 4 : 3, kind: 'Air',
    title: `Squawk ${a.sq} — ${a.cs || a.id} (${a.type || 'unknown type'})`, detail: `${a.sq === '7500' ? 'Unlawful interference' : a.sq === '7600' ? 'Radio failure' : 'General emergency'} at ${a.alt ?? '?'} ft.` });

  // ---- Live activity: unrest, kinetic events, drones, EW, outages ----
  const EVG = 'Live activity';
  for (const [k, lbl] of [['protest', 'Protest events'], ['riot', 'Riot events'], ['aerial', 'Airstrike / drone-strike events'], ['clash', 'Armed-clash events'], ['mass', 'Mass-violence events']])
    G({ group: EVG, key: `ev_${k}`, label: `${lbl} worldwide (24h)`, value: f.gdelt_events ? evCount(events, k) : null, source: 'GDELT events' });
  const byCountry = {};
  for (const e of events) {
    const c = byCountry[e.country] || (byCountry[e.country] = { country: e.country, protest: 0, riot: 0, aerial: 0, clash: 0, mass: 0, ev: [] });
    c[e.kind]++; c.ev.push(e);
  }
  const countries = Object.values(byCountry);
  for (const c of countries.sort((a, b) => (b.protest + b.riot) - (a.protest + a.riot)).slice(0, 12))
    G({ group: `${EVG} · unrest by country`, key: `unrest_${c.country}`, label: `${c.country}: protest + riot events`, value: c.protest + c.riot, source: 'GDELT events',
      status: c.riot >= 10 ? 'serious' : c.protest + c.riot >= 30 ? 'warning' : null });
  for (const c of countries.sort((a, b) => (b.aerial + b.clash) - (a.aerial + a.clash)).slice(0, 12))
    G({ group: `${EVG} · kinetic by country`, key: `kinetic_${c.country}`, label: `${c.country}: airstrike + clash events`, value: c.aerial + c.clash, source: 'GDELT events',
      status: c.aerial >= 10 ? 'critical' : c.aerial + c.clash >= 10 ? 'serious' : null });
  for (const [t] of require('./feeds').GEO_TOPICS)
    G({ group: EVG, key: `geo_${t}`, label: `Geolocated ${t} reports (24h)`, value: geo[t] ? geoPts(t).reduce((a, p) => a + p.count, 0) : null, source: 'GDELT GEO' });
  const uavs = mil.filter((a) => a.uav);
  G({ group: EVG, key: 'uav_airborne', label: 'UAVs broadcasting ADS-B (global)', value: f.mil_air ? uavs.length : null, source: 'ADS-B' });
  const allAir = [...mil, ...Object.values(density).flatMap((d) => d.aircraft || [])];
  const navAll = allAir.filter((a) => a.nacp !== null && a.nacp !== undefined);
  G({ group: EVG, key: 'gnss_degraded', label: 'Aircraft with degraded GNSS (NACp<8)', value: navAll.length ? navAll.filter((a) => a.nacp < 8 || a.gpsLost).length : null, source: 'ADS-B' });
  G({ group: EVG, key: 'cf_ongoing', label: 'Ongoing internet outages (Cloudflare)', value: f.cf_outages ? cfOut.filter((o) => o.ongoing).length : null, source: 'Cloudflare Radar' });
  G({ group: EVG, key: 'cf_gov', label: 'Government-directed shutdowns (7d)', value: f.cf_outages ? cfOut.filter((o) => /government/i.test(o.cause || '')).length : null, source: 'Cloudflare Radar',
    status: !f.cf_outages ? null : cfOut.some((o) => o.ongoing && /government/i.test(o.cause || '')) ? 'critical' : 'good' });
  const sats = f.satellites || [];
  // Orbit regime from TLE line 2 (mean motion rev/day, eccentricity).
  const orbitOf = (t) => { const mm = +t.l2.slice(52, 63); const ecc = +`0.${t.l2.slice(26, 33).trim()}`;
    return ecc > 0.25 ? 'HEO' : mm > 0.95 && mm < 1.05 ? 'GEO' : mm > 11.25 ? 'LEO' : 'MEO'; };
  for (const cls of ['LEO', 'MEO', 'GEO', 'HEO'])
    G({ group: 'Space · overhead', key: `orbit_${cls}`, label: `Tracked satellites in ${cls}`, value: f.satellites ? sats.filter((x) => orbitOf(x) === cls).length : null, source: 'CelesTrak' });
  G({ group: 'Space · overhead', key: 'orbit_sso', label: 'Sun-synchronous imaging orbits (LEO, 95–101° incl.)', value: f.satellites ? sats.filter((x) => orbitOf(x) === 'LEO' && +x.l2.slice(8, 16) > 95 && +x.l2.slice(8, 16) < 101).length : null, source: 'CelesTrak' });
  for (const grp of ['Military', 'Earth observation', 'Radar calibration', 'GNSS'])
    G({ group: 'Space · overhead', key: `sats_${grp}`, label: `Satellites tracked: ${grp}`, value: f.satellites ? sats.filter((x) => x.group === grp).length : null, source: 'CelesTrak' });

  for (const c of countries) {
    const loc = c.ev[0] ? { lat: c.ev[0].lat, lon: c.ev[0].lon } : {};
    if (c.riot >= 8 || c.protest >= 40) I({ entity: 'global', entityName: c.country, ...loc, id: `unrest-${c.country}`, sev: c.riot >= 20 ? 3 : 2, kind: 'Unrest',
      title: `Unrest in ${c.country}: ${c.protest} protest / ${c.riot} riot events (24h)`, detail: topPlaces(c.ev.filter((e) => e.kind === 'protest' || e.kind === 'riot')) });
    if (c.aerial >= 8) I({ entity: 'global', entityName: c.country, ...loc, id: `aerial-${c.country}`, sev: c.aerial >= 20 ? 4 : 3, kind: 'Conflict',
      title: `${c.aerial} airstrike / drone-strike events coded in ${c.country} (24h)`, detail: topPlaces(c.ev.filter((e) => e.kind === 'aerial')) });
  }
  // Fusion rule: a network outage coinciding with street unrest is the classic
  // signature of a government-ordered shutdown.
  const outageCountries = new Map();
  for (const o of Object.values(ioda)) if (o.critical || o.alerts >= 2) outageCountries.set(o.name.toLowerCase(), { name: o.name, src: `IODA ${o.critical} critical / ${o.alerts} alerts` });
  for (const o of cfOut.filter((x) => x.ongoing)) for (const c of o.countries) outageCountries.set(String(c.name).toLowerCase(), { name: c.name, src: `Cloudflare: ${o.cause || 'outage'}` });
  for (const [k, o] of outageCountries) {
    const c = byCountry[o.name] || countries.find((x) => x.country.toLowerCase() === k);
    if (c && c.protest + c.riot >= 5) I({ entity: 'global', entityName: o.name, lat: c.ev[0].lat, lon: c.ev[0].lon, id: `shutdown-${k}`, sev: 4, kind: 'Fusion',
      title: `${o.name}: internet disruption during active unrest`, detail: `${o.src} while ${c.protest + c.riot} protest/riot events were coded in 24h. Pattern consistent with a government-directed shutdown — corroborate.` });
  }
  for (const o of cfOut.filter((x) => x.ongoing && /government/i.test(x.cause || ''))) I({ entity: 'global', entityName: o.countries.map((c) => c.name).join(', '), id: `cf-${o.id}`, sev: 3, kind: 'Cyber',
    title: `Government-directed internet shutdown: ${o.countries.map((c) => c.name).join(', ')}`, detail: `${o.description || ''} Since ${o.start?.slice(0, 16)}Z (${o.scope || 'national'}).` });
  if (uavs.length) I({ entity: 'global', entityName: 'UAVs', id: 'uav-global', sev: 1, kind: 'Drone',
    title: `${uavs.length} UAVs broadcasting ADS-B worldwide`, detail: uavs.slice(0, 8).map((a) => `${a.cs || a.id} (${a.type || 'UAV'})`).join(', ') });

  G({ group: 'Maritime', key: 'ships_total', label: 'Vessels tracked (all AIS sources)', value: ships.length || null, source: 'AIS' });
  G({ group: 'Maritime', key: 'ships_underway', label: 'Vessels underway', value: ships.length ? ships.filter((s) => (s.sog ?? 0) >= 1).length : null, source: 'AIS' });
  for (const c of ['tanker', 'cargo', 'passenger', 'military', 'fishing'])
    G({ group: 'Maritime', key: `ships_${c}`, label: `Vessels: ${c}`, value: ships.length ? ships.filter((s) => shipClass(s.type) === c).length : null, source: 'AIS' });

  // Global threat index = mean of the five highest scored theatres.
  const scored = [...chokepoints, ...hotspots].filter((e) => e.score !== null).map((e) => e.score).sort((a, b) => b - a);
  const gti = scored.length ? Math.round(scored.slice(0, 5).reduce((a, b) => a + b, 0) / Math.min(5, scored.length)) : null;
  G({ group: 'Summary', key: 'gti', label: 'Global Threat Index (top-5 theatre mean)', value: gti, unit: '/100', source: 'SENTINEL model', status: levelOf(gti).status });

  for (const e of [...chokepoints, ...hotspots]) {
    if (e.score >= 60) I({ entity: e.id, entityName: e.name, lat: e.lat, lon: e.lon, id: `risk-${e.kind}-${e.id}`, sev: e.score >= 80 ? 4 : 3, kind: 'Assessment',
      title: `${e.name} assessed ${e.level.label} (${e.score}/100)`,
      detail: `Drivers: ${e.components.filter((c) => c.value).sort((a, b) => b.value * b.weight - a.value * a.weight).slice(0, 3).map((c) => `${c.name} ${Math.round(c.value * 100)}%`).join(', ')}. Model coverage ${e.coverage}%.` });
    const h = e.history;
    if (h.length >= 12 && e.score !== null) {
      const ago = h[h.length - 12].v;
      if (ago !== null && e.score - ago >= 15) I({ entity: e.id, entityName: e.name, lat: e.lat, lon: e.lon, id: `jump-${e.id}`, sev: 3, kind: 'Trend',
        title: `${e.name} risk climbing fast (+${e.score - ago} in 1h)`, detail: `From ${ago} to ${e.score}.` });
    }
  }

  insights.sort((a, b) => b.sev - a.sev || a.title.localeCompare(b.title));
  return { parameters: params, chokepoints, hotspots, insights, gti };
}

function topPlaces(list) {
  const by = {};
  for (const e of list) { const k = e.place.split(', ').slice(0, 2).join(', '); by[k] = (by[k] || 0) + 1; }
  const top = Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 4).map(([k, v]) => `${k} (${v})`).join('; ');
  return `${top}. Machine-coded from news by GDELT — counts reflect reporting, not verified incidents.`;
}

function isIsr(a) {
  // ISR, airborne early warning, SIGINT, maritime patrol and tanker types common on ADS-B.
  return /^(RC135|E3TF|E3CF|E7|E2|E6|E8|P8|P3|K35R|KC2|KC10|KC46|A332|A3ST|MQ9|Q4|RQ4|U2|GLEX|CL60|E390|IL20|IL78|A50|C135|R135|E737|B350|PC12|DH8)/.test(a.type || '') && (a.alt ?? 0) > 0;
}

function emergencies(mil, density) {
  const seen = new Map();
  for (const a of [...mil, ...Object.values(density).flatMap((d) => d.aircraft || [])]) {
    if (['7500', '7600', '7700'].includes(a.sq)) seen.set(a.id, a);
  }
  return [...seen.values()];
}

module.exports = { analyze, composite, levelOf, shipClass, isIsr };
