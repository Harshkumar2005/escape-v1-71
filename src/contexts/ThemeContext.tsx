
import React, { createContext, useContext, useState, useEffect } from 'react';

type ThemeMode = 'dark' | 'light';

interface ThemeContextType {
  theme: ThemeMode;
  toggleTheme: () => void;
  editorTheme: string;
  terminalTheme: {
    background: string;
    foreground: string;
    cursor: string;
    selection: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to dark theme
  const [theme, setTheme] = useState<ThemeMode>('dark');

  // Set up editor and terminal themes based on UI theme
  const editorTheme = theme === 'dark' ? 'vs-dark' : 'light';
  
  const terminalTheme = {
    dark: {
      background: 'hsl(var(--terminal))',
      foreground: 'hsl(var(--terminal-foreground))',
      cursor: '#AEAFAD',
      selection: 'rgba(255, 255, 255, 0.3)'
    },
    light: {
      background: '#f5f5f5',
      foreground: '#333333',
      cursor: '#333333',
      selection: 'rgba(0, 0, 0, 0.3)'
    }
  };

  // Toggle between dark and light theme
  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'dark' ? 'light' : 'dark'));
  };

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <ThemeContext.Provider value={{
      theme,
      toggleTheme,
      editorTheme,
      terminalTheme: terminalTheme[theme]
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
