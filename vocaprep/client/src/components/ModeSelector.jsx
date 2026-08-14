import React from "react";

export default function ModeSelector({ onSelect }) {
  return (
    <section className="dashboard">
      <div className="dashboard__hero">
        <p className="eyebrow">VOCA PREP</p>
        <h1 className="dashboard__title">
          AI Communication <span className="text-accent">Coach</span>
        </h1>
        <p className="dashboard__subtitle">
          Practice speaking. Improve communication. Ace your interviews.
        </p>
      </div>

      <div className="mode-grid">
        <button className="mode-card" onClick={() => onSelect("practice")}>
          <div className="mode-card__icon">🎙</div>
          <h2 className="mode-card__title">Speaking Practice</h2>
          <p className="mode-card__desc">
            Practice individual communication questions and get instant AI feedback on
            fluency, clarity, and filler words.
          </p>
          <span className="mode-card__cta">Start practicing →</span>
        </button>

        <button className="mode-card" onClick={() => onSelect("interview")}>
          <div className="mode-card__icon">💼</div>
          <h2 className="mode-card__title">Mock Interview</h2>
          <p className="mode-card__desc">
            Take a complete AI-powered mock interview — HR, Technical, or General — and get a
            full performance report.
          </p>
          <span className="mode-card__cta">Start interview →</span>
        </button>
      </div>

      <div className="dashboard__stats">
        <div className="stat-pill">
          <span className="stat-pill__value">10+</span>
          <span className="stat-pill__label">Practice questions</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill__value">3</span>
          <span className="stat-pill__label">Interview tracks</span>
        </div>
        <div className="stat-pill">
          <span className="stat-pill__value">5</span>
          <span className="stat-pill__label">Questions per interview</span>
        </div>
      </div>
    </section>
  );
}
