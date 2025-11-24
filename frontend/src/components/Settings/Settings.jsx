import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';

const Settings = () => {
  const { language, changeLanguage } = useLanguage();
  const t = useTranslation();

  const languages = [
    { code: 'ru', name: 'Русский', nativeName: 'Русский' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
        <p className="text-gray-600 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Language Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('settings.language')}</h2>
        <div className="space-y-3">
          {languages.map((lang) => (
            <div key={lang.code} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{lang.name}</p>
                <p className="text-sm text-gray-500">{lang.nativeName}</p>
              </div>
              <button
                onClick={() => changeLanguage(lang.code)}
                className={`px-4 py-2 rounded-lg border ${
                  language === lang.code
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                } transition-colors`}
              >
                {language === lang.code ? t('common.selected') : t('common.select')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Appearance Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('settings.appearance')}</h2>
        <p className="text-gray-600">{t('settings.appearanceDescription')}</p>
        {/* Здесь можно добавить переключатель темы позже */}
      </div>

      {/* Notification Settings */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">{t('settings.notifications')}</h2>
        <p className="text-gray-600">{t('settings.notificationsDescription')}</p>
        {/* Здесь можно добавить настройки уведомлений позже */}
      </div>
    </div>
  );
};

export default Settings;