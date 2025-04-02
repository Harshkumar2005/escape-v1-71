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

  useEffect(() => {
    const initWebContainer = async () => {
      try {
        setIsLoading(true);
        addLogMessage('info', 'Initializing WebContainer...');
        
        const wc = await WebContainer.boot();
        setWebcontainer(wc);
        
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

    return () => {
      setWebcontainer(null);
      setIsReady(false);
    };
  }, [addLogMessage]);

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
        result[itemName] = {
          file: {
            contents: item.content || ''
          }
        };
      }
    });
    
    return result;
  };

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

  const bootstrapProject = async (projectName = 'webcontainer-project') => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      setIsLoading(true);
      addLogMessage('info', 'Bootstrapping project...');

      const webContainerFiles = convertToWebContainerFormat(files);
      
      await mountFiles(webContainerFiles);
      
      try {
        const packageJsonExists = await webcontainer.fs.exists('/package.json');
        
        if (packageJsonExists) {
          addLogMessage('info', 'Installing dependencies...');
          const installProcess = await webcontainer.spawn('npm', ['install']);
          
          const outputPromise = new Promise<string>((resolve, reject) => {
            let output = '';
            const timeoutId = setTimeout(() => {
              reject(new Error('Dependency installation timed out after 60 seconds'));
            }, 60000);
            
            const reader = installProcess.output.getReader();
            
            function processText({ done, value }: ReadableStreamReadResult<any>): void {
              if (done) {
                clearTimeout(timeoutId);
                resolve(output);
                return;
              }
              
              output += value;
              reader.read().then(processText);
            }
            
            reader.read().then(processText);
          });
          
          const installOutput = await outputPromise;
          const exitCode = await installProcess.exit;
          
          if (exitCode !== 0) {
            addLogMessage('error', `Failed to install dependencies: ${installOutput}`);
            throw new Error(`Failed to install dependencies: ${installOutput}`);
          }
          
          addLogMessage('success', 'Dependencies installed successfully');
        }
      } catch (error) {
        console.error('Error checking for package.json:', error);
        addLogMessage('warning', 'Could not verify package.json. Skipping dependency installation.');
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

  const executeCommand = async (command: string, args: string[] = []): Promise<{ exitCode: number, output: string }> => {
    if (!webcontainer) {
      throw new Error('WebContainer not initialized');
    }

    try {
      addLogMessage('info', `Executing command: ${command} ${args.join(' ')}`);
      const process = await webcontainer.spawn(command, args);
      
      const outputPromise = new Promise<string>((resolve, reject) => {
        let output = '';
        const timeoutId = setTimeout(() => {
          reject(new Error('Command execution timed out after 30 seconds'));
        }, 30000);
        
        const reader = process.output.getReader();
        
        function processText({ done, value }: ReadableStreamReadResult<any>): void {
          if (done) {
            clearTimeout(timeoutId);
            resolve(output);
            return;
          }
          
          output += value;
          reader.read().then(processText);
        }
        
        reader.read().then(processText);
      });
      
      const output = await outputPromise;
      const exitCode = await process.exit;
      
      return { exitCode, output };
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
