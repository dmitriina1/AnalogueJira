// import React, { createContext, useState, useContext, useEffect } from 'react';

// const ThemeContext = createContext();

// export const useTheme = () => {
//   const context = useContext(ThemeContext);
//   if (!context) {
//     throw new Error('useTheme must be used within a ThemeProvider');
//   }
//   return context;
// };

// export const ThemeProvider = ({ children }) => {
//   const [theme, setTheme] = useState('light');
//   const [isLoaded, setIsLoaded] = useState(false);

//   // Загрузка темы только один раз при старте
//   useEffect(() => {
//     try {
//       const savedTheme = localStorage.getItem('theme');
//       if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
//         setTheme(savedTheme);
//         console.log('Loaded theme from storage:', savedTheme);
//       } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
//         setTheme('dark');
//         console.log('Loaded theme from system: dark');
//       } else {
//         console.log('Using default theme: light');
//       }
//     } catch (error) {
//       console.warn('Could not load theme from storage:', error);
//     } finally {
//       setIsLoaded(true);
//     }
//   }, []);

//   // Применение темы только после загрузки
//   useEffect(() => {
//     if (!isLoaded) return;

//     console.log('Applying theme:', theme);
    
//     const root = window.document.documentElement;
//     root.classList.remove('light', 'dark');
//     root.classList.add(theme);
    
//     document.body.classList.remove('light', 'dark');
//     document.body.classList.add(theme);
    
//     try {
//       localStorage.setItem('theme', theme);
//       console.log('Saved theme to storage:', theme);
//     } catch (error) {
//       console.warn('Could not save theme to storage:', error);
//     }
//   }, [theme, isLoaded]);

//   const toggleTheme = () => {
//     setTheme(prev => prev === 'light' ? 'dark' : 'light');
//   };

//   const changeTheme = (newTheme) => {
//     if (newTheme === 'light' || newTheme === 'dark') {
//       setTheme(newTheme);
//     }
//   };

//   const value = {
//     theme,
//     toggleTheme,
//     changeTheme,
//     isDark: theme === 'dark',
//     isLoaded
//   };

//   return (
//     <ThemeContext.Provider value={value}>
//       {children}
//     </ThemeContext.Provider>
//   );
// };

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
  const [theme, setTheme] = useState('auto');
  const [resolvedTheme, setResolvedTheme] = useState('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Функция для определения системной темы
  const getSystemTheme = () => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  };

  // Функция для применения темы
  const applyTheme = (themeToApply) => {
    const root = window.document.documentElement;
    const body = document.body;
    
    // Удаляем все классы тем
    root.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // Применяем нужную тему
    if (themeToApply === 'auto') {
      const systemTheme = getSystemTheme();
      root.classList.add(systemTheme);
      body.classList.add(systemTheme);
      setResolvedTheme(systemTheme);
    } else {
      root.classList.add(themeToApply);
      body.classList.add(themeToApply);
      setResolvedTheme(themeToApply);
    }
  };

  // Загрузка темы при старте
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark' || savedTheme === 'auto')) {
        setTheme(savedTheme);
        console.log('Loaded theme from storage:', savedTheme);
      } else {
        console.log('Using default theme: auto');
      }
    } catch (error) {
      console.warn('Could not load theme from storage:', error);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Применение темы при изменении
  useEffect(() => {
    if (!isLoaded) return;

    console.log('Applying theme:', theme);
    applyTheme(theme);
    
    try {
      localStorage.setItem('theme', theme);
      console.log('Saved theme to storage:', theme);
    } catch (error) {
      console.warn('Could not save theme to storage:', error);
    }
  }, [theme, isLoaded]);

  // Слушатель изменения системной темы (только для auto режима)
  useEffect(() => {
    if (theme !== 'auto') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e) => {
      console.log('System theme changed to:', e.matches ? 'dark' : 'light');
      applyTheme('auto');
    };

    // Современный способ
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      // Для старых браузеров
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [theme]);

  const toggleTheme = () => {
    if (theme === 'auto') {
      // Если был auto, переключаем на противоположную системной теме
      const systemTheme = getSystemTheme();
      setTheme(systemTheme === 'dark' ? 'light' : 'dark');
    } else {
      // Если была конкретная тема, переключаем на противоположную
      setTheme(theme === 'dark' ? 'light' : 'dark');
    }
  };

  const changeTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark' || newTheme === 'auto') {
      setTheme(newTheme);
    }
  };

  const value = {
    theme,
    resolvedTheme,
    toggleTheme,
    changeTheme,
    isDark: resolvedTheme === 'dark',
    isLoaded
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};