import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Plus, X, Maximize2, Minimize2, AlertTriangle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebContainer } from '@/contexts/WebContainerContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  shellProcess?: any;
}

interface TerminalPanelProps {
  maximizeTerminal?: () => void;
  minimizeTerminal?: () => void;
}

const TerminalPanel: React.FC<TerminalPanelProps> = ({ maximizeTerminal, minimizeTerminal }) => {
  const [terminals, setTerminals] = useState<TerminalInstance[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { terminalTheme } = useTheme();
  const { webcontainer, isReady, hasWebContainerError } = useWebContainer();
  const { addLogMessage } = useFileSystem();
  
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
      },
      convertEol: true
    });
    
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.loadAddon(new WebLinksAddon());
    
    const newTermRef = React.createRef<HTMLDivElement>();
    
    setTerminals(prev => [...prev, { id, terminal, fitAddon, containerRef: newTermRef }]);
    setActiveTerminalId(id);
    
    return { id, terminal, fitAddon, containerRef: newTermRef };
  };
  
  useEffect(() => {
    if (terminals.length === 0) {
      const newTerm = createTerminal();
      
      setTimeout(() => {
        if (newTerm.containerRef.current) {
          newTerm.terminal.open(newTerm.containerRef.current);
          newTerm.fitAddon.fit();
          
          if (hasWebContainerError) {
            newTerm.terminal.writeln('Welcome to the IDE Terminal!');
            newTerm.terminal.writeln('\r\n\x1b[31mWebContainer initialization failed. Running in editor-only mode.\x1b[0m');
            newTerm.terminal.writeln('Terminal functionality is limited without WebContainer.');
            newTerm.terminal.writeln('');
            simulateShell(newTerm);
          } else if (!isReady) {
            newTerm.terminal.writeln('Welcome to the IDE Terminal!');
            newTerm.terminal.writeln('WebContainer is initializing...');
            newTerm.terminal.writeln('');
          } else {
            initializeShell(newTerm);
          }
        }
      }, 0);
    }
  }, []);

  useEffect(() => {
    if (isReady && webcontainer && terminals.length > 0 && !hasWebContainerError) {
      terminals.forEach(term => {
        if (!term.shellProcess && term.containerRef.current) {
          initializeShell(term);
        }
      });
    }
  }, [isReady, webcontainer, terminals, hasWebContainerError]);

  const simulateShell = (terminalInstance: TerminalInstance) => {
    terminalInstance.terminal.writeln('Simulated terminal mode (WebContainer not available)');
    terminalInstance.terminal.write('\r\n$ ');
    
    terminalInstance.terminal.onData(data => {
      if (data === '\r') {
        terminalInstance.terminal.writeln('');
        terminalInstance.terminal.writeln('\x1b[33mCommand execution is not available in editor-only mode.\x1b[0m');
        terminalInstance.terminal.write('$ ');
      } else if (data === '\x7f') {
        // Backspace handling
        terminalInstance.terminal.write('\b \b');
      } else {
        terminalInstance.terminal.write(data);
      }
    });
  };

  const initializeShell = async (terminalInstance: TerminalInstance) => {
    if (!webcontainer || !isReady || hasWebContainerError) {
      terminalInstance.terminal.writeln('WebContainer not available. Using simulated terminal.');
      simulateShell(terminalInstance);
      return;
    }

    try {
      addLogMessage('info', 'Starting shell process...');
      
      const shellProcess = await webcontainer.spawn('bash', []);
      terminalInstance.shellProcess = shellProcess;

      shellProcess.output.pipeTo(new WritableStream({
        write(data) {
          terminalInstance.terminal.write(data);
        }
      }));

      const input = shellProcess.input.getWriter();
      terminalInstance.terminal.onData((data) => {
        input.write(data);
      });

      shellProcess.exit.then(code => {
        terminalInstance.terminal.writeln(`\r\nProcess exited with code ${code}`);
        terminalInstance.terminal.writeln('Starting new shell...');
        
        setTimeout(() => {
          initializeShell(terminalInstance);
        }, 1000);
      });

    } catch (error) {
      console.error('Error starting shell:', error);
      addLogMessage('error', `Failed to start shell: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      terminalInstance.terminal.writeln('Failed to start WebContainer shell.');
      terminalInstance.terminal.writeln('Using simulated terminal instead.');
      terminalInstance.terminal.writeln('');
      
      simulateShell(terminalInstance);
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
      
      if (isReady && webcontainer && !currentTerminal.shellProcess) {
        initializeShell(currentTerminal);
      } else if (!isReady) {
        currentTerminal.terminal.writeln('Welcome to the IDE Terminal!');
        currentTerminal.terminal.writeln('WebContainer is initializing...');
        currentTerminal.terminal.writeln('');
      }
    }
  }, [terminals, activeTerminalId, isReady, webcontainer]);

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
      if (terminalToClose.shellProcess) {
        try {
          terminalToClose.shellProcess.kill();
        } catch (error) {
          console.error('Error killing shell process:', error);
        }
      }
      
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
            <TerminalTab
              key={term.id}
              terminalId={term.id.replace('term-', '')}
              isActive={term.id === activeTerminalId}
              onClick={() => setActiveTerminalId(term.id)}
              onClose={() => closeTerminal(term.id)}
            />
          ))}
        </div>
        <div className="flex items-center px-2">
          <button 
            className="p-1 text-slate-400 hover:text-white rounded-sm"
            onClick={() => {
              const newTerm = createTerminal();
              setTimeout(() => {
                if (newTerm.containerRef.current) {
                  newTerm.terminal.open(newTerm.containerRef.current);
                  newTerm.fitAddon.fit();
                  if (isReady && webcontainer && !hasWebContainerError) {
                    initializeShell(newTerm);
                  } else {
                    simulateShell(newTerm);
                  }
                }
              }, 0);
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
      
      {hasWebContainerError && (
        <Alert variant="destructive" className="mx-2 mt-2 bg-red-900/20 border-red-900/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Limited Terminal Functionality</AlertTitle>
          <AlertDescription className="text-xs">
            WebContainer is not available. Terminal is in simulated mode and cannot execute real commands.
          </AlertDescription>
        </Alert>
      )}
      
      <div className={`flex-1 relative ${hasWebContainerError ? 'mt-2' : ''}`}>
        {terminals.map(term => (
          <div
            key={term.id}
            ref={term.containerRef}
            className="absolute inset-0 p-2"
            style={{ display: term.id === activeTerminalId ? 'block' : 'none' }}
          />
        ))}
      </div>
    </div>
  );
};

export default TerminalPanel;
