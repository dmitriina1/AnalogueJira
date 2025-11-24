import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import { Sun, Moon, Monitor } from 'lucide-react';

const Settings = () => {
  const { language, changeLanguage } = useLanguage();
  const { theme, changeTheme, toggleTheme } = useTheme();
  const t = useTranslation();

  const languages = [
    { code: 'ru', name: 'Русский', nativeName: 'Русский' },
    { code: 'en', name: 'English', nativeName: 'English' }
  ];

  const themes = [
    { 
      id: 'light', 
      name: t('settings.themes.light'), 
      icon: Sun, 
      description: t('settings.themes.lightDescription') 
    },
    { 
      id: 'dark', 
      name: t('settings.themes.dark'), 
      icon: Moon, 
      description: t('settings.themes.darkDescription') 
    },
    { 
      id: 'auto', 
      name: t('settings.themes.auto'), 
      icon: Monitor, 
      description: t('settings.themes.autoDescription') 
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* Theme Settings */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
          {t('settings.appearance')}
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {themes.map((themeOption) => {
            const Icon = themeOption.icon;
            const isActive = theme === themeOption.id;
            
            return (
              <button
                key={themeOption.id}
                onClick={() => changeTheme(themeOption.id)}
                className={`p-4 border-2 rounded-lg text-left transition-all duration-200 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div className={`p-2 rounded-lg ${
                    isActive 
                      ? 'bg-blue-100 dark:bg-blue-800' 
                      : 'bg-gray-100 dark:bg-gray-600'
                  }`}>
                    <Icon size={20} className={
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-gray-600 dark:text-gray-400'
                    } />
                  </div>
                  <span className={`font-medium ${
                    isActive 
                      ? 'text-blue-900 dark:text-blue-100' 
                      : 'text-gray-900 dark:text-white'
                  }`}>
                    {themeOption.name}
                  </span>
                </div>
                <p className={`text-sm ${
                  isActive 
                    ? 'text-blue-700 dark:text-blue-300' 
                    : 'text-gray-600 dark:text-gray-400'
                }`}>
                  {themeOption.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Quick Toggle */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">
                {t('settings.quickToggle')}
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('settings.quickToggleDescription')}
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 ${
                theme === 'dark' ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={theme === 'dark'}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  theme === 'dark' ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Language Settings */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.language')}</h2>
        <div className="space-y-3">
          {languages.map((lang) => (
            <div key={lang.code} className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{lang.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{lang.nativeName}</p>
              </div>
              <button
                onClick={() => changeLanguage(lang.code)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  language === lang.code
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
                }`}
              >
                {language === lang.code ? t('common.selected') : t('common.select')}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Notification Settings */}
      <div className="card dark:bg-gray-800 dark:border-gray-700">
        <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">{t('settings.notifications')}</h2>
        <p className="text-gray-600 dark:text-gray-400">{t('settings.notificationsDescription')}</p>
        {/* Здесь можно добавить настройки уведомлений позже */}
      </div>
    </div>
  );
};

export default Settings;