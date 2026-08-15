const interviewTracks = [
  "Frontend Developer",
  "MERN Developer",
  "C++ / DSA",
  "HR Interview",
  "Full Stack Developer",
];

const questionBank = {
  "MERN Developer": [
    { skill: "React", text: "Can you explain what React is and why we use it?", keywords: ["component", "ui", "virtual dom", "reusable"] },
    { skill: "React", text: "What is the difference between state and props in React?", keywords: ["state", "props", "immutable", "component"] },
    { skill: "JavaScript", text: "How does event loop work in JavaScript?", keywords: ["call stack", "queue", "event loop", "async"] },
    { skill: "Node.js", text: "What is middleware in Express?", keywords: ["request", "response", "next", "express"] },
    { skill: "APIs", text: "What is REST and when would you use it?", keywords: ["http", "resource", "stateless", "endpoint"] },
    { skill: "MongoDB", text: "What is indexing in MongoDB?", keywords: ["query", "index", "performance", "collection"] },
    { skill: "Security", text: "How do you secure JWT authentication?", keywords: ["expiry", "secret", "https", "refresh"] },
    { skill: "Testing", text: "How would you test a MERN API endpoint?", keywords: ["integration", "unit", "request", "assert"] },
    { skill: "System Design", text: "How do you scale a MERN app for high traffic?", keywords: ["cache", "load balancer", "database", "scaling"] },
    { skill: "DBMS", text: "Difference between SQL and NoSQL?", keywords: ["schema", "relation", "document", "scaling"] },
    { skill: "Advanced React", text: "What are hooks and why are they useful?", keywords: ["state", "effect", "reuse", "function component"] },
    { skill: "Deployment", text: "How do you deploy a full stack MERN app?", keywords: ["build", "server", "environment", "ci"] },
  ],
};

const fallbackQuestions = [
  { skill: "Communication", text: "Tell me about yourself.", keywords: ["experience", "skill", "project"] },
  { skill: "Problem Solving", text: "How do you approach a new technical problem?", keywords: ["analyze", "plan", "test"] },
  { skill: "Teamwork", text: "How do you handle feedback in a team?", keywords: ["feedback", "improve", "collaboration"] },
];

const appState = {
  track: "",
  name: "Dhanayush",
  currentQuestionIndex: 0,
  transcript: "",
  answers: [],
};

const refs = {
  trackOptions: document.getElementById("track-options"),
  candidateName: document.getElementById("candidate-name"),
  startBtn: document.getElementById("start-btn"),
  stepSelect: document.getElementById("step-select"),
  stepInterview: document.getElementById("step-interview"),
  stepReport: document.getElementById("step-report"),
  aiQuestion: document.getElementById("ai-question"),
  voiceInput: document.getElementById("voice-input"),
  convertBtn: document.getElementById("convert-btn"),
  transcript: document.getElementById("transcript"),
  submitAnswerBtn: document.getElementById("submit-answer-btn"),
  evaluation: document.getElementById("evaluation"),
  followUp: document.getElementById("follow-up"),
  finalReport: document.getElementById("final-report"),
  restartBtn: document.getElementById("restart-btn"),
};

function getQuestionsForTrack(track) {
  return questionBank[track] || fallbackQuestions;
}

function renderTrackOptions() {
  refs.trackOptions.innerHTML = interviewTracks
    .map(
      (track, index) => `
      <label>
        <input type="radio" name="track" value="${track}" ${index === 1 ? "checked" : ""} />
        ${track}
      </label>
    `
    )
    .join("");
}

function getCurrentQuestion() {
  const questions = getQuestionsForTrack(appState.track);
  return questions[appState.currentQuestionIndex];
}

function showQuestion() {
  const question = getCurrentQuestion();
  refs.aiQuestion.textContent = `🔊 Hello ${appState.name}. Let's begin your interview. ${question.text}`;
  refs.followUp.textContent = "";
  refs.voiceInput.value = "";
  refs.transcript.textContent = "";
  refs.evaluation.textContent = "";
}

function calculateScores(question, transcript) {
  const normalized = transcript.toLowerCase();
  const hits = question.keywords.filter((keyword) => normalized.includes(keyword.toLowerCase())).length;
  const technical = Math.min(10, 4 + hits * 1.8);
  const completeness = Math.min(10, 3 + hits * 1.9);
  const communication = Math.min(10, 5 + Math.min(3, transcript.trim().split(/\s+/).length / 20));
  return {
    technical: Number(technical.toFixed(1)),
    completeness: Number(completeness.toFixed(1)),
    communication: Number(communication.toFixed(1)),
    hits,
  };
}

function evaluateAnswer(question, transcript) {
  const score = calculateScores(question, transcript);
  const notes = [];
  if (score.hits >= 3) {
    notes.push("Good technical coverage.");
  } else {
    notes.push("Try to include more specific technical details.");
  }
  if (
    question.text.toLowerCase().includes("what react is") &&
    !transcript.toLowerCase().includes("virtual dom")
  ) {
    notes.push("You correctly explained components and reusable UI, but you didn't mention the virtual DOM.");
  }
  return { score, notes: notes.join(" ") };
}

function getOverallReport() {
  const totals = appState.answers.reduce(
    (acc, item) => {
      acc.technical += item.score.technical;
      acc.completeness += item.score.completeness;
      acc.communication += item.score.communication;
      if (item.score.technical >= 7 && item.score.completeness >= 7) {
        acc.correct += 1;
        acc.skillStats[item.skill] = (acc.skillStats[item.skill] || 0) + 1;
      } else {
        acc.needsImprovement += 1;
        acc.improvementStats[item.skill] = (acc.improvementStats[item.skill] || 0) + 1;
      }
      return acc;
    },
    {
      technical: 0,
      completeness: 0,
      communication: 0,
      correct: 0,
      needsImprovement: 0,
      skillStats: {},
      improvementStats: {},
    }
  );

  const count = appState.answers.length || 1;
  const technical = (totals.technical / count).toFixed(1);
  const communication = (totals.communication / count).toFixed(1);
  const confidence = ((totals.communication + totals.completeness) / (2 * count)).toFixed(1);
  const strongAreas = Object.entries(totals.skillStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => `✓ ${skill}`)
    .join("\n");
  const needsWork = Object.entries(totals.improvementStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([skill]) => `✗ ${skill}`)
    .join("\n");

  return `━━━━━━━━━━━━━━━━━━━━━━
     INTERVIEW REPORT
━━━━━━━━━━━━━━━━━━━━━━

Technical       ${technical}/10
Communication   ${communication}/10
Confidence      ${confidence}/10

Strong Areas
${strongAreas || "✓ Consistency"}

Needs Improvement
${needsWork || "✗ Continue practicing"}

Questions: ${appState.answers.length}
Correct: ${totals.correct}
Needs improvement: ${totals.needsImprovement}
━━━━━━━━━━━━━━━━━━━━━━`;
}

function startInterview() {
  const selectedTrack = document.querySelector('input[name="track"]:checked');
  if (!selectedTrack) {
    return;
  }
  appState.track = selectedTrack.value;
  appState.name = refs.candidateName.value.trim() || "Candidate";
  appState.currentQuestionIndex = 0;
  appState.answers = [];
  refs.stepSelect.classList.add("hidden");
  refs.stepReport.classList.add("hidden");
  refs.stepInterview.classList.remove("hidden");
  showQuestion();
}

function convertTranscript() {
  const text = refs.voiceInput.value.trim();
  appState.transcript = text;
  refs.transcript.textContent = text ? `Sarvam STT Transcript: ${text}` : "No voice detected.";
}

function submitAnswer() {
  const transcript = appState.transcript.trim();
  if (!transcript) {
    refs.evaluation.textContent = "Please provide a voice response and convert it first.";
    return;
  }
  const question = getCurrentQuestion();
  const result = evaluateAnswer(question, transcript);
  refs.evaluation.textContent = `Technical accuracy: ${result.score.technical}/10
Completeness: ${result.score.completeness}/10
Communication: ${result.score.communication}/10

${result.notes}`;

  appState.answers.push({
    question: question.text,
    skill: question.skill,
    score: result.score,
  });

  appState.currentQuestionIndex += 1;
  const questions = getQuestionsForTrack(appState.track);
  if (appState.currentQuestionIndex >= questions.length) {
    refs.stepInterview.classList.add("hidden");
    refs.stepReport.classList.remove("hidden");
    refs.finalReport.textContent = getOverallReport();
    return;
  }

  const nextQuestion = getCurrentQuestion();
  refs.followUp.textContent = `🔊 Follow-up: ${nextQuestion.text}`;
  refs.voiceInput.value = "";
  refs.transcript.textContent = "";
  appState.transcript = "";
}

function restartInterview() {
  appState.currentQuestionIndex = 0;
  appState.answers = [];
  appState.transcript = "";
  refs.stepReport.classList.add("hidden");
  refs.stepInterview.classList.add("hidden");
  refs.stepSelect.classList.remove("hidden");
}

renderTrackOptions();
refs.startBtn.addEventListener("click", startInterview);
refs.convertBtn.addEventListener("click", convertTranscript);
refs.submitAnswerBtn.addEventListener("click", submitAnswer);
refs.restartBtn.addEventListener("click", restartInterview);
