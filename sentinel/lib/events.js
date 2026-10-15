'use strict';
// GDELT 2.0 Event stream: a machine-coded, geolocated event table published
// every 15 minutes. We keep a rolling 24h window of the event classes that
// matter for situational awareness:
//   protest   CAMEO 140-144  demonstrations, hunger strikes, strikes, blockades
//   riot      CAMEO 145      violent protest / riot
//   aerial    CAMEO 195      employ aerial weapons — airstrikes, drone strikes
//   clash     CAMEO 190/193/194  conventional force, small arms, artillery/tanks
//   mass      CAMEO 20x      unconventional mass violence
// Events are coded automatically from news; they are signals to corroborate,
// not verified incidents.

const zlib = require('zlib');

const COL = { id: 0, a1: 6, a2: 16, root: 25, code: 26, rootCode: 28, goldstein: 30, mentions: 31, sources: 32, articles: 33, tone: 34,
  geoType: 51, place: 52, country: 53, lat: 56, lon: 57, added: 59, url: 60 };

function classify(code) {
  if (code === '145' || code.startsWith('145')) return 'riot';
  if (code.startsWith('14')) return 'protest';
  if (code.startsWith('195')) return 'aerial';
  if (code.startsWith('190') || code.startsWith('193') || code.startsWith('194')) return 'clash';
  if (code.startsWith('20')) return 'mass';
  return null;
}

// Minimal ZIP reader for GDELT's single-file archives (central directory based,
// so it is correct even when sizes live in a trailing data descriptor).
function unzipFirst(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65_557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('zip: no end-of-central-directory');
  const cd = buf.readUInt32LE(eocd + 16);
  if (buf.readUInt32LE(cd) !== 0x02014b50) throw new Error('zip: bad central directory');
  const method = buf.readUInt16LE(cd + 10);
  const csize = buf.readUInt32LE(cd + 20);
  const local = buf.readUInt32LE(cd + 42);
  if (buf.readUInt32LE(local) !== 0x04034b50) throw new Error('zip: bad local header');
  const start = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
  const data = buf.subarray(start, start + csize);
  if (method === 0) return data;
  if (method === 8) return zlib.inflateRawSync(data);
  throw new Error(`zip: unsupported method ${method}`);
}

function parseExport(text) {
  const out = [];
  for (const line of text.split('\n')) {
    if (!line) continue;
    const c = line.split('\t');
    const kind = classify(c[COL.code] || '');
    if (!kind) continue;
    const geoType = +c[COL.geoType];
    // 1 = country centroid only: too coarse to plot as an incident.
    if (!(geoType >= 2)) continue;
    const lat = +c[COL.lat]; const lon = +c[COL.lon];
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || (lat === 0 && lon === 0)) continue;
    const a = c[COL.added] || '';
    const ts = Date.UTC(+a.slice(0, 4), +a.slice(4, 6) - 1, +a.slice(6, 8), +a.slice(8, 10), +a.slice(10, 12));
    const place = c[COL.place] || '';
    out.push({ id: c[COL.id], kind, code: c[COL.code], lat: +lat.toFixed(3), lon: +lon.toFixed(3), place,
      country: place.split(', ').pop(), cc: c[COL.country] || null, actor1: c[COL.a1] || null, actor2: c[COL.a2] || null,
      articles: +c[COL.articles] || 1, sources: +c[COL.sources] || 1, tone: +(+c[COL.tone]).toFixed(1),
      goldstein: +c[COL.goldstein], precise: geoType === 3 || geoType === 4, ts, url: c[COL.url] || null });
  }
  return out;
}

const fileStamp = (t) => new Date(t).toISOString().replace(/[-:T]/g, '').slice(0, 14);

function eventsFeed({ backfillFiles = 96 } = {}) {
  const store = new Map();
  const seenFiles = new Set();
  let backfill = null;
  return {
    id: 'gdelt_events', name: 'Protests, riots, airstrikes & clashes (geocoded)', category: 'Events', interval: 30_000,
    source: 'GDELT 2.0 Event stream (15-min)', rolling: true,
    store,
    async run(http) {
      const last = await http.text('http://data.gdeltproject.org/gdeltv2/lastupdate.txt');
      const url = (last.split('\n').map((l) => l.trim().split(' ')[2]).find((u) => u && u.includes('.export.CSV')) || '').trim();
      if (!url) throw new Error('lastupdate.txt has no export file');
      const queue = [];
      if (!seenFiles.has(url)) queue.push(url);
      // Walk back 15-minute files to fill the 24h window, one per tick.
      if (!backfill) {
        const m = /(\d{14})\.export/.exec(url);
        const t0 = Date.UTC(+m[1].slice(0, 4), +m[1].slice(4, 6) - 1, +m[1].slice(6, 8), +m[1].slice(8, 10), +m[1].slice(10, 12));
        backfill = Array.from({ length: backfillFiles }, (_, i) => url.replace(m[1], fileStamp(t0 - (i + 1) * 900_000)));
      }
      const next = backfill.shift();
      if (next && !seenFiles.has(next)) queue.push(next);
      for (const u of queue) {
        seenFiles.add(u);
        try {
          const rows = parseExport(unzipFirst(await http.buffer(u, { timeout: 60000 })).toString('utf8'));
          for (const r of rows) store.set(r.id, r);
        } catch (e) {
          if (u === url) { seenFiles.delete(u); throw e; } // retry the newest file next tick
        }
      }
      const cut = Date.now() - 86_400_000;
      for (const [k, v] of store) if (v.ts < cut) store.delete(k);
      return [...store.values()];
    },
  };
}

module.exports = { eventsFeed, parseExport, unzipFirst, classify, COL };
