import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Power, RefreshCcw } from 'lucide-react';
import 'xterm/css/xterm.css';

const WebContainerPanel = () => {
  // Core state
  const [webcontainer, setWebcontainer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [webContainerSupported, setWebContainerSupported] = useState(null);
  
  // Terminal state
  const [terminal, setTerminal] = useState(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  // Logs for debugging
  const [logs, setLogs] = useState([]);
  
  // Add log for debugging
  const addLog = (type, message) => {
    console.log(`[${type}]`, message);
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  // Check if WebContainer is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        // Check if we're in a secure context (HTTPS or localhost)
        const isSecure = window.isSecureContext || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        
        if (!isSecure) {
          setWebContainerSupported(false);
          setError('WebContainer requires HTTPS or localhost environment');
          addLog('error', 'Environment not secure (requires HTTPS or localhost)');
          return;
        }
        
        // Try importing the WebContainer module
        await import('@webcontainer/api');
        setWebContainerSupported(true);
        addLog('info', 'WebContainer API is supported in this browser');
      } catch (err) {
        setWebContainerSupported(false);
        setError(`WebContainer not supported: ${err.message}`);
        addLog('error', `WebContainer API not supported: ${err.message}`);
      }
    };
    
    checkSupport();
  }, []);

  // Initialize WebContainer
  const initWebContainer = async () => {
    if (initialized) {
      addLog('info', 'WebContainer already initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    addLog('info', 'Starting WebContainer initialization...');
    
    try {
      // Boot WebContainer
      const { WebContainer } = await import('@webcontainer/api');
      addLog('info', 'WebContainer module imported successfully');
      
      const wc = await WebContainer.boot();
      setWebcontainer(wc);
      addLog('success', 'WebContainer booted successfully');
      
      // Setup minimal file system
      await setupBaseFileSystem(wc);
      
      // Create terminal
      createTerminal(wc);
      
      setInitialized(true);
      setLoading(false);
      addLog('success', 'WebContainer fully initialized');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize WebContainer: ${errorMsg}`);
      addLog('error', `WebContainer initialization failed: ${errorMsg}`);
      setLoading(false);
    }
  };

  // Setup a minimal file system
  const setupBaseFileSystem = async (wc) => {
    addLog('info', 'Setting up basic file system...');
    
    try {
      // Create a minimal file structure
      const files = {
        'index.html': {
          file: {
            contents: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>WebContainer Demo</title>
</head>
<body>
  <h1>WebContainer is running!</h1>
  <p>This is a simple demo page.</p>
</body>
</html>`
          }
        }
      };
      
      // Mount files to WebContainer
      await wc.mount(files);
      addLog('success', 'Files mounted successfully');
    } catch (err) {
      addLog('error', `Error mounting files: ${err.message}`);
      throw err;
    }
  };

  // Create and set up a terminal
  const createTerminal = (wc) => {
    addLog('info', 'Creating terminal...');
    
    try {
      // Create a new terminal
      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 14,
        theme: {
          background: '#1e1e1e',
          foreground: '#ffffff',
          cursor: '#ffffff',
          selection: 'rgba(255, 255, 255, 0.3)',
        }
      });
      
      // Add the fit addon for terminal resizing
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;
      
      // Store the terminal instance
      setTerminal(term);
      
      // Open terminal after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (terminalRef.current) {
          term.open(terminalRef.current);
          fitAddon.fit();
          
          // Connect terminal to shell process
          connectTerminalToShell(wc, term);
          
          addLog('success', 'Terminal created and opened successfully');
        } else {
          addLog('error', 'Terminal DOM element not found');
        }
      }, 100);
    } catch (err) {
      addLog('error', `Failed to create terminal: ${err.message}`);
    }
  };

  // Connect terminal to a shell process
  const connectTerminalToShell = async (wc, term) => {
    try {
      addLog('info', 'Starting shell process...');
      
      // Try to spawn a bash shell first
      const shellProcess = await wc.spawn('bash')
        .catch(() => {
          addLog('info', 'Bash not available, falling back to sh');
          return wc.spawn('sh');
        });
      
      addLog('success', 'Shell process started');
      
      // Handle input from terminal to shell
      const input = shellProcess.input.getWriter();
      term.onData((data) => {
        input.write(data);
      });
      
      // Handle output from shell to terminal
      shellProcess.output.pipeTo(
        new WritableStream({
          write(data) {
            term.write(data);
          }
        })
      );
      
      // Handle terminal dispose
      term.onDispose(() => {
        input.close();
        addLog('info', 'Terminal disposed');
      });
      
      // Write welcome message
      term.writeln('\r\n\x1b[1;32mWebContainer Shell Ready!\x1b[0m');
      term.writeln('Type commands to interact with the file system.');
      term.writeln('For example: ls, cat index.html, etc.\r\n');
      
    } catch (err) {
      term.writeln('\r\n\x1b[1;31mFailed to start shell process.\x1b[0m');
      term.writeln(`Error: ${err.message}`);
      addLog('error', `Shell connection error: ${err.message}`);
    }
  };

  // Handle window resize to fit terminal
  useEffect(() => {
    const handleResize = () => {
      if (fitAddonRef.current) {
        try {
          fitAddonRef.current.fit();
        } catch (err) {
          // Terminal might be disposed
        }
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (terminal) {
        terminal.dispose();
      }
    };
  }, [terminal]);

  // Render the debugging logs panel
  const renderLogs = () => (
    <div className="bg-black bg-opacity-90 border-t border-gray-700 text-xs h-28 overflow-y-auto">
      <div className="p-2">
        <h3 className="text-white font-bold">Debug Logs:</h3>
        {logs.map((log, i) => (
          <div 
            key={i} 
            className={`py-0.5 ${
              log.type === 'error' ? 'text-red-400' : 
              log.type === 'success' ? 'text-green-400' : 
              'text-gray-300'
            }`}
          >
            [{new Date(log.timestamp).toLocaleTimeString()}] {log.message}
          </div>
        ))}
      </div>
    </div>
  );

  // Handle checking WebContainer support status
  if (webContainerSupported === null) {
    return (
      <div className="h-full flex flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-700 p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Checking WebContainer support...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle unsupported environments
  if (webContainerSupported === false) {
    return (
      <div className="h-full flex flex-col bg-gray-900 text-white">
        <div className="border-b border-gray-700 p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="text-xl font-bold">WebContainer API Not Supported</p>
            <p className="mt-2">Your browser does not support the WebContainer API.</p>
            <p className="mt-1">Please use Chrome or Edge with HTTPS or localhost.</p>
            {error && <p className="mt-2 text-sm">{error}</p>}
          </div>
        </div>
        {renderLogs()}
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-900 text-white">
      {/* Header with controls */}
      <div className="border-b border-gray-700 p-2 flex justify-between items-center">
        <span className="font-medium">WebContainer Preview</span>
        <div className="flex space-x-2">
          {!initialized ? (
            <button
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm flex items-center"
              onClick={initWebContainer}
              disabled={loading}
              title="Start WebContainer"
            >
              <Power size={16} className="mr-1" /> Start
            </button>
          ) : (
            <>
              <button
                className="p-1 text-gray-400 hover:text-white rounded-sm"
                onClick={() => window.location.reload()}
                title="Refresh"
              >
                <RefreshCcw size={16} />
              </button>
              <button
                className="p-1 text-red-400 hover:text-red-500 rounded-sm"
                onClick={() => {
                  if (terminal) terminal.dispose();
                  setInitialized(false);
                  setWebcontainer(null);
                  addLog('info', 'WebContainer shut down');
                }}
                title="Shutdown WebContainer"
              >
                <Power size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {!initialized ? (
          // Not initialized yet - show start screen
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold">WebContainer Preview</p>
              <p className="mt-2">Click the Start button to initialize the WebContainer.</p>
              <p className="mt-1 text-sm text-gray-400">This will allow you to run and preview your web project.</p>
              {loading && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2">Starting WebContainer...</p>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          // Loading state
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Initializing WebContainer...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="h-full flex items-center justify-center text-red-400">
            <div className="text-center">
              <p className="text-xl font-bold">Error</p>
              <p className="mt-2">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={initWebContainer}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          // Show terminal when initialized
          <div className="h-full flex flex-col">
            <div 
              ref={terminalRef} 
              className="flex-1 p-1"
            />
          </div>
        )}
      </div>
      
      {/* Debug logs panel */}
      {renderLogs()}
    </div>
  );
};

export default WebContainerPanel;
/*import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, RefreshCcw, Play, Maximize2, Minimize2, Layout, Plus, Power } from 'lucide-react';
import 'xterm/css/xterm.css';
import { useTheme } from '@/contexts/ThemeContext';

interface TerminalState {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  containerRef: React.RefObject<HTMLDivElement>;
}

interface WebContainerFileSystem {
  [path: string]: {
    file?: { contents: string };
    directory?: Record<string, never>;
  };
}

const WebContainerPanel: React.FC = () => {
  // State management
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [terminals, setTerminals] = useState<TerminalState[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const [webContainerSupported, setWebContainerSupported] = useState<boolean | null>(null);
  
  // Refs
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const fileChangeDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncedFileId = useRef<string | null>(null);
  
  // Contexts
  const { files, logs, addLogMessage, getFileById } = useFileSystem();
  const { openedTabs, activeTabId } = useEditor();
  const { terminalTheme } = useTheme();

  // Check WebContainer support
  useEffect(() => {
    const checkWebContainerSupport = async () => {
      try {
        await import('@webcontainer/api');
        const isSecureContext = window.isSecureContext;
        const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';
        
        if (isSecureContext || isLocalhost) {
          setWebContainerSupported(true);
        } else {
          setWebContainerSupported(false);
          setError('WebContainer requires HTTPS or localhost environment');
        }
      } catch (err) {
        setWebContainerSupported(false);
      }
    };
    
    checkWebContainerSupport();
  }, []);
  
  // Convert IDE file system to WebContainer format
  const convertFilesToWebContainerFormat = useCallback((fileItems: any[]): WebContainerFileSystem => {
    const result: WebContainerFileSystem = {};
    
    // Process all file system items recursively
    const processItem = (item: any) => {
      // Skip root folder
      if (item.id === 'root') {
        if (item.children) {
          item.children.forEach(processItem);
        }
        return;
      }
      
      // Fix path handling - ensure proper format without duplicate project names
      let relativePath = item.path;
      
      // Remove initial slash if present
      if (relativePath.startsWith('/')) {
        relativePath = relativePath.substring(1);
      }
      
      // Handle file or directory
      if (item.type === 'file') {
        result[relativePath] = {
          file: {
            contents: item.content || '',
          },
        };
      } else if (item.type === 'folder') {
        result[relativePath] = {
          directory: {},
        };
        
        // Process children
        if (item.children && item.children.length > 0) {
          item.children.forEach(processItem);
        }
      }
    };
    
    // Start processing from the root
    fileItems.forEach(processItem);
    
    // Add default index.html if not present
    if (!Object.keys(result).some(path => path.endsWith('index.html'))) {
      result['index.html'] = {
        file: {
          contents: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Web Preview</title>
</head>
<body>
  <h1>Welcome to Web Preview</h1>
  <p>Start by editing files in the editor.</p>
</body>
</html>`,
        },
      };
    }
    
    return result;
  }, []);
  
  // Initialize WebContainer
  const initWebContainer = useCallback(async () => {
    if (initialized && webcontainer) {
      addLogMessage('info', 'WebContainer is already running.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      addLogMessage('info', 'Initializing WebContainer...');
      
      // Lazy load WebContainer API
      const { WebContainer } = await import('@webcontainer/api');
      const wc = await WebContainer.boot();
      setWebcontainer(wc);
      addLogMessage('success', 'WebContainer initialized successfully');
      
      // Set up file system in WebContainer
      await setupFiles(wc);
      
      // Start a dev server
      try {
        const serverUrl = await startDevServer(wc);
        setPreviewURL(serverUrl);
        addLogMessage('success', `Preview server started at ${serverUrl}`);
      } catch (err) {
        addLogMessage('info', 'No package.json found or error starting dev server, using static server');
        // Start a simple static server if there's no package.json
        const staticUrl = await startStaticServer(wc);
        setPreviewURL(staticUrl);
      }
      
      // Create initial terminal
      createTerminal(wc);
      
      setInitialized(true);
      setLoading(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize WebContainer: ${errorMsg}`);
      addLogMessage('error', `WebContainer initialization failed: ${errorMsg}`);
      setLoading(false);
    }
  }, [initialized, webcontainer, addLogMessage]);
  
  // Setup files in WebContainer based on IDE's file system
  const setupFiles = async (wc: WebContainer) => {
    if (!wc) return;
    
    addLogMessage('info', 'Setting up files in WebContainer...');
    
    // Convert IDE file system structure to WebContainer format
    const fileSystemEntries = convertFilesToWebContainerFormat(files);
    
    try {
      // Mount all files to the WebContainer
      await wc.mount(fileSystemEntries);
      addLogMessage('success', 'Files mounted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLogMessage('error', `Error mounting files: ${errorMsg}`);
      throw err;
    }
  };
  
  // Start a development server if package.json exists
  const startDevServer = async (wc: WebContainer) => {
    try {
      // Check if package.json exists
      const rootFiles = await wc.fs.readdir('/');
      if (!rootFiles.includes('package.json')) {
        throw new Error('No package.json found');
      }
      
      // Read package.json
      const packageJsonContent = await wc.fs.readFile('package.json', 'utf-8');
      const packageJson = JSON.parse(packageJsonContent);
      
      // Check for script commands
      if (packageJson.scripts) {
        let scriptCommand = '';
        
        // Order of preference for script commands
        if (packageJson.scripts.dev) {
          scriptCommand = 'npm run dev';
        } else if (packageJson.scripts.start) {
          scriptCommand = 'npm run start';
        } else if (packageJson.scripts.serve) {
          scriptCommand = 'npm run serve';
        }
        
        if (scriptCommand) {
          // Install dependencies
          addLogMessage('info', 'Installing dependencies...');
          const installProcess = await wc.spawn('npm', ['install']);
          const installExit = await installProcess.exit;
          
          if (installExit !== 0) {
            throw new Error(`npm install failed with exit code ${installExit}`);
          }
          
          addLogMessage('success', 'Dependencies installed');
          
          // Start dev server
          addLogMessage('info', `Starting dev server with: ${scriptCommand}`);
          const serverProcess = await wc.spawn('sh', ['-c', scriptCommand]);
          
          // Find URL from server logs
          const urlPattern = /(https?:\/\/localhost:[0-9]+)/;
          
          return new Promise<string>((resolve) => {
            // Listen for server output to find URL
            serverProcess.output.pipeTo(new WritableStream({
              write(data) {
                const match = data.match(urlPattern);
                if (match && match[1]) {
                  // Replace localhost with 0.0.0.0 for WebContainer
                  const serverUrl = match[1].replace('localhost', '0.0.0.0');
                  resolve(serverUrl);
                }
              }
            }));
            
            // If no URL found after 5 seconds, use default
            setTimeout(() => {
              resolve('http://0.0.0.0:3000');
            }, 5000);
          });
        }
      }
      
      // Fallback to simple http-server if no suitable script found
      addLogMessage('info', 'No dev script found, using http-server');
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      return 'http://0.0.0.0:3000';
      
    } catch (err) {
      console.error('Error starting dev server:', err);
      throw err;
    }
  };
  
  // Start a simple static server
  const startStaticServer = async (wc: WebContainer) => {
    try {
      addLogMessage('info', 'Starting static server with http-server...');
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      addLogMessage('success', 'Static server started at http://0.0.0.0:3000');
      return 'http://0.0.0.0:3000';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLogMessage('error', `Error starting static server: ${errorMsg}`);
      return null;
    }
  };
  
  // Create a new terminal connected to WebContainer
  const createTerminal = (wc: WebContainer | null = webcontainer) => {
    if (!wc) return;
    
    const id = `term-${Date.now()}`;
    const terminal = new XTerm({
      cursorBlink: true,
      fontFamily: "var(--font-family), 'JetBrains Mono', monospace",
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
    
    setTerminals(prev => [...prev, { id, terminal, fitAddon, containerRef: newTermRef }]);
    setActiveTerminalId(id);
    
    // Set up terminal integration with WebContainer
    setTimeout(() => {
      if (newTermRef.current) {
        terminal.open(newTermRef.current);
        fitAddon.fit();
        
        // Setup shell process
        const setupShell = async () => {
          try {
            // Start a shell in the WebContainer
            const shellProcess = await wc.spawn('bash');
            
            // Set up input from terminal to shell
            const input = shellProcess.input.getWriter();
            
            terminal.onData((data) => {
              input.write(data);
            });
            
            // Set up output from shell to terminal
            shellProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  terminal.write(data);
                }
              })
            );
            
            // Clean up on terminal close
            terminal.onDispose(() => {
              input.close();
            });
          } catch (error) {
            // Try fallback with sh instead of bash
            try {
              const shellProcess = await wc.spawn('sh');
              
              const input = shellProcess.input.getWriter();
              
              terminal.onData((data) => {
                input.write(data);
              });
              
              shellProcess.output.pipeTo(
                new WritableStream({
                  write(data) {
                    terminal.write(data);
                  }
                })
              );
              
              terminal.onDispose(() => {
                input.close();
              });
            } catch (fallbackError) {
              terminal.writeln('\r\n\x1b[1;31mFailed to start shell. Terminal will be in read-only mode.\x1b[0m');
            }
          }
        };
        
        setupShell();
      }
    }, 0);
    
    return { id, terminal, fitAddon, containerRef: newTermRef };
  };
  
  // Efficient file sync with WebContainer - only sync active file when needed
  useEffect(() => {
    if (!webcontainer || !initialized || !activeTabId) return;
    
    // Clear previous debounce timer
    if (fileChangeDebounceRef.current) {
      clearTimeout(fileChangeDebounceRef.current);
    }
    
    // Debounce file changes to prevent excessive operations
    fileChangeDebounceRef.current = setTimeout(async () => {
      const activeTab = openedTabs.find(tab => tab.id === activeTabId);
      if (!activeTab) return;
      
      // Skip if already synced this file recently
      if (lastSyncedFileId.current === activeTabId) return;
      
      const file = getFileById(activeTab.id);
      if (!file || file.type !== 'file') return;
      
      try {
        // Get the relative path by removing initial slash if present
        const relativePath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        
        // Create parent directories if they don't exist
        const dirs = relativePath.split('/');
        dirs.pop(); // Remove filename
        
        if (dirs.length > 0 && dirs[0]) {
          let currentPath = '';
          for (const dir of dirs) {
            if (!dir) continue;
            
            currentPath += currentPath ? `/${dir}` : dir;
            try {
              await webcontainer.fs.mkdir(currentPath, { recursive: true });
            } catch (err) {
              // Directory might already exist, continue
            }
          }
        }
        
        // Write file content
        await webcontainer.fs.writeFile(relativePath, file.content || '');
        lastSyncedFileId.current = activeTabId;
        
        // Reload the preview if it's an HTML file or CSS or JS file
        if (
          relativePath.endsWith('.html') || 
          relativePath.endsWith('.css') || 
          relativePath.endsWith('.js')
        ) {
          refreshPreview();
        }
      } catch (err) {
        console.error('Error syncing file:', err);
      }
    }, 800); // Longer debounce for better performance
    
    return () => {
      if (fileChangeDebounceRef.current) {
        clearTimeout(fileChangeDebounceRef.current);
      }
    };
  }, [webcontainer, initialized, activeTabId, openedTabs, getFileById]);
  
  // Refresh the preview iframe
  const refreshPreview = () => {
    if (iframeRef.current && iframeRef.current.src) {
      iframeRef.current.src = iframeRef.current.src;
    }
  };
  
  // Toggle between terminal and preview
  const toggleView = () => {
    setShowPreview(prev => !prev);
  };
  
  // Toggle maximize
  const toggleMaximize = () => {
    setMaximized(prev => !prev);
  };
  
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
        setActiveTerminalId(null);
      }
    }
  };
  
  // Restart the container
  const restartContainer = async () => {
    if (!webcontainer) return;
    
    setLoading(true);
    addLogMessage('info', 'Restarting WebContainer...');
    
    // Dispose all terminals
    terminals.forEach(term => {
      term.terminal.dispose();
    });
    setTerminals([]);
    
    try {
      // Re-setup files
      await setupFiles(webcontainer);
      
      // Restart server
      try {
        const serverUrl = await startDevServer(webcontainer);
        setPreviewURL(serverUrl);
        addLogMessage('success', `Preview server restarted at ${serverUrl}`);
      } catch (err) {
        const staticUrl = await startStaticServer(webcontainer);
        setPreviewURL(staticUrl);
      }
      
      // Create new terminal
      createTerminal(webcontainer);
      
      setLoading(false);
      addLogMessage('success', 'WebContainer restarted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error restarting WebContainer: ${errorMsg}`);
      addLogMessage('error', `WebContainer restart failed: ${errorMsg}`);
      setLoading(false);
    }
  };
  
  // Shutdown the container to free resources
  const shutdownContainer = () => {
    // Dispose all terminals
    terminals.forEach(term => {
      term.terminal.dispose();
    });
    setTerminals([]);
    setActiveTerminalId(null);
    
    // Clear WebContainer reference
    setWebcontainer(null);
    setInitialized(false);
    setPreviewURL(null);
    
    addLogMessage('info', 'WebContainer shutdown successfully');
  };
  
  // Resize terminals when window resizes
  useEffect(() => {
    const handleResize = () => {
      terminals.forEach(term => {
        try {
          term.fitAddon.fit();
        } catch (err) {
          // Terminal might be disposed already
        }
      });
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [terminals]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      terminals.forEach(term => {
        term.terminal.dispose();
      });
    };
  }, []);
  
  // UI rendering based on state
  if (webContainerSupported === null) {
    return (
      <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
        <div className="border-b border-border p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
            <p className="mt-4">Checking WebContainer support...</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (webContainerSupported === false) {
    return (
      <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
        <div className="border-b border-border p-2 flex justify-between items-center">
          <span className="font-medium">WebContainer Preview</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="text-xl font-bold">WebContainer API Not Supported</p>
            <p className="mt-2">Your browser does not support the WebContainer API.</p>
            <p className="mt-1">Please use Chrome or Edge for this feature.</p>
            {error && <p className="mt-2 text-sm">{error}</p>}
            <div className="mt-4 bg-black bg-opacity-20 p-4 rounded text-white text-sm text-left">
              <p className="font-bold">Troubleshooting:</p>
              <ul className="list-disc pl-5 mt-2">
                <li>Make sure you're using the latest Chrome or Edge browser</li>
                <li>Your site should be served over HTTPS (or localhost)</li>
                <li>Check that you've installed @webcontainer/api package</li>
                <li>Try opening the browser's developer console for more details</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`h-full flex flex-col bg-terminal text-terminal-foreground ${maximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header with controls 
      <div className="border-b border-border p-2 flex justify-between items-center">
        <span className="font-medium">WebContainer Preview</span>
        <div className="flex space-x-2">
          {!initialized ? (
            <button
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm flex items-center"
              onClick={initWebContainer}
              disabled={loading}
              title="Start WebContainer"
            >
              <Power size={16} className="mr-1" /> Start
            </button>
          ) : (
            <>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={toggleView}
                title={showPreview ? "Show Terminal" : "Show Preview"}
              >
                <Layout size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={refreshPreview}
                title="Refresh Preview"
              >
                <RefreshCcw size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={restartContainer}
                title="Restart WebContainer"
              >
                <Play size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={toggleMaximize}
                title={maximized ? "Restore WebContainer" : "Maximize WebContainer"}
              >
                {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                className="p-1 text-red-400 hover:text-red-500 rounded-sm"
                onClick={shutdownContainer}
                title="Shutdown WebContainer"
              >
                <Power size={16} />
              </button>
            </>
          )}
        </div>
      </div>
      
      {/* Content area 
      <div className="flex-1 overflow-hidden">
        {!initialized ? (
          // Not initialized yet
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-xl font-bold">WebContainer Preview</p>
              <p className="mt-2">Click the Start button to initialize the WebContainer.</p>
              <p className="mt-1 text-sm text-slate-400">This will allow you to run and preview your web project.</p>
              {loading && (
                <div className="mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
                  <p className="mt-2">Starting WebContainer...</p>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          // Loading state
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
              <p className="mt-4">Initializing WebContainer...</p>
            </div>
          </div>
        ) : error ? (
          // Error state
          <div className="h-full flex items-center justify-center text-red-400">
            <div className="text-center">
              <p className="text-xl font-bold">Error</p>
              <p className="mt-2">{error}</p>
              <button 
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={restartContainer}
              >
                Try Again
              </button>
            </div>
          </div>
        ) : (
          // Normal state - Preview or Terminal
          <div className="h-full flex flex-col">
            {showPreview ? (
              // Preview
              <div className="h-full">
                {previewURL ? (
                  <iframe 
                    ref={iframeRef}
                    src={previewURL} 
                    className="w-full h-full border-none"
                    title="Web Preview"
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p>No preview available</p>
                  </div>
                )}
              </div>
            ) : (
              // Terminal Tabs & Container
              <div className="h-full flex flex-col">
                {/* Terminal tabs 
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
                        <span className="text-sm">Term {term.id.replace('term-', '').substring(0, 4)}</span>
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
                      onClick={() => createTerminal()}
                      title="New Terminal"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                </div>
                
                {/* Terminal containers 
                <div className="flex-1 relative">
                  {terminals.length === 0 ? (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400">
                      <div className="text-center">
                        <p>No active terminals</p>
                        <button 
                          className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm"
                          onClick={() => createTerminal()}
                        >
                          Create Terminal
                        </button>
                      </div>
                    </div>
                  ) : (
                    terminals.map(term => (
                      <div
                        key={term.id}
                        ref={term.containerRef}
                        className="absolute inset-0 p-2"
                        style={{ display: term.id === activeTerminalId ? 'block' : 'none' }}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebContainerPanel;
*/
