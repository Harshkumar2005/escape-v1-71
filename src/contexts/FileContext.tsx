import React, { createContext, useContext, useState, useEffect, ReactNode, Dispatch, SetStateAction } from 'react';
import { 
  listFiles, 
  readFile, 
  writeFile, 
  deleteFile, 
  createDirectory,
  fileWatcher,
  getFileType
} from '../api/fileSystem';

export interface FileNode {
  path: string;
  content: string;
  isOpen?: boolean;
  fileType?: string;
  children?: FileNode[];
}

export interface FileContextType {
  selectedFile: FileNode | null;
  setSelectedFile: Dispatch<SetStateAction<FileNode | null>>;
  files: FileNode[];
  setFiles: Dispatch<SetStateAction<FileNode[]>>;
  createDirectory: (path: string) => void;
}

const FileContext = createContext<FileContextType>({
  selectedFile: null,
  setSelectedFile: () => {},
  files: [],
  setFiles: () => {},
  createDirectory: () => {},
});

// Provider props
interface FileContextProviderProps {
  children: ReactNode;
}

// Create the provider component
export const FileProvider: React.FC<FileContextProviderProps> = ({ children }) => {
  const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
  const [files, setFiles] = useState<FileNode[]>([]);

  const createDirectory = (path: string) => {
    setFiles(prevFiles => [...prevFiles, { path, content: '', isOpen: false }]);
  };

  // Load files on mount
  useEffect(() => {
    refreshFiles();
    
    // Listen for file changes
    const handleFileChanged = (path: string) => {
      if (path === selectedFile?.path) {
        loadFileContent(path);
      }
      refreshFiles();
    };
    
    const handleFileRemoved = (path: string) => {
      if (path === selectedFile?.path) {
        setSelectedFile(null);
        setFiles(prevFiles => prevFiles.filter(file => file.path !== path));
      }
      refreshFiles();
    };
    
    const handleDirectoryCreated = () => {
      refreshFiles();
    };
    
    fileWatcher.on('fileChanged', handleFileChanged);
    fileWatcher.on('fileRemoved', handleFileRemoved);
    fileWatcher.on('directoryCreated', handleDirectoryCreated);
    
    return () => {
      fileWatcher.off('fileChanged', handleFileChanged);
      fileWatcher.off('fileRemoved', handleFileRemoved);
      fileWatcher.off('directoryCreated', handleDirectoryCreated);
    };
  }, [selectedFile]);

  // Load file content when selected file changes
  useEffect(() => {
    if (selectedFile) {
      loadFileContent(selectedFile.path);
    }
  }, [selectedFile]);

  // Refresh the file list
  const refreshFiles = async () => {
    try {
      const fileList = await listFiles();
      setFiles(fileList.map(path => ({ path, content: '', isOpen: false })));
    } catch (err) {
      console.error('Error loading files:', err);
    }
  };

  // Load file content
  const loadFileContent = async (path: string) => {
    try {
      const content = await readFile(path);
      setFiles(prevFiles => prevFiles.map(file =>
        file.path === path ? { ...file, content } : file
      ));
    } catch (err) {
      console.error(`Error loading file ${path}:`, err);
    }
  };

  // Save file content
  const saveFile = async (content: string) => {
    if (!selectedFile) return;
    
    try {
      await writeFile(selectedFile.path, content);
      setFiles(prevFiles => prevFiles.map(file =>
        file.path === selectedFile.path ? { ...file, content } : file
      ));
    } catch (err) {
      console.error(`Error saving file ${selectedFile.path}:`, err);
    }
  };

  // Create a new file
  const createNewFile = async (path: string, content: string = '') => {
    try {
      await writeFile(path, content);
      setFiles(prevFiles => [...prevFiles, { path, content, isOpen: false }]);
      setSelectedFile({ path, content });
    } catch (err) {
      console.error(`Error creating file ${path}:`, err);
    }
  };

  // Delete a file
  const deleteFileHandler = async (path: string) => {
    try {
      await deleteFile(path);
      setFiles(prevFiles => prevFiles.filter(file => file.path !== path));
      if (path === selectedFile?.path) {
        setSelectedFile(null);
      }
    } catch (err) {
      console.error(`Error deleting file ${path}:`, err);
    }
  };

  return (
    <FileContext.Provider
      value={{
        selectedFile,
        setSelectedFile,
        files,
        setFiles,
        createDirectory,
      }}
    >
      {children}
    </FileContext.Provider>
  );
};

// Custom hook to use the file context
export const useFileContext = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error('useFileContext must be used within a FileProvider');
  }
  return context;
}; 