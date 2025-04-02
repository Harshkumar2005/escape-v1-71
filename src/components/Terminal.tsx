
import React from 'react';

type TerminalProps = {
  output: string[];
};

const Terminal: React.FC<TerminalProps> = ({ output }) => {
  return (
    <div className="bg-terminal text-terminal-foreground h-full overflow-auto p-2 font-mono">
      {output.length === 0 ? (
        <div className="terminal-line opacity-50">Terminal ready. Type commands to begin...</div>
      ) : (
        output.map((line, index) => {
          // Special styling for different parts of the terminal output
          if (line.includes('package name') || line.includes('entry point')) {
            const parts = line.split(/(\(.*?\))/);
            return (
              <div key={index} className="terminal-line">
                <span className="text-teal-400">{parts[0]}</span>
                <span className="text-yellow-400">{parts[1] || ''}</span>
                <span>{parts[2] || ''}</span>
              </div>
            );
          } else if (line.includes('Done!')) {
            return (
              <div key={index} className="terminal-line text-green-400">
                {line}
              </div>
            );
          } else if (line.includes('+')) {
            return (
              <div key={index} className="terminal-line">
                <span className="text-green-400">+</span> {line.substring(1)}
              </div>
            );
          } else if (line.includes('bun run') || line.includes('npm run')) {
            return (
              <div key={index} className="terminal-line">
                <span className="text-blue-400">{line.includes('bun run') ? 'bun run' : 'npm run'}</span> <span className="text-cyan-400">{line.split(' ').slice(-1)[0]}</span>
              </div>
            );
          } else if (line.includes('Error:')) {
            return (
              <div key={index} className="terminal-line text-red-400">
                {line}
              </div>
            );
          } else if (line.includes('Fallback mode:')) {
            return (
              <div key={index} className="terminal-line text-yellow-400">
                {line}
              </div>
            );
          } else if (line.includes('@')) {
            return (
              <div key={index} className="terminal-line">
                <span className="terminal-prompt">{line.split(' ')[0]}</span> <span className="terminal-path">{line.split(' ')[1]}</span> <span className="terminal-highlight">{line.split(' ')[2]}</span>
              </div>
            );
          } else {
            return <div key={index} className="terminal-line">{line}</div>;
          }
        })
      )}
    </div>
  );
};

export default Terminal;
