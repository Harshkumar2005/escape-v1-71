
import React, { useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { useFont } from '@/contexts/FontContext';

const FontSelector: React.FC = () => {
  const { fontFamily, setFontFamily, availableFonts } = useFont();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        className="flex items-center px-2 py-1 text-sm hover:text-white transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-1">{fontFamily}</span>
        <ChevronDown size={14} />
      </button>
      
      {isOpen && (
        <div 
          className="absolute z-50 right-0 mt-1 bg-sidebar border border-border rounded shadow-lg py-1 min-w-40"
          onMouseLeave={() => setIsOpen(false)}
        >
          {availableFonts.map(font => (
            <div
              key={font}
              className="px-3 py-1.5 text-sm text-sidebar-foreground hover:bg-sidebar-foreground hover:bg-opacity-10 cursor-pointer flex items-center justify-between"
              onClick={() => {
                setFontFamily(font);
                setIsOpen(false);
              }}
              style={{ fontFamily: font }}
            >
              <span>{font}</span>
              {fontFamily === font && <Check size={14} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FontSelector;
