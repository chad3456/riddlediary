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
