// server/routes/evaluationRoutes.js
const express = require("express");
const { evaluateAnswer } = require("../services/sarvamService");

const router = express.Router();

// POST /api/evaluate
router.post("/evaluate", async (req, res) => {
  const { question, transcript, mode } = req.body || {};

  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "A 'question' is required to evaluate an answer." });
  }
  if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
    return res.status(400).json({ error: "A non-empty 'transcript' is required to evaluate an answer." });
  }

  try {
    const result = await evaluateAnswer({
      question,
      transcript,
      mode: mode === "interview" ? "interview" : "practice",
    });
    return res.json(result);
  } catch (err) {
    console.error("[evaluate] error:", err.message);
    const status = err.status || 500;
    return res.status(status).json({
      error: friendlyMessage(err),
      code: err.code || "EVALUATION_FAILED",
    });
  }
});

function friendlyMessage(err) {
  if (err.code === "MISSING_API_KEY") {
    return "AI evaluation is not configured on the server yet. Add a SARVAM_API_KEY in server/.env.";
  }
  if (err.code === "SARVAM_NETWORK_ERROR") {
    return "Couldn't reach the AI evaluation service. Check your internet connection and try again.";
  }
  if (err.code === "INVALID_AI_JSON" || err.code === "EMPTY_AI_RESPONSE") {
    return "The AI evaluator returned an unexpected response. Please try again.";
  }
  return "Something went wrong evaluating your answer. Please try again.";
}

module.exports = router;
