
import React, { useEffect, useRef, useState } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Terminal as XTerm } from 'xterm';
import { FitAddon } from 'xterm-addon-fit';
import { RefreshCcw, Power, Maximize2, Minimize2 } from 'lucide-react';
import 'xterm/css/xterm.css';

/**
 * WebContainerPanel - A component that provides a terminal interface
 * connected to a WebContainer instance for executing commands and
 * running a development server.
 */
const WebContainerPanel = () => {
  // Core state
  const [webcontainer, setWebcontainer] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [webContainerSupported, setWebContainerSupported] = useState<boolean | null>(null);
  const [previewURL, setPreviewURL] = useState<string | null>(null);
  
  // Terminal state
  const [terminal, setTerminal] = useState<XTerm | null>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const shellProcessRef = useRef<any>(null);
  const shellInputRef = useRef<any>(null);
  
  // UI state
  const [maximized, setMaximized] = useState(false);
  
  // File system context
  const { files, addLogMessage } = useFileSystem();

  // Check if WebContainer is supported
  useEffect(() => {
    const checkSupport = async () => {
      try {
        const isSecure = window.isSecureContext || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
        
        if (!isSecure) {
          setWebContainerSupported(false);
          setError('WebContainer requires HTTPS or localhost environment');
          addLogMessage('error', 'Environment not secure (requires HTTPS or localhost)');
          return;
        }
        
        await import('@webcontainer/api');
        setWebContainerSupported(true);
        addLogMessage('info', 'WebContainer API is supported in this browser');
      } catch (err: any) {
        setWebContainerSupported(false);
        setError(`WebContainer not supported: ${err.message}`);
        addLogMessage('error', `WebContainer API not supported: ${err.message}`);
      }
    };
    
    checkSupport();
  }, [addLogMessage]);

  // Convert IDE file system to WebContainer format
  const convertFilesToWebContainerFormat = (fileItems: any[]) => {
    addLogMessage('info', 'Converting files to WebContainer format');
    
    const result: Record<string, any> = {};
    
    // Find the root project folder name to remove from paths
    let rootProjectName = '';
    if (fileItems.length > 0 && fileItems[0].id === 'root' && fileItems[0].name) {
      rootProjectName = fileItems[0].name;
    }
    
    // Process all file system items recursively
    const processItems = (items: any[]) => {
      for (const item of items) {
        // Skip the root itself
        if (item.id === 'root') {
          if (item.children) {
            processItems(item.children);
          }
          continue;
        }
        
        // Extract the path without the project name prefix
        let relativePath = item.path;
        
        // Remove leading slash if present
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
        
        // Remove project name prefix if present
        if (rootProjectName && relativePath.startsWith(rootProjectName + '/')) {
          relativePath = relativePath.substring(rootProjectName.length + 1);
        }
        
        // Handle files
        if (item.type === 'file') {
          result[relativePath] = {
            file: {
              contents: item.content || '',
            },
          };
        } 
        // Handle directories
        else if (item.type === 'folder') {
          // Create the directory entry
          result[relativePath] = {
            directory: {},
          };
          
          // Process children
          if (item.children && item.children.length > 0) {
            processItems(item.children);
          }
        }
      }
    };
    
    // Start processing from all items
    processItems(fileItems);
    
    // Add default index.html if not present
    if (!Object.keys(result).some(path => path === 'index.html' || path.endsWith('/index.html'))) {
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

  // Initialize WebContainer
  const initWebContainer = async () => {
    if (initialized) {
      addLogMessage('info', 'WebContainer already initialized');
      return;
    }
    
    setLoading(true);
    setError(null);
    addLogMessage('info', 'Starting WebContainer initialization');
    
    try {
      // Boot WebContainer
      const { WebContainer } = await import('@webcontainer/api');
      
      const wc = await WebContainer.boot();
      setWebcontainer(wc);
      addLogMessage('success', 'WebContainer booted successfully');
      
      // Set up file system from the FileSystemContext
      await setupFileSystem(wc);
      
      // Create terminal first so user can see output during installation
      createTerminal(wc);
      
      // Give the terminal a moment to initialize before running commands
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (terminal) {
        terminal.writeln('\r\n\x1b[1;32mTerminal ready. Processing project files...\x1b[0m\r\n');
      }
      
      // Create a basic starter package.json if none exists
      try {
        await wc.fs.readFile('package.json', 'utf-8');
      } catch (err) {
        // No package.json found, create a basic one
        if (terminal) {
          terminal.writeln('\r\n\x1b[1;33mNo package.json found. Creating a basic one...\x1b[0m\r\n');
        }
        
        const basicPackageJson = {
          name: "web-project",
          version: "1.0.0",
          description: "Web project in WebContainer",
          type: "module",
          scripts: {
            start: "npx http-server -p 3000 --no-dotfiles"
          }
        };
        
        await wc.fs.writeFile('package.json', JSON.stringify(basicPackageJson, null, 2));
        
        if (terminal) {
          terminal.writeln('\x1b[1;32mCreated package.json\x1b[0m\r\n');
        }
      }
      
      // Try to start a dev server if there's a package.json
      try {
        const serverUrl = await startDevServer(wc);
        setPreviewURL(serverUrl);
      } catch (err) {
        addLogMessage('info', 'Using static server instead of dev server');
        if (terminal) {
          terminal.writeln('\r\n\x1b[1;33mFalling back to static server...\x1b[0m\r\n');
        }
        const staticUrl = await startStaticServer(wc);
        setPreviewURL(staticUrl);
      }
      
      setInitialized(true);
      setLoading(false);
      addLogMessage('success', 'WebContainer fully initialized');
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Failed to initialize WebContainer: ${errorMsg}`);
      addLogMessage('error', `WebContainer initialization failed: ${errorMsg}`);
      setLoading(false);
    }
  };

  // Setup file system using the FileSystemContext
  const setupFileSystem = async (wc: any) => {
    try {
      // Convert file system to WebContainer format
      const fileSystemEntries = convertFilesToWebContainerFormat(files);
      
      // Mount files to WebContainer
      await wc.mount(fileSystemEntries);
      addLogMessage('success', 'Files mounted successfully');
    } catch (err: any) {
      addLogMessage('error', `Error mounting files: ${err.message}`);
      throw err;
    }
  };

  // Start a development server if package.json exists
  const startDevServer = async (wc: any) => {
    try {
      // Check if package.json exists
      const rootFiles = await wc.fs.readdir('/');
      
      if (!rootFiles.includes('package.json')) {
        throw new Error('No package.json found');
      }
      
      // Read package.json
      const packageJsonContent = await wc.fs.readFile('package.json', 'utf-8');
      let packageJson;
      
      try {
        packageJson = JSON.parse(packageJsonContent);
      } catch (e) {
        throw new Error('Invalid package.json');
      }
      
      // Special handling for package names with hyphens (if needed)
      if (packageJson.dependencies) {
        let modified = false;
        // Log all hyphenated packages so we can see them in the terminal output
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          if (name.includes('-') && !name.startsWith('@')) {
            addLogMessage('info', `Found hyphenated package: ${name}`);
            if (terminal) {
              terminal.write(`\r\nFound hyphenated package: ${name}\r\n`);
            }
          }
        }
        
        // Make sure package.json is properly formatted
        await wc.fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
      }
      
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
          addLogMessage('info', 'Installing dependencies');
          
          if (terminal) {
            terminal.write('\r\n\x1b[1;33mInstalling dependencies...\x1b[0m\r\n');
          }
          
          try {
            // Run npm install with shell to properly handle package names
            const installProcess = await wc.spawn('sh', ['-c', 'npm install --no-audit --no-fund']);
            
            // Pipe output to terminal for visibility
            installProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (terminal) {
                    terminal.write(data);
                  }
                }
              })
            );
            
            const installExit = await installProcess.exit;
            
            if (installExit !== 0) {
              throw new Error(`npm install failed with exit code ${installExit}`);
            }
          } catch (err: any) {
            if (terminal) {
              terminal.write(`\r\n\x1b[1;31mInstallation error: ${err.message}\x1b[0m\r\n`);
              // Try an alternative approach for troublesome packages
              terminal.write('\r\n\x1b[1;33mTrying alternative installation approach...\x1b[0m\r\n');
              
              // Try with --legacy-peer-deps which sometimes helps with dependency issues
              const fallbackProcess = await wc.spawn('sh', ['-c', 'npm install --legacy-peer-deps --no-audit --no-fund']);
              fallbackProcess.output.pipeTo(
                new WritableStream({
                  write(data) {
                    if (terminal) {
                      terminal.write(data);
                    }
                  }
                })
              );
              
              const fallbackExit = await fallbackProcess.exit;
              if (fallbackExit !== 0) {
                throw new Error(`Alternative npm install failed with exit code ${fallbackExit}`);
              }
            } else {
              throw err;
            }
          }
          
          addLogMessage('success', 'Dependencies installed');
          
          if (terminal) {
            terminal.write('\r\n\x1b[1;32mDependencies installed successfully\x1b[0m\r\n');
            terminal.write(`\r\nStarting dev server with: ${scriptCommand}\r\n\r\n`);
          }
          
          // Start dev server
          addLogMessage('info', `Starting dev server with: ${scriptCommand}`);
          const serverProcess = await wc.spawn('sh', ['-c', scriptCommand]);
          
          // Find URL from server logs
          const urlPattern = /(https?:\/\/localhost:[0-9]+)/;
          
          return new Promise<string>((resolve) => {
            // Listen for server output to find URL
            serverProcess.output.pipeTo(
              new WritableStream({
                write(data) {
                  if (terminal) {
                    terminal.write(data);
                  }
                  
                  const match = data.match(urlPattern);
                  if (match && match[1]) {
                    // Replace localhost with 0.0.0.0 for WebContainer
                    const serverUrl = match[1].replace('localhost', '0.0.0.0');
                    resolve(serverUrl);
                  }
                }
              })
            );
            
            // If no URL found after 5 seconds, use default
            setTimeout(() => {
              resolve('http://0.0.0.0:3000');
            }, 5000);
          });
        }
      }
      
      // Fallback to simple http-server if no suitable script found
      addLogMessage('info', 'No dev script found, using http-server');
      
      if (terminal) {
        terminal.write('\r\n\x1b[1;33mNo dev script found, using http-server\x1b[0m\r\n');
      }
      
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      return 'http://0.0.0.0:3000';
    } catch (err: any) {
      addLogMessage('error', `Error starting dev server: ${err.message}`);
      if (terminal) {
        terminal.write(`\r\n\x1b[1;31mError starting dev server: ${err.message}\x1b[0m\r\n`);
      }
      throw err;
    }
  };

  // Start a simple static server
  const startStaticServer = async (wc: any) => {
    try {
      addLogMessage('info', 'Starting static server with http-server');
      
      if (terminal) {
        terminal.write('\r\n\x1b[1;33mStarting static server with http-server\x1b[0m\r\n');
      }
      
      await wc.spawn('npx', ['http-server', '-p', '3000', '--no-dotfiles']);
      
      addLogMessage('success', 'Static server started at http://0.0.0.0:3000');
      
      if (terminal) {
        terminal.write('\r\n\x1b[1;32mStatic server started at http://0.0.0.0:3000\x1b[0m\r\n');
      }
      
      return 'http://0.0.0.0:3000';
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      addLogMessage('error', `Error starting static server: ${errorMsg}`);
      
      if (terminal) {
        terminal.write(`\r\n\x1b[1;31mError starting static server: ${errorMsg}\x1b[0m\r\n`);
      }
      
      return null;
    }
  };

  // Create and set up a terminal
  const createTerminal = (wc: any) => {
    addLogMessage('info', 'Creating terminal');
    
    try {
      // Create a new terminal with improved settings
      const term = new XTerm({
        cursorBlink: true,
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Menlo', monospace",
        fontSize: 14,
        lineHeight: 1.2,
        scrollback: 1000,
        theme: {
          background: '#1a1e26',
          foreground: '#e0e0e0',
          cursor: '#f0f0f0',
          selectionBackground: 'rgba(255, 255, 255, 0.3)',
          black: '#000000',
          red: '#e06c75',
          green: '#98c379',
          yellow: '#e5c07b',
          blue: '#61afef',
          magenta: '#c678dd',
          cyan: '#56b6c2',
          white: '#d0d0d0',
          brightBlack: '#808080',
          brightRed: '#f44747',
          brightGreen: '#b5cea8',
          brightYellow: '#dcdcaa',
          brightBlue: '#569cd6',
          brightMagenta: '#c586c0',
          brightCyan: '#9cdcfe',
          brightWhite: '#ffffff'
        }
      });
      
      // Add the fit addon for terminal resizing
      const fitAddon = new FitAddon();
      term.loadAddon(fitAddon);
      fitAddonRef.current = fitAddon;
      
      // We can add more addons here if needed in the future
      // For now, keeping it simple with just the fit addon
      
      // Store the terminal instance
      setTerminal(term);
      
      // Open terminal after a short delay to ensure DOM is ready
      setTimeout(() => {
        if (terminalRef.current) {
          term.open(terminalRef.current);
          fitAddon.fit();
          
          // Connect terminal to shell process
          connectTerminalToShell(wc, term);
          
          addLogMessage('success', 'Terminal created and opened successfully');
        } else {
          addLogMessage('error', 'Terminal DOM element not found');
        }
      }, 100);
    } catch (err: any) {
      addLogMessage('error', `Failed to create terminal: ${err.message}`);
    }
  };

  // Connect terminal to a shell process
  const connectTerminalToShell = async (wc: any, term: XTerm) => {
    try {
      addLogMessage('info', 'Starting shell process');
      
      let shellProcess;
      try {
        // Try to spawn a bash shell first
        shellProcess = await wc.spawn('bash');
        addLogMessage('info', 'Using bash shell');
      } catch (err) {
        // Fall back to sh if bash is not available
        addLogMessage('info', 'Bash not available, falling back to sh');
        shellProcess = await wc.spawn('sh');
      }
      
      shellProcessRef.current = shellProcess;
      addLogMessage('success', 'Shell process started');
      
      // Handle input from terminal to shell
      const input = shellProcess.input.getWriter();
      shellInputRef.current = input;
      
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
      
      // Clean up when terminal is disposed
      // We'll handle this in the useEffect cleanup function
      
      // Write welcome message
      term.writeln('\r\n\x1b[1;32mWebContainer Terminal\x1b[0m');
      term.writeln('Type commands to interact with the filesystem.\r\n');
      
    } catch (err: any) {
      term.writeln('\r\n\x1b[1;31mFailed to start shell process.\x1b[0m');
      term.writeln(`Error: ${err.message}`);
      addLogMessage('error', `Shell connection error: ${err.message}`);
    }
  };

  // Sync files when they change
  useEffect(() => {
    if (!webcontainer || !initialized || !files.length) return;
    
    const syncFileToWebContainer = async (file: any) => {
      if (!file || file.type !== 'file' || !webcontainer) return;
      
      try {
        // Extract the correct path
        let relativePath = file.path;
        
        // Remove leading slash if present
        if (relativePath.startsWith('/')) {
          relativePath = relativePath.substring(1);
        }
        
        // Remove project name prefix if present
        let rootProjectName = '';
        if (files.length > 0 && files[0].id === 'root' && files[0].name) {
          rootProjectName = files[0].name;
        }
        
        if (rootProjectName && relativePath.startsWith(rootProjectName + '/')) {
          relativePath = relativePath.substring(rootProjectName.length + 1);
        }
        
        // Create parent directories if needed
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
      } catch (err: any) {
        addLogMessage('error', `Error syncing file ${file.path}: ${err.message}`);
      }
    };
    
    // Initial sync for all files
    const initialSync = async () => {
      // Recursive function to process files
      const processFiles = async (items: any[]) => {
        for (const item of items) {
          if (item.type === 'file') {
            await syncFileToWebContainer(item);
          } else if (item.type === 'folder' && item.children) {
            await processFiles(item.children);
          }
        }
      };
      
      await processFiles(files);
      addLogMessage('success', 'Initial file sync complete');
    };
    
    initialSync();
  }, [webcontainer, initialized, files, addLogMessage]);

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
      if (shellInputRef.current) {
        shellInputRef.current.close();
        addLogMessage('info', 'Terminal disposed');
      }
    };
  }, [terminal, addLogMessage]);

  // Toggle maximize/minimize the panel
  const toggleMaximize = () => setMaximized(prev => !prev);

  // Refresh the preview
  const refreshPreview = () => {
    if (previewURL) {
      addLogMessage('info', 'Refreshing preview');
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
    addLogMessage('info', 'Restarting WebContainer');
    
    // Clean up existing terminal
    if (terminal) {
      terminal.dispose();
      setTerminal(null);
    }
    
    try {
      // Re-setup file system
      await setupFileSystem(webcontainer);
      
      // Create new terminal
      createTerminal(webcontainer);
      
      // Restart server
      try {
        const serverUrl = await startDevServer(webcontainer);
        setPreviewURL(serverUrl);
        addLogMessage('success', `Preview server restarted at ${serverUrl}`);
      } catch (err) {
        const staticUrl = await startStaticServer(webcontainer);
        setPreviewURL(staticUrl);
      }
      
      setLoading(false);
      addLogMessage('success', 'WebContainer restarted successfully');
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`Error restarting WebContainer: ${errorMsg}`);
      addLogMessage('error', `WebContainer restart failed: ${errorMsg}`);
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
    
    addLogMessage('info', 'WebContainer shutdown successfully');
  };

  // Handle checking WebContainer support status
  if (webContainerSupported === null) {
    return (
      <div className="h-full flex flex-col bg-terminal text-terminal-foreground">
        <div className="border-b border-border p-2 flex justify-between items-center">
          <span className="font-medium">Terminal</span>
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
          <span className="font-medium">Terminal</span>
        </div>
        <div className="flex-1 flex items-center justify-center text-red-400">
          <div className="text-center">
            <p className="text-xl font-bold">WebContainer API Not Supported</p>
            <p className="mt-2">Your browser does not support the WebContainer API.</p>
            <p className="mt-1">Please use Chrome or Edge with HTTPS or localhost.</p>
            {error && <p className="mt-2 text-sm">{error}</p>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col bg-terminal text-terminal-foreground ${maximized ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header with controls */}
      <div className="border-b border-border p-2 flex justify-between items-center bg-sidebar">
        <span className="font-medium flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
            <polyline points="4 17 10 11 4 5"></polyline>
            <line x1="12" y1="19" x2="20" y2="19"></line>
          </svg>
          Terminal
        </span>
        <div className="flex space-x-2">
          {!initialized ? (
            <button
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-sm flex items-center"
              onClick={initWebContainer}
              disabled={loading}
              title="Start Terminal"
            >
              <Power size={16} className="mr-1" /> Start
            </button>
          ) : (
            <>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={refreshPreview}
                title="Refresh"
              >
                <RefreshCcw size={16} />
              </button>
              <button
                className="p-1 text-slate-400 hover:text-white rounded-sm"
                onClick={toggleMaximize}
                title={maximized ? "Minimize Terminal" : "Maximize Terminal"}
              >
                {maximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button
                className="p-1 text-red-400 hover:text-red-500 rounded-sm"
                onClick={shutdownContainer}
                title="Shutdown Terminal"
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
              <p className="text-xl font-bold">Terminal</p>
              <p className="mt-2">Click the Start button to initialize the terminal.</p>
              <p className="mt-1 text-sm text-slate-400">This will allow you to run commands and interact with the file system.</p>
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
              <p className="mt-4">Initializing terminal...</p>
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
          <div 
            ref={terminalRef} 
            className="h-full overflow-hidden p-1 xterm-container"
            style={{
              backgroundColor: '#1a1e26',
              borderRadius: '4px'
            }}
          />
        )}
      </div>
    </div>
  );
};

export default WebContainerPanel;
