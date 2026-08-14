import React, { useState } from "react";
import InterviewQuestion from "./InterviewQuestion.jsx";
import FinalReport from "./FinalReport.jsx";
import { INTERVIEW_TYPES } from "../data/questions.js";
import { speechToText, evaluateAnswer, generateInterviewQuestion, generateInterviewReport } from "../services/api.js";

const TOTAL_QUESTIONS = 5;

export default function InterviewMode({ onNavigateToPractice }) {
  const [phase, setPhase] = useState("select-type"); // select-type | loading-question | answering | transcribing | evaluating | result | loading-report | report
  const [interviewType, setInterviewType] = useState(null);
  const [questionNumber, setQuestionNumber] = useState(1);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [error, setError] = useState("");
  const [resetSignal, setResetSignal] = useState(0);
  const [report, setReport] = useState(null);

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState([]);
  const [evaluations, setEvaluations] = useState([]);

  async function startInterview(type) {
    setInterviewType(type);
    setQuestionNumber(1);
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setError("");
    await fetchQuestion(type, 1, [], []);
  }

  async function fetchQuestion(type, num, prevQuestions, prevAnswers) {
    setPhase("loading-question");
    setError("");
    try {
      const { question } = await generateInterviewQuestion({
        type,
        questionNumber: num,
        previousQuestions: prevQuestions,
        previousAnswers: prevAnswers,
      });
      setCurrentQuestion(question);
      setCurrentTranscript("");
      setCurrentEvaluation(null);
      setResetSignal((n) => n + 1);
      setPhase("answering");
    } catch (err) {
      setError(err.message || "Couldn't generate the next question. Please try again.");
      setPhase("answering-error");
    }
  }

  async function handleRecordingComplete(blob) {
    setError("");
    try {
      setPhase("transcribing");
      const { transcript } = await speechToText(blob);
      setCurrentTranscript(transcript);

      setPhase("evaluating");
      const evaluation = await evaluateAnswer(currentQuestion, transcript, "interview");
      setCurrentEvaluation(evaluation);

      setQuestions((q) => [...q, currentQuestion]);
      setAnswers((a) => [...a, transcript]);
      setEvaluations((e) => [...e, evaluation]);

      setPhase("result");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setPhase("answering");
    }
  }

  async function handleNext() {
    if (questionNumber < TOTAL_QUESTIONS) {
      const nextNum = questionNumber + 1;
      setQuestionNumber(nextNum);
      await fetchQuestion(interviewType, nextNum, questions.concat(currentQuestion), answers.concat(currentTranscript));
    } else {
      await buildReport();
    }
  }

  async function buildReport() {
    setPhase("loading-report");
    setError("");
    try {
      const result = await generateInterviewReport({
        interviewType,
        questions,
        answers,
        evaluations,
      });
      setReport(result);
      setPhase("report");
    } catch (err) {
      setError(err.message || "Couldn't generate your final report. Please try again.");
      setPhase("result");
    }
  }

  function resetInterview() {
    setPhase("select-type");
    setInterviewType(null);
    setQuestionNumber(1);
    setQuestions([]);
    setAnswers([]);
    setEvaluations([]);
    setCurrentQuestion("");
    setCurrentTranscript("");
    setCurrentEvaluation(null);
    setReport(null);
    setError("");
  }

  if (phase === "select-type") {
    return (
      <section className="interview-mode">
        <div className="section-header">
          <p className="eyebrow">AI Mock Interview</p>
          <h1 className="section-title">Choose your interview type</h1>
        </div>

        <div className="interview-type-grid">
          {INTERVIEW_TYPES.map((t) => (
            <button className="mode-card mode-card--compact" key={t.id} onClick={() => startInterview(t.id)}>
              <div className="mode-card__icon">{t.icon}</div>
              <h2 className="mode-card__title">{t.label}</h2>
              <p className="mode-card__desc">{t.description}</p>
              <span className="mode-card__cta">Start interview →</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  if (phase === "report" && report) {
    return (
      <FinalReport
        report={report}
        interviewType={interviewType}
        questions={questions}
        answers={answers}
        evaluations={evaluations}
        onPracticeAgain={onNavigateToPractice}
        onNewInterview={resetInterview}
      />
    );
  }

  return (
    <section className="interview-mode">
      <div className="section-header">
        <p className="eyebrow">{interviewType} Interview</p>
        <h1 className="section-title">Mock Interview in Progress</h1>
      </div>

      <ProgressBar current={questionNumber} total={TOTAL_QUESTIONS} phase={phase} />

      {phase === "loading-question" && (
        <div className="card loading-card">
          <span className="loading-dot" /> ✨ Generating question...
        </div>
      )}

      {phase === "loading-report" && (
        <div className="card loading-card">
          <span className="loading-dot" /> 📊 Creating your report...
        </div>
      )}

      {error && phase !== "loading-question" && phase !== "loading-report" && (
        <div className="alert alert--error">
          <span>⚠ {error}</span>
        </div>
      )}

      {phase === "answering-error" && !currentQuestion && (
        <div className="action-row">
          <button
            className="btn btn--primary"
            onClick={() => fetchQuestion(interviewType, questionNumber, questions, answers)}
          >
            Retry
          </button>
        </div>
      )}

      {["answering", "answering-error", "transcribing", "evaluating", "result"].includes(phase) && currentQuestion && (
        <InterviewQuestion
          questionNumber={questionNumber}
          totalQuestions={TOTAL_QUESTIONS}
          question={currentQuestion}
          stage={phase === "answering-error" ? "answering" : phase}
          transcript={currentTranscript}
          evaluation={currentEvaluation}
          error={null}
          onRecordingComplete={handleRecordingComplete}
          onNext={handleNext}
          resetSignal={resetSignal}
        />
      )}
    </section>
  );
}

function ProgressBar({ current, total, phase }) {
  const dots = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div className="progress-track" role="progressbar" aria-valuenow={current} aria-valuemin={1} aria-valuemax={total}>
      {dots.map((n, i) => (
        <React.Fragment key={n}>
          <span
            className={`progress-dot ${
              n < current || (n === current && phase === "result") ? "progress-dot--done" : n === current ? "progress-dot--active" : ""
            }`}
          />
          {i < dots.length - 1 && (
            <span className={`progress-line ${n < current ? "progress-line--done" : ""}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
