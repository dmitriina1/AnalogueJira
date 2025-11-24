import React, { createContext, useState, useContext, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('ru');
  const [translations, setTranslations] = useState({});

  // Загружаем сохраненный язык при инициализации
  useEffect(() => {
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }
  }, []);

  // Загружаем переводы при изменении языка
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        if (language === 'ru') {
          const ruTranslations = await import('../locales/ru.json');
          setTranslations(ruTranslations.default);
        } else if (language === 'en') {
          const enTranslations = await import('../locales/en.json');
          setTranslations(enTranslations.default);
        }
      } catch (error) {
        console.error('Error loading translations:', error);
        // Fallback to empty object
        setTranslations({});
      }
    };

    loadTranslations();
  }, [language]);

  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    localStorage.setItem('language', newLanguage);
  };

  const t = (key) => {
    const keys = key.split('.');
    let value = translations;
    
    for (const k of keys) {
      if (value && typeof value === 'object') {
        value = value[k];
      } else {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
    }
    
    return value || key;
  };

  const value = {
    language,
    changeLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};