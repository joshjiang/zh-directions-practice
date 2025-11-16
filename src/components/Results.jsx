import React from 'react';
import './Results.css';

const Results = ({ score, feedback, onNextRound }) => {
  if (!feedback) return null;

  return (
    <div className="results-container">
      {score !== null && (
        <div className="score-section">
          <h2>评分 (Score)</h2>
          <div className="score-display">
            <div className="score-circle" style={{
              background: score >= 80 ? '#4CAF50' : score >= 60 ? '#FFC107' : '#f44336'
            }}>
              {score}%
            </div>
          </div>
        </div>
      )}

      <div className="feedback-section">
        {score !== null && <h3>反馈 (Feedback)</h3>}
        <div className="feedback-content" dangerouslySetInnerHTML={{ __html: feedback }} />
      </div>

      <button onClick={onNextRound} className="next-button">
        下一题 (Next Round)
      </button>
    </div>
  );
};

export default Results;
