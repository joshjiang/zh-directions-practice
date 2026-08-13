import { useMemo } from 'react';
import './Results.css';
import { useLanguage } from '../context/useLanguage';
import { translations } from '../data/translations';
import { sanitizeFeedback } from '../utils/sanitizeFeedback';

const scoreColor = (score) => {
  if (score >= 80) return '#4CAF50';
  if (score >= 60) return '#FFC107';
  return '#f44336';
};

const Score = ({ value, labelEn, label, htmlLang }) => (
  <div className="score-item">
    <div className="score-circle" style={{ background: scoreColor(value) }}>
      {value}%
    </div>
    <div className="score-label">
      {labelEn}<br /><span lang={htmlLang}>{label}</span>
    </div>
  </div>
);

const Results = ({
  pathScore,
  languageScore,
  feedback,
  translation,
  pathExplanation,
  nativeExample,
  onNextRound,
}) => {
  const { language } = useLanguage();
  const t = translations[language];
  const htmlLang = language === 'korean' ? 'ko' : 'zh';

  // Model-generated HTML that quotes the student's raw input - always sanitize.
  const safeFeedback = useMemo(() => sanitizeFeedback(feedback), [feedback]);

  const hasScores = pathScore !== null || languageScore !== null;

  // Nothing graded yet. A graded round with scores but no feedback still
  // renders, so the user is never stranded without a "next round" button.
  if (!hasScores && !safeFeedback) return null;

  return (
    <div className="results-container">
      {hasScores && (
        <div className="score-section">
          <h2><span lang={htmlLang}>{t.scores}</span> ({t.scoresEn})</h2>
          <div className="score-display">
            {pathScore !== null && (
              <Score value={pathScore} labelEn={t.pathAccuracyEn} label={t.pathAccuracy} htmlLang={htmlLang} />
            )}
            {languageScore !== null && (
              <Score value={languageScore} labelEn={t.languageQualityEn} label={t.languageQuality} htmlLang={htmlLang} />
            )}
          </div>
          {pathExplanation && (
            <p className="score-explanation">
              <strong>{t.whyThisScoreEn}:</strong> {pathExplanation}
            </p>
          )}
        </div>
      )}

      {translation && (
        <div className="translation-section">
          <h3><span lang={htmlLang}>{t.yourTranslation}</span> ({t.yourTranslationEn})</h3>
          <p className="translation-text">{translation}</p>
        </div>
      )}

      {safeFeedback && (
        <div className="feedback-section">
          {hasScores && <h3><span lang={htmlLang}>{t.feedback}</span> ({t.feedbackEn})</h3>}
          <div
            className="feedback-content"
            lang={htmlLang}
            dangerouslySetInnerHTML={{ __html: safeFeedback }}
          />
        </div>
      )}

      {nativeExample && (
        <div className="native-example-section">
          <h3>{t.nativeExampleEn}<br /><span lang={htmlLang}>{t.nativeExample}</span></h3>
          <p className="native-example-text" lang={htmlLang}>{nativeExample}</p>
        </div>
      )}

      <button onClick={onNextRound} className="next-button">
        <span lang={htmlLang}>{t.nextRound}</span> ({t.nextRoundEn})
      </button>
    </div>
  );
};

export default Results;
