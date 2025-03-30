
import React, { createContext, useContext, useState, useEffect } from 'react';

type FontFamily = 'JetBrains Mono' | 'Fira Code' | 'Source Code Pro' | 'Inter';

interface FontContextType {
  fontFamily: FontFamily;
  setFontFamily: (font: FontFamily) => void;
  availableFonts: FontFamily[];
}

const FontContext = createContext<FontContextType | undefined>(undefined);

export const FontProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [fontFamily, setFontFamily] = useState<FontFamily>('JetBrains Mono');
  const availableFonts: FontFamily[] = ['JetBrains Mono', 'Fira Code', 'Source Code Pro', 'Inter'];

  // Apply font to root CSS variable
  useEffect(() => {
    document.documentElement.style.setProperty('--font-family', fontFamily);
  }, [fontFamily]);

  return (
    <FontContext.Provider value={{
      fontFamily,
      setFontFamily,
      availableFonts
    }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (context === undefined) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};
