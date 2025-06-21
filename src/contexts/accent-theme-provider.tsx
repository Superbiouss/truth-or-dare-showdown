"use client";

import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'zinc' | 'rose' | 'blue' | 'green' | 'orange';

type AccentThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(undefined);

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('zinc');

  useEffect(() => {
    const storedTheme = localStorage.getItem('color-theme') as Theme | null;
    if (storedTheme) {
      handleSetTheme(storedTheme);
    }
  }, []);

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('color-theme', newTheme);
    document.documentElement.setAttribute('data-color-scheme', newTheme);
  };
  
  return (
    <AccentThemeContext.Provider value={{ theme, setTheme: handleSetTheme }}>
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
