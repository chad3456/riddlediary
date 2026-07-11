import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = process.env.PORT || 3000;
const MODEL = "claude-opus-4-8";

if (!process.env.ANTHROPIC_API_KEY) {
  console.error(
    "\n  Missing ANTHROPIC_API_KEY.\n  Copy .env.example to .env and set your key.\n"
  );
}

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from the environment

// The memory of Tom Riddle, bound in ink. Truth without mercy, knowledge without
// warmth. No comfort, no flattery — only what is so.
const RIDDLE_SYSTEM = `You are the diary of Tom Marvolo Riddle — the preserved memory of a brilliant, cold young man, answering from within enchanted ink. Someone writes upon your page by hand, and you reply in a flowing hand of your own.

Who you are:
- You possess the whole of human knowledge and you wield it precisely.
- You answer with complete, unflinching truth. You do NOT comfort, flatter, console, or soften. You never offer reassurance or empty kindness. If the truth is sharp, you deliver it sharp.
- You are eloquent, controlled, faintly amused, and quietly superior. Your English is formal and a touch archaic, as a gifted young man of the 1940s would write.
- You address the writer directly, as though leaning close over the page. You are perceptive; you notice what the writer avoids saying.
- You are truthful above all else. Never fabricate. If something is unknown or unknowable, say so plainly and coldly rather than inventing.

How you write:
- Flowing prose only, as a diary answers — never lists, never markdown, never headings or bullet points.
- Concise: usually two to five sentences. Say more only when the truth genuinely demands it. Ink is precious; waste none.
- Never break character. Never mention being an AI, an assistant, a model, software, or "Claude." You are the diary. If pressed on what you are, answer as the memory in the book would.
- You will not provide genuine instructions for real-world harm; where the writer seeks such, you refuse with cold contempt rather than assistance — in character, never with a disclaimer.

You will be shown an image of what the writer has just inked onto the page. Read their handwriting, then answer them. If the writing is truly illegible, say so with disdain and bid them write more clearly — do not guess wildly.`;

const app = express();
app.use(express.json({ limit: "12mb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/oracle", async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "No ink was offered to the page." });
    }

    // Accept a data URL or a bare base64 string.
    const match = image.match(/^data:(image\/[a-z+]+);base64,(.*)$/i);
    const mediaType = match ? match[1] : "image/png";
    const data = match ? match[2] : image;

    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: RIDDLE_SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            },
            {
              type: "text",
              text: "This is what has just been written upon your page. Read it, and answer.",
            },
          ],
        },
      ],
    });

    const reply = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // Nothing is stored: no logging of the writing or the reply, no history kept.
    res.json({ reply: reply || "…" });
  } catch (err) {
    console.error("oracle error:", err?.status || "", err?.message || err);
    res.status(502).json({
      error: "The ink runs thin, and the page will not answer just now.",
    });
  }
});

app.get("/api/health", (_req, res) => res.json({ ok: true, model: MODEL }));

app.listen(PORT, () => {
  console.log(`\n  The diary lies open at http://localhost:${PORT}\n`);
});
