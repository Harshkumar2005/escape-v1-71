
import React, { createContext, useContext, useState, useEffect } from 'react';

// Types
export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  content?: string;
  language?: string;
  children?: FileSystemItem[];
  path: string;
  isOpen?: boolean;
  isModified?: boolean;
  parentId?: string;
}

interface FileSystemContextType {
  files: FileSystemItem[];
  selectedFile: string | null;
  createFile: (parentPath: string, name: string, type: FileType) => void;
  renameFile: (id: string, newName: string) => void;
  deleteFile: (id: string) => void;
  updateFileContent: (id: string, content: string) => void;
  selectFile: (id: string) => void;
  getFileById: (id: string) => FileSystemItem | undefined;
  toggleFolder: (id: string) => void;
  searchFiles: (query: string) => FileSystemItem[];
  moveFile: (fileId: string, newParentId: string) => void;
}

const FileSystemContext = createContext<FileSystemContextType | undefined>(undefined);

// Sample initial file system
const initialFileSystem: FileSystemItem[] = [
  {
    id: 'root',
    name: 'my-project',
    type: 'folder',
    path: '/my-project',
    isOpen: true,
    children: [
      {
        id: 'src',
        name: 'src',
        type: 'folder',
        path: '/my-project/src',
        isOpen: true,
        parentId: 'root',
        children: [
          {
            id: 'components',
            name: 'components',
            type: 'folder',
            path: '/my-project/src/components',
            isOpen: false,
            parentId: 'src',
            children: [
              {
                id: 'button',
                name: 'Button.tsx',
                type: 'file',
                path: '/my-project/src/components/Button.tsx',
                language: 'typescript',
                content: 'import React from "react";\n\ninterface ButtonProps {\n  children: React.ReactNode;\n  onClick?: () => void;\n  variant?: "primary" | "secondary";\n}\n\nconst Button: React.FC<ButtonProps> = ({ children, onClick, variant = "primary" }) => {\n  return (\n    <button\n      className={`px-4 py-2 rounded ${variant === "primary" ? "bg-blue-500 text-white" : "bg-gray-200 text-gray-800"}`}\n      onClick={onClick}\n    >\n      {children}\n    </button>\n  );\n};\n\nexport default Button;',
                parentId: 'components',
              }
            ]
          },
          {
            id: 'app',
            name: 'App.tsx',
            type: 'file',
            path: '/my-project/src/App.tsx',
            language: 'typescript',
            content: 'import React from "react";\nimport Button from "./components/Button";\n\nconst App: React.FC = () => {\n  return (\n    <div className="p-4">\n      <h1 className="text-2xl font-bold mb-4">My Application</h1>\n      <Button onClick={() => alert("Button clicked!")}>Click Me</Button>\n    </div>\n  );\n};\n\nexport default App;',
            parentId: 'src',
          },
          {
            id: 'index',
            name: 'index.tsx',
            type: 'file',
            path: '/my-project/src/index.tsx',
            language: 'typescript',
            content: 'import React from "react";\nimport ReactDOM from "react-dom/client";\nimport App from "./App";\n\nReactDOM.createRoot(document.getElementById("root")!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);',
            parentId: 'src',
          }
        ]
      },
      {
        id: 'package',
        name: 'package.json',
        type: 'file',
        path: '/my-project/package.json',
        language: 'json',
        content: '{\n  "name": "my-project",\n  "version": "1.0.0",\n  "dependencies": {\n    "react": "^18.0.0",\n    "react-dom": "^18.0.0"\n  }\n}',
        parentId: 'root',
      },
      {
        id: 'readme',
        name: 'README.md',
        type: 'file',
        path: '/my-project/README.md',
        language: 'markdown',
        content: '# My Project\n\nThis is a sample React project.\n\n## Getting Started\n\nInstall dependencies:\n\n```bash\nnpm install\n```\n\nStart the development server:\n\n```bash\nnpm start\n```',
        parentId: 'root',
      }
    ]
  }
];

// Helper function to generate unique IDs
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper function to find an item by ID in the file system tree
const findItemById = (files: FileSystemItem[], id: string): FileSystemItem | undefined => {
  for (const file of files) {
    if (file.id === id) return file;
    if (file.children) {
      const found = findItemById(file.children, id);
      if (found) return found;
    }
  }
  return undefined;
};

// Helper function to find a parent by child ID
const findParentById = (files: FileSystemItem[], childId: string): FileSystemItem | undefined => {
  for (const file of files) {
    if (file.children?.some(child => child.id === childId)) return file;
    if (file.children) {
      const found = findParentById(file.children, childId);
      if (found) return found;
    }
  }
  return undefined;
};

export const FileSystemProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileSystemItem[]>(initialFileSystem);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  // Get file by ID
  const getFileById = (id: string) => {
    return findItemById(files, id);
  };

  // Create new file or folder
  const createFile = (parentPath: string, name: string, type: FileType) => {
    const newId = generateId();
    const path = `${parentPath}/${name}`;
    
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      // Find the parent folder in which to create the new item
      const findAndAddToParent = (items: FileSystemItem[]) => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.path === parentPath) {
            // Found the parent, add the new item to its children
            const newItem: FileSystemItem = {
              id: newId,
              name,
              type,
              path,
              parentId: item.id,
              isOpen: false,
            };
            
            if (type === 'folder') {
              newItem.children = [];
            } else {
              newItem.content = '';
              newItem.language = name.split('.').pop() || 'plaintext';
              newItem.isModified = false;
            }
            
            item.children = [...(item.children || []), newItem];
            return true;
          }
          
          if (item.children) {
            const added = findAndAddToParent(item.children);
            if (added) return true;
          }
        }
        
        return false;
      };
      
      findAndAddToParent(newFiles);
      return newFiles;
    });
    
    if (type === 'file') {
      setSelectedFile(newId);
    }
    
    return newId;
  };

  // Rename file or folder
  const renameFile = (id: string, newName: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const processItems = (items: FileSystemItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id) {
            // Update name and path
            const oldPath = item.path;
            const newPath = oldPath.substring(0, oldPath.lastIndexOf('/') + 1) + newName;
            item.name = newName;
            item.path = newPath;
            
            // If this is a file, update language based on new extension
            if (item.type === 'file') {
              item.language = newName.split('.').pop() || 'plaintext';
            }
            
            // Update paths of all children if this is a folder
            if (item.type === 'folder' && item.children) {
              const updateChildPaths = (children: FileSystemItem[], oldParentPath: string, newParentPath: string) => {
                for (const child of children) {
                  child.path = child.path.replace(oldParentPath, newParentPath);
                  if (child.children) {
                    updateChildPaths(child.children, oldParentPath, newParentPath);
                  }
                }
              };
              
              updateChildPaths(item.children, oldPath, newPath);
            }
            
            return true;
          }
          
          if (item.children) {
            const renamed = processItems(item.children);
            if (renamed) return true;
          }
        }
        
        return false;
      };
      
      processItems(newFiles);
      return newFiles;
    });
  };

  // Delete file or folder
  const deleteFile = (id: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const processItems = (items: FileSystemItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          // Check if this item has the child we want to delete
          if (items[i].children) {
            const childIndex = items[i].children.findIndex(child => child.id === id);
            
            if (childIndex !== -1) {
              // Found the item to delete
              items[i].children?.splice(childIndex, 1);
              return true;
            }
            
            // Recurse into children
            const deleted = processItems(items[i].children);
            if (deleted) return true;
          }
        }
        
        return false;
      };
      
      processItems(newFiles);
      return newFiles;
    });
    
    // If the deleted file was selected, deselect it
    if (selectedFile === id) {
      setSelectedFile(null);
    }
  };

  // Update file content
  const updateFileContent = (id: string, content: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const processItems = (items: FileSystemItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id) {
            // Update content and mark as modified
            item.content = content;
            item.isModified = true;
            return true;
          }
          
          if (item.children) {
            const updated = processItems(item.children);
            if (updated) return true;
          }
        }
        
        return false;
      };
      
      processItems(newFiles);
      return newFiles;
    });
  };

  // Select a file
  const selectFile = (id: string) => {
    setSelectedFile(id);
  };

  // Toggle folder open/closed state
  const toggleFolder = (id: string) => {
    setFiles(prevFiles => {
      const newFiles = [...prevFiles];
      
      const processItems = (items: FileSystemItem[]): boolean => {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          
          if (item.id === id && item.type === 'folder') {
            item.isOpen = !item.isOpen;
            return true;
          }
          
          if (item.children) {
            const toggled = processItems(item.children);
            if (toggled) return true;
          }
        }
        
        return false;
      };
      
      processItems(newFiles);
      return newFiles;
    });
  };

  // Search files by name or content
  const searchFiles = (query: string): FileSystemItem[] => {
    if (!query) return [];
    
    const results: FileSystemItem[] = [];
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        const matchesName = item.name.toLowerCase().includes(query.toLowerCase());
        const matchesContent = item.type === 'file' && 
                              item.content && 
                              item.content.toLowerCase().includes(query.toLowerCase());
        
        if (matchesName || matchesContent) {
          results.push(item);
        }
        
        if (item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    return results;
  };

  // Move file to new parent
  const moveFile = (fileId: string, newParentId: string) => {
    setFiles(prevFiles => {
      const newFiles = JSON.parse(JSON.stringify(prevFiles)); // Deep copy
      
      // Find the file to move
      const fileToMove = findItemById(newFiles, fileId);
      if (!fileToMove) return prevFiles;
      
      // Find current parent
      const currentParent = findParentById(newFiles, fileId);
      if (!currentParent) return prevFiles;
      
      // Find new parent
      const newParent = findItemById(newFiles, newParentId);
      if (!newParent || newParent.type !== 'folder') return prevFiles;
      
      // Remove from current parent
      const fileIndex = currentParent.children?.findIndex(child => child.id === fileId) ?? -1;
      if (fileIndex > -1 && currentParent.children) {
        currentParent.children.splice(fileIndex, 1);
      }
      
      // Update file's parent ID and path
      fileToMove.parentId = newParentId;
      const oldPath = fileToMove.path;
      const newPath = `${newParent.path}/${fileToMove.name}`;
      fileToMove.path = newPath;
      
      // Update paths of all children if this is a folder
      if (fileToMove.type === 'folder' && fileToMove.children) {
        const updateChildPaths = (children: FileSystemItem[], oldParentPath: string, newParentPath: string) => {
          for (const child of children) {
            child.path = child.path.replace(oldParentPath, newParentPath);
            if (child.children) {
              updateChildPaths(child.children, oldParentPath, newParentPath);
            }
          }
        };
        
        updateChildPaths(fileToMove.children, oldPath, newPath);
      }
      
      // Add to new parent
      if (!newParent.children) newParent.children = [];
      newParent.children.push(fileToMove);
      
      return newFiles;
    });
  };

  return (
    <FileSystemContext.Provider value={{
      files,
      selectedFile,
      createFile,
      renameFile,
      deleteFile,
      updateFileContent,
      selectFile,
      getFileById,
      toggleFolder,
      searchFiles,
      moveFile
    }}>
      {children}
    </FileSystemContext.Provider>
  );
};

export const useFileSystem = () => {
  const context = useContext(FileSystemContext);
  if (context === undefined) {
    throw new Error('useFileSystem must be used within a FileSystemProvider');
  }
  return context;
};
