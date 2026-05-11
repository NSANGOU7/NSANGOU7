import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const STORAGE_KEY = 'autoparts_lang';
const DEFAULT_LANG = 'fr';

export const SUPPORTED_LANGS = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'es', label: 'Español', flag: '🇪🇸' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦' },
];

const LanguageContext = createContext(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider');
  return ctx;
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLangState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && translations[saved]) return saved;
    } catch (e) { /* ignore */ }
    return DEFAULT_LANG;
  });

  const setLang = (newLang) => {
    if (translations[newLang]) {
      setLangState(newLang);
      try { localStorage.setItem(STORAGE_KEY, newLang); } catch (e) { /* ignore */ }
    }
  };

  // Apply RTL direction for Arabic
  useEffect(() => {
    const isRTL = lang === 'ar';
    document.documentElement.lang = lang;
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
  }, [lang]);

  // Translate function — fallback to FR then to the key itself
  const t = (key) => {
    const table = translations[lang] || translations[DEFAULT_LANG];
    if (table && table[key] != null) return table[key];
    const fallback = translations[DEFAULT_LANG];
    if (fallback && fallback[key] != null) return fallback[key];
    return key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isRTL: lang === 'ar' }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageContext;
