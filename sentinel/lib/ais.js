'use strict';
// Live global AIS via aisstream.io (free API key). Subscribes to every chokepoint
// box and keeps a rolling in-memory picture of vessels seen in the last 45 min.

const { CHOKEPOINTS } = require('./catalog');

const TTL = 45 * 60_000;

class AisStream {
  constructor({ key, WebSocketImpl = globalThis.WebSocket, onChange = () => {} }) {
    this.key = key; this.WS = WebSocketImpl; this.onChange = onChange;
    this.vessels = new Map(); this.static = new Map();
    this.health = { id: 'ais_global', name: 'Vessel positions at chokepoints (AIS)', category: 'Maritime',
      source: 'aisstream.io', needsKey: 'AISSTREAM_API_KEY', disabled: !key, ok: false, lastOk: null,
      lastError: key ? null : 'Set AISSTREAM_API_KEY for global ship tracking', count: 0, messages: 0 };
    this.backoff = 2000;
  }

  start() {
    if (!this.key || !this.WS) return;
    this.connect();
    this.sweeper = setInterval(() => this.expire(), 60_000);
    this.sweeper.unref?.();
  }

  connect() {
    const ws = new this.WS('wss://stream.aisstream.io/v0/stream');
    ws.binaryType = 'arraybuffer';
    this.ws = ws;
    ws.onopen = () => {
      this.backoff = 2000;
      ws.send(JSON.stringify({
        APIKey: this.key,
        BoundingBoxes: CHOKEPOINTS.map((c) => c.box),
        FilterMessageTypes: ['PositionReport', 'StandardClassBPositionReport', 'ShipStaticData'],
      }));
    };
    ws.onmessage = (ev) => {
      try {
        const raw = typeof ev.data === 'string' ? ev.data : Buffer.from(ev.data).toString('utf8');
        this.ingest(JSON.parse(raw));
      } catch (e) { this.health.lastError = `parse: ${e.message}`; }
    };
    ws.onerror = (e) => { this.health.lastError = e?.message || 'socket error'; };
    ws.onclose = () => {
      this.health.ok = false;
      setTimeout(() => this.connect(), this.backoff).unref?.();
      this.backoff = Math.min(this.backoff * 2, 120_000);
    };
  }

  ingest(msg) {
    if (msg.error) { this.health.lastError = msg.error; return; }
    const md = msg.MetaData || {};
    const mmsi = String(md.MMSI ?? '');
    if (!mmsi) return;
    this.health.messages++;
    if (msg.MessageType === 'ShipStaticData') {
      const s = msg.Message?.ShipStaticData || {};
      this.static.set(mmsi, { type: s.Type ?? null, dest: (s.Destination || '').trim() || null,
        imo: s.ImoNumber || null, call: (s.CallSign || '').trim() || null,
        len: s.Dimension ? (s.Dimension.A || 0) + (s.Dimension.B || 0) : null });
      const v = this.vessels.get(mmsi); if (v) Object.assign(v, this.static.get(mmsi));
      return;
    }
    const p = msg.Message?.PositionReport || msg.Message?.StandardClassBPositionReport;
    if (!p) return;
    const lat = md.latitude ?? p.Latitude; const lon = md.longitude ?? p.Longitude;
    if (Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    this.vessels.set(mmsi, {
      id: mmsi, name: (md.ShipName || '').trim() || null, lat: +lat.toFixed(4), lon: +lon.toFixed(4),
      sog: p.Sog ?? null, cog: p.Cog ?? null, hdg: p.TrueHeading === 511 ? null : p.TrueHeading ?? null,
      nav: p.NavigationalStatus ?? null, ts: Date.now(), src: 'aisstream', ...(this.static.get(mmsi) || {}),
    });
    this.health.ok = true; this.health.lastOk = Date.now(); this.health.lastError = null;
    this.health.count = this.vessels.size;
    this.onChange();
  }

  expire() {
    const cut = Date.now() - TTL;
    for (const [k, v] of this.vessels) if (v.ts < cut) this.vessels.delete(k);
    this.health.count = this.vessels.size;
  }

  list() { return [...this.vessels.values()]; }
}

module.exports = { AisStream };
