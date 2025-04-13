import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// File system types
export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: FileType;
  content?: string;
  language?: string;
  children?: FileSystemItem[];
  isOpen?: boolean;
}

interface LogMessage {
  id: string; // Added id field to LogMessage
  type: 'info' | 'error' | 'success' | 'warning';
  message: string;
  timestamp: Date;
}

interface FileSystemContextProps {
  files: FileSystemItem[];
  selectedFile: string | null;
  getFileById: (id: string) => FileSystemItem | null;
  createFile: (parentPath: string, name: string, type: FileType) => string | undefined; // Return fileId or undefined
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  toggleFolder: (id: string) => void;
  setSelectedFile: (id: string | null) => void;
  selectFile: (id: string) => void; // Add selectFile method
  searchFiles: (query: string) => FileSystemItem[];
  getAllFiles: () => FileSystemItem[];
  getChildrenOf: (path: string) => FileSystemItem[];
  logs: LogMessage[];
  addLogMessage: (type: LogMessage['type'], message: string) => void;
  clearLogs: () => void;
  removeLog: (id: string) => void; // Add removeLog method
  resetFileSystem: () => void; // Add resetFileSystem method
  replaceFileSystem: (rootName: string) => void; // Add replaceFileSystem method
}

const FileSystemContext = createContext<FileSystemContextProps | null>(null);

// Sample initial files
const initialFiles: FileSystemItem[] = [
  {
    id: 'root',
    name: 'project',
    path: 'project',
    type: 'folder',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        path: 'project/src',
        type: 'folder',
        isOpen: true,
        children: [
          {
            id: 'app.js',
            name: 'app.js',
            path: 'project/src/app.js',
            type: 'file',
            language: 'javascript',
            content: `import React from 'react';

const App = () => {
  return (
    <div>
      <h1>Hello, World!</h1>
    </div>
  );
};

export default App;`
          },
          {
            id: 'styles.css',
            name: 'styles.css',
            path: 'project/src/styles.css',
            type: 'file',
            language: 'css',
            content: `body {
  margin: 0;
  padding: 0;
  font-family: sans-serif;
}

h1 {
  color: #333;
}`
          }
        ]
      },
      {
        id: 'package.json',
        name: 'package.json',
        path: 'project/package.json',
        type: 'file',
        language: 'json',
        content: `{
  "name": "project",
  "version": "1.0.0",
  "description": "A sample project",
  "main": "index.js",
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}`
      }
    ]
  }
];

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileSystemItem[]>(initialFiles);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  
  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9);
  
  // Get file by ID
  const getFileById = useCallback((id: string): FileSystemItem | null => {
    const findById = (items: FileSystemItem[]): FileSystemItem | null => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        
        if (item.type === 'folder' && item.children) {
          const found = findById(item.children);
          if (found) return found;
        }
      }
      
      return null;
    };
    
    return findById(files);
  }, [files]);
  
  // Select a file (set as selected and ensure it's loaded)
  const selectFile = (id: string) => {
    setSelectedFile(id);
    // Additional loading logic could be added here if needed
  };
  
  // Create a new file or folder
  const createFile = (parentPath: string, name: string, type: FileType): string | undefined => {
    const newId = generateId();
    
    const insertItem = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.path === parentPath || (item.type === 'folder' && parentPath.startsWith(item.path + '/'))) {
          if (item.path === parentPath) {
            const newItem: FileSystemItem = {
              id: newId,
              name,
              path: `${parentPath}/${name}`,
              type,
              ...(type === 'folder' ? { children: [], isOpen: true } : { content: '', language: getLanguageFromName(name) })
            };
            
            return {
              ...item,
              children: [...(item.children || []), newItem],
              isOpen: true
            };
          } else if (item.children) {
            return {
              ...item,
              children: insertItem(item.children),
              isOpen: true
            };
          }
        }
        
        return item;
      });
    };
    
    setFiles(insertItem(files));
    addLogMessage('success', `Created new ${type}: ${name}`);
    
    if (type === 'file') {
      setSelectedFile(newId);
    }
    
    return newId; // Return the new file ID
  };
  
  // Reset file system to initial state
  const resetFileSystem = () => {
    setFiles(initialFiles);
    setSelectedFile(null);
    addLogMessage('info', 'File system reset to initial state');
  };
  
  // Replace file system with a new one (for importing projects)
  const replaceFileSystem = (rootName: string) => {
    const newRoot: FileSystemItem = {
      id: 'root',
      name: rootName,
      path: rootName,
      type: 'folder',
      isOpen: true,
      children: []
    };
    
    setFiles([newRoot]);
    setSelectedFile(null);
    addLogMessage('info', `Created new project: ${rootName}`);
  };
  
  // Remove a specific log by ID
  const removeLog = (id: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };
  
  // Rename a file or folder
  const renameFile = (id: string, newName: string) => {
    const updatePath = (oldPath: string, oldName: string, newName: string) => {
      return oldPath.replace(new RegExp(`/${oldName}($|/)`, 'g'), `/${newName}$1`);
    };
    
    const updateNames = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.id === id) {
          const newPath = updatePath(item.path, item.name, newName);
          
          if (item.type === 'folder' && item.children) {
            // Update paths of all children
            const updateChildPaths = (children: FileSystemItem[], oldPath: string, newPath: string): FileSystemItem[] => {
              return children.map(child => {
                const childNewPath = child.path.replace(oldPath, newPath);
                
                if (child.type === 'folder' && child.children) {
                  return {
                    ...child,
                    path: childNewPath,
                    children: updateChildPaths(child.children, child.path, childNewPath)
                  };
                }
                
                return {
                  ...child,
                  path: childNewPath
                };
              });
            };
            
            return {
              ...item,
              name: newName,
              path: newPath,
              children: updateChildPaths(item.children, item.path, newPath)
            };
          }
          
          return {
            ...item,
            name: newName,
            path: newPath,
            language: getLanguageFromName(newName)
          };
        }
        
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: updateNames(item.children)
          };
        }
        
        return item;
      });
    };
    
    const oldFile = getFileById(id);
    setFiles(updateNames(files));
    addLogMessage('info', `Renamed ${oldFile?.name} to ${newName}`);
  };
  
  // Delete a file or folder
  const deleteFile = (id: string) => {
    const removeItem = (items: FileSystemItem[]): FileSystemItem[] => {
      const filtered = items.filter(item => item.id !== id);
      
      return filtered.map(item => {
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: removeItem(item.children)
          };
        }
        
        return item;
      });
    };
    
    const fileToDelete = getFileById(id);
    setFiles(removeItem(files));
    
    if (selectedFile === id) {
      setSelectedFile(null);
    }
    
    addLogMessage('warning', `Deleted ${fileToDelete?.name}`);
  };
  
  // Update file content
  const updateFileContent = (id: string, content: string) => {
    const updateContent = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.id === id) {
          return {
            ...item,
            content
          };
        }
        
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: updateContent(item.children)
          };
        }
        
        return item;
      });
    };
    
    setFiles(updateContent(files));
  };
  
  // Toggle folder open/closed
  const toggleFolder = (id: string) => {
    const toggle = (items: FileSystemItem[]): FileSystemItem[] => {
      return items.map(item => {
        if (item.id === id && item.type === 'folder') {
          return {
            ...item,
            isOpen: !item.isOpen
          };
        }
        
        if (item.type === 'folder' && item.children) {
          return {
            ...item,
            children: toggle(item.children)
          };
        }
        
        return item;
      });
    };
    
    setFiles(toggle(files));
  };
  
  // Search files
  const searchFiles = (query: string): FileSystemItem[] => {
    const results: FileSystemItem[] = [];
    
    const findMatches = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          findMatches(item.children);
        }
      }
    };
    
    findMatches(files);
    return results;
  };
  
  // Get all files (flat list)
  const getAllFiles = useCallback((): FileSystemItem[] => {
    const allFiles: FileSystemItem[] = [];
    
    const collectFiles = (items: FileSystemItem[]) => {
      for (const item of items) {
        allFiles.push(item);
        
        if (item.type === 'folder' && item.children) {
          collectFiles(item.children);
        }
      }
    };
    
    collectFiles(files);
    return allFiles;
  }, [files]);
  
  // Get children of a path
  const getChildrenOf = (path: string): FileSystemItem[] => {
    const findChildren = (items: FileSystemItem[]): FileSystemItem[] => {
      for (const item of items) {
        if (item.path === path && item.type === 'folder' && item.children) {
          return item.children;
        }
        
        if (item.type === 'folder' && item.children) {
          const found = findChildren(item.children);
          if (found.length > 0) return found;
        }
      }
      
      return [];
    };
    
    return findChildren(files);
  };
  
  // Add log message
  const addLogMessage = (type: LogMessage['type'], message: string) => {
    const newLog = {
      id: generateId(),  // Add unique ID to each log message
      type, 
      message, 
      timestamp: new Date()
    };
    setLogs(prev => [...prev, newLog]);
  };
  
  // Clear logs
  const clearLogs = () => {
    setLogs([]);
  };
  
  // Helper function to guess language from file extension
  const getLanguageFromName = (fileName: string): string => {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    
    const languageMap: Record<string, string> = {
      'js': 'javascript',
      'jsx': 'javascript',
      'ts': 'typescript',
      'tsx': 'typescript',
      'html': 'html',
      'css': 'css',
      'scss': 'scss',
      'json': 'json',
      'md': 'markdown',
      'py': 'python',
      'java': 'java',
      'c': 'c',
      'cpp': 'cpp',
      'go': 'go',
      'rs': 'rust',
      'php': 'php',
      'rb': 'ruby',
      'swift': 'swift',
      'kt': 'kotlin',
      'sh': 'bash',
      'sql': 'sql',
      'xml': 'xml',
      'yaml': 'yaml',
      'yml': 'yaml',
    };
    
    return languageMap[ext] || 'plaintext';
  };
  
  return (
    <FileSystemContext.Provider value={{
      files,
      selectedFile,
      getFileById,
      createFile,
      renameFile,
      deleteFile,
      updateFileContent,
      toggleFolder,
      setSelectedFile,
      selectFile,
      searchFiles,
      getAllFiles,
      getChildrenOf,
      logs,
      addLogMessage,
      clearLogs,
      removeLog,
      resetFileSystem,
      replaceFileSystem
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  
  if (context === null) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  
  return context;
};
