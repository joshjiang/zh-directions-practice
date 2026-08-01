import { useLanguage } from '../context/useLanguage';
import './LanguageSwitcher.css';

const OPTIONS = [
  { id: 'chinese', flag: '🇨🇳', label: '中文', htmlLang: 'zh', name: 'Chinese' },
  { id: 'korean', flag: '🇰🇷', label: '한국어', htmlLang: 'ko', name: 'Korean' },
];

const LanguageSwitcher = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="language-switcher" role="group" aria-label="Practice language">
      {OPTIONS.map((option) => (
        <button
          key={option.id}
          type="button"
          className={`language-button ${language === option.id ? 'active' : ''}`}
          aria-pressed={language === option.id}
          aria-label={`Practice in ${option.name}`}
          onClick={() => setLanguage(option.id)}
        >
          <span className="language-flag" aria-hidden="true">{option.flag}</span>
          <span className="language-text" lang={option.htmlLang}>{option.label}</span>
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
