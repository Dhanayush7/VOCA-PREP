# VocaPrep

**AI Communication Coach** — a speaking practice and mock-interview platform for college students preparing for internships and placements.

VocaPrep lets a student record a spoken answer, transcribes it with **Sarvam AI Speech-to-Text**, and evaluates it with **Sarvam AI Chat Completions** acting as a professional communication coach — returning fluency/grammar/clarity/answer-quality scores, filler-word detection, written feedback, and a rewritten "better answer".

---

## Features

- 🎙 **Speaking Practice** — pick from 10 common practice questions, record an answer, and get instant AI-scored feedback.
- 💼 **Mock Interview** — a full 5-question AI-driven interview in HR, Technical, or General tracks. Questions are generated live and adapt to what you've already been asked.
- 📊 **Score dashboard** — overall score plus Fluency / Grammar / Clarity / Answer Quality, color-coded green/yellow/red.
- 🗣 **Filler word detection** — counts and lists filler words actually found in your transcript (never a fabricated score).
- 💡 **AI feedback** — strengths, areas to improve, and a polished rewritten answer you can copy with one click.
- 📈 **Final interview report** — averaged scores, strongest/weakest area, an AI-written summary, top 3 improvements, and an expandable question-by-question breakdown.
- 🎨 A dark, purple-accented dashboard UI built to look and feel like a real SaaS product.
- 🛡 Robust error handling for mic permissions, unsupported browsers, empty recordings, network failures, and AI/service errors — with friendly messages and no leaked server internals.

## Tech Stack

**Frontend:** React + Vite (JavaScript), plain CSS (custom design system, no UI framework)
**Backend:** Node.js + Express
**AI:** Sarvam AI — `/speech-to-text` (Saaras v3) for transcription, `/v1/chat/completions` (Sarvam-105B) for evaluation, question generation, and report summaries
**Uploads:** Multer (temporary local storage, deleted immediately after transcription)

## Project Structure

```
vocaprep/
├── client/                    React + Vite frontend
│   ├── src/
│   │   ├── components/        Navbar, ModeSelector, Recorder, TranscriptCard,
│   │   │                      ScoreCard, FeedbackCard, PracticeMode, InterviewMode,
│   │   │                      InterviewQuestion, FinalReport
│   │   ├── data/questions.js  Practice question bank + interview type metadata
│   │   ├── services/api.js    All calls to the Express backend
│   │   ├── App.jsx / App.css  Top-level view routing + all component styles
│   │   └── index.css          Design tokens, reset, fonts
│   ├── index.html
│   └── vite.config.js
│
├── server/                    Express backend
│   ├── routes/
│   │   ├── speechRoutes.js        POST /api/speech-to-text
│   │   ├── evaluationRoutes.js    POST /api/evaluate
│   │   └── interviewRoutes.js     POST /api/interview/question, /api/interview/report
│   ├── services/sarvamService.js  All Sarvam AI request/response logic (single source of truth)
│   ├── uploads/                   Temporary audio storage (auto-cleaned per request)
│   ├── server.js
│   └── .env / .env.example
│
└── README.md
```

## Installation & Setup

### 1. Backend

```bash
cd server
npm install
cp .env.example .env
```

Open `server/.env` and add your Sarvam AI key:

```
SARVAM_API_KEY=your_sarvam_api_key_here
PORT=5001
```

Get a key from [dashboard.sarvam.ai](https://dashboard.sarvam.ai).

Start the server:

```bash
node server.js
```

You should see `VocaPrep server running on http://localhost:5001`.

### 2. Frontend

In a second terminal:

```bash
cd client
npm install
npm run dev
```

Open the app at **http://localhost:5173**.

> The frontend always talks to `http://localhost:5001`. The Sarvam API key lives only in `server/.env` and is never sent to the browser.

### Production build

```bash
cd client
npm run build
```

Outputs a static bundle to `client/dist/`, ready to deploy behind any static host (the backend still needs to run separately, or be reachable at the URL configured in `src/services/api.js`).

## Environment Variables

| Variable          | Location      | Description                                  |
|--------------------|--------------|-----------------------------------------------|
| `SARVAM_API_KEY`   | `server/.env` | Your Sarvam AI subscription key (required)    |
| `PORT`             | `server/.env` | Port the Express server listens on (default `5001`) |

If `SARVAM_API_KEY` is missing, the backend still starts and the frontend still compiles — every AI-powered endpoint returns a clear `500` configuration error instead of pretending to work.

## API Endpoints

| Method | Endpoint                    | Purpose                                                   |
|--------|------------------------------|------------------------------------------------------------|
| GET    | `/api/health`                | Server + Sarvam-config health check                        |
| POST   | `/api/speech-to-text`        | `multipart/form-data`, field `audio` → `{ transcript }`    |
| POST   | `/api/evaluate`               | `{ question, transcript, mode }` → structured score/feedback JSON |
| POST   | `/api/interview/question`    | `{ type, questionNumber, previousQuestions, previousAnswers }` → `{ question }` |
| POST   | `/api/interview/report`      | `{ interviewType, questions, answers, evaluations }` → final report JSON |

## How Speech-to-Text Works

1. The browser's `MediaRecorder` API records the mic to a `Blob` (WebM/Opus, or MP4 as a fallback).
2. The frontend uploads the blob as `multipart/form-data` to `POST /api/speech-to-text`.
3. The backend streams the file to Sarvam's `POST /speech-to-text` endpoint (`model: saaras:v3`) using the server-side `SARVAM_API_KEY`.
4. The transcript comes back and is returned to the frontend — the temp file on disk is deleted immediately after.

## How AI Evaluation Works

`POST /api/evaluate` sends the question + transcript to Sarvam Chat Completions (`sarvam-105b`) with a system prompt that instructs the model to act as a professional communication coach and return **only** a JSON object matching a fixed schema (scores, filler words found in the transcript, feedback, strengths, improvements, and a rewritten answer). The backend validates and clamps every score to `0–100` before sending it to the frontend — filler words are always a count, never a score.

## How Mock Interview Works

Each interview is exactly **5 questions**. For every question:

1. `POST /api/interview/question` asks Sarvam for one new question for the selected track (HR / Technical / General), passing along every prior question and answer so it won't repeat itself.
2. The student manually clicks **Start Recording** (recording is never triggered automatically), answers, and the answer goes through the same speech-to-text + evaluate pipeline as Practice Mode.
3. After all 5 questions, `POST /api/interview/report` computes the overall score, per-category averages, total filler words, and strongest/weakest area **directly from the real evaluation data already collected** — Sarvam is only asked to write the qualitative summary and top-3 improvements grounded in those real numbers, so nothing is randomly generated.

## Troubleshooting

- **"Speech-to-text is not configured on the server yet."** — add `SARVAM_API_KEY` to `server/.env` and restart `node server.js`.
- **"Couldn't reach the VocaPrep server."** — make sure the backend is running on port 5001 before using the frontend.
- **Microphone permission denied** — check your browser's site settings and allow microphone access for `localhost:5173`, then retry.
- **CORS errors** — the backend already enables CORS for all origins via the `cors` package; if you change the frontend port, no extra config is needed.
- **Empty transcript / "No speech was detected"** — check that your mic isn't muted and that you spoke for more than a second or two.

## Limitations

- No authentication or user accounts — this is a single-session MVP, nothing is persisted between page reloads.
- No database — all interview state lives in React state for the current session only.
- Requires a valid Sarvam AI key with speech-to-text and chat-completions access; the free tier's rate limits may apply.
- Audio recording requires a browser that supports the `MediaRecorder` API (all current versions of Chrome, Edge, and Firefox do).
