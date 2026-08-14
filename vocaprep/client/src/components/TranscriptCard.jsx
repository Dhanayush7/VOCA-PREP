import React from "react";

export default function TranscriptCard({ transcript, loading }) {
  if (!loading && !transcript) return null;

  return (
    <div className="card transcript-card">
      <h3 className="card__eyebrow">Your Transcript</h3>
      {loading ? (
        <div className="loading-row">
          <span className="loading-dot" />
          <span>🤖 Converting speech to text...</span>
        </div>
      ) : (
        <p className="transcript-card__text">&ldquo;{transcript}&rdquo;</p>
      )}
    </div>
  );
}