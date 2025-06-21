"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';

type Theme = 'violet' | 'zinc' | 'rose' | 'blue' | 'green' | 'orange';

type AccentThemeContextType = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const AccentThemeContext = createContext<AccentThemeContextType | undefined>(undefined);

export function AccentThemeProvider({ children }: { children: React.ReactNode }) {
  // Always default to 'zinc' on initial load and ignore localStorage.
  const [theme, setTheme] = useState<Theme>('zinc');

  useEffect(() => {
    // Apply the data-color-scheme attribute to the root element.
    document.documentElement.setAttribute('data-color-scheme', theme);
  }, [theme]);

  // The setTheme function no longer saves to localStorage.
  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
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
