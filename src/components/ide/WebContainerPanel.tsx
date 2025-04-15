import React, { useEffect, useRef, useState, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { Power, RefreshCcw, Play, Maximize2, Minimize2 } from 'lucide-react';
import 'xterm/css/xterm.css';

const WebContainerPanel = () => {
  // Core state
  const [webcontainer, setWebcontainer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [webContainerSupported, setWebContainerSupported] = useState(null);
  const [previewURL, setPreviewURL] = useState(null);
  
  // Terminal state
  const [terminal, setTerminal] = useState(null);
  const terminalRef = useRef(null);
  const fitAddonRef = useRef(null);
  
  // UI state
  const [maximized, setMaximized] = useState(false);
  
  // File system context
  const { files, addLogMessage, getFileById } = useFileSystem();
  
  // Refs for debouncing
  const fileChangeDebounceRef = useRef(null);
  const lastSyncedFileId = useRef(null);
  
  // Logs for debugging
  const [logs, setLogs] = useState([]);
  
  // Add log for debugging
  const addLog = (type, message) => {
    console.log(`[${type}]`, message);
    setLogs(prev => [...prev, { type, message, timestamp: new Date().toISOString() }]);
    
    // Also add to the FileSystem context logs if available
    if (addLogMessage) {
      addLogMessage(type, message);
    }
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

  // Convert IDE file system to WebContainer format
  const convertFilesToWebContainerFormat = useCallback((fileItems) => {
    addLog('info', 'Converting files to WebContainer format...');
    const result = {};
    
    // Process all file system items recursively
    const processItem = (item) => {
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
    
    addLog('info', `Converted ${Object.keys(result).length} files`);
    return result;
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
      
      // Set up file system from the FileSystemContext
      await setupFileSystem(wc);
      
      // Try to start a dev server if there's a package.json
      try {
        const serverUrl = await startDevServer(wc);
        setPreviewURL(serverUrl);
        addLog('success', `Development server started at ${serverUrl}`);
      } catch (err) {
        addLog('info', 'No package.json found or error starting dev server, using static server');
        // Start a simple static server as fallback
        const staticUrl = await startStaticServer(wc);
        setPreviewURL(staticUrl);
      }
      
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

  // Setup file system using the FileSystemContext
  const setupFileSystem = async (wc) => {
    addLog('info', 'Setting up file system from FileSystemContext...');
    
    try {
      // Convert file system to WebContainer format
      const fileSystemEntries = convertFilesToWebContainerFormat(files);
      
      // Log the file structure (for debugging)
      addLog('info', `File system entries: ${Object.keys(fileSystemEntries).join(', ')}`);
      
      // Mount files to WebContainer
      await wc.mount(fileSystemEntries);
      addLog('success', 'Files mounted successfully');
    } catch (err) {
      addLog('error', `Error mounting files: ${err.message}`);
      throw err;
    }
  };

  // Start a development server if package.json exists
  const startDevServer = async (wc) => {
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
          addLog('info', 'Installing dependencies...');
          const installProcess = await wc.spawn('npm', ['install']);
          const installExit = await installProcess.exit;
          
          if (installExit !== 0) {
            throw new Error(`npm install failed with exit code ${installExit}`);
          }
          
          addLog('success', 'Dependencies installed');
          
          // Start dev server
          addLog('info', `Starting dev server with: ${scriptCommand}`);
          const serverProcess = await wc.spawn('sh', ['-c', scriptCommand]);
          
          // Find URL from server logs
          const urlPattern = /(https?:\/\/localhost:[0-9]+)/;
          
          return new Promise((resolve) => {
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
      addLog('info', 'No dev script found, using http-server');
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      return 'http://0.0.0.0:3000';
      
    } catch (err) {
      console.error('Error starting dev server:', err);
      throw err;
    }
  };

  // Start a simple static server
  const startStaticServer = async (wc) => {
    try {
      addLog('info', 'Starting static server with http-server...');
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      addLog('success', 'Static server started at http://0.0.0.0:3000');
      return 'http://0.0.0.0:3000';
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLog('error', `Error starting static server: ${errorMsg}`);
      return null;
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
          addLog('info', 'Opening terminal...');
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
      
      let shellProcess;
      try {
        // Try to spawn a bash shell first
        shellProcess = await wc.spawn('bash');
        addLog('info', 'Using bash shell');
      } catch (err) {
        // Fall back to sh if bash is not available
        addLog('info', 'Bash not available, falling back to sh');
        shellProcess = await wc.spawn('sh');
      }
      
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

  // Sync files when they change
  useEffect(() => {
    if (!webcontainer || !initialized || !files.length) return;
    
    addLog('info', 'Setting up file system sync...');
    
    // Function to synchronize a file with WebContainer
    const syncFileToWebContainer = async (file) => {
      if (!file || file.type !== 'file') return;
      
      try {
        const relativePath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        
        // Create parent directories if they don't exist
        const dirs = relativePath.split('/');
        dirs.pop(); // Remove filename
        
        if (dirs.length > 0) {
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
        addLog('info', `Synced file: ${relativePath}`);
      } catch (err) {
        addLog('error', `Error syncing file ${file.path}: ${err.message}`);
      }
    };
    
    // Initial sync for all files
    const initialSync = async () => {
      // Recursive function to process files
      const processFiles = async (items) => {
        for (const item of items) {
          if (item.type === 'file') {
            await syncFileToWebContainer(item);
          } else if (item.type === 'folder' && item.children) {
            await processFiles(item.children);
          }
        }
      };
      
      await processFiles(files);
      addLog('success', 'Initial file sync complete');
    };
    
    initialSync();
  }, [webcontainer, initialized, files]);

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

  // Toggle maximize
  const toggleMaximize = () => {
    setMaximized(prev => !prev);
  };

  // Refresh the preview
  const refreshPreview = () => {
    if (previewURL) {
      addLog('info', 'Refreshing preview...');
      const iframe = document.querySelector('iframe');
      if (iframe) {
        iframe.src = iframe.src;
      }
    }
  };

  // Restart the WebContainer
  const restartContainer = async () => {
    if (!webcontainer) return;
    
    setLoading(true);
    addLog('info', 'Restarting WebContainer...');
    
    // Clean up existing terminal
    if (terminal) {
      terminal.dispose();
      setTerminal(null);
    }
    
    try {
      // Re-setup file system
      await setupFileSystem(webcontainer);
      
      // Restart server
      try {
        const serverUrl = await startDevServer(webcontainer);
        setPreviewURL(serverUrl);
        addLog('success', `Preview server restarted at ${serverUrl}`);
      } catch (err) {
        const staticUrl = await startStaticServer(webcontainer);
        setPreviewURL(staticUrl);
      }
      
      // Create new terminal
      createTerminal(webcontainer);
      
      setLoading(false);
      addLog('success', 'WebContainer restarted successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error restarting WebContainer: ${errorMsg}`);
      addLog('error', `WebContainer restart failed: ${errorMsg}`);
      setLoading(false);
    }
  };

  // Shutdown the WebContainer
  const shutdownContainer = () => {
    if (terminal) {
      terminal.dispose();
      setTerminal(null);
    }
    
    setWebcontainer(null);
    setInitialized(false);
    setPreviewURL(null);
    
    addLog('info', 'WebContainer shutdown successfully');
  };

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

  // Handle unsupported environments
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
            <p className="mt-1">Please use Chrome or Edge with HTTPS or localhost.</p>
            {error && <p className="mt-2 text-sm">{error}</p>}
          </div>
        </div>
        {renderLogs()}
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-terminal text-terminal-foreground ${maximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header with controls */}
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
      
      {/* Main content area */}
      <div className="flex-1 overflow-hidden relative">
        {!initialized ? (
          // Not initialized yet - show start screen
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
          // Terminal display
          <div className="h-full flex flex-col">
            <div className="flex-1 relative">
              {previewURL && (
                <div className="absolute inset-0" style={{ display: 'none' }}>
                  <iframe 
                    src={previewURL} 
                    className="w-full h-full border-none"
                    title="Web Preview"
                  />
                </div>
              )}
              <div 
                ref={terminalRef} 
                className="absolute inset-0 p-1"
              />
            </div>
          </div>
        )}
      </div>
      
      {/* Debug logs panel */}
      {renderLogs()}
    </div>
  );
};

export default WebContainerPanel;
