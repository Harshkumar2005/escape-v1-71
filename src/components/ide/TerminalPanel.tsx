
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
  
  // Initialize the first terminal
  useEffect(() => {
    if (terminals.length === 0) {
      const newTerm = createTerminal();
      
      // Wait for the DOM to update
      setTimeout(() => {
        if (newTerm.containerRef.current) {
          newTerm.terminal.open(newTerm.containerRef.current);
          newTerm.fitAddon.fit();
          
          // Set up initial terminal content
          if (isFallbackMode) {
            newTerm.terminal.writeln('Running in fallback mode:');
            newTerm.terminal.writeln(`WebContainer is not supported in this environment.`);
            newTerm.terminal.writeln('');
            newTerm.terminal.writeln('Terminal is in limited functionality mode.');
            newTerm.terminal.writeln('Some features will be simulated instead of actually executed.');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          } else if (error && !isReady) {
            newTerm.terminal.writeln('WebContainer initialization failed:');
            newTerm.terminal.writeln(`Error: ${error}`);
            newTerm.terminal.writeln('');
            newTerm.terminal.writeln('Terminal is in limited functionality mode.');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          } else if (!isReady) {
            newTerm.terminal.writeln('WebContainer is initializing...');
            newTerm.terminal.writeln('Please wait...');
          } else {
            newTerm.terminal.writeln('WebContainer initialized successfully!');
            newTerm.terminal.writeln('');
            newTerm.terminal.write('$ ');
          }
          
          setupTerminalInputHandling(newTerm);
        }
      }, 0);
    }
  }, []);
  
  // Update terminal when WebContainer status changes
  useEffect(() => {
    const currentTerminal = terminals.find(t => t.id === activeTerminalId);
    
    if (currentTerminal && currentTerminal.terminal) {
      if (isFallbackMode) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('Running in fallback mode:');
        currentTerminal.terminal.writeln('WebContainer is not supported in this environment.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        currentTerminal.terminal.writeln('Some features will be simulated instead of actually executed.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      } else if (error && !isReady) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('WebContainer initialization failed:');
        currentTerminal.terminal.writeln(`Error: ${error}`);
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      } else if (isReady) {
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.writeln('WebContainer is ready!');
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
      }
    }
  }, [isReady, error, isFallbackMode]);
  
  // Set up terminal input handling
  const setupTerminalInputHandling = (termInstance: TerminalInstance) => {
    termInstance.terminal.onData(data => {
      // Ignore input if there's a process running
      if (isProcessing) return;
      
      // Handle special keys
      if (data === '\r') {
        // Enter key pressed - execute command
        termInstance.terminal.writeln('');
        
        const command = termInstance.lineBuffer.trim();
        if (command) {
          executeTerminalCommand(termInstance, command);
        } else {
          termInstance.terminal.write('$ ');
        }
        
        termInstance.lineBuffer = '';
      } else if (data === '\u007F') {
        // Backspace key pressed
        if (termInstance.lineBuffer.length > 0) {
          termInstance.lineBuffer = termInstance.lineBuffer.slice(0, -1);
          termInstance.terminal.write('\b \b');
        }
      } else if (data === '\u0003') {
        // Ctrl+C pressed
        termInstance.terminal.writeln('^C');
        termInstance.lineBuffer = '';
        termInstance.terminal.write('$ ');
      } else if (!data.match(/[\u0000-\u001F]/)) {
        // Regular character input
        termInstance.lineBuffer += data;
        termInstance.terminal.write(data);
      }
    });
  };
  
  // Execute command in terminal
  const executeTerminalCommand = async (termInstance: TerminalInstance, commandLine: string) => {
    if (!isReady) {
      termInstance.terminal.writeln('WebContainer is not ready. Command cannot be executed.');
      termInstance.terminal.write('$ ');
      return;
    }
    
    setIsProcessing(true);
    
    // Parse command and arguments
    const parts = commandLine.split(' ');
    const command = parts[0];
    const args = parts.slice(1);
    
    try {
      if (command === 'clear' || command === 'cls') {
        termInstance.terminal.clear();
      } else if (isFallbackMode) {
        // Special handling for fallback mode
        termInstance.terminal.writeln(`Simulating: ${commandLine}`);
        
        // Simulate some common commands
        if (command === 'ls' || command === 'dir') {
          termInstance.terminal.writeln('package.json');
          termInstance.terminal.writeln('index.js');
          termInstance.terminal.writeln('node_modules/');
        } else if (command === 'cat' || command === 'type') {
          termInstance.terminal.writeln(`// Simulated content of ${args[0]}`);
          termInstance.terminal.writeln('// In fallback mode, actual file content cannot be displayed');
        } else if (command === 'npm') {
          termInstance.terminal.writeln(`Simulating npm ${args.join(' ')}`);
          termInstance.terminal.writeln('Done');
        } else {
          termInstance.terminal.writeln(`Command executed in simulation mode`);
        }
      } else {
        termInstance.terminal.writeln(`Executing: ${commandLine}`);
        
        const result = await executeCommand(command, args);
        
        if (result.stdout) {
          termInstance.terminal.writeln(result.stdout);
        }
        
        if (result.stderr) {
          termInstance.terminal.writeln(`Error: ${result.stderr}`);
        }
        
        termInstance.terminal.writeln(`Exit code: ${result.exitCode}`);
      }
    } catch (error: any) {
      termInstance.terminal.writeln(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
      termInstance.terminal.write('$ ');
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
      
      // Set up initial terminal content if this is a new terminal
      if (!currentTerminal.containerRef.current.querySelector('.xterm-cursor')) {
        if (isFallbackMode) {
          currentTerminal.terminal.writeln('Running in fallback mode:');
          currentTerminal.terminal.writeln('WebContainer is not supported in this environment.');
          currentTerminal.terminal.writeln('');
          currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
          currentTerminal.terminal.writeln('Some features will be simulated instead of actually executed.');
        } else if (error) {
          currentTerminal.terminal.writeln('WebContainer initialization failed:');
          currentTerminal.terminal.writeln(`Error: ${error}`);
          currentTerminal.terminal.writeln('');
          currentTerminal.terminal.writeln('Terminal is in limited functionality mode.');
        } else if (!isReady) {
          currentTerminal.terminal.writeln('WebContainer is initializing...');
          currentTerminal.terminal.writeln('Please wait...');
        } else {
          currentTerminal.terminal.writeln('WebContainer initialized successfully!');
        }
        
        currentTerminal.terminal.writeln('');
        currentTerminal.terminal.write('$ ');
        
        setupTerminalInputHandling(currentTerminal);
      }
    }
  }, [terminals, activeTerminalId, isReady, error, isFallbackMode]);

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
