'use strict';
// DEMO MODE ONLY. A fake `fetch` and `WebSocket` that answer in each vendor's
// real response format with synthetic values, so the whole pipeline (feeds →
// normalizers → fusion → UI) can be developed and tested offline.
// The UI shows a permanent "DEMO DATA" banner whenever this is active.

const { CHOKEPOINTS, HOTSPOTS, MARKETS } = require('./catalog');

let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const pick = (a) => a[Math.floor(rnd() * a.length)];
const T0 = Date.now();
const mins = () => (Date.now() - T0) / 60_000;

// "Hot" theatres get surging news and more military traffic in the demo.
const HOT = { hormuz: 2.6, babelmandeb: 3.4, taiwan: 2.1, ukraine: 1.9, gaza: 1.6, sudan: 2.4, kerch: 1.7, iran: 2.2, baltic: 1.5 };

const MIL_TYPES = ['C17', 'K35R', 'RC135', 'P8', 'E3TF', 'F16', 'A332', 'C130', 'H60', 'KC46', 'MQ9', 'C30J', 'GLEX', 'A400', 'E2'];
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
      alt_baro: a.alt, gs: a.gs, track: a.hdg, dbFlags: 1, squawk: a.hex === 'ae1003' ? '7700' : '4000' })) });
  }
  if (h === 'api.adsb.lol' && p.includes('/point/')) {
    const [, , , lat, lon] = p.split('/').map(Number);
    const n = 20 + Math.floor(rnd() * 70);
    return json({ ac: Array.from({ length: n }, (_, i) => ({ hex: `c${Math.floor(lat * 100)}${i}`.replace('-', 'm'), flight: `${pick(['UAE', 'QTR', 'SIA', 'BAW', 'DLH', 'THY', 'CPA'])}${200 + i}`,
      lat: lat + (rnd() - 0.5) * 3, lon: lon + (rnd() - 0.5) * 3, alt_baro: 30000 + Math.round(rnd() * 9000), gs: 430 + rnd() * 60, track: rnd() * 360, t: pick(['B77W', 'A359', 'A21N', 'B38M', 'B789']) })) });
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
  if (h === 'api.gdeltproject.org') {
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
  return { ok: false, status: 404, text: async () => 'demo: no fixture' };
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

module.exports = { fetch, WebSocket, env: { AISSTREAM_API_KEY: 'demo', FIRMS_MAP_KEY: 'demo' } };
