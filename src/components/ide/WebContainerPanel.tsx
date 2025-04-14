// src/components/ide/WebContainerPanel.tsx
import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { X, RefreshCcw, Play, Maximize2, Minimize2, Layout, Plus } from 'lucide-react';
import 'xterm/css/xterm.css';
import { useTheme } from '@/contexts/ThemeContext';

interface TerminalState {
  id: string;
  terminal: XTerm;
  fitAddon: FitAddon;
  containerRef: React.RefObject<HTMLDivElement>;
}

const WebContainerPanel: React.FC = () => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<boolean>(true);
  const [terminals, setTerminals] = useState<TerminalState[]>([]);
  const [activeTerminalId, setActiveTerminalId] = useState<string | null>(null);
  const [maximized, setMaximized] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { files, logs, addLogMessage, getFileById } = useFileSystem();
  const { openedTabs, activeTabId } = useEditor();
  const { terminalTheme } = useTheme();
  
  // Initialize WebContainer
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        setLoading(true);
        // Loading WebContainer
        addLogMessage('info', 'Initializing WebContainer...');
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
          addLogMessage('info', 'No package.json found, using static server');
          // Start a simple static server if there's no package.json
          const staticUrl = await startStaticServer(wc);
          setPreviewURL(staticUrl);
        }
        
        // Create initial terminal
        createTerminal(wc);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to initialize WebContainer:', err);
        setError(`Failed to initialize WebContainer: ${err instanceof Error ? err.message : String(err)}`);
        addLogMessage('error', `WebContainer initialization failed: ${err instanceof Error ? err.message : String(err)}`);
        setLoading(false);
      }
    };
    
    initWebContainer();
    
    // Cleanup function
    return () => {
      terminals.forEach(term => {
        term.terminal.dispose();
      });
    };
  }, []);
  
  // Setup files in WebContainer based on IDE's file system
  const setupFiles = async (wc: WebContainer) => {
    if (!wc) return;
    
    addLogMessage('info', 'Setting up files in WebContainer...');
    
    // Convert our file system structure to the format expected by WebContainer
    const fileSystemEntries = await convertFilesToWebContainerFormat(files);
    
    try {
      // Mount all files to the WebContainer
      await wc.mount(fileSystemEntries);
      addLogMessage('success', 'Files mounted successfully');
    } catch (err) {
      console.error('Error mounting files:', err);
      addLogMessage('error', `Error mounting files: ${err instanceof Error ? err.message : String(err)}`);
      throw err;
    }
  };
  
  // Convert our file system structure to WebContainer format
  const convertFilesToWebContainerFormat = async (fileItems: any[]) => {
    const result: any = {};
    
    // Recursive function to convert file tree
    const processItems = (items: any[], parentPath = '') => {
      for (const item of items) {
        const relativePath = item.path.startsWith('/') ? item.path.substring(1) : item.path;
        
        if (item.type === 'file') {
          // For files, store the content
          result[relativePath] = {
            file: {
              contents: item.content || '',
            },
          };
        } else if (item.type === 'folder' && item.children) {
          // For folders, create a directory entry
          result[relativePath] = {
            directory: {},
          };
          
          // Process children
          if (item.children && item.children.length > 0) {
            processItems(item.children, relativePath);
          }
        }
      }
    };
    
    processItems(fileItems);
    
    // Add default files if needed
    if (!result['index.html']) {
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
  };
  
  // Start a development server if package.json exists
  const startDevServer = async (wc: WebContainer) => {
    try {
      // Check if package.json exists
      const packageJsonFiles = await wc.fs.readdir('/');
      if (!packageJsonFiles.includes('package.json')) {
        throw new Error('No package.json found');
      }
      
      // Read package.json
      const packageJsonContent = await wc.fs.readFile('/package.json', 'utf-8');
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
          
          // Wait for installation to complete
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
                console.log('Server output:', data);
                const match = data.match(urlPattern);
                if (match && match[1]) {
                  // Replace localhost with 0.0.0.0 for WebContainer
                  const serverUrl = match[1].replace('localhost', '0.0.0.0');
                  resolve(serverUrl);
                }
              }
            }));
            
            // If no URL found after 10 seconds, use default
            setTimeout(() => {
              resolve('http://0.0.0.0:3000');
            }, 10000);
          });
        }
      }
      
      // Fallback to simple http-server if no suitable script found
      addLogMessage('info', 'No dev script found, using http-server');
      const serverProcess = await wc.spawn('npx', ['http-server', '-p', '3000']);
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
      
      // Install http-server globally if not installed
      const installProcess = await wc.spawn('npm', ['install', '-g', 'http-server']);
      await installProcess.exit;
      
      // Start http-server
      const serverProcess = await wc.spawn('http-server', ['-p', '3000']);
      
      addLogMessage('success', 'Static server started at http://0.0.0.0:3000');
      return 'http://0.0.0.0:3000';
    } catch (err) {
      console.error('Error starting static server:', err);
      addLogMessage('error', `Error starting static server: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  };
  
  // Create a new terminal connected to WebContainer
  const createTerminal = (wc: WebContainer | null = webcontainer) => {
    if (!wc) return;
    
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
            console.error('Failed to start shell:', error);
            terminal.writeln('\r\n\x1b[1;31mFailed to start shell. Trying fallback...\x1b[0m');
            
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
              console.error('Fallback shell also failed:', fallbackError);
              terminal.writeln('\r\n\x1b[1;31mFailed to start shell. Terminal will be in read-only mode.\x1b[0m');
            }
          }
        };
        
        setupShell();
      }
    }, 0);
    
    return { id, terminal, fitAddon, containerRef: newTermRef };
  };
  
  // Handle file changes for syncing with WebContainer
  useEffect(() => {
    if (!webcontainer) return;
    
    // Sync the currently active file when it's saved
    const syncActiveFile = async () => {
      if (!activeTabId) return;
      const activeTab = openedTabs.find(tab => tab.id === activeTabId);
      if (!activeTab) return;
      
      const file = getFileById(activeTab.id);
      if (!file || file.type !== 'file') return;
      
      try {
        // Get the relative path by removing initial slash if present
        const relativePath = file.path.startsWith('/') ? file.path.substring(1) : file.path;
        
        // Create parent directories if they don't exist
        const dirs = relativePath.split('/');
        dirs.pop(); // Remove filename
        
        let currentPath = '';
        for (const dir of dirs) {
          if (!dir) continue;
          
          currentPath += dir + '/';
          try {
            await webcontainer.fs.mkdir(currentPath, { recursive: true });
          } catch (err) {
            // Directory might already exist, continue
          }
        }
        
        // Write file content
        await webcontainer.fs.writeFile(relativePath, file.content || '');
        
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
        addLogMessage('error', `Error syncing file: ${err instanceof Error ? err.message : String(err)}`);
      }
    };
    
    syncActiveFile();
  }, [openedTabs, activeTabId, webcontainer]);
  
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
        // Create a new terminal if we closed the last one
        createTerminal();
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
      console.error('Error restarting WebContainer:', err);
      setError(`Error restarting WebContainer: ${err instanceof Error ? err.message : String(err)}`);
      addLogMessage('error', `WebContainer restart failed: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
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
  
  // If WebContainer API is not supported
  if (typeof window !== 'undefined' && window.WebContainer === undefined) {
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
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
      {/* Header with controls */}
      <div className="border-b border-border p-2 flex justify-between items-center">
        <span className="font-medium">WebContainer Preview</span>
        <div className="flex space-x-2">
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
        </div>
      </div>
      
      {/* Content area */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
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
                {/* Terminal tabs */}
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
                      onClick={() => createTerminal()}
                      title="New Terminal"
                    >
                      <Plus size={16} />
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
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WebContainerPanel;
