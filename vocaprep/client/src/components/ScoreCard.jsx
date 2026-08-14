import React from "react";

export function scoreColorClass(score) {
  if (score >= 80) return "score--green";
  if (score >= 60) return "score--yellow";
  return "score--red";
}

function SubScore({ label, value }) {
  return (
    <div className={`subscore ${scoreColorClass(value)}`}>
      <span className="subscore__label">{label}</span>
      <span className="subscore__value">{value}</span>
      <div className="subscore__bar">
        <div className="subscore__bar-fill" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export default function ScoreCard({ evaluation }) {
  if (!evaluation) return null;

  const { overallScore, fluency, grammar, clarity, answerQuality, fillerWordCount, fillerWords } = evaluation;

  const tally = {};
  (fillerWords || []).forEach((w) => {
    const key = w.toLowerCase();
    tally[key] = (tally[key] || 0) + 1;
  });
  const tallyEntries = Object.entries(tally);

  return (
    <div className="card score-card">
      <div className="score-card__headline">
        <h3 className="card__eyebrow">Your Score</h3>
        <div className={`score-card__big ${scoreColorClass(overallScore)}`}>
          <span className="score-card__big-num">{overallScore}</span>
          <span className="score-card__big-max">/ 100</span>
        </div>
      </div>

      <div className="subscore-grid">
        <SubScore label="Fluency" value={fluency} />
        <SubScore label="Grammar" value={grammar} />
        <SubScore label="Clarity" value={clarity} />
        <SubScore label="Answer Quality" value={answerQuality} />
      </div>

      <div className="filler-section">
        <h4 className="filler-section__title">Filler Words</h4>
        {fillerWordCount > 0 ? (
          <>
            <p className="filler-section__count">{fillerWordCount} detected</p>
            <div className="filler-chips">
              {tallyEntries.map(([word, count]) => (
                <span className="filler-chip" key={word}>
                  &ldquo;{word}&rdquo; × {count}
                </span>
              ))}
            </div>
          </>
        ) : (
          <p className="filler-section__none">🎉 No filler words detected</p>
        )}
      </div>
    </div>
  );
}