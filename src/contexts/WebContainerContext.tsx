
import React, { createContext, useContext, useState, useEffect } from 'react';
import { WebContainer } from '@webcontainer/api';
import { useFileSystem, FileSystemItem } from './FileSystemContext';
import { toast } from 'sonner';

interface WebContainerContextType {
  webcontainer: WebContainer | null;
  isReady: boolean;
  isLoading: boolean;
  terminal: any | null;
  mountFiles: (files: Record<string, any>) => Promise<void>;
  executeCommand: (command: string, args?: string[]) => Promise<{ exitCode: number, output: string }>;
  bootstrapProject: (projectName?: string) => Promise<void>;
}

const WebContainerContext = createContext<WebContainerContextType | null>(null);

export const useWebContainer = () => {
  const context = useContext(WebContainerContext);
  if (!context) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return context;
};

interface WebContainerProviderProps {
  children: React.ReactNode;
}

export const WebContainerProvider: React.FC<WebContainerProviderProps> = ({ children }) => {
  const [webcontainer, setWebcontainer] = useState<WebContainer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [terminal, setTerminal] = useState<any | null>(null);
  const { files, addLogMessage } = useFileSystem();

  // Initialize WebContainer
  useEffect(() => {
    const initWebContainer = async () => {
      try {
        setIsLoading(true);
        addLogMessage('info', 'Initializing WebContainer...');
        
        // Create the WebContainer instance
        const wc = await WebContainer.boot();
        setWebcontainer(wc);
        
        // Create a basic file system to start with
        await wc.mount({
          'package.json': {
            file: {
              contents: JSON.stringify({
                name: 'webcontainer-project',
                type: 'module',
                dependencies: {},
                scripts: {
                  start: 'node index.js'
                }
              }, null, 2)
            }
          },
          'index.js': {
            file: {
              contents: `console.log('WebContainer initialized successfully!');`
            }
          },
        });
        
        setIsReady(true);
        setIsLoading(false);
        addLogMessage('success', 'WebContainer initialized successfully!');
      } catch (error) {
        console.error('Error initializing WebContainer:', error);
        addLogMessage('error', `Failed to initialize WebContainer: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setIsLoading(false);
        toast.error('Failed to initialize WebContainer. Please try again.');
      }
    };

    initWebContainer();

    // Cleanup function
    return () => {
      // WebContainer doesn't have a direct shutdown method, but we can clean up resources
      setWebcontainer(null);
      setIsReady(false);
    };
  }, [addLogMessage]);

  // Convert FileSystemItem array to WebContainer compatible file structure
  const convertToWebContainerFormat = (items: FileSystemItem[], parentPath = ''): Record<string, any> => {
    const result: Record<string, any> = {};
    
    items.forEach(item => {
      const itemName = item.name;
      
      if (item.type === 'folder') {
        if (item.children && item.children.length > 0) {
          result[itemName] = {
            directory: convertToWebContainerFormat(item.children, `${parentPath}/${itemName}`)
          };
        } else {
          result[itemName] = { directory: {} };
        }
      } else {
        // For files
        result[itemName] = {
          file: {
            contents: item.content || ''
          }
        };
      }
    });
    
    return result;
  };

  // Mount files to WebContainer
  const mountFiles = async (filesObj: Record<string, any>) => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      addLogMessage('info', 'Mounting files to WebContainer...');
      await webcontainer.mount(filesObj);
      addLogMessage('success', 'Files mounted successfully');
    } catch (error) {
      console.error('Error mounting files:', error);
      addLogMessage('error', `Failed to mount files: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  // Bootstrap a project
  const bootstrapProject = async (projectName = 'webcontainer-project') => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      setIsLoading(true);
      addLogMessage('info', 'Bootstrapping project...');

      // Convert current file system to WebContainer format
      const webContainerFiles = convertToWebContainerFormat(files);
      
      // Mount the files
      await mountFiles(webContainerFiles);
      
      // Install dependencies if package.json exists
      const packageJsonExists = await webcontainer.fs.exists('/package.json');
      if (packageJsonExists) {
        addLogMessage('info', 'Installing dependencies...');
        const installProcess = await webcontainer.spawn('npm', ['install']);
        const installOutput = await installProcess.output.timeout(60000);
        
        if (installProcess.exit !== 0) {
          addLogMessage('error', `Failed to install dependencies: ${installOutput}`);
          throw new Error(`Failed to install dependencies: ${installOutput}`);
        }
        
        addLogMessage('success', 'Dependencies installed successfully');
      }
      
      setIsLoading(false);
      toast.success('Project bootstrapped successfully!');
    } catch (error) {
      console.error('Error bootstrapping project:', error);
      addLogMessage('error', `Failed to bootstrap project: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      throw error;
    }
  };

  // Execute commands in the WebContainer
  const executeCommand = async (command: string, args: string[] = []): Promise<{ exitCode: number, output: string }> => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      addLogMessage('info', `Executing command: ${command} ${args.join(' ')}`);
      const process = await webcontainer.spawn(command, args);
      const output = await process.output.timeout(30000);
      return { exitCode: process.exit, output };
    } catch (error) {
      console.error('Error executing command:', error);
      addLogMessage('error', `Command execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  };

  const value = {
    webcontainer,
    isReady,
    isLoading,
    terminal,
    mountFiles,
    executeCommand,
    bootstrapProject
  };

  return (
    <WebContainerContext.Provider value={value}>
      {children}
    </WebContainerContext.Provider>
  );
};
