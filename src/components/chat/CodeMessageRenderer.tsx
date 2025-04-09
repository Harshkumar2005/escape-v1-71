
import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface CodeMessageRendererProps {
  content: string;
  messageIndex: number;
}

export const CodeMessageRenderer: React.FC<CodeMessageRendererProps> = ({ 
  content, 
  messageIndex 
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, blockIndex: number) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedIndex(blockIndex);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
        toast.error("Failed to copy code");
      });
  };

  return (
    <ReactMarkdown
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          const language = match ? match[1] : 'text';
          
          if (!inline) {
            const code = String(children).replace(/\n$/, '');
            const blockIndex = `${messageIndex}-${Math.random()}`;
            
            return (
              <div className="relative">
                <div className="flex justify-between items-center bg-[#1E1E1E] px-4 py-1 rounded-t-md border-b border-gray-700">
                  <span className="text-xs text-gray-400">{language}</span>
                  <button 
                    onClick={() => handleCopyCode(code, parseInt(blockIndex))}
                    className="text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    {copiedIndex === parseInt(blockIndex) ? (
                      <><CheckCircle size={14} /> Copied</>
                    ) : (
                      <><Copy size={14} /> Copy code</>
                    )}
                  </button>
                </div>
                <SyntaxHighlighter
                  language={language}
                  style={vscDarkPlus}
                  customStyle={{ margin: 0, borderRadius: '0 0 6px 6px' }}
                  showLineNumbers={true}
                  wrapLines={true}
                  wrapLongLines={true}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            );
          }
          return (
            <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
              {children}
            </code>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
};
