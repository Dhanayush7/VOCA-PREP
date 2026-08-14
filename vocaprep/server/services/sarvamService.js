// server/services/sarvamService.js
//
// Single shared module for every call VocaPrep makes to Sarvam AI.
// Nothing outside this file should build a Sarvam request directly -
// that keeps auth, error handling and response parsing in one place.

const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const SARVAM_BASE_URL = "https://api.sarvam.ai";
const CHAT_MODEL = "sarvam-105b";

// ---------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------

function getApiKey() {
  const key = process.env.SARVAM_API_KEY;
  if (!key || key.trim() === "") {
    const err = new Error(
      "Sarvam API key is not configured. Add SARVAM_API_KEY to server/.env"
    );
    err.code = "MISSING_API_KEY";
    err.status = 500;
    throw err;
  }
  return key;
}

// Pulls the assistant's text out of a Sarvam chat completion response.
function extractChatText(payload) {
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    const err = new Error("Sarvam chat completion returned an empty response.");
    err.code = "EMPTY_AI_RESPONSE";
    err.status = 502;
    throw err;
  }
  return content;
}

// The model is asked to return raw JSON, but some models wrap it in
// ```json fences anyway - strip that defensively before parsing.
function parseJsonFromModel(text) {
  const cleaned = text
    .trim()
    .replace(/^```json/i, "")
    .replace(/^```/, "")
    .replace(/```$/, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (e) {
    const err = new Error("Sarvam returned a response that was not valid JSON.");
    err.code = "INVALID_AI_JSON";
    err.status = 502;
    throw err;
  }
}

async function callChatCompletion({ systemPrompt, userPrompt, temperature = 0.4 }) {
  const apiKey = getApiKey();

  let response;
  try {
    response = await fetch(`${SARVAM_BASE_URL}/v1/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-subscription-key": apiKey,
      },
      body: JSON.stringify({
        model: CHAT_MODEL,
        temperature,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });
  } catch (networkErr) {
    console.error("[sarvamService.callChatCompletion] raw fetch error:", networkErr);
    const err = new Error(
      `Could not reach Sarvam AI. (${networkErr.code || networkErr.message || "unknown network error"}) Check your network connection.`
    );
    err.code = "SARVAM_NETWORK_ERROR";
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch (_) {
      detail = await response.text().catch(() => "");
    }
    const err = new Error(`Sarvam chat completion failed: ${detail || response.statusText}`);
    err.code = "SARVAM_CHAT_ERROR";
    err.status = response.status === 401 || response.status === 403 ? 500 : 502;
    throw err;
  }

  const payload = await response.json();
  return extractChatText(payload);
}

// ---------------------------------------------------------------------
// 1. Speech to Text
// ---------------------------------------------------------------------

/**
 * Sends an audio file to Sarvam's /speech-to-text REST endpoint.
 * @param {string} filePath - path to the uploaded audio file on disk
 * @param {string} originalName - original filename (helps Sarvam infer format)
 * @returns {Promise<string>} transcript text
 */
async function speechToText(filePath, originalName = "recording.webm") {
  const apiKey = getApiKey();

  const form = new FormData();
  form.append("file", fs.createReadStream(filePath), originalName);
  form.append("model", "saaras:v3");
  form.append("language_code", "unknown");

  let response;
  try {
    response = await fetch(`${SARVAM_BASE_URL}/speech-to-text`, {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        ...form.getHeaders(),
      },
      body: form,
    });
  } catch (networkErr) {
    // Log the REAL underlying cause (ENOTFOUND, ECONNREFUSED, ETIMEDOUT,
    // certificate errors, etc.) - this is what you need to see in the
    // terminal to actually diagnose the problem.
    console.error("[sarvamService.speechToText] raw fetch error:", networkErr);
    const err = new Error(
      `Could not reach Sarvam AI Speech-to-Text service. (${networkErr.code || networkErr.message || "unknown network error"})`
    );
    err.code = "SARVAM_NETWORK_ERROR";
    err.status = 502;
    throw err;
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.error?.message || JSON.stringify(body);
    } catch (_) {
      detail = await response.text().catch(() => "");
    }
    const err = new Error(`Sarvam Speech-to-Text failed: ${detail || response.statusText}`);
    err.code = "SARVAM_STT_ERROR";
    err.status = response.status === 401 || response.status === 403 ? 500 : 502;
    throw err;
  }

  const data = await response.json();
  const transcript = (data.transcript || "").trim();

  if (!transcript) {
    const err = new Error(
      "No speech was detected in the recording. Please try again and speak clearly."
    );
    err.code = "EMPTY_TRANSCRIPT";
    err.status = 422;
    throw err;
  }

  return transcript;
}

// ---------------------------------------------------------------------
// 2. Answer evaluation (communication coach)
// ---------------------------------------------------------------------

/**
 * Evaluates a spoken answer using Sarvam Chat Completions, acting as a
 * professional communication coach. Returns the structured JSON shape
 * documented in the project spec.
 */
async function evaluateAnswer({ question, transcript, mode = "practice" }) {
  const systemPrompt = `You are an expert professional communication coach and interview evaluator for college students preparing for internship and placement interviews.

You will be given an interview/practice question and the student's spoken answer (transcribed from audio, so it may contain natural speech artifacts).

Evaluate the answer strictly and honestly across: fluency, grammar, clarity, relevance to the question, overall answer quality, conciseness, and professional communication tone. Also detect filler words (e.g. "um", "uh", "like", "actually", "basically", "you know", "so yeah") actually present in the transcript - do not invent ones that are not there.

Respond with ONLY a raw JSON object (no markdown fences, no commentary) with EXACTLY this shape:

{
  "overallScore": <integer 0-100>,
  "fluency": <integer 0-100>,
  "grammar": <integer 0-100>,
  "clarity": <integer 0-100>,
  "answerQuality": <integer 0-100>,
  "fillerWordCount": <integer, total count of filler words found>,
  "fillerWords": [ { "word": "<filler word>", "count": <integer> } ],
  "feedback": "<2-4 sentence honest, constructive feedback>",
  "improvedAnswer": "<a rewritten, polished version of the same answer, same intent, in first person>",
  "strengths": ["<short strength>", "..."],
  "improvements": ["<short actionable improvement>", "..."]
}

Rules:
- fillerWordCount and fillerWords are counts, never a 0-100 score.
- If there are no filler words, return "fillerWordCount": 0 and "fillerWords": [].
- Base every score on the actual transcript content. Do not default to a fixed number.
- If the transcript is very short, off-topic, or low quality, scores should reflect that honestly (they can be low).
- Keep "feedback" specific to what was actually said.
- strengths and improvements should each have 2-4 short items.`;

  const userPrompt = JSON.stringify({
    mode,
    question,
    transcript,
  });

  const text = await callChatCompletion({ systemPrompt, userPrompt, temperature: 0.4 });
  const parsed = parseJsonFromModel(text);

  // Normalize fillerWords into the flat array-of-strings shape the
  // frontend spec expects, while keeping counts available too.
  const fillerWordsList = [];
  if (Array.isArray(parsed.fillerWords)) {
    for (const item of parsed.fillerWords) {
      if (typeof item === "string") {
        fillerWordsList.push(item);
      } else if (item && typeof item.word === "string") {
        const count = Number.isFinite(item.count) ? item.count : 1;
        for (let i = 0; i < count; i++) fillerWordsList.push(item.word);
      }
    }
  }

  return {
    overallScore: clampScore(parsed.overallScore),
    fluency: clampScore(parsed.fluency),
    grammar: clampScore(parsed.grammar),
    clarity: clampScore(parsed.clarity),
    answerQuality: clampScore(parsed.answerQuality),
    fillerWordCount: Number.isFinite(parsed.fillerWordCount)
      ? parsed.fillerWordCount
      : fillerWordsList.length,
    fillerWords: fillerWordsList,
    fillerWordBreakdown: Array.isArray(parsed.fillerWords) ? parsed.fillerWords : [],
    feedback: parsed.feedback || "",
    improvedAnswer: parsed.improvedAnswer || "",
    strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
    improvements: Array.isArray(parsed.improvements) ? parsed.improvements : [],
  };
}

function clampScore(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

// ---------------------------------------------------------------------
// 3. Mock interview question generation
// ---------------------------------------------------------------------

async function generateInterviewQuestion({
  type,
  questionNumber,
  previousQuestions = [],
  previousAnswers = [],
  topic = null,
}) {
  const systemPrompt = `You are an experienced interview panelist conducting a mock ${type} interview for a college CSE/engineering student preparing for internship and placement interviews.

Generate exactly ONE concise interview question appropriate for question number ${questionNumber} of a 5-question interview.

Rules:
- Never generate an answer - only the question.
- Never repeat or closely rephrase any question in "previousQuestions".
- If useful, let the question be lightly informed by the student's previous answers (e.g. a natural follow-up), but it must still fit the "${type}" interview category.
- Keep the question concise (1-2 sentences), natural, and realistic for a real interview panel.
- If type is "Technical", keep questions relevant to core CSE topics (DSA, OOP, DBMS, OS, Computer Networks, Web/Full-Stack Development, C/C++/JS/React/Node) suitable for a student, and prefer conceptual/explain-style questions over ones requiring a whiteboard.
- If type is "HR", focus on motivation, self-awareness, teamwork, career goals, strengths/weaknesses, and workplace scenarios.
- If type is "General", focus on communication, problem solving, teamwork, and general workplace situations.

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{ "question": "<the question text>" }`;

  const userPrompt = JSON.stringify({
    type,
    questionNumber,
    topic,
    previousQuestions,
    previousAnswers,
  });

  const text = await callChatCompletion({ systemPrompt, userPrompt, temperature: 0.7 });
  const parsed = parseJsonFromModel(text);

  if (!parsed.question || typeof parsed.question !== "string") {
    const err = new Error("Sarvam did not return a valid interview question.");
    err.code = "INVALID_AI_JSON";
    err.status = 502;
    throw err;
  }

  return parsed.question.trim();
}

// ---------------------------------------------------------------------
// 4. Final interview report
// ---------------------------------------------------------------------

/**
 * Computes the aggregate numeric report from the ACTUAL evaluations
 * collected during the interview (never randomly generated), then asks
 * Sarvam only for the qualitative overall summary + top improvements,
 * grounded in that real data.
 */
async function generateInterviewReport({ interviewType, questions, answers, evaluations }) {
  if (!Array.isArray(evaluations) || evaluations.length === 0) {
    const err = new Error("No evaluations were provided to generate a report.");
    err.code = "MISSING_EVALUATIONS";
    err.status = 400;
    throw err;
  }

  const avg = (key) =>
    Math.round(
      evaluations.reduce((sum, e) => sum + (Number(e[key]) || 0), 0) / evaluations.length
    );

  const overallScore = avg("overallScore");
  const averageFluency = avg("fluency");
  const averageGrammar = avg("grammar");
  const averageClarity = avg("clarity");
  const averageAnswerQuality = avg("answerQuality");
  const totalFillerWords = evaluations.reduce(
    (sum, e) => sum + (Number(e.fillerWordCount) || 0),
    0
  );

  const areaScores = {
    Fluency: averageFluency,
    Grammar: averageGrammar,
    Clarity: averageClarity,
    "Answer Quality": averageAnswerQuality,
  };
  const strongestArea = Object.entries(areaScores).sort((a, b) => b[1] - a[1])[0][0];
  const weakestArea = Object.entries(areaScores).sort((a, b) => a[1] - b[1])[0][0];

  const systemPrompt = `You are a professional interview coach writing the closing summary of a mock ${interviewType} interview report for a college student. You are given the student's real questions, answers and per-question evaluation scores. Do not invent scores - only reference what is given.

Respond with ONLY a raw JSON object, no markdown fences, no commentary:
{
  "overallFeedback": "<4-6 sentence overall assessment, specific to this student's performance across all questions>",
  "improvements": ["<specific actionable improvement>", "<...>", "<...>"]
}
"improvements" should have exactly 3 items, ordered by priority.`;

  const userPrompt = JSON.stringify({
    interviewType,
    questions,
    answers,
    evaluations,
    computedAverages: {
      overallScore,
      averageFluency,
      averageGrammar,
      averageClarity,
      averageAnswerQuality,
      totalFillerWords,
      strongestArea,
      weakestArea,
    },
  });

  let overallFeedback = "";
  let improvements = [];
  try {
    const text = await callChatCompletion({ systemPrompt, userPrompt, temperature: 0.5 });
    const parsed = parseJsonFromModel(text);
    overallFeedback = parsed.overallFeedback || "";
    improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
  } catch (e) {
    // The numeric report is still valid even if the qualitative summary
    // call fails - surface a fallback instead of failing the whole report.
    overallFeedback =
      "Your detailed scores are below. We couldn't generate a written summary right now, but your question-by-question breakdown reflects your actual performance.";
    improvements = [
      "Review your lowest-scoring question below for specific feedback.",
      "Practice reducing filler words by pausing instead of saying 'um' or 'like'.",
      "Structure answers with a clear beginning, example, and conclusion.",
    ];
  }

  return {
    overallScore,
    averageFluency,
    averageGrammar,
    averageClarity,
    averageAnswerQuality,
    totalFillerWords,
    strongestArea,
    weakestArea,
    overallFeedback,
    improvements,
  };
}

module.exports = {
  speechToText,
  evaluateAnswer,
  generateInterviewQuestion,
  generateInterviewReport,
};