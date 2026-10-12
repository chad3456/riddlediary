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
