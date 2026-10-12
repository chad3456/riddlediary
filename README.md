# The Diary of Tom Riddle

A mobile-first web app that recreates the enchanted diary from _Harry Potter and the Chamber of Secrets_.

You **write on the screen by hand**. The page **drinks your ink** — it fades and vanishes. Then it **answers in a flowing hand** that appears stroke by stroke and slowly sinks back into the page, exactly as Riddle's diary does in the film.

The voice behind the ink is **Claude** (`claude-opus-4-8`), directed to answer as **Tom Riddle**: total truth, no comfort, no sugar-coating — all knowledge, coldly given.

- ✍️ **Handwriting input** — finger or stylus, pressure-sensitive.
- 🖋️ **Claude reads your handwriting directly** (vision) and replies in character in one step — no separate OCR.
- 🫧 **Ink-drinking + fading-reply effects** to match the diary.
- 🧠 **No data, no memory.** Nothing is written to disk or a database; no conversation history is kept or sent. Every entry is independent — the page keeps nothing.

## Run it

Requires **Node 18+** and an [Anthropic API key](https://console.anthropic.com/).

```bash
npm install
cp .env.example .env        # then paste your key into .env
npm start
```

Open **http://localhost:3000** — on a phone, open it in the browser and "Add to Home Screen" for a full-screen, app-like experience.

## Get a shareable link (real Claude answers)

A published Claude **artifact cannot do this** — artifacts run with no network
access and no built-in AI, so they can only return canned text. Real, varied,
in-character answers require this small server (it holds your API key and calls
Claude). To put it online:

**Render (free, one click):** push this repo to GitHub → [render.com](https://render.com)
→ **New → Blueprint** → pick this repo → paste your `ANTHROPIC_API_KEY` when asked.
You get a public `https://…onrender.com` URL that works on any phone.

**Any Docker host** (Railway, Fly.io, a VPS): a `Dockerfile` is included —
`docker build -t riddle . && docker run -e ANTHROPIC_API_KEY=sk-ant-... -p 3000:3000 riddle`.

Either way the key stays server-side and nothing is stored.

## How it works

```
 your handwriting (canvas)
        │  PNG (base64), trimmed to the inked area
        ▼
 POST /api/oracle  ──►  Claude (vision + Tom Riddle system prompt)
        │                       │
        │  reply text           │  reads the image, answers in character
        ▼                       ▼
 flowing hand appears, then fades into the page
```

- `server.js` — a tiny Express server. Serves the page and exposes `POST /api/oracle`, which forwards the handwriting image to Claude with the Riddle persona and returns the reply. **The API key never reaches the browser.** Requests are stateless; the writing and the reply are never logged or stored.
- `public/` — the parchment page, the handwriting canvas, and the ink effects. No frameworks, no build step.

## The character

Riddle's persona lives in `RIDDLE_SYSTEM` in `server.js`: eloquent, cold, faintly amused, 1940s formality — and truthful above all, refusing to comfort or flatter. Edit it there to retune the voice. He will still decline genuine real-world harm, in character.

## Notes

- The reply font is **Dancing Script** (Google Fonts), the same flowing-hand choice as the original [reMarkable `riddle` project](https://github.com/MaximeRivest/riddle), with a cursive fallback if offline.
- This is an MVP. There is no account system and nothing to persist — that is by design.


---

## Also in this repo: SENTINEL OSINT board

[`sentinel/`](sentinel/) is a separate, self-contained real-time OSINT fusion dashboard. It covers chokepoints, military aviation, shipping, conflict reporting, hazards, cyber and markets. See [sentinel/README.md](sentinel/README.md).
