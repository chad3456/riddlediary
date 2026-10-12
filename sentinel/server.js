'use strict';
// SENTINEL — open-source intelligence fusion board.
// Zero-dependency Node 22 server: polls public OSINT APIs, fuses them,
// and streams updates to the browser over Server-Sent Events.
//
//   node server.js           live data
//   node server.js --demo    synthetic data (clearly labelled), for offline dev

const http = require('http');
const fs = require('fs');
const path = require('path');
const { Engine } = require('./lib/engine');

loadDotEnv(path.join(__dirname, '.env'));

const DEMO = process.argv.includes('--demo') || process.env.SENTINEL_DEMO === '1';
const PORT = Number(process.env.PORT) || 8080;
const PUBLIC = path.join(__dirname, 'public');

let engineOpts = {};
if (DEMO) {
  const demo = require('./lib/demo');
  engineOpts = { fetchImpl: demo.fetch, WebSocketImpl: demo.WebSocket, env: { ...process.env, ...demo.env }, demo: true };
}
const engine = new Engine(engineOpts);
engine.start();

const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.json': 'application/json', '.ico': 'image/x-icon', '.png': 'image/png' };

const clients = new Set();
engine.on('versions', (v) => {
  const msg = `event: versions\ndata: ${JSON.stringify(v)}\n\n`;
  for (const res of clients) res.write(msg);
});
setInterval(() => { for (const res of clients) res.write(': ping\n\n'); }, 25_000).unref();

function sendJSON(res, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(body);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');
  const p = url.pathname;

  if (p === '/api/stream') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-store', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
    res.write(`event: versions\ndata: ${JSON.stringify(engine.versions)}\n\n`);
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }
  if (p === '/api/summary') return sendJSON(res, engine.summary());
  if (p === '/api/parameters') return sendJSON(res, engine.result.parameters);
  if (p === '/api/health') return sendJSON(res, engine.healthList());
  if (p.startsWith('/api/layer/')) {
    const data = engine.layer(p.slice('/api/layer/'.length));
    if (!data) { res.writeHead(404); return res.end('unknown layer'); }
    return sendJSON(res, data);
  }

  const file = path.normalize(path.join(PUBLIC, p === '/' ? 'index.html' : p));
  if (!file.startsWith(PUBLIC)) { res.writeHead(403); return res.end(); }
  fs.readFile(file, (err, buf) => {
    if (err) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
    res.end(buf);
  });
});

server.listen(PORT, () => {
  console.log(`SENTINEL ${DEMO ? '[DEMO DATA] ' : ''}listening on http://localhost:${PORT}`);
  if (!DEMO && !process.env.AISSTREAM_API_KEY) console.log('  · ship tracking at chokepoints: set AISSTREAM_API_KEY (free at aisstream.io)');
  if (!DEMO && !process.env.FIRMS_MAP_KEY) console.log('  · fire / strike thermal anomalies: set FIRMS_MAP_KEY (free at firms.modaps.eosdis.nasa.gov)');
});

function loadDotEnv(file) {
  try {
    for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
      if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  } catch { /* no .env is fine */ }
}
