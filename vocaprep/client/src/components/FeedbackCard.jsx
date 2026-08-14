import React, { useState } from "react";

export default function FeedbackCard({ evaluation }) {
  const [copied, setCopied] = useState(false);

  if (!evaluation) return null;

  const { feedback, strengths, improvements, improvedAnswer } = evaluation;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(improvedAnswer || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {
      // Clipboard API may be unavailable - fail silently.
    }
  }

  return (
    <div className="card feedback-card">
      <h3 className="card__eyebrow">💡 AI Feedback</h3>
      <p className="feedback-card__text">{feedback}</p>

      {strengths && strengths.length > 0 && (
        <div className="feedback-block">
          <h4 className="feedback-block__title">Your Strengths</h4>
          <ul className="feedback-list feedback-list--positive">
            {strengths.map((s, i) => (
              <li key={i}>✓ {s}</li>
            ))}
          </ul>
        </div>
      )}

      {improvements && improvements.length > 0 && (
        <div className="feedback-block">
          <h4 className="feedback-block__title">Areas to Improve</h4>
          <ul className="feedback-list feedback-list--neutral">
            {improvements.map((s, i) => (
              <li key={i}>• {s}</li>
            ))}
          </ul>
        </div>
      )}

      {improvedAnswer && (
        <div className="better-answer">
          <div className="better-answer__header">
            <h4 className="feedback-block__title">✨ Better Answer</h4>
            <button className="btn btn--small" onClick={handleCopy}>
              {copied ? "✓ Copied!" : "Copy Answer"}
            </button>
          </div>
          <p className="better-answer__text">{improvedAnswer}</p>
        </div>
      )}
    </div>
  );
}