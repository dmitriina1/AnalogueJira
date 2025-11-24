import React, { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Загрузка темы только один раз при старте
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        setTheme(savedTheme);
        console.log('Loaded theme from storage:', savedTheme);
      } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setTheme('dark');
        console.log('Loaded theme from system: dark');
      } else {
        console.log('Using default theme: light');
      }
    } catch (error) {
      console.warn('Could not load theme from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Применение темы только после загрузки
  useEffect(() => {
    if (!isLoaded) return;

    console.log('Applying theme:', theme);
    
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    
    document.body.classList.remove('light', 'dark');
    document.body.classList.add(theme);
    
    try {
      localStorage.setItem('theme', theme);
      console.log('Saved theme to storage:', theme);
    } catch (error) {
      console.warn('Could not save theme to storage:', error);
    }
  }, [theme, isLoaded]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const changeTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    toggleTheme,
    changeTheme,
    isDark: theme === 'dark',
    isLoaded
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};