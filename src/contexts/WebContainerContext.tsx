
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
  isFallbackMode: boolean;
}

const WebContainerContext = createContext<WebContainerContextType | undefined>(undefined);

export const WebContainerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [webcontainerInstance, setWebcontainerInstance] = useState<WebContainer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackMode, setIsFallbackMode] = useState(false);
  const { files } = useFileSystem();

  // Initialize WebContainer
  useEffect(() => {
    const bootWebContainer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Boot the WebContainer
        try {
          console.log("Attempting to boot WebContainer...");
          const instance = await WebContainer.boot();
          console.log("WebContainer booted successfully");
          setWebcontainerInstance(instance);
          
          // Install base packages
          await setupBasePackages(instance);
          
          setIsReady(true);
          toast.success("WebContainer initialized successfully");
        } catch (err: any) {
          // Set fallback mode and continue
          console.warn("WebContainer is not supported in this environment, entering fallback mode", err);
          setIsFallbackMode(true);
          setError("WebContainer is not supported in this environment");
          toast.warning("Running in limited functionality mode");
          // Allow the app to continue in fallback mode
          setIsReady(true);
        }
      } catch (err: any) {
        console.error("Failed to initialize WebContainer:", err);
        setError(err.message || "Failed to initialize WebContainer");
        toast.error("Failed to initialize WebContainer");
        // Enable fallback mode
        setIsFallbackMode(true);
        setIsReady(true); // Still mark as ready so the app can run in fallback mode
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
    try {
      console.log("Setting up base packages...");
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
      console.log("Package.json created");
      
      // Install basic packages
      // We'll use a minimal set of packages to avoid long installation times
      await executeCommandInternal(instance, 'npm', ['install', '--quiet']);
      console.log("Base packages installed");
    } catch (err) {
      console.error("Error setting up base packages:", err);
      throw err;
    }
  };
  
  // Mount files to WebContainer
  const mountFiles = async (files: Record<string, any>) => {
    if (!webcontainerInstance) {
      if (isFallbackMode) {
        console.log("Fallback mode: Mount files operation simulated");
        toast.success("Files processed in fallback mode");
        return;
      }
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
      if (isFallbackMode) {
        console.log(`Fallback mode: Write file ${path} operation simulated`);
        return;
      }
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
      if (isFallbackMode) {
        console.log(`Fallback mode: Read file ${path} operation simulated`);
        return "// Fallback mode: File content not available";
      }
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
      
      process.output.pipeTo(
        new WritableStream({
          write(data) {
            stdoutChunks.push(data);
          }
        })
      );
      
      // WebContainerProcess doesn't have a direct stderr property in the type definition
      // We'll capture errors from the exit code instead
      
      const exitCode = await process.exit;
      
      // If exit code is non-zero, there was an error
      const stderrOutput = exitCode !== 0 ? `Process exited with code ${exitCode}` : '';
      
      return {
        exitCode,
        stdout: stdoutChunks.join(''),
        stderr: stderrOutput
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
      if (isFallbackMode) {
        console.log(`Fallback mode: Execute command ${command} ${args.join(' ')} operation simulated`);
        return {
          exitCode: 0,
          stdout: `Fallback mode: Command '${command} ${args.join(' ')}' simulated`,
          stderr: ''
        };
      }
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
        executeCommand,
        isFallbackMode
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
