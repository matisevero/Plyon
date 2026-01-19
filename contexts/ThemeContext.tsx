
import React, { createContext, useContext, useMemo, useEffect, useState } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const designSystem = {
  spacing: {
    extraSmall: '0.25rem', // 4px
    small: '0.5rem',      // 8px
    medium: '1rem',       // 16px
    large: '1.5rem',      // 24px
    extraLarge: '2rem',   // 32px
  },
  borderRadius: {
    small: '6px',
    medium: '12px',       // Increased for a more modern, friendly look
    large: '20px',        // Increased for cards/modals
  },
  typography: {
    fontFamily: "'Inter', sans-serif",
    fontSize: {
      extraSmall: '0.75rem', // 12px
      small: '0.875rem',    // 14px
      medium: '1rem',       // 16px
      large: '1.125rem',    // 18px
      extraLarge: '1.5rem', // 24px
    }
  },
  shadows: {
    small: '0 2px 4px rgba(0, 0, 0, 0.1)',
    medium: '0 4px 12px rgba(0, 0, 0, 0.15)',
    large: '0 12px 32px rgba(0, 0, 0, 0.25)',
  }
};

const darkTheme = {
  name: 'dark',
  ...designSystem,
  colors: {
    background: '#121829', // Midnight Blue (Previous style)
    backgroundGradient: 'linear-gradient(180deg, #121829 0%, #0F1322 100%)',
    surface: '#1A2238', // Lighter Midnight
    primaryText: '#FFFFFF',
    secondaryText: '#94A3B8',
    border: '#2D3748',
    borderStrong: '#4A5568',
    accent1: '#00E676', // Green pop
    accent2: '#2979FF', // Blue pop
    accent3: '#FFCA28',
    win: '#00C853',
    loss: '#FF5252',
    draw: '#448AFF',
    textOnAccent: '#FFFFFF', 
  },
  shadows: {
    small: '0 1px 3px rgba(0,0,0,0.3)',
    medium: '0 4px 6px rgba(0,0,0,0.4)',
    large: '0 10px 15px rgba(0,0,0,0.5)',
  }
};

const lightTheme = {
  name: 'light',
  ...designSystem,
  colors: {
    background: '#F2F4F7',
    backgroundGradient: 'linear-gradient(180deg, #FFFFFF 0%, #F2F4F7 100%)',
    surface: '#FFFFFF',
    primaryText: '#101828',
    secondaryText: '#667085',
    border: '#E4E7EC',
    borderStrong: '#D0D5DD',
    accent1: '#00C865',
    accent2: '#0099E6',
    accent3: '#FFA000',
    win: '#039855',
    loss: '#D92D20',
    draw: '#3538CD',
    textOnAccent: '#FFFFFF',
  },
  shadows: {
    small: '0 1px 2px rgba(16, 24, 40, 0.05)',
    medium: '0 4px 6px -2px rgba(16, 24, 40, 0.03), 0 12px 16px -4px rgba(16, 24, 40, 0.08)',
    large: '0 20px 24px -4px rgba(16, 24, 40, 0.08), 0 8px 8px -4px rgba(16, 24, 40, 0.03)',
  }
};

type Theme = typeof darkTheme;
type ThemePreference = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  themePreference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const getSystemTheme = (): 'dark' | 'light' => {
  if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themePreference, setThemePreference] = useLocalStorage<ThemePreference>('theme-preference', 'system');
  const [systemTheme, setSystemTheme] = useState<'dark' | 'light'>(getSystemTheme);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const effectiveThemeName = useMemo(() => {
    return themePreference === 'system' ? systemTheme : themePreference;
  }, [themePreference, systemTheme]);

  const theme = useMemo(() => (effectiveThemeName === 'dark' ? darkTheme : lightTheme), [effectiveThemeName]);

  const toggleTheme = () => {
    const newTheme = effectiveThemeName === 'dark' ? 'light' : 'dark';
    setThemePreference(newTheme);
  };
  
  const value = useMemo(() => ({
    theme,
    toggleTheme,
    themePreference,
    setThemePreference: (p: ThemePreference) => setThemePreference(p),
  }), [theme, themePreference, setThemePreference]);
  
  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
