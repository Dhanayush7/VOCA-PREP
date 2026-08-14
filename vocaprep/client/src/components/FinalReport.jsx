import React, { useState } from "react";
import { scoreColorClass } from "./ScoreCard.jsx";

function StatBlock({ label, value }) {
  return (
    <div className={`stat-block ${scoreColorClass(value)}`}>
      <span className="stat-block__value">{value}</span>
      <span className="stat-block__label">{label}</span>
    </div>
  );
}

function QuestionRow({ index, question, answer, evaluation }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="qperf-row">
      <button className="qperf-row__header" onClick={() => setOpen((v) => !v)}>
        <span className="qperf-row__q">Q{index + 1}</span>
        <span className="qperf-row__question">{question}</span>
        <span className={`qperf-row__score ${scoreColorClass(evaluation.overallScore)}`}>
          {evaluation.overallScore}
        </span>
        <span className="qperf-row__chevron">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="qperf-row__body">
          <p className="qperf-row__answer">
            <strong>Your answer:</strong> &ldquo;{answer}&rdquo;
          </p>
          <div className="qperf-row__grid">
            <span>Fluency: <b>{evaluation.fluency}</b></span>
            <span>Grammar: <b>{evaluation.grammar}</b></span>
            <span>Clarity: <b>{evaluation.clarity}</b></span>
            <span>Answer Quality: <b>{evaluation.answerQuality}</b></span>
            <span>Filler Words: <b>{evaluation.fillerWordCount}</b></span>
          </div>
          <p className="qperf-row__feedback">{evaluation.feedback}</p>
        </div>
      )}
    </div>
  );
}

export default function FinalReport({
  report,
  interviewType,
  questions,
  answers,
  evaluations,
  onPracticeAgain,
  onNewInterview,
}) {
  const {
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
  } = report;

  return (
    <section className="final-report">
      <div className="section-header">
        <p className="eyebrow">{interviewType} Interview</p>
        <h1 className="section-title">Interview Complete 🎉</h1>
      </div>

      <div className="card score-card">
        <div className="score-card__headline">
          <h3 className="card__eyebrow">Overall Score</h3>
          <div className={`score-card__big ${scoreColorClass(overallScore)}`}>
            <span className="score-card__big-num">{overallScore}</span>
            <span className="score-card__big-max">/ 100</span>
          </div>
        </div>

        <div className="stat-block-grid">
          <StatBlock label="Avg. Fluency" value={averageFluency} />
          <StatBlock label="Avg. Grammar" value={averageGrammar} />
          <StatBlock label="Avg. Clarity" value={averageClarity} />
          <StatBlock label="Avg. Answer Quality" value={averageAnswerQuality} />
        </div>

        <div className="report-meta-row">
          <div className="report-meta-chip">
            <span className="report-meta-chip__label">Total Filler Words</span>
            <span className="report-meta-chip__value">{totalFillerWords}</span>
          </div>
          <div className="report-meta-chip report-meta-chip--good">
            <span className="report-meta-chip__label">Strongest Area</span>
            <span className="report-meta-chip__value">{strongestArea}</span>
          </div>
          <div className="report-meta-chip report-meta-chip--warn">
            <span className="report-meta-chip__label">Needs Improvement</span>
            <span className="report-meta-chip__value">{weakestArea}</span>
          </div>
        </div>
      </div>

      <div className="card feedback-card">
        <h3 className="card__eyebrow">AI Summary</h3>
        <p className="feedback-card__text">{overallFeedback}</p>

        {improvements && improvements.length > 0 && (
          <div className="feedback-block">
            <h4 className="feedback-block__title">Top Improvements</h4>
            <ol className="feedback-list feedback-list--numbered">
              {improvements.map((imp, i) => (
                <li key={i}>{imp}</li>
              ))}
            </ol>
          </div>
        )}
      </div>

      <div className="card qperf-card">
        <h3 className="card__eyebrow">Question Performance</h3>
        <div className="qperf-list">
          {questions.map((q, i) => (
            <QuestionRow key={i} index={i} question={q} answer={answers[i]} evaluation={evaluations[i]} />
          ))}
        </div>
      </div>

      <div className="action-row">
        <button className="btn btn--secondary" onClick={onPracticeAgain}>
          Practice Again
        </button>
        <button className="btn btn--primary" onClick={onNewInterview}>
          New Interview
        </button>
      </div>
    </section>
  );
}