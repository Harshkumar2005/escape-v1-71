
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { WebContainer } from '@webcontainer/api';
import { FileSystemItem, useFileSystem } from './FileSystemContext';
import { toast } from 'sonner';

interface WebContainerContextType {
  webcontainerInstance: WebContainer | null;
  isReady: boolean;
  isLoading: boolean;
  error: string | null;
  mountFiles: (files: Record<string, any>) => Promise<void>;
  writeFile: (path: string, contents: string) => Promise<void>;
  readFile: (path: string) => Promise<string>;
  executeCommand: (command: string, args?: string[]) => Promise<{ exitCode: number; stdout: string; stderr: string }>;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(undefined);

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { files } = useFileSystem();

  // Initialize WebContainer
  useEffect(() => {
    const bootWebContainer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Check if WebContainer is supported in current environment
        if (!(WebContainer as any).isSupported()) {
          throw new Error("WebContainer is not supported in this environment");
        }
        
        // Boot the WebContainer
        const instance = await WebContainer.boot();
        setWebcontainerInstance(instance);
        
        // Install base packages
        await setupBasePackages(instance);
        
        setIsReady(true);
        toast.success("WebContainer initialized successfully");
      } catch (err: any) {
        console.error("Failed to initialize WebContainer:", err);
        setError(err.message || "Failed to initialize WebContainer");
        toast.error("Failed to initialize WebContainer");
      } finally {
        setIsLoading(false);
      }
    };

    bootWebContainer();
    
    return () => {
      // Cleanup function
      // WebContainer doesn't have a direct shutdown method
    };
  }, []);

  // Setup base packages
  const setupBasePackages = async (instance: WebContainer) => {
    // Create basic package.json
    const packageJson = {
      name: "web-editor-project",
      version: "1.0.0",
      description: "Web editor project",
      main: "index.js",
      type: "module",
      scripts: {
        start: "node index.js"
      }
    };
    
    await instance.fs.writeFile('/package.json', JSON.stringify(packageJson, null, 2));
    
    // Install basic packages
    // We'll use a minimal set of packages to avoid long installation times
    // Users can install more packages as needed
    await executeCommandInternal(instance, 'npm', ['install', '--quiet']);
  };
  
  // Convert FileSystemItem tree to WebContainer format
  const convertToWebContainerFormat = useCallback((items: FileSystemItem[]): Record<string, any> => {
    const result: Record<string, any> = {};
    
    for (const item of items) {
      const name = item.name;
      
      if (item.type === 'folder') {
        result[name] = {
          directory: convertToWebContainerFormat(item.children || [])
        };
      } else {
        result[name] = {
          file: {
            contents: item.content || ''
          }
        };
      }
    }
    
    return result;
  }, []);

  // Check if a file exists in the WebContainer
  const fileExists = async (instance: WebContainer, path: string): Promise<boolean> => {
    try {
      await instance.fs.readFile(path);
      return true;
    } catch (error) {
      return false;
    }
  };
  
  // Mount files to WebContainer
  const mountFiles = async (files: Record<string, any>) => {
    if (!webcontainerInstance) {
      throw new Error("WebContainer is not initialized");
    }
    
    try {
      await webcontainerInstance.mount(files);
      toast.success("Files mounted successfully");
    } catch (err: any) {
      console.error("Failed to mount files:", err);
      toast.error("Failed to mount files");
      throw err;
    }
  };
  
  // Write a file to WebContainer
  const writeFile = async (path: string, contents: string) => {
    if (!webcontainerInstance) {
      throw new Error("WebContainer is not initialized");
    }
    
    try {
      await webcontainerInstance.fs.writeFile(path, contents);
    } catch (err: any) {
      console.error(`Failed to write file ${path}:`, err);
      toast.error(`Failed to write file ${path}`);
      throw err;
    }
  };
  
  // Read a file from WebContainer
  const readFile = async (path: string) => {
    if (!webcontainerInstance) {
      throw new Error("WebContainer is not initialized");
    }
    
    try {
      return await webcontainerInstance.fs.readFile(path, 'utf-8');
    } catch (err: any) {
      console.error(`Failed to read file ${path}:`, err);
      throw err;
    }
  };
  
  // Internal function to execute commands
  const executeCommandInternal = async (
    instance: WebContainer,
    command: string,
    args: string[] = []
  ): Promise<{ exitCode: number; stdout: string; stderr: string }> => {
    try {
      const process = await instance.spawn(command, args);
      
      const stdoutChunks: string[] = [];
      const stderrChunks: string[] = [];
      
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            stdoutChunks.push(data);
          }
        })
      );
      
      // Process error stream exists on WebContainer process
      if (process.stderr) {
        process.stderr.pipeTo(
          new WritableStream({
            write(data) {
              stderrChunks.push(data);
            }
          })
        );
      }
      
      const exitCode = await process.exit;
      
      return {
        exitCode,
        stdout: stdoutChunks.join(''),
        stderr: stderrChunks.join('')
      };
    } catch (err: any) {
      console.error(`Failed to execute command ${command}:`, err);
      return {
        exitCode: 1,
        stdout: '',
        stderr: err.message || 'Command execution failed'
      };
    }
  };
  
  // Public function to execute commands
  const executeCommand = async (command: string, args: string[] = []) => {
    if (!webcontainerInstance) {
      throw new Error("WebContainer is not initialized");
    }
    
    return executeCommandInternal(webcontainerInstance, command, args);
  };
  
  return (
    <WebContainerContext.Provider
      value={{
        webcontainerInstance,
        isReady,
        isLoading,
        error,
        mountFiles,
        writeFile,
        readFile,
        executeCommand
      }}
    >
      {children}
    </WebContainerContext.Provider>
  );
};

export const useWebContainer = () => {
  const context = useContext(WebContainerContext);
  if (context === undefined) {
    throw new Error('useWebContainer must be used within a WebContainerProvider');
  }
  return context;
};
