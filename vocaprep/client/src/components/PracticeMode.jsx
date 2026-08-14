import React, { useState } from "react";
import Recorder from "./Recorder.jsx";
import TranscriptCard from "./TranscriptCard.jsx";
import ScoreCard from "./ScoreCard.jsx";
import FeedbackCard from "./FeedbackCard.jsx";
import { PRACTICE_QUESTIONS } from "../data/questions.js";
import { speechToText, evaluateAnswer } from "../services/api.js";

export default function PracticeMode() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);

  const [stage, setStage] = useState("idle"); // idle | transcribing | evaluating | done
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [error, setError] = useState("");

  const question = PRACTICE_QUESTIONS[questionIndex];

  function selectQuestion(idx) {
    setQuestionIndex(idx);
    setPickerOpen(false);
    setStage("idle");
    setTranscript("");
    setEvaluation(null);
    setError("");
    setResetSignal((n) => n + 1);
  }

  async function handleRecordingComplete(blob) {
    setError("");
    setEvaluation(null);
    setTranscript("");

    try {
      setStage("transcribing");
      const { transcript: text } = await speechToText(blob);
      setTranscript(text);

      setStage("evaluating");
      const result = await evaluateAnswer(question, text, "practice");
      setEvaluation(result);
      setStage("done");
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
      setStage("idle");
    }
  }

  function tryAgain() {
    setStage("idle");
    setTranscript("");
    setEvaluation(null);
    setError("");
    setResetSignal((n) => n + 1);
  }

  const isBusy = stage === "transcribing" || stage === "evaluating";

  return (
    <section className="practice-mode">
      <div className="section-header">
        <p className="eyebrow">AI Speaking Practice</p>
        <h1 className="section-title">Practice one question at a time</h1>
      </div>

      <div className="card question-card">
        <div className="question-card__row">
          <div>
            <h3 className="card__eyebrow">Question</h3>
            <p className="question-card__text">&ldquo;{question}&rdquo;</p>
            <p className="question-card__hint">Speak naturally and answer in 30–60 seconds.</p>
          </div>
          <div className="question-card__picker">
            <button className="btn btn--secondary" onClick={() => setPickerOpen((v) => !v)}>
              Change Question
            </button>
            {pickerOpen && (
              <div className="picker-dropdown">
                {PRACTICE_QUESTIONS.map((q, i) => (
                  <button
                    key={q}
                    className={`picker-dropdown__item ${i === questionIndex ? "picker-dropdown__item--active" : ""}`}
                    onClick={() => selectQuestion(i)}
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card recorder-card">
        <Recorder
          onRecordingComplete={handleRecordingComplete}
          disabled={isBusy}
          resetSignal={resetSignal}
        />
      </div>

      {error && (
        <div className="alert alert--error">
          <span>⚠ {error}</span>
        </div>
      )}

      {stage === "transcribing" && (
        <div className="card loading-card">
          <span className="loading-dot" /> 🤖 Converting speech to text...
        </div>
      )}

      {(transcript || stage === "transcribing") && stage !== "idle" && (
        <TranscriptCard transcript={transcript} loading={false} />
      )}

      {stage === "evaluating" && (
        <div className="card loading-card">
          <span className="loading-dot" /> 🧠 Evaluating your answer...
        </div>
      )}

      {stage === "done" && evaluation && (
        <>
          <ScoreCard evaluation={evaluation} />
          <FeedbackCard evaluation={evaluation} />
          <div className="action-row">
            <button className="btn btn--primary" onClick={tryAgain}>
              Practice This Question Again
            </button>
          </div>
        </>
      )}
    </section>
  );
}