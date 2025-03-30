
import React from 'react';

type EditorProps = {
  content: string;
  language: string;
};

const Editor: React.FC<EditorProps> = ({ content, language }) => {
  // Enhanced syntax highlighting for various languages
  const highlightSyntax = (code: string, lang: string) => {
    if (lang === 'typescript' || lang === 'javascript') {
      return code
        .replace(/(const|let|var|function|class|interface|type|import|export|from|return|if|else|for|while|switch|case|break|continue|default|async|await|try|catch|throw|new)/g, '<span class="text-syntax-keyword">$1</span>')
        .replace(/(".*?")/g, '<span class="text-syntax-string">$1</span>')
        .replace(/('.*?')/g, '<span class="text-syntax-string">$1</span>')
        .replace(/(`.*?`)/g, '<span class="text-syntax-string">$1</span>')
        .replace(/(\b\d+\b)/g, '<span class="text-syntax-variable">$1</span>')
        .replace(/(\w+)\s*\(/g, '<span class="text-syntax-function">$1</span>(')
        .replace(/(\/\/.*)/g, '<span class="text-syntax-comment">$1</span>');
    } else if (lang === 'html') {
      return code
        .replace(/(&lt;[^&]*&gt;)/g, '<span class="text-syntax-keyword">$1</span>')
        .replace(/(".*?")/g, '<span class="text-syntax-string">$1</span>');
    } else if (lang === 'css') {
      return code
        .replace(/([\.\#][^{]*)\s*{/g, '<span class="text-syntax-function">$1</span> {')
        .replace(/(\w+):/g, '<span class="text-syntax-keyword">$1</span>:')
        .replace(/(\d+[a-z%]+)/g, '<span class="text-syntax-variable">$1</span>')
        .replace(/(!important)/g, '<span class="text-syntax-keyword">$1</span>');
    }
    return code;
  };

  // Escape HTML to prevent XSS
  const escapeHTML = (str: string) => {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const lines = content.split('\n');

  return (
    <div className="h-full overflow-auto bg-editor py-2 text-sm font-mono">
      <table className="w-full border-collapse">
        <tbody>
          {lines.map((line, index) => (
            <tr key={index} className="hover:bg-editor-line">
              <td className="text-right pr-4 select-none text-gray-500 w-12">{index + 1}</td>
              <td className="pl-4 pr-8 whitespace-pre">
                <div dangerouslySetInnerHTML={{ 
                  __html: highlightSyntax(escapeHTML(line), language) 
                }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Editor;
