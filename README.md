# Directions Practice (中文方向练习 / 한국어 길찾기 연습)

A React single-page app for practising how to give directions in **Chinese (HSK3)** or **Korean (TOPIK 3)**. You are dropped somewhere on a randomly generated city map, facing a random direction, and have to write directions to the destination. An LLM grades the result and traces your route on the map.

## Features

- **Interactive 5×5 map grid** with buildings, streets, and intersections, labelled in the language you are practising
- **Random start/facing/destination** each round, with the destination at least two blocks away
- **Two scores**: path accuracy (do the directions get there?) and language quality (grammar and vocabulary)
- **Inline corrections**: mistakes highlighted with the corrected form and an English explanation
- **Animated route trace** replaying the path your directions describe
- **Native speaker example** showing how the same route would be described naturally
- **Chinese / Korean toggle**, remembered across visits

## Architecture

The Groq API key must never reach the browser, so grading goes through a small Express proxy:

```
browser  ──POST /api/grade──▶  Vite dev proxy  ──▶  server.js (:3001)  ──▶  Groq API
```

The client calls a relative `/api/grade`, so the same build works behind any same-origin deployment. Set `VITE_API_BASE_URL` to target a backend on a different host.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure the grading API

```bash
cp .env.example .env
```

Add your [Groq API key](https://console.groq.com/keys) to `.env`:

```env
GROQ_API_KEY=your-groq-api-key-here
```

Optional overrides: `GROQ_MODEL` (default `openai/gpt-oss-120b`), `GROQ_REASONING_EFFORT`, `GROQ_MAX_TOKENS`, `GROQ_TIMEOUT_MS`, `PORT`.

> **Note:** these are backend-only variables. Never prefix an API key with `VITE_` — Vite inlines `VITE_*` variables into the client bundle, where anyone can read them.

Using a different OpenAI-compatible provider (OpenAI, DeepSeek, a local Ollama server) only requires changing `GROQ_URL` and the auth header in [server.js](server.js).

### 3. Run

```bash
npm run dev:all
```

This starts the Vite dev server on <http://localhost:5173> and the grading proxy on <http://localhost:3001>. To run them separately use `npm run dev` and `npm run server`.

Check the backend with `curl http://localhost:3001/api/health`.

## How to Use

1. **Read the map**: 👤 is you (the arrow shows which way you are facing), 📍 is the destination
2. **Write directions** in the target language — relative directions (forward / left / right) are expected and are not penalised
3. **Submit** (or press ⌘/Ctrl + Enter)
4. **Review** your two scores, the literal translation of what you wrote, the corrections, and the native-speaker example
5. **Next Round** for a new map

## Example Direction Phrases

**Chinese (HSK3)**

- 往前走 (wǎng qián zǒu) — go forward
- 向右拐 (xiàng yòu guǎi) — turn right
- 向左拐 (xiàng zuǒ guǎi) — turn left
- 一直走 (yìzhí zǒu) — go straight
- 到路口 (dào lùkǒu) — reach the intersection
- 在…旁边 (zài… pángbiān) — next to…
- 过马路 (guò mǎlù) — cross the street

**Korean (TOPIK 3)**

- 앞으로 가세요 — go forward
- 오른쪽으로 도세요 — turn right
- 왼쪽으로 도세요 — turn left
- 쭉 가세요 — go straight
- 사거리까지 가세요 — go to the intersection
- … 옆에 있어요 — it is next to…
- 길을 건너세요 — cross the street

## Project Structure

```
server.js                        # Express proxy: validates input, prompts Groq, sanitizes the response
vite.config.js                   # Dev server + /api proxy
src/
├── components/
│   ├── Map.jsx                  # 5×5 grid of buildings, streets, and intersections
│   ├── PathAnimation.jsx        # SVG overlay that replays the graded route
│   ├── DirectionsForm.jsx       # Text input form
│   ├── Results.jsx              # Scores, corrections, native example
│   └── LanguageSwitcher.jsx     # Chinese / Korean toggle
├── context/
│   ├── LanguageContext.jsx      # Provider (persists the choice to localStorage)
│   └── useLanguage.js           # Context + hook
├── data/
│   ├── buildings.js             # Vocabulary lists and round randomisation
│   ├── gridLayout.js            # Shared map geometry (JS + CSS custom properties)
│   └── translations.js          # UI strings
├── services/
│   └── llmService.js            # Client for the grading API
├── utils/
│   └── sanitizeFeedback.js      # Allow-list sanitizer for model-generated HTML
└── App.jsx                      # Round lifecycle and state
```

## Building for Production

```bash
npm run build
```

Output lands in `dist/`. The Express server only serves `/api`, so in production either serve `dist/` from the same origin (behind a reverse proxy) or set `VITE_API_BASE_URL` at build time.

## Technologies Used

- **React 19** + **Vite 7**
- **Express** proxy for the grading API
- **Groq** (`openai/gpt-oss-120b` by default)

### Choosing a model

`openai/gpt-oss-120b` is the default because grading here hinges on left/right
reasoning relative to a facing direction. On an 6-case benchmark of that skill:

| Model | Correct left/right verdicts | Notes |
| --- | --- | --- |
| `openai/gpt-oss-120b` | 5-6/6 | Traces multi-step paths; example restates the real starting position |
| `llama-3.3-70b-versatile` | 4/6 | Scored 0 on correct answers 2 of 3 times; path collapses to one point |
| `qwen/qwen3.6-27b` (`reasoning_effort=none`) | 3/6 | Rubber stamp: scored 100 on every case, including every wrong answer |
| `qwen/qwen3.6-27b` (thinking on) | 3/6 + 3 failures | Discriminates when it completes, but ~9.7s and unreliable JSON |

Qwen writes the most idiomatic Chinese of the three, so it is tempting for this
app. It is not usable as the grader: with thinking off it agrees with
everything, and with thinking on it is slow and returns malformed JSON often
enough to break rounds. Note it is a hybrid reasoning model that emits
`<think>` blocks inline in `content`; the server strips those, and
`GROQ_REASONING_EFFORT=none` turns thinking off entirely.

`GROQ_REASONING_EFFORT=low` is worth setting: it scored 6/6 on the same
benchmark while using 1,338 completion tokens instead of 2,865, which roughly
doubles how many submissions fit in the rate limit.

The free tier also has a **daily token cap** (200,000 for `gpt-oss-120b`).
Benchmarking sweeps exhaust it quickly; when it trips, the error names the
model and the reset time, and switching `GROQ_MODEL` gives you a fresh
per-model budget.

Note the free tier is capped at **6,000 tokens/minute**. A grading costs about
1,400 prompt tokens plus completion, so at default reasoning that is roughly
1.4 submissions per minute and at `low` about 2.2. The server retries once with
backoff on a 429.

Reasoning tokens share the `max_tokens` budget, so if you switch models and
start seeing truncated responses, raise `GROQ_MAX_TOKENS`.

## License

MIT
