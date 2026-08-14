// server/db/db.js
//
// Lightweight persistence layer using a plain JSON file - no native
// dependencies, no compilation, works everywhere. Good enough for a
// single-user student project; swap for a real database if this ever
// needs to handle concurrent writers.
//
// The database is a single file: server/data/vocaprep.json
// It is created automatically on first run.

const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const dbFile = path.join(dataDir, "vocaprep.json");

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

function loadState() {
  if (!fs.existsSync(dbFile)) {
    return { practiceAttempts: [], interviews: [], nextPracticeId: 1, nextInterviewId: 1 };
  }
  try {
    const raw = fs.readFileSync(dbFile, "utf-8");
    const parsed = JSON.parse(raw);
    return {
      practiceAttempts: Array.isArray(parsed.practiceAttempts) ? parsed.practiceAttempts : [],
      interviews: Array.isArray(parsed.interviews) ? parsed.interviews : [],
      nextPracticeId: parsed.nextPracticeId || 1,
      nextInterviewId: parsed.nextInterviewId || 1,
    };
  } catch (e) {
    // Corrupt or empty file - start fresh rather than crashing the server.
    console.error("[db] Failed to read vocaprep.json, starting with empty history:", e.message);
    return { practiceAttempts: [], interviews: [], nextPracticeId: 1, nextInterviewId: 1 };
  }
}

function saveState(state) {
  fs.writeFileSync(dbFile, JSON.stringify(state, null, 2), "utf-8");
}

function nowIso() {
  return new Date().toISOString().replace("T", " ").slice(0, 19);
}

// ---------------------------------------------------------------------
// Practice attempts
// ---------------------------------------------------------------------

function savePracticeAttempt({ question, transcript, evaluation }) {
  const state = loadState();

  const record = {
    id: state.nextPracticeId,
    question,
    transcript,
    overallScore: evaluation.overallScore,
    fillerWordCount: evaluation.fillerWordCount,
    evaluation,
    createdAt: nowIso(),
  };

  state.practiceAttempts.unshift(record); // most recent first
  state.nextPracticeId += 1;
  saveState(state);

  return record.id;
}

function listPracticeAttempts(limit = 20) {
  const state = loadState();
  return state.practiceAttempts.slice(0, limit);
}

// ---------------------------------------------------------------------
// Interviews
// ---------------------------------------------------------------------

function saveInterview({ interviewType, report, questions, answers, evaluations }) {
  const state = loadState();

  const record = {
    id: state.nextInterviewId,
    interviewType,
    overallScore: report.overallScore,
    averageFluency: report.averageFluency,
    averageGrammar: report.averageGrammar,
    averageClarity: report.averageClarity,
    averageAnswerQuality: report.averageAnswerQuality,
    totalFillerWords: report.totalFillerWords,
    strongestArea: report.strongestArea,
    weakestArea: report.weakestArea,
    overallFeedback: report.overallFeedback,
    improvements: report.improvements || [],
    createdAt: nowIso(),
    questions: questions.map((question, i) => ({
      questionNumber: i + 1,
      question,
      answer: answers[i],
      evaluation: evaluations[i],
    })),
  };

  state.interviews.unshift(record); // most recent first
  state.nextInterviewId += 1;
  saveState(state);

  return record.id;
}

function listInterviews(limit = 20) {
  const state = loadState();
  // Return summaries only (no per-question detail) to keep the list light.
  return state.interviews.slice(0, limit).map(({ questions, ...summary }) => summary);
}

function getInterviewById(id) {
  const state = loadState();
  return state.interviews.find((i) => i.id === id) || null;
}

module.exports = {
  savePracticeAttempt,
  listPracticeAttempts,
  saveInterview,
  listInterviews,
  getInterviewById,
};