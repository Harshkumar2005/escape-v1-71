
import React, { createContext, useContext, useState, ReactNode } from 'react';

type Font = 'JetBrains Mono' | 'Fira Code' | 'Source Code Pro' | 'Menlo';

interface FontContextType {
  fontFamily: Font;
  setFontFamily: (font: Font) => void;
  editorFont: string;
  availableFonts: Font[];
}

const FontContext = createContext<FontContextType | null>(null);

export const FontProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fontFamily, setFontFamily] = useState<Font>('JetBrains Mono');

  const availableFonts: Font[] = [
    'JetBrains Mono',
    'Fira Code',
    'Source Code Pro',
    'Menlo'
  ];

  const editorFont = fontFamily;

  return (
    <FontContext.Provider value={{ fontFamily, setFontFamily, editorFont, availableFonts }}>
      {children}
    </FontContext.Provider>
  );
};

export const useFont = () => {
  const context = useContext(FontContext);
  if (!context) {
    throw new Error('useFont must be used within a FontProvider');
  }
  return context;
};
