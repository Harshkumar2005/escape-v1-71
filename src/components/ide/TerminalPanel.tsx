
import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { WebLinksAddon } from 'xterm-addon-web-links';
import 'xterm/css/xterm.css';
import { Plus, X, Maximize2, Minimize2 } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useWebContainer } from '@/contexts/WebContainerContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
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
  const { webcontainer, isReady } = useWebContainer();
  const { addLogMessage } = useFileSystem();
  
  // Initialize a new terminal
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
  
  // Initialize the first terminal
  useEffect(() => {
    if (terminals.length === 0) {
      const newTerm = createTerminal();
      
      // Wait for the DOM to update
      setTimeout(() => {
        if (newTerm.containerRef.current) {
          newTerm.terminal.open(newTerm.containerRef.current);
          newTerm.fitAddon.fit();
          
          if (!isReady) {
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

  // When WebContainer becomes ready, initialize shells in all terminals
  useEffect(() => {
    if (isReady && webcontainer && terminals.length > 0) {
      terminals.forEach(term => {
        if (!term.shellProcess && term.containerRef.current) {
          initializeShell(term);
        }
      });
    }
  }, [isReady, webcontainer, terminals]);

  // Initialize shell in terminal
  const initializeShell = async (terminalInstance: TerminalInstance) => {
    if (!webcontainer || !isReady) {
      terminalInstance.terminal.writeln('WebContainer not ready. Please wait...');
      return;
    }

    try {
      addLogMessage('info', 'Starting shell process...');
      
      // Start a shell process
      const shellProcess = await webcontainer.spawn('bash', []);
      terminalInstance.shellProcess = shellProcess;

      // Write the output to the terminal
      shellProcess.output.pipeTo(new WritableStream({
        write(data) {
          terminalInstance.terminal.write(data);
        }
      }));

      // Set up input handling
      const input = shellProcess.input.getWriter();
      terminalInstance.terminal.onData((data) => {
        input.write(data);
      });

      // Handle process exit - using addEventListener instead of .on
      shellProcess.addEventListener('exit', (event: any) => {
        const code = event.detail || 0;
        terminalInstance.terminal.writeln(`\r\nProcess exited with code ${code}`);
        terminalInstance.terminal.writeln('Starting new shell...');
        
        // Start a new shell
        setTimeout(() => {
          initializeShell(terminalInstance);
        }, 1000);
      });

    } catch (error) {
      console.error('Error starting shell:', error);
      addLogMessage('error', `Failed to start shell: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Fall back to simulated terminal
      terminalInstance.terminal.writeln('Failed to start WebContainer shell.');
      terminalInstance.terminal.writeln('Using simulated terminal instead.');
      terminalInstance.terminal.writeln('');
      terminalInstance.terminal.write('$ ');
      
      // Set up simulated terminal
      terminalInstance.terminal.onData(data => {
        // Echo back input
        terminalInstance.terminal.write(data);
        
        // Handle Enter key
        if (data === '\r') {
          terminalInstance.terminal.writeln('');
          terminalInstance.terminal.write('$ ');
        }
      });
    }
  };
  
  // Resize terminals when window resizes
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(term => {
        term.fitAddon.fit();
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);
  
  // Set up new terminal when created
  useEffect(() => {
    const currentTerminal = terminals.find(t => t.id === activeTerminalId);
    
    if (currentTerminal && currentTerminal.containerRef.current && 
        !currentTerminal.containerRef.current.querySelector('.xterm')) {
      currentTerminal.terminal.open(currentTerminal.containerRef.current);
      currentTerminal.fitAddon.fit();
      
      // Set up the shell if WebContainer is ready
      if (isReady && webcontainer && !currentTerminal.shellProcess) {
        initializeShell(currentTerminal);
      } else if (!isReady) {
        currentTerminal.terminal.writeln('Welcome to the IDE Terminal!');
        currentTerminal.terminal.writeln('WebContainer is initializing...');
        currentTerminal.terminal.writeln('');
      }
    }
  }, [terminals, activeTerminalId, isReady, webcontainer]);

  // Apply theme changes to existing terminals
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
  
  // Handle close terminal
  const closeTerminal = (id: string) => {
    const terminalToClose = terminals.find(t => t.id === id);
    if (terminalToClose) {
      // Clean up shell process if exists
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
    
    // Set a new active terminal if needed
    if (activeTerminalId === id) {
      const remainingTerminals = terminals.filter(t => t.id !== id);
      if (remainingTerminals.length > 0) {
        setActiveTerminalId(remainingTerminals[0].id);
      } else {
        // Create a new terminal if we closed the last one
        createTerminal();
      }
    }
  };
  
  // Toggle maximize
  const toggleMaximize = () => {
    setMaximized(prev => !prev);
    
    if (!maximized) {
      // Maximize the terminal panel
      if (maximizeTerminal) {
        maximizeTerminal();
      }
      toast.info("Terminal maximized");
    } else {
      // Restore the terminal panel
      if (minimizeTerminal) {
        minimizeTerminal();
      }
      toast.info("Terminal restored");
    }
    
    // Resize terminals after the animation completes
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
      {/* Terminal tabs */}
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
                  if (isReady && webcontainer) {
                    initializeShell(newTerm);
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
      
      {/* Terminal containers */}
      <div className="flex-1 relative">
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
