import React from 'react';
import './Results.css';

const Results = ({ pathScore, languageScore, feedback, translation, nativeExample, onNextRound }) => {
  if (!feedback) return null;

  return (
    <div className="results-container">
      {(pathScore !== null || languageScore !== null) && (
        <div className="score-section">
          <h2>评分 (Scores)</h2>
          <div className="score-display">
            {pathScore !== null && (
              <div className="score-item">
                <div className="score-circle" style={{
                  background: pathScore >= 80 ? '#4CAF50' : pathScore >= 60 ? '#FFC107' : '#f44336'
                }}>
                  {pathScore}%
                </div>
                <div className="score-label">Path Accuracy<br/>路线准确性</div>
              </div>
            )}
            {languageScore !== null && (
              <div className="score-item">
                <div className="score-circle" style={{
                  background: languageScore >= 80 ? '#4CAF50' : languageScore >= 60 ? '#FFC107' : '#f44336'
                }}>
                  {languageScore}%
                </div>
                <div className="score-label">Language Quality<br/>语言质量</div>
              </div>
            )}
          </div>
        </div>
      )}

      {translation && (
        <div className="translation-section">
          <h3>你的翻译 (Your Translation)</h3>
          <p className="translation-text">{translation}</p>
        </div>
      )}

      <div className="feedback-section">
        {(pathScore !== null || languageScore !== null) && <h3>反馈 (Feedback)</h3>}
        <div className="feedback-content" dangerouslySetInnerHTML={{ __html: feedback }} />
      </div>

      {nativeExample && (
        <div className="native-example-section">
          <h3>Native Speaker Example<br/>母语者示例</h3>
          <p className="native-example-text">{nativeExample}</p>
        </div>
      )}

      <button onClick={onNextRound} className="next-button">
        下一题 (Next Round)
      </button>
    </div>
  );
};

export default Results;
