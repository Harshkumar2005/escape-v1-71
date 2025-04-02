
import React, { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';

export type FileType = 'file' | 'folder';
export type LogType = 'info' | 'success' | 'error' | 'warning';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  path: string;
  content?: string;
  language?: string;
  children?: FileSystemItem[];
  isOpen?: boolean;
  parentId?: string;
}

interface Log {
  id: string;
  type: LogType;
  message: string;
  timestamp: Date;
}

interface FileSystemContextType {
  files: FileSystemItem[];
  logs: Log[];
  selectedFile: string | null;
  createFile: (parentPath: string, name: string, type: FileType) => string;
  updateFileContent: (fileId: string, content: string) => void;
  getFileById: (id: string) => FileSystemItem | undefined;
  getFileByPath: (path: string) => FileSystemItem | undefined;
  renameFile: (fileId: string, newName: string) => void;
  deleteFile: (fileId: string) => void;
  toggleFolder: (folderId: string) => void;
  addLogMessage: (type: LogType, message: string) => void;
  clearLogs: () => void;
  removeLog: (id: string) => void;
  searchFiles: (query: string) => FileSystemItem[];
  resetFileSystem: () => void;
  replaceFileSystem: (projectName: string) => void;
  convertFilesToWebContainer: () => Record<string, any>;
}

const FileSystemContext = createContext<FileSystemContextType | null>(null);

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};

// Helper function to get file language from extension
const getFileLanguage = (fileName: string): string => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascriptreact';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescriptreact';
    case 'html':
      return 'html';
    case 'css':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'java':
      return 'java';
    case 'cpp':
    case 'c':
      return 'cpp';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    default:
      return 'plaintext';
  }
};

// Default file system for a new project
const getDefaultFileSystem = (): FileSystemItem[] => {
  const projectId = uuidv4();
  return [
    {
      id: projectId,
      name: 'my-project',
      type: 'folder',
      path: '/my-project',
      isOpen: true,
      children: [
        {
          id: uuidv4(),
          name: 'index.js',
          type: 'file',
          path: '/my-project/index.js',
          content: 'console.log("Hello from WebContainers!");',
          language: 'javascript',
          parentId: projectId
        },
        {
          id: uuidv4(),
          name: 'package.json',
          type: 'file',
          path: '/my-project/package.json',
          content: JSON.stringify({
            name: 'my-project',
            version: '1.0.0',
            description: '',
            main: 'index.js',
            scripts: {
              start: 'node index.js'
            },
            keywords: [],
            author: '',
            license: 'ISC',
            dependencies: {}
          }, null, 2),
          language: 'json',
          parentId: projectId
        },
        {
          id: uuidv4(),
          name: 'README.md',
          type: 'file',
          path: '/my-project/README.md',
          content: '# My Project\n\nWelcome to my project!',
          language: 'markdown',
          parentId: projectId
        }
      ]
    }
  ];
};

interface FileSystemProviderProps {
  children: React.ReactNode;
}

export const FileSystemProvider: React.FC<FileSystemProviderProps> = ({ children }) => {
  const [files, setFiles] = useState<FileSystemItem[]>(getDefaultFileSystem());
  const [logs, setLogs] = useState<Log[]>([]);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Convert file system to WebContainer format
  const convertFilesToWebContainer = (): Record<string, any> => {
    const convertItems = (items: FileSystemItem[]): Record<string, any> => {
      const result: Record<string, any> = {};
      
      items.forEach(item => {
        const itemName = item.name;
        
        if (item.type === 'folder') {
          if (item.children && item.children.length > 0) {
            result[itemName] = {
              directory: convertItems(item.children)
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
    
    return convertItems(files);
  };

  const createFile = (parentPath: string, name: string, type: FileType): string => {
    const newFileId = uuidv4();
    let newPath = '';
    
    if (parentPath === '/') {
      newPath = `/${name}`;
    } else {
      newPath = `${parentPath}/${name}`;
    }
    
    const language = type === 'file' ? getFileLanguage(name) : undefined;
    
    const newItem: FileSystemItem = {
      id: newFileId,
      name,
      type,
      path: newPath,
      content: type === 'file' ? '' : undefined,
      language,
      children: type === 'folder' ? [] : undefined,
      isOpen: type === 'folder' ? false : undefined
    };
    
    let fileAdded = false;
    
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      
      const addFileToFolder = (items: FileSystemItem[], path: string): FileSystemItem[] => {
        return items.map(item => {
          if (item.type === 'folder' && item.path === path) {
            fileAdded = true;
            return {
              ...item,
              children: [...(item.children || []), { ...newItem, parentId: item.id }],
              isOpen: true
            };
          } else if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: addFileToFolder(item.children, path)
            };
          }
          return item;
        });
      };
      
      // If parent path is root and no root folder exists yet
      if (parentPath === '/' && type === 'folder') {
        fileAdded = true;
        return [...updatedFiles, newItem];
      } else {
        const result = addFileToFolder(updatedFiles, parentPath);
        
        // If parent folder not found, add to first level
        if (!fileAdded && parentPath === '/my-project') {
          const rootFolder = result.find(f => f.name === 'my-project');
          if (rootFolder && rootFolder.type === 'folder') {
            rootFolder.children = [...(rootFolder.children || []), { ...newItem, parentId: rootFolder.id }];
            rootFolder.isOpen = true;
            fileAdded = true;
          }
        }
        
        return result;
      }
    });
    
    addLogMessage('success', `${type === 'file' ? 'File' : 'Folder'} created: ${newPath}`);
    
    return newFileId;
  };

  const updateFileContent = (fileId: string, content: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      
      const updateContent = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === fileId) {
            return { ...item, content };
          } else if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: updateContent(item.children)
            };
          }
          return item;
        });
      };
      
      return updateContent(updatedFiles);
    });
  };

  const getFileById = (id: string): FileSystemItem | undefined => {
    const findFile = (items: FileSystemItem[]): FileSystemItem | undefined => {
      for (const item of items) {
        if (item.id === id) {
          return item;
        }
        
        if (item.type === 'folder' && item.children) {
          const found = findFile(item.children);
          if (found) {
            return found;
          }
        }
      }
      
      return undefined;
    };
    
    return findFile(files);
  };

  const getFileByPath = (path: string): FileSystemItem | undefined => {
    const findFile = (items: FileSystemItem[]): FileSystemItem | undefined => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        
        if (item.type === 'folder' && item.children) {
          const found = findFile(item.children);
          if (found) {
            return found;
          }
        }
      }
      
      return undefined;
    };
    
    return findFile(files);
  };

  const renameFile = (fileId: string, newName: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      
      const rename = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === fileId) {
            const pathParts = item.path.split('/');
            pathParts[pathParts.length - 1] = newName;
            const newPath = pathParts.join('/');
            
            const language = item.type === 'file' ? getFileLanguage(newName) : undefined;
            
            return { 
              ...item, 
              name: newName,
              path: newPath,
              language: language || item.language
            };
          } else if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: rename(item.children)
            };
          }
          return item;
        });
      };
      
      return rename(updatedFiles);
    });
    
    addLogMessage('info', `Renamed to: ${newName}`);
  };

  const deleteFile = (fileId: string) => {
    let deletedItem: FileSystemItem | undefined;
    let parentId: string | undefined;
    
    // Find the item to be deleted and its parent
    const findItemAndParent = (items: FileSystemItem[]): void => {
      for (const item of items) {
        if (item.id === fileId) {
          deletedItem = item;
          return;
        }
        
        if (item.type === 'folder' && item.children) {
          const childItem = item.children.find(child => child.id === fileId);
          if (childItem) {
            deletedItem = childItem;
            parentId = item.id;
            return;
          }
          
          findItemAndParent(item.children);
        }
      }
    };
    
    findItemAndParent(files);
    
    // If the item is selected, deselect it
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
    
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      
      // If the item is a top-level item
      if (!parentId) {
        return updatedFiles.filter(item => item.id !== fileId);
      }
      
      const removeItem = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === parentId && item.children) {
            return {
              ...item,
              children: item.children.filter(child => child.id !== fileId)
            };
          } else if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: removeItem(item.children)
            };
          }
          return item;
        });
      };
      
      return removeItem(updatedFiles);
    });
    
    if (deletedItem) {
      addLogMessage('warning', `Deleted: ${deletedItem.path}`);
    }
  };

  const toggleFolder = (folderId: string) => {
    setFiles(prevFiles => {
      const updatedFiles = [...prevFiles];
      
      const toggleFolderOpen = (items: FileSystemItem[]): FileSystemItem[] => {
        return items.map(item => {
          if (item.id === folderId && item.type === 'folder') {
            return { ...item, isOpen: !item.isOpen };
          } else if (item.type === 'folder' && item.children) {
            return {
              ...item,
              children: toggleFolderOpen(item.children)
            };
          }
          return item;
        });
      };
      
      return toggleFolderOpen(updatedFiles);
    });
  };

  const addLogMessage = (type: LogType, message: string) => {
    const newLog: Log = {
      id: uuidv4(),
      type,
      message,
      timestamp: new Date()
    };
    
    setLogs(prevLogs => [...prevLogs, newLog]);
  };

  const clearLogs = () => {
    setLogs([]);
  };

  const removeLog = (id: string) => {
    setLogs(prevLogs => prevLogs.filter(log => log.id !== id));
  };

  const searchFiles = (query: string): FileSystemItem[] => {
    if (!query) return [];
    
    const results: FileSystemItem[] = [];
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        
        // Also search in content for text files
        if (item.type === 'file' && item.content && 
            item.content.toLowerCase().includes(query.toLowerCase())) {
          if (!results.includes(item)) {
            results.push(item);
          }
        }
        
        if (item.type === 'folder' && item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    return results;
  };

  const resetFileSystem = () => {
    setFiles(getDefaultFileSystem());
    setSelectedFile(null);
    addLogMessage('info', 'File system reset to default');
  };

  const replaceFileSystem = (projectName: string) => {
    const projectId = uuidv4();
    setFiles([
      {
        id: projectId,
        name: projectName,
        type: 'folder',
        path: `/${projectName}`,
        isOpen: true,
        children: [
          {
            id: uuidv4(),
            name: 'index.js',
            type: 'file',
            path: `/${projectName}/index.js`,
            content: 'console.log("Hello, World!");',
            language: 'javascript',
            parentId: projectId
          },
          {
            id: uuidv4(),
            name: 'package.json',
            type: 'file',
            path: `/${projectName}/package.json`,
            content: JSON.stringify({
              name: projectName,
              version: '1.0.0',
              type: 'module',
              description: '',
              main: 'index.js',
              scripts: {
                start: 'node index.js'
              },
              keywords: [],
              author: '',
              license: 'ISC',
              dependencies: {}
            }, null, 2),
            language: 'json',
            parentId: projectId
          }
        ]
      }
    ]);
    setSelectedFile(null);
    addLogMessage('info', `New file system created for project: ${projectName}`);
  };

  useEffect(() => {
    // Add an initial log message
    addLogMessage('info', 'File system initialized');
  }, []);

  const value = {
    files,
    logs,
    selectedFile,
    createFile,
    updateFileContent,
    getFileById,
    getFileByPath,
    renameFile,
    deleteFile,
    toggleFolder,
    addLogMessage,
    clearLogs,
    removeLog,
    searchFiles,
    resetFileSystem,
    replaceFileSystem,
    convertFilesToWebContainer
  };

  return (
    <FileSystemContext.Provider value={value}>
      {children}
    </FileSystemContext.Provider>
  );
};
