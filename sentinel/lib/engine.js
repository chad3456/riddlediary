'use strict';
// Scheduler + in-memory state. Polls every feed on its own cadence, keeps
// per-source health, re-runs the fusion model, and bumps layer versions that
// the SSE stream announces to browsers.

const { EventEmitter } = require('events');
const { buildFeeds, makeHttp } = require('./feeds');
const { AisStream } = require('./ais');
const { analyze } = require('./analytics');
const { MARKETS, CHOKEPOINTS } = require('./catalog');
const { centroid } = require('./countries');

const HISTORY_EVERY = 5 * 60_000;
const HISTORY_LEN = 288; // 24h of 5-minute points

class Engine extends EventEmitter {
  constructor({ fetchImpl = globalThis.fetch, WebSocketImpl = globalThis.WebSocket, env = process.env, demo = false } = {}) {
    super();
    this.http = makeHttp(fetchImpl);
    this.demo = demo;
    this.feeds = buildFeeds(env);
    // Demo fixtures have no rate limits, so rolling feeds can fill the board quickly.
    if (demo) for (const f of this.feeds) if (f.rolling) f.interval = 400;
    this.state = { feeds: {}, ships: [], aisCoverage: new Set() };
    this.health = Object.fromEntries(this.feeds.map((f) => [f.id, {
      id: f.id, name: f.name, category: f.category, source: f.source, interval: f.interval, needsKey: f.needsKey || null,
      disabled: !!f.disabled, ok: false, lastOk: null, lastError: f.disabled ? `Optional: set ${f.needsKey}` : null,
      count: 0, latencyMs: null, runs: 0, failures: 0,
    }]));
    this.ais = new AisStream({ key: env.AISSTREAM_API_KEY, WebSocketImpl, onChange: () => this.touch('ships') });
    this.versions = { summary: 0, air: 0, ships: 0, hazards: 0, params: 0, activity: 0, sats: 0 };
    this.history = {}; this.gtiHistory = [];
    this.result = analyze(this.state, this.history);
    this.timers = [];
  }

  start() {
    this.feeds.filter((f) => !f.disabled).forEach((f, i) => {
      const t = setTimeout(() => this.loop(f), 300 * i); t.unref?.(); this.timers.push(t);
    });
    this.ais.start();
    const h = setInterval(() => this.snapshotHistory(), HISTORY_EVERY); h.unref?.(); this.timers.push(h);
    const a = setInterval(() => this.flush(), 2000); a.unref?.(); this.timers.push(a);
    setTimeout(() => this.snapshotHistory(), 20_000).unref?.();
  }

  stop() { this.timers.forEach(clearTimeout); this.timers.forEach(clearInterval); }

  async loop(feed) {
    await this.runFeed(feed);
    const h = this.health[feed.id];
    // Back off on repeated failure so a dead API is not hammered.
    const delay = h.ok ? feed.interval : Math.min(feed.interval * 2 ** Math.min(h.failures, 4), 1_800_000);
    const t = setTimeout(() => this.loop(feed), delay); t.unref?.();
  }

  async runFeed(feed) {
    const h = this.health[feed.id];
    const t0 = Date.now();
    h.runs++;
    try {
      const data = await feed.run(this.http, this.state.feeds[feed.id]);
      this.state.feeds[feed.id] = data;
      Object.assign(h, { ok: true, lastOk: Date.now(), lastError: null, latencyMs: Date.now() - t0, failures: 0,
        count: Array.isArray(data) ? data.length : Object.keys(data || {}).length });
      this.touch(layerOf(feed.id));
    } catch (e) {
      Object.assign(h, { ok: h.lastOk !== null && Date.now() - h.lastOk < feed.interval * 6, lastError: e.message, failures: h.failures + 1 });
      this.touch(null);
    }
  }

  touch(layer) {
    this.dirty = true;
    if (layer) this.dirtyLayers = new Set([...(this.dirtyLayers || []), layer]);
  }

  flush() {
    if (!this.dirty) return;
    this.dirty = false;
    const aisH = this.ais.health;
    this.state.ships = [...this.ais.list(), ...(this.state.feeds.ais_baltic || [])];
    this.state.aisCoverage = aisH.ok ? new Set(CHOKEPOINTS.map((c) => c.id)) : new Set();
    this.result = analyze(this.state, this.history);
    this.versions.summary++; this.versions.params++;
    for (const l of this.dirtyLayers || []) this.versions[l]++;
    this.dirtyLayers = new Set();
    this.emit('versions', this.versions);
  }

  snapshotHistory() {
    const t = Date.now();
    for (const e of [...this.result.chokepoints, ...this.result.hotspots]) {
      const k = `${e.kind === 'chokepoint' ? 'cp' : 'hs'}:${e.id}`;
      const arr = this.history[k] || (this.history[k] = []);
      arr.push({ t, v: e.score });
      if (arr.length > HISTORY_LEN) arr.shift();
    }
    this.gtiHistory.push({ t, v: this.result.gti });
    if (this.gtiHistory.length > HISTORY_LEN) this.gtiHistory.shift();
  }

  healthList() {
    return [...Object.values(this.health), { ...this.ais.health, interval: 0 }];
  }

  summary() {
    const f = this.state.feeds; const r = this.result;
    const strip = (e) => { const { query, ...rest } = e; return rest; };
    const health = this.healthList();
    return {
      generatedAt: Date.now(), demo: this.demo, gti: r.gti, gtiHistory: this.gtiHistory,
      counts: {
        parameters: r.parameters.length, liveParameters: r.parameters.filter((p) => p.value !== null && p.value !== undefined).length,
        milAircraft: (f.mil_air || []).length, aircraft: this.airLayer().length, ships: this.state.ships.length,
        quakes: (f.quakes || []).length, events: (f.eonet || []).length + (f.gdacs || []).length, fires: (f.firms || []).length,
        protests: (f.gdelt_events || []).filter((e) => e.kind === 'protest' || e.kind === 'riot').length,
        kinetic: (f.gdelt_events || []).filter((e) => e.kind === 'aerial' || e.kind === 'clash' || e.kind === 'mass').length,
        uav: (f.mil_air || []).filter((a) => a.uav).length, satellites: (f.satellites || []).length, outages: this.outageLayer().length,
        insights: r.insights.length, sourcesOnline: health.filter((h) => h.ok).length, sources: health.length,
      },
      health,
      insights: r.insights.slice(0, 150),
      chokepoints: r.chokepoints.map(strip), hotspots: r.hotspots.map(strip),
      markets: MARKETS.map((m) => f.markets?.[m.sym] || { ...m, price: null }),
      crypto: f.crypto || null, spaceWx: f.space_wx || null, kev: f.cisa_kev || null, outages: f.ioda || null,
      globalNews: f.gdelt?.global?.articles || [],
    };
  }

  // Country-level outages from IODA and Cloudflare, merged and placed at centroids.
  outageLayer() {
    const out = new Map();
    for (const o of Object.values(this.state.feeds.ioda || {})) {
      const c = centroid(o.code); if (!c) continue;
      out.set(o.code, { code: o.code, name: o.name, lat: c.lat, lon: c.lon, alerts: o.alerts, critical: o.critical, sources: o.sources, causes: [], ongoing: false });
    }
    for (const a of this.state.feeds.cf_outages || []) {
      for (const k of a.countries) {
        const c = centroid(k.code); if (!c) continue;
        const e = out.get(k.code) || { code: k.code, name: c.name, lat: c.lat, lon: c.lon, alerts: 0, critical: 0, sources: [], causes: [], ongoing: false };
        e.causes.push({ cause: a.cause, type: a.type, start: a.start, end: a.end, description: a.description, url: a.url });
        e.ongoing = e.ongoing || a.ongoing;
        if (!e.sources.includes('cloudflare')) e.sources.push('cloudflare');
        out.set(k.code, e);
      }
    }
    return [...out.values()];
  }

  airLayer() {
    const out = new Map();
    for (const d of Object.values(this.state.feeds.air_density || {})) for (const a of d.aircraft || []) out.set(a.id, a);
    for (const a of this.state.feeds.mil_air || []) out.set(a.id, a);
    return [...out.values()];
  }

  layer(name) {
    const f = this.state.feeds;
    if (name === 'air') return this.airLayer().map((a) => [a.id, a.lat, a.lon, a.hdg, a.alt, a.spd, a.cs, a.type, a.reg, a.mil ? 1 : 0, a.sq, a.src,
      a.nacp ?? null, a.uav ? 1 : 0, a.gpsLost ? 1 : 0]);
    if (name === 'activity') return {
      events: (f.gdelt_events || []).map((e) => [e.id, e.kind, e.lat, e.lon, e.place, e.code, e.actor1, e.actor2, e.articles, e.tone, e.ts, e.url, e.precise ? 1 : 0]),
      geo: Object.fromEntries(Object.entries(f.gdelt_geo || {}).map(([k, v]) => [k, v.points])),
      outages: this.outageLayer(),
    };
    if (name === 'sats') return f.satellites || [];
    if (name === 'ships') return this.state.ships.map((s) => [s.id, s.lat, s.lon, s.cog ?? s.hdg, s.sog, s.name, s.type, s.nav, s.dest, s.src]);
    if (name === 'hazards') return {
      quakes: f.quakes || [], eonet: f.eonet || [], gdacs: f.gdacs || [],
      fires: (f.firms || []).map((x) => [x.lat, x.lon, x.frp, x.date, x.time]),
    };
    return null;
  }
}

function layerOf(feedId) {
  return { mil_air: 'air', air_density: 'air', ais_baltic: 'ships', quakes: 'hazards', eonet: 'hazards', gdacs: 'hazards', firms: 'hazards',
    gdelt_events: 'activity', gdelt_geo: 'activity', ioda: 'activity', cf_outages: 'activity', satellites: 'sats' }[feedId] || null;
}

module.exports = { Engine };
