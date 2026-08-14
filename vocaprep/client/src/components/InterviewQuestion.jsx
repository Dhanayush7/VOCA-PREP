import React from "react";
import Recorder from "./Recorder.jsx";
import TranscriptCard from "./TranscriptCard.jsx";
import ScoreCard from "./ScoreCard.jsx";
import FeedbackCard from "./FeedbackCard.jsx";

export default function InterviewQuestion({
  questionNumber,
  totalQuestions,
  question,
  stage, // "answering" | "transcribing" | "evaluating" | "result"
  transcript,
  evaluation,
  error,
  onRecordingComplete,
  onNext,
  resetSignal,
}) {
  const isBusy = stage === "transcribing" || stage === "evaluating";
  const isLast = questionNumber === totalQuestions;

  return (
    <div className="interview-question">
      <div className="card question-card">
        <h3 className="card__eyebrow">
          Question {questionNumber} of {totalQuestions}
        </h3>
        <p className="question-card__text">&ldquo;{question}&rdquo;</p>
      </div>

      {stage === "answering" && (
        <div className="card recorder-card">
          <p className="question-card__hint">Click below when you're ready, then answer out loud.</p>
          <Recorder
            onRecordingComplete={onRecordingComplete}
            disabled={isBusy}
            resetSignal={resetSignal}
          />
        </div>
      )}

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

      {(stage === "evaluating" || stage === "result") && transcript && (
        <TranscriptCard transcript={transcript} loading={false} />
      )}

      {stage === "evaluating" && (
        <div className="card loading-card">
          <span className="loading-dot" /> 🧠 Evaluating your answer...
        </div>
      )}

      {stage === "result" && evaluation && (
        <>
          <ScoreCard evaluation={evaluation} />
          <FeedbackCard evaluation={evaluation} />
          <div className="action-row">
            <button className="btn btn--primary" onClick={onNext}>
              {isLast ? "View Final Report →" : "Next Question →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}