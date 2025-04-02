import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import 'xterm/css/xterm.css';
import { Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebContainer } from '@/contexts/WebContainerContext';
import { toast } from 'sonner';

interface TerminalTabProps {
  terminalId: string;
  isActive: boolean;
  onClick: () => void;
  onClose: () => void;
}

const TerminalTab: React.FC<TerminalTabProps> = ({ terminalId, isActive, onClick, onClose }) => {
  return (
    <div 
      className={`flex items-center px-3 py-1 border-r border-border cursor-pointer ${
        isActive ? 'bg-terminal text-white' : 'bg-tab-inactive text-slate-400 hover:text-white'
      }`}
      onClick={onClick}
    >
      <span className="text-sm">Terminal {terminalId}</span>
      <button 
        className="ml-2 p-0.5 text-slate-400 hover:text-white rounded-sm"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
};

interface TerminalInstance {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  containerRef: React.RefObject<HTMLDivElement>;
  lineBuffer: string;
}

interface TerminalPanelProps {
  maximizeTerminal?: () => void;
  minimizeTerminal?: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ maximizeTerminal, minimizeTerminal }) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { terminalTheme } = useTheme();
  const { webcontainerInstance, isReady, error, executeCommand, isFallbackMode } = useWebContainer();
  
  const createTerminal = () => {
    const id = `term-${Date.now()}`;
    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily: "var(--font-family), 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      fontSize: 14,
      theme: {
        background: terminalTheme.background,
        foreground: terminalTheme.foreground,
        cursor: terminalTheme.cursor,
        selectionBackground: terminalTheme.selection,
      }
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    
    const newTermRef = React.createRef<HTMLDivElement>();
    
    const newTerminal: TerminalInstance = { 
      id, 
      terminal, 
      fitAddon, 
      containerRef: newTermRef,
      lineBuffer: '',
    };
    
    setTerminals(prev => [...prev, newTerminal]);
    setActiveTerminalId(id);
    
    return newTerminal;
  };
  
  useEffect(() => {
    if (terminals.length === 0) {
      const newTerm = createTerminal();
      
      setTimeout(() => {
        if (newTerm.containerRef.current) {
          newTerm.terminal.open(newTerm.containerRef.current);
          newTerm.fitAddon.fit();
          
          if (isFallbackMode) {
            newTerm.terminal.writeln('\x1b[33mRunning in fallback mode:\x1b[0m');
            newTerm.terminal.writeln('\x1b[33mWebContainer is not supported in this environment.\x1b[0m');
            newTerm.terminal.writeln('');
            newTerm.terminal.writeln('Terminal is in limited functionality mode.');
            newTerm.terminal.writeln('Some features will be simulated instead of actually executed.');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          } else if (error && !isReady) {
            newTerm.terminal.writeln('\x1b[31mWebContainer initialization failed:\x1b[0m');
            newTerm.terminal.writeln(`\x1b[31mError: ${error}\x1b[0m`);
            newTerm.terminal.writeln('');
            newTerm.terminal.writeln('Terminal is in limited functionality mode.');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          } else if (!isReady) {
            newTerm.terminal.writeln('\x1b[36mWebContainer is initializing...\x1b[0m');
            newTerm.terminal.writeln('Please wait...');
          } else {
            newTerm.terminal.writeln('\x1b[32mWebContainer initialized successfully!\x1b[0m');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          }
          
          setupTerminalInputHandling(newTerm);
        }
      }, 0);
    }
  }, []);
  
  useEffect(() => {
    const currentTerminal = terminals.find(t => t.id === activeTerminalId);
    
    if (currentTerminal && currentTerminal.terminal) {
      if (isFallbackMode) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('\x1b[33mRunning in fallback mode:\x1b[0m');
        currentTerminal.terminal.writeln('\x1b[33mWebContainer is not supported in this environment.\x1b[0m');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        currentTerminal.terminal.writeln('Some features will be simulated instead of actually executed.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      } else if (error && !isReady) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('\x1b[31mWebContainer initialization failed:\x1b[0m');
        currentTerminal.terminal.writeln(`\x1b[31mError: ${error}\x1b[0m`);
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      } else if (isReady) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('\x1b[32mWebContainer is ready!\x1b[0m');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      }
    }
  }, [isReady, error, isFallbackMode]);
  
  const setupTerminalInputHandling = (termInstance: TerminalInstance) => {
    termInstance.terminal.onData(data => {
      if (isProcessing) return;
      
      if (data === '\r') {
        termInstance.terminal.writeln('');
        
        const command = termInstance.lineBuffer.trim();
        if (command) {
          executeTerminalCommand(termInstance, command);
        } else {
          termInstance.terminal.write('$ ');
        }
        
        termInstance.lineBuffer = '';
      } else if (data === '\u007F') {
        if (termInstance.lineBuffer.length > 0) {
          termInstance.lineBuffer = termInstance.lineBuffer.slice(0, -1);
          termInstance.terminal.write('\b \b');
        }
      } else if (data === '\u0003') {
        termInstance.terminal.writeln('^C');
        termInstance.lineBuffer = '';
        termInstance.terminal.write('$ ');
      } else if (!data.match(/[\u0000-\u001F]/)) {
        termInstance.lineBuffer += data;
        termInstance.terminal.write(data);
      }
    });
  };
  
  const executeTerminalCommand = async (termInstance: TerminalInstance, commandLine: string) => {
    if (!isReady && !isFallbackMode) {
      termInstance.terminal.writeln('\x1b[31mWebContainer is not ready. Command cannot be executed.\x1b[0m');
      termInstance.terminal.write('$ ');
      return;
    }
    
    setIsProcessing(true);
    
    const parts = commandLine.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    try {
      if (command === 'clear' || command === 'cls') {
        termInstance.terminal.clear();
      } else if (isFallbackMode) {
        termInstance.terminal.writeln(`\x1b[33mSimulating: ${commandLine}\x1b[0m`);
        
        if (command === 'ls' || command === 'dir') {
          termInstance.terminal.writeln('package.json');
          termInstance.terminal.writeln('index.js');
          termInstance.terminal.writeln('node_modules/');
        } else if (command === 'cat' || command === 'type') {
          termInstance.terminal.writeln(`\x1b[90m// Simulated content of ${args[0]}\x1b[0m`);
          termInstance.terminal.writeln('\x1b[90m// In fallback mode, actual file content cannot be displayed\x1b[0m');
        } else if (command === 'npm') {
          termInstance.terminal.writeln(`\x1b[33mSimulating npm ${args.join(' ')}\x1b[0m`);
          if (args[0] === 'install' || args[0] === 'i') {
            termInstance.terminal.writeln('\x1b[32madded 42 packages in 2s\x1b[0m');
          } else if (args[0] === 'start') {
            termInstance.terminal.writeln('\x1b[36m> Starting development server...\x1b[0m');
            termInstance.terminal.writeln('\x1b[32mReady on http://localhost:3000\x1b[0m');
          } else {
            termInstance.terminal.writeln('Done');
          }
        } else {
          termInstance.terminal.writeln(`\x1b[33mCommand executed in simulation mode\x1b[0m`);
          termInstance.terminal.writeln(`\x1b[90mThe output would appear here if this was a real environment\x1b[0m`);
        }
      } else {
        termInstance.terminal.writeln(`Executing: ${commandLine}`);
        
        const result = await executeCommand(command, args);
        
        if (result.stdout) {
          termInstance.terminal.writeln(result.stdout);
        }
        
        if (result.stderr) {
          termInstance.terminal.writeln(`\x1b[31mError: ${result.stderr}\x1b[0m`);
        }
        
        termInstance.terminal.writeln(`Exit code: ${result.exitCode}`);
      }
    } catch (error: any) {
      termInstance.terminal.writeln(`\x1b[31mError: ${error.message || 'Unknown error'}\x1b[0m`);
    } finally {
      setIsProcessing(false);
      termInstance.terminal.write('$ ');
    }
  };
  
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(term => {
        term.fitAddon.fit();
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);
  
  useEffect(() => {
    const currentTerminal = terminals.find(t => t.id === activeTerminalId);
    
    if (currentTerminal && currentTerminal.containerRef.current && 
        !currentTerminal.containerRef.current.querySelector('.xterm')) {
      currentTerminal.terminal.open(currentTerminal.containerRef.current);
      currentTerminal.fitAddon.fit();
      
      if (!currentTerminal.containerRef.current.querySelector('.xterm-cursor')) {
        if (isFallbackMode) {
          currentTerminal.terminal.writeln('\x1b[33mRunning in fallback mode:\x1b[0m');
          currentTerminal.terminal.writeln('\x1b[33mWebContainer is not supported in this environment.\x1b[0m');
          currentTerminal.terminal.writeln('');
          currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
          currentTerminal.terminal.writeln('Some features will be simulated instead of actually executed.');
        } else if (error) {
          currentTerminal.terminal.writeln('\x1b[31mWebContainer initialization failed:\x1b[0m');
          currentTerminal.terminal.writeln(`\x1b[31mError: ${error}\x1b[0m`);
          currentTerminal.terminal.writeln('');
          currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        } else if (!isReady) {
          currentTerminal.terminal.writeln('\x1b[36mWebContainer is initializing...\x1b[0m');
          currentTerminal.terminal.writeln('Please wait...');
        } else {
          currentTerminal.terminal.writeln('\x1b[32mWebContainer initialized successfully!\x1b[0m');
        }
        
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
        
        setupTerminalInputHandling(currentTerminal);
      }
    }
  }, [terminals, activeTerminalId, isReady, error, isFallbackMode]);
  
  useEffect(() => {
    terminals.forEach(term => {
      term.terminal.options.theme = {
        background: terminalTheme.background,
        foreground: terminalTheme.foreground,
        cursor: terminalTheme.cursor,
        selectionBackground: terminalTheme.selection,
      };
    });
  }, [terminalTheme, terminals]);
  
  const closeTerminal = (id: string) => {
    const terminalToClose = terminals.find(t => t.id === id);
    if (terminalToClose) {
      terminalToClose.terminal.dispose();
    }
    
    setTerminals(prev => prev.filter(t => t.id !== id));
    
    if (activeTerminalId === id) {
      const remainingTerminals = terminals.filter(t => t.id !== id);
      if (remainingTerminals.length > 0) {
        setActiveTerminalId(remainingTerminals[0].id);
      } else {
        createTerminal();
      }
    }
  };
  
  const toggleMaximize = () => {
    setMaximized(prev => !prev);
    
    if (!maximized) {
      if (maximizeTerminal) {
        maximizeTerminal();
      }
      toast.info("Terminal maximized");
    } else {
      if (minimizeTerminal) {
        minimizeTerminal();
      }
      toast.info("Terminal restored");
    }
    
    setTimeout(() => {
      terminals.forEach(term => {
        term.fitAddon.fit();
      });
    }, 300);
  };
  
  return (
    <div 
      ref={containerRef}
      className="h-full flex flex-col bg-terminal text-terminal-foreground"
    >
      <div className="flex items-center justify-between bg-sidebar border-b border-border">
        <div className="flex overflow-x-auto">
          {terminals.map(term => (
            <div 
              key={term.id}
              className={`flex items-center px-3 py-1 border-r border-border cursor-pointer ${
                term.id === activeTerminalId ? 'bg-terminal text-white' : 'bg-tab-inactive text-slate-400 hover:text-white'
              }`}
              onClick={() => setActiveTerminalId(term.id)}
            >
              <span className="text-sm">Terminal {term.id.replace('term-', '')}</span>
              <button 
                className="ml-2 p-0.5 text-slate-400 hover:text-white rounded-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTerminal(term.id);
                }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
        <div className="flex items-center px-2">
          <button 
            className="p-1 text-slate-400 hover:text-white rounded-sm"
            onClick={() => {
              createTerminal();
              toast.success("New terminal created");
            }}
            title="New Terminal"
          >
            <Plus size={16} />
          </button>
          <button 
            className="p-1 ml-1 text-slate-400 hover:text-white rounded-sm"
            onClick={toggleMaximize}
            title={maximized ? "Restore Terminal" : "Maximize Terminal"}
          >
            {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
      
      <div className="flex-1 relative">
        {terminals.map(term => (
          <div
            key={term.id}
            ref={term.containerRef}
            className="absolute inset-0 p-2"
            style={{ display: term.id === activeTerminalId ? 'block' : 'none' }}
          />
        ))}
        
        {terminals.length === 0 && (
          <div className="absolute inset-0 p-4 flex items-center justify-center text-terminal-foreground opacity-50">
            No active terminals. Create a new one to begin.
          </div>
        )}
      </div>
    </div>
  );
};

export default TerminalPanel;
