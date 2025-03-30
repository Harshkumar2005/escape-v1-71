
import React from 'react';

type EditorProps = {
  content: string;
  language: string;
};

const Editor: React.FC<EditorProps> = ({ content, language }) => {
  // Simple syntax highlighting for TypeScript
  const highlightSyntax = (code: string) => {
    if (language === 'typescript' || language === 'javascript') {
      // Replace keywords, strings, functions with highlighted spans
      return code
        .replace(/(console\.\w+)/g, '<span class="syntax-function">$1</span>')
        .replace(/(".*?")/g, '<span class="syntax-string">$1</span>')
        .replace(/('.*?')/g, '<span class="syntax-string">$1</span>');
    }
    return code;
  };

  const lines = content.split('\n');

  return (
    <div className="h-full overflow-auto bg-editor py-2 text-sm font-mono">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="hover:bg-editor-line">
              <td className="line-number">{index + 1}</td>
              <td className="pl-4 pr-8 whitespace-pre">
                <div dangerouslySetInnerHTML={{ __html: highlightSyntax(line) }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Editor;
