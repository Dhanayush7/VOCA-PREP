// server/routes/interviewRoutes.js
const express = require("express");
const { generateInterviewQuestion, generateInterviewReport } = require("../services/sarvamService");
const { saveInterview, listInterviews, getInterviewById, listPracticeAttempts } = require("../db/db");

const router = express.Router();

const VALID_TYPES = ["HR", "Technical", "General"];

// POST /api/interview/question
router.post("/interview/question", async (req, res) => {
  const {
    type,
    questionNumber,
    previousQuestions = [],
    previousAnswers = [],
    topic = null,
  } = req.body || {};

  if (!VALID_TYPES.includes(type)) {
    return res.status(400).json({ error: `'type' must be one of ${VALID_TYPES.join(", ")}.` });
  }
  if (!Number.isInteger(questionNumber) || questionNumber < 1 || questionNumber > 5) {
    return res.status(400).json({ error: "'questionNumber' must be an integer between 1 and 5." });
  }

  try {
    const question = await generateInterviewQuestion({
      type,
      questionNumber,
      previousQuestions,
      previousAnswers,
      topic,
    });
    return res.json({ question });
  } catch (err) {
    console.error("[interview/question] error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: friendlyQuestionMessage(err),
      code: err.code || "QUESTION_GENERATION_FAILED",
    });
  }
});

// POST /api/interview/report
router.post("/interview/report", async (req, res) => {
  const { interviewType, questions = [], answers = [], evaluations = [] } = req.body || {};

  if (!VALID_TYPES.includes(interviewType)) {
    return res.status(400).json({ error: `'interviewType' must be one of ${VALID_TYPES.join(", ")}.` });
  }
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    return res.status(400).json({ error: "'evaluations' must be a non-empty array." });
  }

  try {
    const report = await generateInterviewReport({ interviewType, questions, answers, evaluations });

    let interviewId = null;
    try {
      interviewId = saveInterview({ interviewType, report, questions, answers, evaluations });
    } catch (dbErr) {
      console.error("[interview/report] failed to save interview:", dbErr.message);
    }

    return res.json({ ...report, id: interviewId });
  } catch (err) {
    console.error("[interview/report] error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: friendlyReportMessage(err),
      code: err.code || "REPORT_GENERATION_FAILED",
    });
  }
});

// GET /api/history/practice
router.get("/history/practice", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const attempts = listPracticeAttempts(limit);
    return res.json({ attempts });
  } catch (err) {
    console.error("[history/practice] error:", err.message);
    return res.status(500).json({ error: "Couldn't load practice history." });
  }
});

// GET /api/history/interviews
router.get("/history/interviews", (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const interviews = listInterviews(limit);
    return res.json({ interviews });
  } catch (err) {
    console.error("[history/interviews] error:", err.message);
    return res.status(500).json({ error: "Couldn't load interview history." });
  }
});

// GET /api/history/interviews/:id
router.get("/history/interviews/:id", (req, res) => {
  try {
    const interview = getInterviewById(parseInt(req.params.id, 10));
    if (!interview) {
      return res.status(404).json({ error: "Interview not found." });
    }
    return res.json({ interview });
  } catch (err) {
    console.error("[history/interviews/:id] error:", err.message);
    return res.status(500).json({ error: "Couldn't load that interview." });
  }
});

function friendlyQuestionMessage(err) {
  if (err.code === "MISSING_API_KEY") {
    return "Interview question generation is not configured on the server yet. Add a SARVAM_API_KEY in server/.env.";
  }
  if (err.code === "SARVAM_NETWORK_ERROR") {
    return "Couldn't reach the AI service to generate the next question. Check your internet connection and try again.";
  }
  return "Something went wrong generating the next interview question. Please try again.";
}

function friendlyReportMessage(err) {
  if (err.code === "MISSING_API_KEY") {
    return "Report generation is not configured on the server yet. Add a SARVAM_API_KEY in server/.env.";
  }
  if (err.code === "SARVAM_NETWORK_ERROR") {
    return "Couldn't reach the AI service to build your final report. Check your internet connection and try again.";
  }
  return "Something went wrong creating your final interview report. Please try again.";
}

module.exports = router;