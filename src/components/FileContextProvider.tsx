import { createContext, useContext, useState, useEffect } from 'react';
import { fileWatcher } from '../api/fileSystem';

interface FileInfo {
  path: string;
  content: string;
  isOpen: boolean;
  fileType: string;
}

interface FileContextType {
  files: FileInfo[];
  currentFile: string | null;
  setCurrentFile: (path: string) => void;
  refreshFiles: () => void;
  writeFile: (path: string, content: string) => Promise<void>;
  deleteFile: (path: string) => Promise<void>;
  createDirectory: (path: string) => Promise<void>;
}

const FileContext = createContext<FileContextType | null>(null);

export function FileContextProvider({ children }: { children: React.ReactNode }) {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [currentFile, setCurrentFile] = useState<string | null>(null);

  const readFileContent = async (path: string): Promise<{ content: string; fileType: string }> => {
    try {
      const response = await fetch(`/api/read-file?path=${encodeURIComponent(path)}`);
      if (!response.ok) throw new Error('Failed to read file');
      return await response.json();
    } catch (error) {
      console.error(`Error reading file ${path}:`, error);
      return { content: '', fileType: 'plaintext' };
    }
  };

  const listFiles = async (): Promise<string[]> => {
    try {
      const response = await fetch('/api/list-files');
      if (!response.ok) throw new Error('Failed to list files');
      return await response.json();
    } catch (error) {
      console.error('Error listing files:', error);
      return [];
    }
  };

  const refreshFiles = async () => {
    try {
      const filePaths = await listFiles();
      const fileInfos = await Promise.all(
        filePaths.map(async (path) => {
          const { content, fileType } = await readFileContent(path);
          return {
            path,
            content,
            fileType,
            isOpen: path === currentFile
          };
        })
      );
      setFiles(fileInfos);
    } catch (error) {
      console.error('Error refreshing files:', error);
    }
  };

  const writeFile = async (path: string, content: string): Promise<void> => {
    try {
      const response = await fetch(`/api/write-file?path=${encodeURIComponent(path)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) throw new Error('Failed to write file');
      
      // Update the file in the state
      setFiles(prev => 
        prev.map(file => 
          file.path === path 
            ? { ...file, content } 
            : file
        )
      );
    } catch (error) {
      console.error(`Error writing file ${path}:`, error);
      throw error;
    }
  };

  const deleteFile = async (path: string): Promise<void> => {
    try {
      const response = await fetch(`/api/delete-file?path=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed to delete file');
      
      // Remove the file from the state
      setFiles(prev => prev.filter(file => file.path !== path));
      
      // If the deleted file was the current file, clear the current file
      if (path === currentFile) {
        setCurrentFile(null);
      }
    } catch (error) {
      console.error(`Error deleting file ${path}:`, error);
      throw error;
    }
  };

  const createDirectory = async (path: string): Promise<void> => {
    try {
      const response = await fetch(`/api/create-directory?path=${encodeURIComponent(path)}`, {
        method: 'POST',
      });
      
      if (!response.ok) throw new Error('Failed to create directory');
      
      // Refresh the file list to include any new files in the directory
      refreshFiles();
    } catch (error) {
      console.error(`Error creating directory ${path}:`, error);
      throw error;
    }
  };

  // Set up file watcher
  useEffect(() => {
    const handleFileAdded = (path: string) => {
      readFileContent(path).then(({ content, fileType }) => {
        setFiles(prev => [...prev, { path, content, fileType, isOpen: false }]);
      });
    };
    
    const handleFileChanged = (path: string) => {
      readFileContent(path).then(({ content, fileType }) => {
        setFiles(prev => 
          prev.map(file => 
            file.path === path 
              ? { ...file, content, fileType } 
              : file
          )
        );
      });
    };
    
    const handleFileRemoved = (path: string) => {
      setFiles(prev => prev.filter(file => file.path !== path));
      if (path === currentFile) {
        setCurrentFile(null);
      }
    };
    
    fileWatcher.on('fileAdded', handleFileAdded);
    fileWatcher.on('fileChanged', handleFileChanged);
    fileWatcher.on('fileRemoved', handleFileRemoved);
    
    return () => {
      fileWatcher.off('fileAdded', handleFileAdded);
      fileWatcher.off('fileChanged', handleFileChanged);
      fileWatcher.off('fileRemoved', handleFileRemoved);
    };
  }, [currentFile]);

  // Initial file load
  useEffect(() => {
    refreshFiles();
  }, []);

  // Update isOpen state when currentFile changes
  useEffect(() => {
    setFiles(prev => 
      prev.map(file => ({
        ...file,
        isOpen: file.path === currentFile
      }))
    );
  }, [currentFile]);

  return (
    <FileContext.Provider value={{ 
      files, 
      currentFile, 
      setCurrentFile, 
      refreshFiles,
      writeFile,
      deleteFile,
      createDirectory
    }}>
      {children}
    </FileContext.Provider>
  );
}

export function useFileContext() {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileContextProvider');
  }
  return context;
} 