'use strict';
// Every OSINT source SENTINEL polls. Each feed fetches a public endpoint and
// normalizes it into a small, stable shape so the analytics and UI never see
// vendor formats. Feeds fail independently: one dead API never blanks the board.

const { CHOKEPOINTS, HOTSPOTS, MARKETS, CRYPTO } = require('./catalog');
const { inBox } = require('./geo');
const { eventsFeed } = require('./events');

const UA = 'Mozilla/5.0 (SENTINEL OSINT dashboard; +https://github.com/)';

function makeHttp(fetchImpl) {
  async function get(url, { headers = {}, timeout = 20000 } = {}) {
    const res = await fetchImpl(url, {
      headers: { 'User-Agent': UA, Accept: 'application/json,text/csv,*/*', ...headers },
      signal: AbortSignal.timeout(timeout),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} from ${new URL(url).host}`);
    return res;
  }
  return {
    async json(url, opts) {
      const text = await (await get(url, opts)).text();
      try { return JSON.parse(text); } catch {
        throw new Error(`Non-JSON from ${new URL(url).host}: ${text.slice(0, 80).replace(/\s+/g, ' ')}`);
      }
    },
    async text(url, opts) { return (await get(url, opts)).text(); },
    async buffer(url, opts) { return Buffer.from(await (await get(url, opts)).arrayBuffer()); },
  };
}

const num = (v) => (v === null || v === undefined || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const round = (v, d = 2) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);

// ---------- Aviation (ADS-B Exchange-compatible community APIs) ----------

// Unmanned aircraft that broadcast ADS-B (mostly in transit or on ISR orbits).
const UAV_TYPES = /^(Q1|Q4|Q9|Q25|MQ1|MQ4|MQ9|RQ1|RQ4|RQ7|TB2|TB3|AKNC|HRON|HERN|H450|WK45|PRDT|REAP|GLHK|TRTN|SKYG|PRTE)/;
const UAV_CALLS = /^(FORTE|TRITON|REAPER|REAPR|BLKCAT|GHAWK|SKYGRD)/;
function isUav(ac) {
  // Callsign alone only counts when no type is reported (avoids tagging e.g. FORTE-callsign support aircraft).
  return UAV_TYPES.test(ac.t || '') || (!ac.t && UAV_CALLS.test((ac.flight || '').trim())) || ac.category === 'B6';
}

function normAircraft(ac, src, mil) {
  if (ac.lat === undefined || ac.lon === undefined) return null;
  const alt = ac.alt_baro === 'ground' ? 0 : num(ac.alt_baro ?? ac.alt_geom);
  return {
    id: ac.hex, cs: (ac.flight || '').trim() || null, lat: round(ac.lat, 4), lon: round(ac.lon, 4),
    alt, spd: num(ac.gs), hdg: num(ac.track ?? ac.true_heading), type: ac.t || null, reg: ac.r || null,
    sq: ac.squawk || null, mil: mil || (ac.dbFlags & 1) === 1, src,
    // Navigation accuracy: NACp < 8 on an aircraft that reports it is the
    // gpsjam.org-style signal for GNSS jamming/spoofing in the area.
    nacp: num(ac.nac_p), nic: num(ac.nic), gpsLost: ac.gpsOkBefore !== undefined,
    uav: isUav(ac),
  };
}

const MIL_SOURCES = [
  ['adsb.lol', 'https://api.adsb.lol/v2/mil'],
  ['airplanes.live', 'https://api.airplanes.live/v2/mil'],
];

function militaryAircraftFeed() {
  return {
    id: 'mil_air', name: 'Military aircraft (ADS-B)', category: 'Air', interval: 30_000,
    source: 'adsb.lol / airplanes.live',
    async run(http) {
      let lastErr;
      for (const [src, url] of MIL_SOURCES) {
        try {
          const j = await http.json(url);
          return (j.ac || j.aircraft || []).map((a) => normAircraft(a, src, true)).filter(Boolean);
        } catch (e) { lastErr = e; }
      }
      throw lastErr;
    },
  };
}

// Rolling: one chokepoint per tick, so the community API never sees a burst.
function airDensityFeed() {
  let cursor = 0;
  return {
    id: 'air_density', name: 'Air traffic around chokepoints', category: 'Air', interval: 15_000,
    source: 'adsb.lol point query', rolling: true,
    async run(http, prev) {
      const cp = CHOKEPOINTS[cursor++ % CHOKEPOINTS.length];
      const nm = Math.min(250, Math.round(cp.radiusKm / 1.852));
      const j = await http.json(`https://api.adsb.lol/v2/point/${cp.lat}/${cp.lon}/${nm}`);
      const ac = (j.ac || []).map((a) => normAircraft(a, 'adsb.lol', false)).filter(Boolean);
      return { ...(prev || {}), [cp.id]: { ts: Date.now(), aircraft: ac } };
    },
  };
}

// ---------- Natural hazards ----------

function quakesFeed() {
  return {
    id: 'quakes', name: 'Earthquakes M2.5+ (24h)', category: 'Hazards', interval: 300_000, source: 'USGS',
    async run(http) {
      const j = await http.json('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson');
      return (j.features || []).map((f) => ({
        id: f.id, mag: num(f.properties.mag), place: f.properties.place, time: f.properties.time,
        tsunami: !!f.properties.tsunami, alert: f.properties.alert || null, url: f.properties.url,
        lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], depth: f.geometry.coordinates[2],
      }));
    },
  };
}

function eonetFeed() {
  return {
    id: 'eonet', name: 'Natural events (wildfire, storms, volcanoes)', category: 'Hazards', interval: 900_000,
    source: 'NASA EONET',
    async run(http) {
      const j = await http.json('https://eonet.gsfc.nasa.gov/api/v3/events?status=open&days=30&limit=400');
      return (j.events || []).map((e) => {
        const g = e.geometry?.[e.geometry.length - 1];
        if (!g || g.type !== 'Point') return null;
        return { id: e.id, title: e.title, cat: e.categories?.[0]?.title || 'Event', date: g.date,
          lon: g.coordinates[0], lat: g.coordinates[1], url: e.sources?.[0]?.url || e.link };
      }).filter(Boolean);
    },
  };
}

function gdacsFeed() {
  return {
    id: 'gdacs', name: 'Disaster alerts', category: 'Hazards', interval: 900_000, source: 'GDACS (UN/EC)',
    async run(http) {
      const j = await http.json('https://www.gdacs.org/gdacsapi/api/events/geteventlist/MAP');
      return (j.features || []).filter((f) => f.geometry?.type === 'Point').map((f) => {
        const p = f.properties;
        return { id: `${p.eventtype}${p.eventid}`, type: p.eventtype, level: p.alertlevel, name: p.name || p.eventname,
          country: p.country, from: p.fromdate, to: p.todate, severity: p.severitydata?.severitytext,
          lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], url: p.url?.report };
      });
    },
  };
}

function firmsFeed(key) {
  return {
    id: 'firms', name: 'Thermal anomalies in hotspots (VIIRS)', category: 'Hazards', interval: 1_800_000,
    source: 'NASA FIRMS', needsKey: 'FIRMS_MAP_KEY', disabled: !key,
    async run(http) {
      const csv = await http.text(`https://firms.modaps.eosdis.nasa.gov/api/area/csv/${key}/VIIRS_SNPP_NRT/world/1`, { timeout: 60000 });
      const [head, ...rows] = csv.trim().split('\n');
      const cols = head.split(',');
      const ix = (n) => cols.indexOf(n);
      const out = [];
      for (const r of rows) {
        const c = r.split(',');
        const lat = +c[ix('latitude')]; const lon = +c[ix('longitude')];
        const hs = HOTSPOTS.find((h) => inBox(lat, lon, h.box));
        if (!hs) continue;
        out.push({ lat, lon, frp: num(c[ix('frp')]), conf: c[ix('confidence')], date: c[ix('acq_date')],
          time: c[ix('acq_time')], dn: c[ix('daynight')], hs: hs.id });
      }
      return out.sort((a, b) => (b.frp || 0) - (a.frp || 0)).slice(0, 4000);
    },
  };
}

// ---------- Weather & sea state at chokepoints (Open-Meteo, multi-point) ----------

function seaStateFeed() {
  const lats = CHOKEPOINTS.map((c) => c.lat).join(',');
  const lons = CHOKEPOINTS.map((c) => c.lon).join(',');
  return {
    id: 'sea_state', name: 'Weather & sea state at chokepoints', category: 'Maritime', interval: 900_000,
    source: 'Open-Meteo',
    async run(http) {
      const wx = await http.json(`https://api.open-meteo.com/v1/forecast?latitude=${lats}&longitude=${lons}`
        + '&current=temperature_2m,wind_speed_10m,wind_gusts_10m,visibility,weather_code&wind_speed_unit=kn');
      let sea = [];
      try {
        sea = await http.json(`https://marine-api.open-meteo.com/v1/marine?latitude=${lats}&longitude=${lons}`
          + '&current=wave_height,swell_wave_height,wave_period,sea_surface_temperature,ocean_current_velocity');
      } catch { /* marine model gaps are normal for canals */ }
      const W = Array.isArray(wx) ? wx : [wx];
      const S = Array.isArray(sea) ? sea : [sea];
      const out = {};
      CHOKEPOINTS.forEach((cp, i) => {
        const w = W[i]?.current || {}; const s = S[i]?.current || {};
        out[cp.id] = { temp: num(w.temperature_2m), wind: num(w.wind_speed_10m), gust: num(w.wind_gusts_10m),
          vis: num(w.visibility), code: num(w.weather_code), wave: num(s.wave_height), swell: num(s.swell_wave_height),
          period: num(s.wave_period), sst: num(s.sea_surface_temperature), current: num(s.ocean_current_velocity) };
      });
      return out;
    },
  };
}

// ---------- Maritime: free Baltic AIS (no key) ----------

function digitrafficFeed() {
  let meta = {}; let metaTs = 0;
  return {
    id: 'ais_baltic', name: 'Vessel positions, Baltic (AIS)', category: 'Maritime', interval: 60_000,
    source: 'Fintraffic Digitraffic',
    async run(http) {
      const headers = { 'Digitraffic-User': 'SENTINEL/1.0' };
      if (Date.now() - metaTs > 1_800_000) {
        try {
          const v = await http.json('https://meri.digitraffic.fi/api/ais/v1/vessels', { headers, timeout: 40000 });
          meta = Object.fromEntries(v.map((x) => [x.mmsi, { name: x.name, type: x.shipType, dest: x.destination }]));
          metaTs = Date.now();
        } catch { /* positions are still useful without names */ }
      }
      const from = Date.now() - 15 * 60_000;
      const j = await http.json(`https://meri.digitraffic.fi/api/ais/v1/locations?from=${from}`, { headers, timeout: 40000 });
      return (j.features || []).map((f) => {
        const p = f.properties; const m = meta[p.mmsi] || {};
        return { id: String(p.mmsi), name: m.name || null, type: num(m.type), dest: m.dest || null,
          lon: round(f.geometry.coordinates[0], 4), lat: round(f.geometry.coordinates[1], 4),
          sog: num(p.sog), cog: num(p.cog), hdg: num(p.heading), nav: num(p.navStat),
          ts: p.timestampExternal, src: 'digitraffic' };
      });
    },
  };
}

// ---------- Intelligence: GDELT global news graph ----------

function gdeltDate(s) {
  const m = /^(\d{4})(\d{2})(\d{2})T?(\d{2})(\d{2})(\d{2})/.exec(s || '');
  return m ? Date.UTC(+m[1], m[2] - 1, +m[3], +m[4], +m[5], +m[6]) : null;
}

function summarizeTimeline(data, now, agg) {
  const pts = (data || []).map((d) => ({ t: gdeltDate(d.date), v: num(d.value) })).filter((p) => p.t && p.v !== null);
  if (!pts.length) return null;
  const cut = now - 86_400_000;
  const last = pts.filter((p) => p.t > cut); const prior = pts.filter((p) => p.t <= cut);
  if (agg === 'sum') {
    const s24 = last.reduce((a, p) => a + p.v, 0);
    const spanDays = prior.length ? Math.max(1, (cut - prior[0].t) / 86_400_000) : 0;
    const daily = spanDays ? prior.reduce((a, p) => a + p.v, 0) / spanDays : null;
    return { last24: s24, dailyAvg: daily === null ? null : round(daily, 1),
      surge: daily ? round(s24 / daily, 2) : null, series: dailyBuckets(pts, 'sum') };
  }
  const mean = (a) => (a.length ? a.reduce((x, p) => x + p.v, 0) / a.length : null);
  return { last24: round(mean(last)), week: round(mean(pts)), series: dailyBuckets(pts, 'mean') };
}

function dailyBuckets(pts, agg) {
  const b = new Map();
  for (const p of pts) {
    const k = Math.floor(p.t / 86_400_000);
    const e = b.get(k) || { s: 0, n: 0 }; e.s += p.v; e.n++; b.set(k, e);
  }
  return [...b.entries()].sort((a, c) => a[0] - c[0]).map(([, e]) => round(agg === 'sum' ? e.s : e.s / e.n, 2));
}

// Rolling task queue: GDELT allows ~1 request per 5 s, so one call per tick.
function gdeltFeed() {
  const entities = [
    ...CHOKEPOINTS.map((c) => ({ key: `cp:${c.id}`, query: c.query })),
    ...HOTSPOTS.map((h) => ({ key: `hs:${h.id}`, query: h.query })),
  ];
  const tasks = [{ key: 'global', query: '(military OR missile OR airstrike OR "naval" OR sanctions OR coup OR blockade)', mode: 'artlist' }];
  for (const e of entities) for (const mode of ['timelinevolraw', 'timelinetone', 'artlist']) tasks.push({ ...e, mode });
  let cursor = 0;
  return {
    id: 'gdelt', name: 'Global news intelligence (volume, tone, headlines)', category: 'Intel', interval: 7_000,
    source: 'GDELT 2.0 DOC API', rolling: true,
    async run(http, prev) {
      const t = tasks[cursor++ % tasks.length];
      const q = encodeURIComponent(t.query);
      const base = `https://api.gdeltproject.org/api/v2/doc/doc?query=${q}&format=json`;
      const out = { ...(prev || {}) };
      const cur = { ...(out[t.key] || {}) };
      const now = Date.now();
      if (t.mode === 'artlist') {
        const j = await http.json(`${base}&mode=artlist&maxrecords=${t.key === 'global' ? 75 : 25}&timespan=24h&sort=datedesc`);
        cur.articles = (j.articles || []).map((a) => ({ title: a.title, url: a.url, domain: a.domain,
          country: a.sourcecountry, lang: a.language, ts: gdeltDate(a.seendate) }));
      } else if (t.mode === 'timelinevolraw') {
        const j = await http.json(`${base}&mode=timelinevolraw&timespan=7d`);
        cur.volume = summarizeTimeline(j.timeline?.[0]?.data, now, 'sum');
      } else {
        const j = await http.json(`${base}&mode=timelinetone&timespan=7d`);
        cur.tone = summarizeTimeline(j.timeline?.[0]?.data, now, 'mean');
      }
      cur.ts = now;
      out[t.key] = cur;
      return out;
    },
  };
}

// ---------- Markets ----------

function marketsFeed() {
  let cursor = 0;
  return {
    id: 'markets', name: 'Commodities, FX, shipping & defense equities', category: 'Markets', interval: 8_000,
    source: 'Yahoo Finance chart API', rolling: true,
    async run(http, prev) {
      const m = MARKETS[cursor++ % MARKETS.length];
      const j = await http.json(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(m.sym)}?range=1mo&interval=1d`);
      const r = j.chart?.result?.[0];
      if (!r) throw new Error(`No chart for ${m.sym}`);
      const closes = (r.indicators?.quote?.[0]?.close || []).filter((v) => v !== null);
      const price = num(r.meta.regularMarketPrice) ?? closes[closes.length - 1];
      const prevClose = closes.length >= 2 ? closes[closes.length - 2] : num(r.meta.chartPreviousClose);
      const first = closes[0];
      return { ...(prev || {}), [m.sym]: { ...m, price: round(price, 4), prev: round(prevClose, 4),
        chg: prevClose ? round(((price - prevClose) / prevClose) * 100) : null,
        chg1m: first ? round(((price - first) / first) * 100) : null,
        spark: closes.slice(-22).map((v) => round(v, 4)), ts: Date.now() } };
    },
  };
}

function cryptoFeed() {
  return {
    id: 'crypto', name: 'Crypto (capital-flight / sanctions proxy)', category: 'Markets', interval: 120_000, source: 'CoinGecko',
    async run(http) {
      const j = await http.json(`https://api.coingecko.com/api/v3/simple/price?ids=${CRYPTO.join(',')}&vs_currencies=usd&include_24hr_change=true&include_24hr_vol=true`);
      return Object.fromEntries(Object.entries(j).map(([k, v]) => [k, { price: num(v.usd), chg: round(num(v.usd_24h_change)), vol: num(v.usd_24h_vol) }]));
    },
  };
}

// ---------- Space weather (GNSS / HF comms degradation) ----------

function spaceWeatherFeed() {
  return {
    id: 'space_wx', name: 'Space weather (GNSS/HF impact)', category: 'Cyber & Infra', interval: 600_000, source: 'NOAA SWPC',
    async run(http) {
      const kp = await http.json('https://services.swpc.noaa.gov/products/noaa-planetary-k-index.json');
      const rows = Array.isArray(kp[0]) ? kp.slice(1).map((r) => ({ t: r[0], kp: num(r[1]) })) : kp.map((r) => ({ t: r.time_tag, kp: num(r.Kp ?? r.kp_index ?? r.estimated_kp) }));
      let alerts = [];
      try {
        const a = await http.json('https://services.swpc.noaa.gov/products/alerts.json');
        const cut = Date.now() - 86_400_000;
        alerts = a.filter((x) => Date.parse(`${x.issue_datetime.replace(' ', 'T')}Z`) >= cut).map((x) => ({
          id: x.product_id, ts: x.issue_datetime,
          title: (x.message.split('\n').find((l) => /^(ALERT|WARNING|WATCH|SUMMARY|EXTENDED WARNING|CANCEL)/.test(l.trim())) || x.product_id).trim(),
        }));
      } catch { /* kp alone is enough */ }
      const kps = rows.filter((r) => r.kp !== null);
      return { kp: kps[kps.length - 1]?.kp ?? null, kpMax24: kps.length ? Math.max(...kps.slice(-8).map((r) => r.kp)) : null, series: kps.slice(-24).map((r) => r.kp), alerts };
    },
  };
}

// ---------- Cyber ----------

function kevFeed() {
  return {
    id: 'cisa_kev', name: 'Known exploited vulnerabilities', category: 'Cyber & Infra', interval: 21_600_000, source: 'CISA KEV',
    async run(http) {
      const j = await http.json('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json', { timeout: 40000 });
      const v = (j.vulnerabilities || []).slice().sort((a, b) => b.dateAdded.localeCompare(a.dateAdded));
      const since = (d) => { const c = new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10); return v.filter((x) => x.dateAdded >= c).length; };
      return { total: v.length, d7: since(7), d30: since(30),
        ransomware30: v.filter((x) => x.dateAdded >= new Date(Date.now() - 30 * 86_400_000).toISOString().slice(0, 10) && x.knownRansomwareCampaignUse === 'Known').length,
        latest: v.slice(0, 12).map((x) => ({ id: x.cveID, vendor: x.vendorProject, product: x.product, name: x.vulnerabilityName, added: x.dateAdded, ransomware: x.knownRansomwareCampaignUse === 'Known' })) };
    },
  };
}

function iodaFeed() {
  return {
    id: 'ioda', name: 'Internet outages by country', category: 'Cyber & Infra', interval: 600_000, source: 'IODA (Georgia Tech)',
    async run(http) {
      const until = Math.floor(Date.now() / 1000); const from = until - 86_400;
      const j = await http.json(`https://api.ioda.inetintel.cc.gatech.edu/v2/outages/alerts?from=${from}&until=${until}&entityType=country&limit=5000`, { timeout: 40000 });
      const byCountry = {};
      for (const a of j.data || []) {
        if (a.entity?.type !== 'country' || a.level === 'normal') continue;
        const k = a.entity.code;
        const e = byCountry[k] || (byCountry[k] = { code: k, name: a.entity.name, alerts: 0, critical: 0, sources: new Set(), last: 0 });
        e.alerts++; if (a.level === 'critical') e.critical++; e.sources.add(a.datasource); e.last = Math.max(e.last, a.time);
      }
      return Object.fromEntries(Object.entries(byCountry).map(([k, e]) => [k, { ...e, sources: [...e.sources] }]));
    },
  };
}

// ---------- Government advisories ----------

function advisoriesFeed() {
  return {
    id: 'advisories', name: 'US travel advisory levels', category: 'Intel', interval: 43_200_000, source: 'US State Dept',
    async run(http) {
      const j = await http.json('https://cadataapi.state.gov/api/TravelAdvisories', { timeout: 40000 });
      const out = {};
      for (const a of j) {
        const m = /^(.*?)\s+-\s+Level\s+(\d)/i.exec(a.Title || '');
        if (m) out[m[1].trim()] = { level: +m[2], title: a.Title, url: a.Link, updated: a.Updated || a.Published };
      }
      return out;
    },
  };
}

// ---------- Overhead: reconnaissance & earth-observation satellites ----------

const SAT_GROUPS = [['military', 'Military'], ['resource', 'Earth observation'], ['radar', 'Radar calibration'], ['gnss', 'GNSS']];

function satellitesFeed() {
  let i = 0; const acc = {};
  return {
    id: 'satellites', name: 'Military & EO satellites (TLE)', category: 'Space', interval: 90_000, source: 'CelesTrak',
    async run(http, prev) {
      // One group per run, each group refreshed ~every 6 min at start then
      // slowed: CelesTrak asks clients not to re-download unchanged data often.
      const [g, label] = SAT_GROUPS[i++ % SAT_GROUPS.length];
      const age = acc[g]?.ts ? Date.now() - acc[g].ts : Infinity;
      if (age > 4 * 3_600_000) {
        const txt = await http.text(`https://celestrak.org/NORAD/elements/gp.php?GROUP=${g}&FORMAT=tle`, { timeout: 40000 });
        const lines = txt.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean);
        const sats = [];
        for (let k = 0; k + 2 < lines.length + 1; k += 3) {
          if (lines[k + 1]?.startsWith('1 ') && lines[k + 2]?.startsWith('2 ')) sats.push({ name: lines[k].trim(), l1: lines[k + 1], l2: lines[k + 2], group: label });
        }
        if (!sats.length) throw new Error(`CelesTrak returned no TLEs for ${g}`);
        acc[g] = { ts: Date.now(), sats };
      }
      return Object.values(acc).flatMap((x) => x.sats);
    },
  };
}

// ---------- Internet outages with cause (Cloudflare Radar, optional token) ----------

function cloudflareOutagesFeed(token) {
  return {
    id: 'cf_outages', name: 'Internet outages with cause', category: 'Cyber & Infra', interval: 900_000,
    source: 'Cloudflare Radar', needsKey: 'CLOUDFLARE_API_TOKEN', disabled: !token,
    async run(http) {
      const j = await http.json('https://api.cloudflare.com/client/v4/radar/annotations/outages?dateRange=7d&limit=200&format=json',
        { headers: { Authorization: `Bearer ${token}` } });
      return (j.result?.annotations || []).map((a) => ({
        id: a.id, start: a.startDate, end: a.endDate || null, ongoing: !a.endDate,
        cause: a.outage?.outageCause || null, type: a.outage?.outageType || null, scope: a.scope || null,
        description: a.description || null, url: a.linkedUrl || null,
        countries: (a.locationsDetails || []).map((l) => ({ code: l.code, name: l.name })).concat((a.locations || []).filter((c) => !(a.locationsDetails || []).some((l) => l.code === c)).map((c) => ({ code: c, name: c }))),
      }));
    },
  };
}

// ---------- News-geolocated activity heat (GDELT GEO 2.0) ----------

const GEO_TOPICS = [
  ['drone', '(drone OR UAV OR "unmanned aerial" OR Shahed OR quadcopter) (attack OR strike OR intercepted OR "shot down" OR sighting OR swarm)'],
  ['protest', '(protest OR protesters OR demonstration OR "tear gas" OR riot)'],
  ['shutdown', '("internet shutdown" OR "internet blackout" OR "network outage" OR "mobile data" cut OR "connectivity disrupted")'],
  ['cyber', '(cyberattack OR ransomware OR "DDoS" OR hacktivist OR "data breach")'],
  ['jamming', '("GPS jamming" OR "GPS spoofing" OR "GNSS interference" OR "electronic warfare")'],
];

function geoHeatFeed() {
  let i = 0;
  return {
    id: 'gdelt_geo', name: 'Geolocated reporting: drones, protests, shutdowns, cyber, jamming', category: 'Events', interval: 30_000,
    source: 'GDELT GEO 2.0 API', rolling: true,
    async run(http, prev) {
      const [topic, q] = GEO_TOPICS[i++ % GEO_TOPICS.length];
      const j = await http.json(`https://api.gdeltproject.org/api/v2/geo/geo?query=${encodeURIComponent(q)}&mode=PointData&format=GeoJSON&timespan=24h&maxpoints=300`);
      const pts = (j.features || []).filter((f) => f.geometry?.type === 'Point').map((f) => {
        const p = f.properties || {};
        const link = /href="([^"]+)"/.exec(p.html || '')?.[1] || null;
        const title = /title="([^"]+)"/.exec(p.html || '')?.[1] || />([^<]{8,})</.exec(p.html || '')?.[1] || null;
        return { topic, name: p.name, count: num(p.count) || 1, lon: f.geometry.coordinates[0], lat: f.geometry.coordinates[1], url: link, title };
      });
      return { ...(prev || {}), [topic]: { ts: Date.now(), points: pts } };
    },
  };
}

function buildFeeds(env = process.env) {
  return [
    militaryAircraftFeed(), airDensityFeed(), quakesFeed(), eonetFeed(), gdacsFeed(), firmsFeed(env.FIRMS_MAP_KEY),
    seaStateFeed(), digitrafficFeed(), gdeltFeed(), marketsFeed(), cryptoFeed(), spaceWeatherFeed(), kevFeed(),
    iodaFeed(), advisoriesFeed(), eventsFeed(), geoHeatFeed(), satellitesFeed(), cloudflareOutagesFeed(env.CLOUDFLARE_API_TOKEN),
  ];
}

module.exports = { buildFeeds, makeHttp, summarizeTimeline, gdeltDate, normAircraft, isUav, GEO_TOPICS };
