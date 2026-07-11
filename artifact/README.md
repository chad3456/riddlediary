# Riddle Diary — publishable Artifact

`riddle-diary.html` is a **single, self-contained** version of the diary built to run as a
Claude.ai **Artifact** — no server, no API key, no build step, and it stores nothing.

It differs from the full app (in the repo root) in one way, forced by the Artifact sandbox:

| | Full app (`/server.js` + `/public`) | This Artifact (`riddle-diary.html`) |
|---|---|---|
| Reads your handwriting | **Claude vision** — any hand, any device | Browser **Handwriting Recognition API** (Chrome / Edge / Android); elsewhere it shows an in‑character "inscribe" line to type the words |
| Riddle's reply | Your server → Claude API | Built‑in `window.claude.complete()` (runs inside Claude.ai) |
| Needs an API key | Yes | No |
| Stores data / memory | No | No |

Artifacts run under a strict CSP that blocks all outside requests, so an Artifact can neither
call your own server nor send the handwriting image to Claude's vision API. The built‑in
`window.claude.complete()` is text‑only — hence the recognition/inscribe step above.

## How to publish it

1. Open a chat on **claude.ai** and ask Claude to publish `riddle-diary.html` as an Artifact
   (paste the file's contents, or ask it to create an Artifact from this file). Artifacts start
   **private**; you get a share link you can hand to others.
2. Or open the file locally in **Chrome/Edge** to try the flow — note that `window.claude.complete`
   only exists inside Claude.ai, so a local open will show "the page stirs, but its magic sleeps
   outside these walls" in place of a reply. Recognition + all the ink effects still work locally.

The reply uses a system cursive stack (`Snell Roundhand` / `Segoe Script` / `Bradley Hand`) because
the Artifact CSP blocks font CDNs. To match the film's hand exactly, embed a handwriting font as a
`@font-face` data URI in the `<style>` block.
