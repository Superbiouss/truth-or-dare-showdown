"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'violet' | 'zinc' | 'rose' | 'blue' | 'green' | 'orange';

type AccentThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(undefined);

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('color-theme') as Theme | null) || 'violet';
    }
    return 'violet';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-color-scheme', theme);
  }, [theme]);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
        localStorage.setItem('color-theme', newTheme);
    }
  };
  
  const value = useMemo(() => ({ theme, setTheme: handleSetTheme }), [theme]);

  return (
    <AccentThemeContext.Provider value={value}>
      {children}
    </AccentThemeContext.Provider>
  );
}

export function useAccentTheme() {
  const context = useContext(AccentThemeContext);
  if (context === undefined) {
    throw new Error('useAccentTheme must be used within a AccentThemeProvider');
  }
  return context;
}
