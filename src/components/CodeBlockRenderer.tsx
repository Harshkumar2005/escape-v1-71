
import React from 'react';
import { processCodeBlock } from '../utils/codeBlockUtils';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockRendererProps {
  language: string;
  code: string;
  filePath?: string;
}

const CodeBlockRenderer: React.FC<CodeBlockRendererProps> = ({ language, code, filePath }) => {
  // Process the code to remove the first 3 lines
  const processedCode = processCodeBlock(code);
  
  return (
    <div className="relative group">
      {filePath && (
        <div className="absolute top-0 right-0 bg-gray-800 text-xs text-gray-400 px-2 py-1 rounded-bl">
          {filePath}
        </div>
      )}
      <SyntaxHighlighter
        language={language || 'text'}
        style={vscDarkPlus}
        className="rounded-md"
        customStyle={{ background: '#1E1E1E', padding: '1rem' }}
        data-path={filePath || ''}
      >
        {processedCode}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodeBlockRenderer;
