import { useId, useState } from 'react';
import './DirectionsForm.css';
import { useLanguage } from '../context/useLanguage';
import { translations } from '../data/translations';

const DirectionsForm = ({ onSubmit, isLoading }) => {
  const { language } = useLanguage();
  const t = translations[language];
  const [directions, setDirections] = useState('');
  const inputId = useId();
  const htmlLang = language === 'korean' ? 'ko' : 'zh';

  const canSubmit = Boolean(directions.trim()) && !isLoading;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (canSubmit) {
      onSubmit(directions.trim());
    }
  };

  // Enter inserts a newline in a textarea, so offer the usual submit shortcut.
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="directions-form-container">
      <h2>
        <label htmlFor={inputId}>
          <span lang={htmlLang}>{t.giveDirections}</span> ({t.giveDirectionsEn})
        </label>
      </h2>
      <form onSubmit={handleSubmit}>
        <textarea
          id={inputId}
          lang={htmlLang}
          value={directions}
          onChange={(e) => setDirections(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t.placeholder}
          rows="6"
          maxLength={2000}
          disabled={isLoading}
          className="directions-input"
        />
        <div className="button-group">
          <button type="submit" disabled={!canSubmit} className="submit-button">
            {isLoading ? t.submitting : t.submit}
          </button>
          <button
            type="button"
            onClick={() => setDirections('')}
            disabled={isLoading || !directions}
            className="clear-button"
          >
            {t.clear}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DirectionsForm;
