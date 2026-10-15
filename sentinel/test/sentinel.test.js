'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { buildFeeds, makeHttp, summarizeTimeline, normAircraft } = require('../lib/feeds');
const { analyze, composite, levelOf, shipClass } = require('../lib/analytics');
const { AisStream } = require('../lib/ais');
const { Engine } = require('../lib/engine');
const demo = require('../lib/demo');

const feed = (id) => buildFeeds({ FIRMS_MAP_KEY: 'k' }).find((f) => f.id === id);
const http = makeHttp(demo.fetch);

test('every feed normalizes its vendor format', async () => {
  for (const f of buildFeeds({ FIRMS_MAP_KEY: 'k' })) {
    const data = await f.run(http, undefined);
    assert.ok(data && (Array.isArray(data) ? data.length : Object.keys(data).length), `${f.id} produced data`);
  }
});

test('aircraft normalizer handles ground altitude and missing positions', () => {
  assert.strictEqual(normAircraft({ hex: 'a', alt_baro: 'ground', lat: 1, lon: 2 }, 's').alt, 0);
  assert.strictEqual(normAircraft({ hex: 'b' }, 's'), null);
  assert.strictEqual(normAircraft({ hex: 'c', lat: 1, lon: 1, dbFlags: 1 }, 's', false).mil, true);
});

test('GDELT timeline summary computes 24h surge against prior daily mean', () => {
  const now = Date.UTC(2026, 9, 12, 12);
  const fmt = (t) => new Date(t).toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
  const data = [];
  for (let h = 144; h >= 0; h--) data.push({ date: fmt(now - h * 3_600_000), value: h < 24 ? 3 : 1 });
  const s = summarizeTimeline(data, now, 'sum');
  assert.strictEqual(s.last24, 72);
  assert.ok(s.surge > 2.5 && s.surge < 3.5, `surge ${s.surge}`);
});

test('composite score renormalizes over available components and reports coverage', () => {
  const r = composite([{ name: 'a', weight: 50, value: 1 }, { name: 'b', weight: 50, value: null }]);
  assert.strictEqual(r.score, 100);
  assert.strictEqual(r.coverage, 50);
  assert.strictEqual(composite([{ name: 'a', weight: 1, value: null }]).score, null);
  assert.strictEqual(levelOf(85).label, 'SEVERE');
  assert.strictEqual(levelOf(null).label, 'NO DATA');
});

test('AIS ship type classes', () => {
  assert.strictEqual(shipClass(84), 'tanker');
  assert.strictEqual(shipClass(71), 'cargo');
  assert.strictEqual(shipClass(35), 'military');
  assert.strictEqual(shipClass(undefined), 'unknown');
});

test('aisstream ingest merges static data into positions', () => {
  const a = new AisStream({ key: null });
  a.ingest({ MessageType: 'ShipStaticData', MetaData: { MMSI: 1 }, Message: { ShipStaticData: { Type: 80, Destination: 'FUJAIRAH ' } } });
  a.ingest({ MessageType: 'PositionReport', MetaData: { MMSI: 1, ShipName: 'TEST ', latitude: 26.5, longitude: 56.3 }, Message: { PositionReport: { Sog: 0.2, Cog: 90, TrueHeading: 511 } } });
  const [v] = a.list();
  assert.deepStrictEqual([v.name, v.type, v.dest, v.hdg], ['TEST', 80, 'FUJAIRAH', null]);
});

test('analysis with no data yields null values, not zeros', () => {
  const r = analyze({ feeds: {}, ships: [] });
  assert.ok(r.parameters.length > 200);
  assert.ok(r.chokepoints.every((c) => c.score === null));
  assert.ok(r.parameters.filter((p) => p.key === 'mil_air').every((p) => p.value === null));
});

test('end-to-end demo engine produces 200+ live parameters and insights', async () => {
  const e = new Engine({ fetchImpl: demo.fetch, WebSocketImpl: demo.WebSocket, env: demo.env, demo: true });
  await Promise.all(e.feeds.map((f) => e.runFeed(f)));
  e.ais.connect();
  await new Promise((r) => setTimeout(r, 400));
  e.dirty = true; e.flush();
  const s = e.summary();
  assert.ok(s.counts.liveParameters >= 200, `live params ${s.counts.liveParameters}`);
  assert.ok(s.insights.length > 5);
  assert.ok(s.gti !== null);
  assert.ok(e.layer('air').length > 100);
  assert.ok(e.layer('ships').length > 100);
  assert.ok(s.health.every((h) => h.ok), s.health.filter((h) => !h.ok).map((h) => `${h.id}: ${h.lastError}`).join('; '));
});

test('a failing source is isolated and reported', async () => {
  const broken = async () => ({ ok: false, status: 503, text: async () => '' });
  const e = new Engine({ fetchImpl: broken, WebSocketImpl: null, env: {} });
  await e.runFeed(e.feeds.find((f) => f.id === 'quakes'));
  const h = e.health.quakes;
  assert.strictEqual(h.ok, false);
  assert.match(h.lastError, /503/);
  assert.ok(feed('gdelt'));
});

test('GDELT event export: zip round-trip, CAMEO classes and geo filtering', () => {
  const { unzipFirst, parseExport, classify } = require('../lib/events');
  assert.strictEqual(classify('1411'), 'protest');
  assert.strictEqual(classify('145'), 'riot');
  assert.strictEqual(classify('195'), 'aerial');
  assert.strictEqual(classify('193'), 'clash');
  assert.strictEqual(classify('202'), 'mass');
  assert.strictEqual(classify('042'), null);
  const csv = demo.gdeltExport('20261012150000');
  const back = unzipFirst(demo.zipOne('x.export.CSV', Buffer.from(csv))).toString('utf8');
  assert.strictEqual(back, csv);
  const rows = parseExport(back);
  assert.ok(rows.length > 0 && rows.every((r) => r.kind && Number.isFinite(r.lat)));
  const countryOnly = csv.split('\n')[0].split('\t'); countryOnly[51] = '1';
  assert.strictEqual(parseExport(countryOnly.join('\t')).length, 0, 'country-centroid events are dropped');
});

test('UAV detection by type, and callsign only when type is missing', () => {
  const { isUav } = require('../lib/feeds');
  assert.ok(isUav({ t: 'Q4' }));
  assert.ok(isUav({ t: 'MQ9' }));
  assert.ok(isUav({ flight: 'FORTE11 ' }));
  assert.ok(!isUav({ t: 'C17', flight: 'FORTE11' }));
  assert.ok(!isUav({ t: 'B738' }));
});

test('live-activity fusion: unrest + outage raises a shutdown insight', async () => {
  const e = new Engine({ fetchImpl: demo.fetch, WebSocketImpl: null, env: demo.env, demo: true });
  for (const id of ['gdelt_events', 'cf_outages', 'ioda']) { const f = e.feeds.find((x) => x.id === id); for (let i = 0; i < 6; i++) await e.runFeed(f); }
  e.dirty = true; e.flush();
  const s = e.summary();
  assert.ok(s.insights.some((i) => i.kind === 'Fusion' && /Iran/.test(i.title)), s.insights.map((i) => i.title).join(' | '));
  const act = e.layer('activity');
  assert.ok(act.events.length > 0 && act.outages.some((o) => o.code === 'IR' && o.ongoing));
  assert.ok(e.result.parameters.length >= 1000);
});

test('client orbital analysis: classes, sun geometry, footprints, passes', async () => {
  const satellite = require('satellite.js');
  global.satellite = satellite; global.window = global.window || {};
  require('../public/orbits.js');
  const O = global.window.SentinelOrbits;
  const iss = satellite.twoline2satrec('1 25544U 98067A   26285.50000000  .00016717  00000-0  10270-3 0  9993', '2 25544  51.6400 208.9163 0006317  69.9862  25.2906 15.49560532 12345');
  assert.strictEqual(O.classify(iss).cls, 'LEO');
  const [l1, l2] = demo.tle(40001, 0.05, 100, 0.0002, 0, 0, 1.00274);
  assert.strictEqual(O.classify(satellite.twoline2satrec(l1, l2)).cls, 'GEO');
  const sun = O.sun(new Date('2026-06-21T12:00:00Z'));
  assert.ok(Math.abs(sun.lat - 23.44) < 0.3 && Math.abs(sun.lon) < 2, JSON.stringify(sun));
  assert.ok(O.sunElevation(0, 0, new Date('2026-06-21T12:00:00Z')) > 60);
  assert.ok(Math.abs(O.fieldOfRegardKm(500, 30) - 293) < 5);
  const recs = [{ rec: iss, name: 'ISS', group: 'Test', orbit: O.classify(iss) }];
  const p = O.passes(recs, 0, 0, { hours: 24 });
  assert.ok(p.length > 0 && p.every((x) => x.los > x.aos && x.maxEl >= 10));
}, { skip: (() => { try { require.resolve('satellite.js'); return false; } catch { return 'satellite.js not installed (dev-only)'; } })() });

test('reference geopolitics: well-formed codes and shapes', () => {
  global.window = global.window || {};
  require('../public/data/geopolitics.js');
  const R = global.window.GEOREF;
  const iso = /^[A-Z]{2}$/;
  for (const [k, b] of Object.entries(R.blocs)) for (const c of [...b.members, ...(b.partners || [])]) assert.match(c, iso, `${k}:${c}`);
  assert.strictEqual(R.blocs.NATO.members.length, 32);
  assert.strictEqual(R.blocs.EU.members.length, 27);
  for (const c of R.contested) assert.ok(c.ring || c.line || c.at, c.id);
  for (const b of R.bases) assert.ok(Math.abs(b.lat) <= 90 && Math.abs(b.lon) <= 180, b.name);
});
