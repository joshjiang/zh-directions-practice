import { useCallback, useEffect, useMemo, useState } from 'react';
import { LanguageContext, LANGUAGES } from './useLanguage';

const STORAGE_KEY = 'directions-practice:language';

const readStoredLanguage = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return LANGUAGES.includes(stored) ? stored : 'chinese';
  } catch {
    // Private browsing / disabled storage - fall back to the default.
    return 'chinese';
  }
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(readStoredLanguage);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Persistence is a nicety; ignore storage failures.
    }
  }, [language]);

  const toggleLanguage = useCallback(() => {
    setLanguage((prev) => (prev === 'chinese' ? 'korean' : 'chinese'));
  }, []);

  const value = useMemo(
    () => ({ language, setLanguage, toggleLanguage }),
    [language, toggleLanguage]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};
