'use strict';
// DEMO MODE ONLY. A fake `fetch` and `WebSocket` that answer in each vendor's
// real response format with synthetic values, so the whole pipeline (feeds →
// normalizers → fusion → UI) can be developed and tested offline.
// The UI shows a permanent "DEMO DATA" banner whenever this is active.

const zlib = require('zlib');
const { CHOKEPOINTS, HOTSPOTS, MARKETS } = require('./catalog');

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const T0 = Date.now();
const mins = () => (Date.now() - T0) / 60_000;

// "Hot" theatres get surging news and more military traffic in the demo.
const HOT = { hormuz: 2.6, babelmandeb: 3.4, taiwan: 2.1, ukraine: 1.9, gaza: 1.6, sudan: 2.4, kerch: 1.7, iran: 2.2, baltic: 1.5 };

const MIL_TYPES = ['C17', 'K35R', 'RC135', 'P8', 'E3TF', 'F16', 'A332', 'C130', 'H60', 'KC46', 'Q9', 'C30J', 'GLEX', 'A400', 'E2', 'Q4'];
const anchors = [...CHOKEPOINTS, ...HOTSPOTS];
const milFleet = Array.from({ length: 190 }, (_, i) => {
  const a = rnd() < 0.7 ? pick(anchors) : { lat: rnd() * 120 - 50, lon: rnd() * 340 - 170 };
  const boost = HOT[a.id] || 1;
  const keep = rnd() < 0.35 * boost;
  const base = keep || !a.id ? a : pick(anchors);
  return { hex: `ae${(0x1000 + i).toString(16)}`, flight: `${pick(['RCH', 'NATO', 'FORTE', 'HOMER', 'LAGR', 'QID', 'DUKE', 'NCHO', 'JAKE'])}${100 + i}`,
    t: pick(MIL_TYPES), lat0: base.lat + (rnd() - 0.5) * 3, lon0: base.lon + (rnd() - 0.5) * 4, hdg: rnd() * 360, gs: 250 + rnd() * 250, alt: 8000 + Math.round(rnd() * 30000) };
});

function move(o, kmPerMin) {
  const d = (kmPerMin * mins()) / 111;
  const lat = o.lat0 + Math.cos((o.hdg * Math.PI) / 180) * (d % 4);
  const lon = o.lon0 + Math.sin((o.hdg * Math.PI) / 180) * (d % 4);
  return { lat: +lat.toFixed(4), lon: +(((lon + 540) % 360) - 180).toFixed(4) };
}

const json = (o) => ({ ok: true, status: 200, text: async () => JSON.stringify(o) });
const text = (s) => ({ ok: true, status: 200, text: async () => s });

function gdeltTimeline(hot, mode) {
  const data = [];
  for (let h = 7 * 24; h >= 0; h--) {
    const t = new Date(Date.now() - h * 3_600_000);
    const date = t.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
    const recent = h < 24;
    const value = mode === 'tone'
      ? -2 - rnd() * 1.5 - (recent ? (hot - 1) * 2.4 : 0)
      : Math.round((8 + rnd() * 6) * (recent ? hot : 1));
    data.push({ date, value: +value.toFixed(2) });
  }
  return { timeline: [{ series: mode === 'tone' ? 'Average Tone' : 'Article Count', data }] };
}

const HEADLINES = ['naval escort operations expand', 'insurers raise war-risk premiums', 'drone intercepted near shipping lane',
  'tanker diverts after reported incident', 'military exercises announced', 'officials warn of escalation', 'talks stall as tensions rise',
  'satellite images show new deployments', 'shipping firms reroute vessels', 'coast guard confrontation reported'];

function respond(url) {
  const u = new URL(url);
  const h = u.host; const p = u.pathname;

  if (/adsb\.lol|airplanes\.live/.test(h) && p.endsWith('/mil')) {
    return json({ ac: milFleet.map((a) => ({ hex: a.hex, flight: a.flight, t: a.t, ...move({ ...a, lat0: a.lat0, lon0: a.lon0 }, a.gs / 32),
      alt_baro: a.alt, gs: a.gs, track: a.hdg, dbFlags: 1, squawk: a.hex === 'ae1003' ? '7700' : '4000', nac_p: 9, nic: 8 })) });
  }
  if (h === 'api.adsb.lol' && p.includes('/point/')) {
    const [, , , lat, lon] = p.split('/').map(Number);
    const n = 20 + Math.floor(rnd() * 70);
    return json({ ac: Array.from({ length: n }, (_, i) => ({ hex: `c${Math.floor(lat * 100)}${i}`.replace('-', 'm'), flight: `${pick(['UAE', 'QTR', 'SIA', 'BAW', 'DLH', 'THY', 'CPA'])}${200 + i}`,
      lat: lat + (rnd() - 0.5) * 3, lon: lon + (rnd() - 0.5) * 3, alt_baro: 30000 + Math.round(rnd() * 9000), gs: 430 + rnd() * 60, track: rnd() * 360, t: pick(['B77W', 'A359', 'A21N', 'B38M', 'B789']),
      // Demo jamming: aircraft near the Baltic, Black Sea and Gulf report degraded accuracy.
      nac_p: rnd() < ({ 55: 0.45, 45: 0.35, 41: 0.3, 26: 0.25 }[Math.round(lat)] || 0.03) ? Math.floor(rnd() * 5) : 9 + Math.floor(rnd() * 2), nic: 8 })) });
  }
  if (h === 'earthquake.usgs.gov') {
    const features = Array.from({ length: 45 }, (_, i) => ({ id: `demo${i}`, properties: { mag: +(2.5 + rnd() ** 2 * 4).toFixed(1), place: `${Math.round(rnd() * 90)} km of synthetic location ${i}`, time: Date.now() - rnd() * 86_400_000, tsunami: 0, url: 'https://earthquake.usgs.gov' },
      geometry: { coordinates: [rnd() * 340 - 170, rnd() * 120 - 55, rnd() * 80] } }));
    features.push({ id: 'demo-big', properties: { mag: 6.7, place: 'synthetic, near Bab el-Mandeb', time: Date.now() - 3_600_000, tsunami: 1, alert: 'yellow' }, geometry: { coordinates: [43.0, 13.2, 12] } });
    return json({ features });
  }
  if (h === 'eonet.gsfc.nasa.gov') {
    return json({ events: Array.from({ length: 40 }, (_, i) => ({ id: `EONET_D${i}`, title: `Synthetic ${['wildfire', 'storm', 'volcano'][i % 3]} ${i}`,
      categories: [{ title: ['Wildfires', 'Severe Storms', 'Volcanoes'][i % 3] }], geometry: [{ date: new Date().toISOString(), type: 'Point', coordinates: [rnd() * 340 - 170, rnd() * 120 - 50] }] })) });
  }
  if (h === 'www.gdacs.org') {
    return json({ features: Array.from({ length: 12 }, (_, i) => ({ geometry: { type: 'Point', coordinates: [rnd() * 300 - 150, rnd() * 100 - 40] },
      properties: { eventtype: ['TC', 'FL', 'EQ', 'DR'][i % 4], eventid: 1000 + i, alertlevel: i === 0 ? 'Red' : i < 4 ? 'Orange' : 'Green', name: `Synthetic event ${i}`, country: 'Demo', severitydata: { severitytext: 'synthetic' } } })) });
  }
  if (h === 'firms.modaps.eosdis.nasa.gov') {
    const rows = ['latitude,longitude,bright_ti4,scan,track,acq_date,acq_time,satellite,instrument,confidence,version,bright_ti5,frp,daynight'];
    for (const [id, n] of [['ukraine', 220], ['sudan', 140], ['gaza', 40], ['myanmar', 90], ['sahel', 60], ['lebanon', 25]]) {
      const hs = HOTSPOTS.find((x) => x.id === id);
      for (let i = 0; i < n; i++) rows.push(`${(hs.lat + (rnd() - 0.5) * 3).toFixed(4)},${(hs.lon + (rnd() - 0.5) * 4).toFixed(4)},330,0.4,0.4,2026-10-12,0130,N,VIIRS,n,2.0NRT,290,${(rnd() * 40).toFixed(1)},N`);
    }
    return text(rows.join('\n'));
  }
  if (h === 'api.open-meteo.com') {
    return json(CHOKEPOINTS.map(() => ({ current: { temperature_2m: 10 + rnd() * 25, wind_speed_10m: 5 + rnd() * 25, wind_gusts_10m: 10 + rnd() * 38, visibility: 2000 + rnd() * 40000, weather_code: 3 } })));
  }
  if (h === 'marine-api.open-meteo.com') {
    return json(CHOKEPOINTS.map((c) => ({ current: { wave_height: c.id === 'goodhope' ? 4.6 : rnd() * 3, swell_wave_height: rnd() * 2, wave_period: 5 + rnd() * 8, sea_surface_temperature: 12 + rnd() * 18, ocean_current_velocity: rnd() * 2 } })));
  }
  if (h === 'meri.digitraffic.fi') {
    if (p.endsWith('/vessels')) return json(Array.from({ length: 350 }, (_, i) => ({ mmsi: 230000000 + i, name: `BALTIC DEMO ${i}`, shipType: pick([70, 71, 80, 81, 60, 30, 52]), destination: pick(['HELSINKI', 'TALLINN', 'ST PETERSBURG', 'PRIMORSK']) })));
    return json({ features: Array.from({ length: 350 }, (_, i) => {
      const o = { lat0: 58 + ((i * 37) % 100) / 30, lon0: 19 + ((i * 53) % 100) / 12, hdg: (i * 47) % 360 };
      const pos = move(o, i % 4 === 0 ? 0 : 0.3);
      return { geometry: { coordinates: [pos.lon, pos.lat] }, properties: { mmsi: 230000000 + i, sog: i % 4 === 0 ? 0.1 : 9 + (i % 7), cog: o.hdg, heading: o.hdg, navStat: i % 4 === 0 ? 1 : 0, timestampExternal: Date.now() } };
    }) });
  }
  if (h === 'api.gdeltproject.org' && !p.includes('/geo/')) {
    const q = u.searchParams.get('query');
    const ent = [...CHOKEPOINTS, ...HOTSPOTS].find((e) => e.query === q);
    const hot = ent ? HOT[ent.id] || 1 : 1.2;
    const mode = u.searchParams.get('mode');
    if (mode === 'artlist') {
      const name = ent?.name || 'Global';
      return json({ articles: Array.from({ length: 12 }, (_, i) => ({ title: `[DEMO] ${name}: ${HEADLINES[(i + name.length) % HEADLINES.length]}`, url: 'https://example.org/demo',
        domain: pick(['reuters.com', 'apnews.com', 'aljazeera.com', 'bbc.co.uk', 'scmp.com', 'kyivindependent.com']), sourcecountry: pick(['United States', 'United Kingdom', 'Qatar', 'Hong Kong']),
        language: 'English', seendate: new Date(Date.now() - i * 1_500_000).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z' })) });
    }
    return json(gdeltTimeline(hot, mode === 'timelinetone' ? 'tone' : 'vol'));
  }
  if (h === 'query1.finance.yahoo.com') {
    const sym = decodeURIComponent(p.split('/').pop());
    const m = MARKETS.find((x) => x.sym === sym);
    const base = { 'BZ=F': 84, 'CL=F': 80, 'NG=F': 3.1, 'GC=F': 2650, '^VIX': 21, '^GSPC': 5800, 'EURUSD=X': 1.09, 'RUB=X': 96, 'CNY=X': 7.2, 'TRY=X': 34.5, 'ILS=X': 3.75 }[sym] || 50;
    const closes = []; let v = base;
    for (let i = 0; i < 22; i++) { v *= 1 + (rnd() - 0.5) * 0.03; closes.push(+v.toFixed(4)); }
    if (sym === 'BZ=F') closes[21] = +(closes[20] * 1.046).toFixed(2);
    return json({ chart: { result: [{ meta: { regularMarketPrice: closes[21], chartPreviousClose: base, currency: 'USD', symbol: m?.sym }, indicators: { quote: [{ close: closes }] } }] } });
  }
  if (h === 'api.coingecko.com') return json({ bitcoin: { usd: 64000 + rnd() * 3000, usd_24h_change: (rnd() - 0.5) * 6, usd_24h_vol: 3e10 }, ethereum: { usd: 3100 + rnd() * 200, usd_24h_change: (rnd() - 0.5) * 6, usd_24h_vol: 1.5e10 }, tether: { usd: 1.0, usd_24h_change: 0.01, usd_24h_vol: 5e10 } });
  if (h === 'services.swpc.noaa.gov') {
    if (p.includes('alerts')) return json([{ product_id: 'K05W', issue_datetime: new Date(Date.now() - 3_600_000).toISOString().replace('T', ' ').slice(0, 19), message: 'Space Weather Message Code: K05W\nWARNING: Geomagnetic K-index of 5 expected' }]);
    return json([['time_tag', 'Kp', 'a_running', 'station_count'], ...Array.from({ length: 24 }, (_, i) => [new Date(Date.now() - (24 - i) * 10_800_000).toISOString(), String(i > 20 ? 5.33 : 2 + rnd() * 2), '10', '8'])]);
  }
  if (h === 'www.cisa.gov') {
    const day = (d) => new Date(Date.now() - d * 86_400_000).toISOString().slice(0, 10);
    return json({ vulnerabilities: Array.from({ length: 30 }, (_, i) => ({ cveID: `CVE-2026-${10000 + i}`, vendorProject: pick(['Microsoft', 'Ivanti', 'Fortinet', 'Cisco', 'Citrix']), product: 'Demo Product', vulnerabilityName: 'Synthetic vulnerability', dateAdded: day(i * 1.5), knownRansomwareCampaignUse: i % 4 ? 'Unknown' : 'Known' })) });
  }
  if (h === 'api.ioda.inetintel.cc.gatech.edu') {
    return json({ data: [
      { entity: { type: 'country', code: 'IR', name: 'Iran' }, level: 'critical', datasource: 'bgp', time: Date.now() / 1000 },
      { entity: { type: 'country', code: 'IR', name: 'Iran' }, level: 'warning', datasource: 'ping-slash24', time: Date.now() / 1000 },
      { entity: { type: 'country', code: 'SD', name: 'Sudan' }, level: 'warning', datasource: 'merit-nt', time: Date.now() / 1000 },
      { entity: { type: 'country', code: 'UA', name: 'Ukraine' }, level: 'warning', datasource: 'bgp', time: Date.now() / 1000 },
    ] });
  }
  if (h === 'cadataapi.state.gov') {
    const lv = { Ukraine: 4, Russia: 4, Iran: 4, Yemen: 4, Sudan: 4, Syria: 4, Lebanon: 4, Iraq: 4, Libya: 4, Somalia: 4, Mali: 4, 'Burkina Faso': 4, Haiti: 4, Venezuela: 4, Burma: 4, 'North Korea': 4, Israel: 3, Niger: 4, Pakistan: 3, 'Democratic Republic of the Congo': 3, Azerbaijan: 2, Armenia: 2, Philippines: 2, China: 3, Taiwan: 1, India: 2, Estonia: 1, Finland: 1 };
    return json(Object.entries(lv).map(([c, l]) => ({ Title: `${c} - Level ${l}: Demo Advisory`, Link: 'https://travel.state.gov', Updated: new Date().toISOString() })));
  }
  if (h === 'data.gdeltproject.org') {
    if (p.endsWith('lastupdate.txt')) {
      const t = new Date(Math.floor(Date.now() / 900_000) * 900_000).toISOString().replace(/[-:T]/g, '').slice(0, 14);
      return text(`123 abc http://data.gdeltproject.org/gdeltv2/${t}.export.CSV.zip\n456 def http://data.gdeltproject.org/gdeltv2/${t}.mentions.CSV.zip\n`);
    }
    const stamp = /(\d{14})/.exec(p)[1];
    return binary(zipOne(`${stamp}.export.CSV`, Buffer.from(gdeltExport(stamp))));
  }
  if (h === 'api.gdeltproject.org' && p.includes('/geo/')) {
    const q = u.searchParams.get('query');
    const topic = /drone/i.test(q) ? 'drone' : /protest/i.test(q) ? 'protest' : /shutdown/i.test(q) ? 'shutdown' : /GPS/i.test(q) ? 'jamming' : 'cyber';
    const places = { drone: ['ukraine', 'ukraine', 'yemen', 'sudan', 'lebanon', 'iran'], protest: ['iran', 'kashmir', 'venezuela', 'haiti', 'sahel'], shutdown: ['iran', 'sudan', 'myanmar'], jamming: ['baltic', 'ukraine', 'lebanon'], cyber: ['ukraine', 'iran', 'taiwan'] }[topic];
    return json({ type: 'FeatureCollection', features: Array.from({ length: 40 }, (_, i) => {
      const hs = HOTSPOTS.find((x) => x.id === places[i % places.length]);
      return { type: 'Feature', geometry: { type: 'Point', coordinates: [hs.lon + (rnd() - 0.5) * 5, hs.lat + (rnd() - 0.5) * 4] },
        properties: { name: `${hs.name} (demo locality ${i})`, count: 1 + Math.floor(rnd() ** 2 * 12), html: `<a href="https://example.org/demo" title="[DEMO] ${topic} report ${i}">[DEMO] ${topic} report ${i}</a>` } };
    }) });
  }
  if (h === 'celestrak.org') {
    const g = u.searchParams.get('GROUP');
    const n = { military: 60, resource: 90, radar: 15, gnss: 32 }[g] || 20;
    const lines = [];
    for (let i = 0; i < n; i++) {
      const no = 40000 + ({ military: 0, resource: 1000, radar: 2000, gnss: 3000 }[g] || 0) + i;
      const geo = g === 'military' && i % 7 === 3;
      const [inc, mm] = g === 'gnss' ? [55, 2.0056] : geo ? [0.05, 1.00274] : g === 'military' && i % 5 === 0 ? [63.4, 2.006] : [97.5 + rnd(), 14.8 + rnd() * 0.6];
      lines.push(`DEMO-${g.toUpperCase()} ${i}`, ...tle(no, inc, geo ? (i * 37) % 360 : rnd() * 360, geo ? 0.0002 : g === 'military' && i % 5 === 0 ? 0.7 : 0.001, rnd() * 360, rnd() * 360, mm));
    }
    return text(lines.join('\n'));
  }
  if (h === 'api.cloudflare.com') {
    return json({ result: { annotations: [
      { id: 'demo1', startDate: new Date(Date.now() - 5 * 3_600_000).toISOString(), endDate: null, scope: 'Nationwide', description: '[DEMO] Mobile and fixed networks cut during protests',
        outage: { outageCause: 'GOVERNMENT_DIRECTED', outageType: 'NATIONWIDE' }, locations: ['IR'], locationsDetails: [{ code: 'IR', name: 'Iran' }], linkedUrl: 'https://radar.cloudflare.com' },
      { id: 'demo2', startDate: new Date(Date.now() - 30 * 3_600_000).toISOString(), endDate: null, scope: 'Regional', description: '[DEMO] Power outage affects connectivity',
        outage: { outageCause: 'POWER_OUTAGE', outageType: 'REGIONAL' }, locations: ['SD'], locationsDetails: [{ code: 'SD', name: 'Sudan' }] },
      { id: 'demo3', startDate: new Date(Date.now() - 60 * 3_600_000).toISOString(), endDate: new Date(Date.now() - 50 * 3_600_000).toISOString(), description: '[DEMO] Submarine cable damage',
        outage: { outageCause: 'CABLE_CUT', outageType: 'NATIONWIDE' }, locations: ['YE'], locationsDetails: [{ code: 'YE', name: 'Yemen' }] },
    ] } });
  }
  return { ok: false, status: 404, text: async () => 'demo: no fixture' };
}

const binary = (buf) => ({ ok: true, status: 200, text: async () => buf.toString('latin1'), arrayBuffer: async () => buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) });

// Synthetic GDELT 2.0 export rows (61 tab-separated columns, real layout).
const EV_MIX = { ukraine: { '195': 6, '190': 4, '193': 3, '1412': 1 }, sudan: { '195': 3, '193': 5, '202': 1 }, gaza: { '195': 4, '190': 2, '141': 2 },
  iran: { '141': 9, '145': 4, '1411': 2 }, kashmir: { '141': 4, '145': 2 }, venezuela: { '141': 6, '145': 2 }, haiti: { '145': 3, '193': 2 },
  myanmar: { '195': 2, '193': 3 }, sahel: { '193': 2, '195': 1, '141': 2 }, lebanon: { '195': 2 }, yemen: { '195': 2, '190': 1 }, korea: { '141': 1 } };
const DEMO_FIPS = { ukraine: 'UP', sudan: 'SU', gaza: 'GZ', iran: 'IR', kashmir: 'IN', venezuela: 'VE', haiti: 'HA', myanmar: 'BM', sahel: 'ML', lebanon: 'LE', yemen: 'YM', korea: 'KS' };
function gdeltExport(stamp) {
  const rows = [];
  let k = 0;
  for (const [id, mix] of Object.entries(EV_MIX)) {
    const hs = HOTSPOTS.find((x) => x.id === id);
    for (const [code, n] of Object.entries(mix)) for (let i = 0; i < n; i++) {
      if (rnd() > 0.3) continue; // sparse, like a real 15-minute file
      const c = new Array(61).fill('');
      c[0] = `${stamp}${String(k++).padStart(4, '0')}`; c[1] = stamp.slice(0, 8);
      c[6] = pick(['PROTESTER', 'MILITARY', 'POLICE', 'REBEL', 'GOVERNMENT', '']); c[16] = pick(['CIVILIAN', 'MILITARY', '']);
      c[25] = '1'; c[26] = code; c[27] = code.slice(0, 3); c[28] = code.slice(0, 2); c[30] = '-9'; c[31] = '4'; c[32] = '2'; c[33] = String(1 + Math.floor(rnd() * 8)); c[34] = (-4 - rnd() * 6).toFixed(2);
      c[51] = '4'; c[52] = `Demo locality ${i}, ${hs.countries[0]}`; c[53] = DEMO_FIPS[id] || 'XX';
      c[56] = (hs.lat + (rnd() - 0.5) * 4).toFixed(4); c[57] = (hs.lon + (rnd() - 0.5) * 5).toFixed(4);
      c[59] = stamp; c[60] = 'https://example.org/demo-event';
      rows.push(c.join('\t'));
    }
  }
  return rows.join('\n') + '\n';
}

// Minimal single-entry ZIP writer (deflate) matching what GDELT publishes.
function zipOne(name, data) {
  const comp = zlib.deflateRawSync(data);
  const nameBuf = Buffer.from(name);
  const crc = crc32(data);
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8);
  local.writeUInt32LE(crc, 14); local.writeUInt32LE(comp.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(nameBuf.length, 26);
  const cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(20, 4); cd.writeUInt16LE(20, 6); cd.writeUInt16LE(8, 10);
  cd.writeUInt32LE(crc, 16); cd.writeUInt32LE(comp.length, 20); cd.writeUInt32LE(data.length, 24); cd.writeUInt16LE(nameBuf.length, 28); cd.writeUInt32LE(0, 42);
  const cdOff = 30 + nameBuf.length + comp.length;
  const eocd = Buffer.alloc(22); eocd.writeUInt32LE(0x06054b50, 0); eocd.writeUInt16LE(1, 8); eocd.writeUInt16LE(1, 10);
  eocd.writeUInt32LE(46 + nameBuf.length, 12); eocd.writeUInt32LE(cdOff, 16);
  return Buffer.concat([local, nameBuf, comp, cd, nameBuf, eocd]);
}
function crc32(buf) {
  let c = ~0;
  for (const b of buf) { c ^= b; for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1)); }
  return ~c >>> 0;
}

// Fixed-width TLE lines with valid checksums, epoch = now.
function tle(no, inc, raan, ecc, argp, ma, mm) {
  const d = new Date(); const start = Date.UTC(d.getUTCFullYear(), 0, 0);
  const doy = (Date.now() - start) / 86_400_000;
  const yy = String(d.getUTCFullYear() % 100).padStart(2, '0');
  const f = (v, w, p) => v.toFixed(p).padStart(w, ' ');
  const n5 = String(no).padStart(5, '0');
  const l1 = `1 ${n5}U 26001A   ${yy}${doy.toFixed(8).padStart(12, '0')}  .00000000  00000-0  00000-0 0  999`;
  const l2 = `2 ${n5} ${f(inc, 8, 4)} ${f(raan, 8, 4)} ${String(Math.round(ecc * 1e7)).padStart(7, '0')} ${f(argp, 8, 4)} ${f(ma, 8, 4)} ${f(mm, 11, 8)}00001`;
  const ck = (l) => String([...l].reduce((a, ch) => a + (ch === '-' ? 1 : /\d/.test(ch) ? +ch : 0), 0) % 10);
  return [l1 + ck(l1), l2 + ck(l2)];
}

async function fetch(url) {
  await new Promise((r) => setTimeout(r, 30 + rnd() * 120));
  return respond(url);
}

// Fake aisstream.io socket: emits synthetic position reports inside each chokepoint box.
class WebSocket {
  constructor() {
    this.ships = [];
    for (const cp of CHOKEPOINTS) {
      const n = 25 + Math.floor(rnd() * 60);
      const stuck = { suez: 0.75, babelmandeb: 0.5, panama: 0.55 }[cp.id] || 0.2;
      for (let i = 0; i < n; i++) {
        const [[s, w], [nn, e]] = cp.box;
        this.ships.push({ mmsi: 400000000 + this.ships.length, name: `DEMO ${cp.id.toUpperCase()} ${i}`, type: pick([70, 71, 80, 81, 84, 60, 35, 52, 30]),
          lat0: s + rnd() * (nn - s), lon0: w + rnd() * (e - w), hdg: rnd() * 360, sog: rnd() < stuck ? 0.2 : 8 + rnd() * 10 });
      }
    }
    setTimeout(() => {
      this.onopen?.();
      for (const sh of this.ships) this.emit({ MessageType: 'ShipStaticData', MetaData: { MMSI: sh.mmsi }, Message: { ShipStaticData: { Type: sh.type, Destination: pick(['SGSIN', 'AEFJR', 'NLRTM', 'EGPSD', 'CNSHA']) } } });
      const tick = () => {
        for (const sh of this.ships) {
          if (rnd() > 0.3) continue;
          const pos = move(sh, sh.sog * 0.03);
          this.emit({ MessageType: 'PositionReport', MetaData: { MMSI: sh.mmsi, ShipName: sh.name, latitude: pos.lat, longitude: pos.lon },
            Message: { PositionReport: { Sog: sh.sog, Cog: sh.hdg, TrueHeading: Math.round(sh.hdg), NavigationalStatus: sh.sog < 1 ? 1 : 0 } } });
        }
      };
      tick();
      setInterval(tick, 5000).unref();
    }, 200);
  }
  emit(o) { this.onmessage?.({ data: JSON.stringify(o) }); }
  send() {}
}

module.exports = { fetch, WebSocket, env: { AISSTREAM_API_KEY: 'demo', FIRMS_MAP_KEY: 'demo', CLOUDFLARE_API_TOKEN: 'demo' }, zipOne, gdeltExport, tle };
