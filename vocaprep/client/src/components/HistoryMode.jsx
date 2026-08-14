import React, { useEffect, useState } from "react";
import { getPracticeHistory, getInterviewHistory, getInterviewDetail } from "../services/api.js";
import { scoreColorClass } from "./ScoreCard.jsx";

function formatDate(iso) {
  try {
    return new Date(iso + "Z").toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (_) {
    return iso;
  }
}

function PracticeHistoryList({ attempts, loading, error }) {
  if (loading) {
    return (
      <div className="card loading-card">
        <span className="loading-dot" /> Loading practice history...
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert--error">
        <span>⚠ {error}</span>
      </div>
    );
  }
  if (attempts.length === 0) {
    return (
      <div className="card">
        <p className="feedback-card__text">No practice attempts yet. Head to Speaking Practice to get started.</p>
      </div>
    );
  }

  return (
    <div className="qperf-list">
      {attempts.map((a) => (
        <div className="qperf-row" key={a.id}>
          <div className="qperf-row__header" style={{ cursor: "default" }}>
            <span className={`qperf-row__score ${scoreColorClass(a.overallScore)}`}>{a.overallScore}</span>
            <span className="qperf-row__question">{a.question}</span>
            <span className="history-date">{formatDate(a.createdAt)}</span>
          </div>
          <div className="qperf-row__body" style={{ display: "block" }}>
            <p className="qperf-row__answer">
              <strong>Your answer:</strong> &ldquo;{a.transcript}&rdquo;
            </p>
            <div className="qperf-row__grid">
              <span>Fluency: <b>{a.evaluation.fluency}</b></span>
              <span>Grammar: <b>{a.evaluation.grammar}</b></span>
              <span>Clarity: <b>{a.evaluation.clarity}</b></span>
              <span>Answer Quality: <b>{a.evaluation.answerQuality}</b></span>
              <span>Filler Words: <b>{a.fillerWordCount}</b></span>
            </div>
            <p className="qperf-row__feedback">{a.evaluation.feedback}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function InterviewDetail({ id, onBack }) {
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getInterviewDetail(id)
      .then((data) => {
        if (!cancelled) setInterview(data.interview);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load this interview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div>
      <button className="btn btn--ghost" onClick={onBack} style={{ marginBottom: 16 }}>
        ← Back to history
      </button>

      {loading && (
        <div className="card loading-card">
          <span className="loading-dot" /> Loading interview...
        </div>
      )}

      {error && (
        <div className="alert alert--error">
          <span>⚠ {error}</span>
        </div>
      )}

      {interview && (
        <>
          <div className="card score-card">
            <div className="score-card__headline">
              <h3 className="card__eyebrow">
                {interview.interviewType} Interview · {formatDate(interview.createdAt)}
              </h3>
              <div className={`score-card__big ${scoreColorClass(interview.overallScore)}`}>
                <span className="score-card__big-num">{interview.overallScore}</span>
                <span className="score-card__big-max">/ 100</span>
              </div>
            </div>
            <div className="report-meta-row">
              <div className="report-meta-chip">
                <span className="report-meta-chip__label">Total Filler Words</span>
                <span className="report-meta-chip__value">{interview.totalFillerWords}</span>
              </div>
              <div className="report-meta-chip report-meta-chip--good">
                <span className="report-meta-chip__label">Strongest Area</span>
                <span className="report-meta-chip__value">{interview.strongestArea}</span>
              </div>
              <div className="report-meta-chip report-meta-chip--warn">
                <span className="report-meta-chip__label">Needs Improvement</span>
                <span className="report-meta-chip__value">{interview.weakestArea}</span>
              </div>
            </div>
          </div>

          <div className="card feedback-card">
            <h3 className="card__eyebrow">AI Summary</h3>
            <p className="feedback-card__text">{interview.overallFeedback}</p>
          </div>

          <div className="card qperf-card">
            <h3 className="card__eyebrow">Question Performance</h3>
            <div className="qperf-list">
              {interview.questions.map((q) => (
                <div className="qperf-row" key={q.questionNumber}>
                  <div className="qperf-row__header" style={{ cursor: "default" }}>
                    <span className="qperf-row__q">Q{q.questionNumber}</span>
                    <span className="qperf-row__question">{q.question}</span>
                    <span className={`qperf-row__score ${scoreColorClass(q.evaluation.overallScore)}`}>
                      {q.evaluation.overallScore}
                    </span>
                  </div>
                  <div className="qperf-row__body" style={{ display: "block" }}>
                    <p className="qperf-row__answer">
                      <strong>Your answer:</strong> &ldquo;{q.answer}&rdquo;
                    </p>
                    <p className="qperf-row__feedback">{q.evaluation.feedback}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function InterviewHistoryList({ interviews, loading, error, onOpen }) {
  if (loading) {
    return (
      <div className="card loading-card">
        <span className="loading-dot" /> Loading interview history...
      </div>
    );
  }
  if (error) {
    return (
      <div className="alert alert--error">
        <span>⚠ {error}</span>
      </div>
    );
  }
  if (interviews.length === 0) {
    return (
      <div className="card">
        <p className="feedback-card__text">No completed interviews yet. Take a Mock Interview to build your history.</p>
      </div>
    );
  }

  return (
    <div className="qperf-list">
      {interviews.map((i) => (
        <button className="qperf-row" key={i.id} onClick={() => onOpen(i.id)} style={{ textAlign: "left", width: "100%" }}>
          <div className="qperf-row__header">
            <span className={`qperf-row__score ${scoreColorClass(i.overallScore)}`}>{i.overallScore}</span>
            <span className="qperf-row__question">{i.interviewType} Interview</span>
            <span className="history-date">{formatDate(i.createdAt)}</span>
            <span className="qperf-row__chevron">→</span>
          </div>
        </button>
      ))}
    </div>
  );
}

export default function HistoryMode() {
  const [tab, setTab] = useState("practice"); // practice | interviews
  const [practiceAttempts, setPracticeAttempts] = useState([]);
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openInterviewId, setOpenInterviewId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    Promise.all([getPracticeHistory(), getInterviewHistory()])
      .then(([practiceData, interviewData]) => {
        if (cancelled) return;
        setPracticeAttempts(practiceData.attempts || []);
        setInterviews(interviewData.interviews || []);
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || "Couldn't load history.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (openInterviewId) {
    return (
      <section className="history-mode">
        <div className="section-header">
          <p className="eyebrow">History</p>
          <h1 className="section-title">Past Interview</h1>
        </div>
        <InterviewDetail id={openInterviewId} onBack={() => setOpenInterviewId(null)} />
      </section>
    );
  }

  return (
    <section className="history-mode">
      <div className="section-header">
        <p className="eyebrow">History</p>
        <h1 className="section-title">Your Progress</h1>
      </div>

      <div className="history-tabs">
        <button className={`history-tab ${tab === "practice" ? "history-tab--active" : ""}`} onClick={() => setTab("practice")}>
          Speaking Practice
        </button>
        <button className={`history-tab ${tab === "interviews" ? "history-tab--active" : ""}`} onClick={() => setTab("interviews")}>
          Mock Interviews
        </button>
      </div>

      {tab === "practice" ? (
        <PracticeHistoryList attempts={practiceAttempts} loading={loading} error={error} />
      ) : (
        <InterviewHistoryList interviews={interviews} loading={loading} error={error} onOpen={setOpenInterviewId} />
      )}
    </section>
  );
}