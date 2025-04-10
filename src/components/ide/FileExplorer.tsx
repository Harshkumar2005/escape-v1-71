
import React, { useState, useRef, useEffect } from 'react';
import { 
  File, Folder, FolderOpen, ChevronDown, ChevronRight, Plus, Search, X,
  FileCode, FileText, FileImage, FileVideo, FileAudio, FileJson, FileCheck, 
  FileCog, FileSpreadsheet, Edit, Trash, FolderPlus
} from 'lucide-react';
import { useFileSystem, FileSystemItem, FileType } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch(extension) {
    case 'js':
    case 'jsx':
    case 'ts':
    case 'tsx':
    case 'html':
    case 'css':
    case 'php':
    case 'py':
    case 'rb':
    case 'java':
    case 'go':
    case 'c':
    case 'cpp':
    case 'cs':
      return <FileCode size={16} className="file-icon" />;
    
    case 'txt':
    case 'md':
    case 'rtf':
    case 'log':
      return <FileText size={16} className="file-icon" />;
    
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'bmp':
    case 'ico':
      return <FileImage size={16} className="file-icon" />;
    
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'webm':
      return <FileVideo size={16} className="file-icon" />;
    
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <FileAudio size={16} className="file-icon" />;
    
    case 'json':
      return <FileJson size={16} className="file-icon" />;
    
    case 'yml':
    case 'yaml':
    case 'toml':
    case 'ini':
    case 'env':
    case 'config':
      return <FileCog size={16} className="file-icon" />;
    
    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FileSpreadsheet size={16} className="file-icon" />;
    
    case 'exe':
    case 'bat':
    case 'sh':
      return <FileCheck size={16} className="file-icon" />;
    
    default:
      return <File size={16} className="file-icon" />;
  }
};

const FileExplorer: React.FC = () => {
  const { files, createFile, renameFile, deleteFile, toggleFolder } = useFileSystem();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FileSystemItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [newItemType, setNewItemType] = useState<FileType | null>(null);
  const [newItemParentPath, setNewItemParentPath] = useState<string>('');
  const [renamingItemId, setRenamingItemId] = useState<string | null>(null);
  const newItemInputRef = useRef<HTMLInputElement>(null);
  const renameInputRef = useRef<HTMLInputElement>(null);
  
  // Menu state
  const [contextMenuPosition, setContextMenuPosition] = useState({ x: 0, y: 0 });
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [showFileItemMenu, setShowFileItemMenu] = useState(false);
  const [showFolderItemMenu, setShowFolderItemMenu] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [selectedItemPath, setSelectedItemPath] = useState<string | null>(null);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowContextMenu(false);
      setShowFileItemMenu(false);
      setShowFolderItemMenu(false);
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowContextMenu(true);
    setShowFileItemMenu(false);
    setShowFolderItemMenu(false);
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setSelectedItemId(item.id);
    setSelectedItemPath(item.path);
    
    if (item.type === 'file') {
      setShowFileItemMenu(true);
      setShowFolderItemMenu(false);
    } else {
      setShowFileItemMenu(false);
      setShowFolderItemMenu(true);
    }
    
    setShowContextMenu(false);
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    
    if (query.trim() === '') {
      setIsSearching(false);
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    
    const results: FileSystemItem[] = [];
    
    const searchInItems = (items: FileSystemItem[]) => {
      for (const item of items) {
        if (item.name.toLowerCase().includes(query.toLowerCase())) {
          results.push(item);
        }
        
        if (item.type === 'folder' && item.children) {
          searchInItems(item.children);
        }
      }
    };
    
    searchInItems(files);
    setSearchResults(results);
  };

  const startCreatingNewItem = (parentPath: string, type: FileType) => {
    setNewItemType(type);
    setNewItemParentPath(parentPath);
    
    setTimeout(() => {
      if (newItemInputRef.current) {
        newItemInputRef.current.focus();
      }
    }, 50);
    
    // Close all menus
    setShowContextMenu(false);
    setShowFileItemMenu(false);
    setShowFolderItemMenu(false);
  };

  const handleCreateNewItem = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newItemType) {
      const name = e.currentTarget.value.trim();
      
      if (name) {
        createFile(newItemParentPath, name, newItemType);
        setNewItemType(null);
      }
    } else if (e.key === 'Escape') {
      setNewItemType(null);
    }
  };

  const startRenaming = (itemId: string) => {
    setRenamingItemId(itemId);
    
    setTimeout(() => {
      if (renameInputRef.current) {
        renameInputRef.current.focus();
        renameInputRef.current.select();
      }
    }, 50);
    
    // Close all menus
    setShowContextMenu(false);
    setShowFileItemMenu(false);
    setShowFolderItemMenu(false);
  };

  const handleRename = (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => {
    if (e.key === 'Enter') {
      const newName = e.currentTarget.value.trim();
      
      if (newName) {
        renameFile(itemId, newName);
        setRenamingItemId(null);
      }
    } else if (e.key === 'Escape') {
      setRenamingItemId(null);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    deleteFile(itemId);
    
    // Close all menus
    setShowContextMenu(false);
    setShowFileItemMenu(false);
    setShowFolderItemMenu(false);
  };

  // Custom MenuItem component
  const MenuItem = ({ onClick, children }: { onClick: () => void, children: React.ReactNode }) => (
    <div 
      className="menu-item flex items-center px-4 py-1 hover:bg-[#272b34] hover:text-white cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {children}
    </div>
  );

  // File Explorer Item component
  const FileExplorerItem = ({ 
    item, 
    depth = 0,
    handleItemContextMenu,
    renamingItemId,
    renameInputRef,
    handleRename,
    newItemType,
    newItemParentPath,
    newItemInputRef,
    handleCreateNewItem,
  }: any) => {
    const { openTab } = useEditor();
    const { selectedFile, toggleFolder } = useFileSystem();
    
    // Determine if this is a folder
    const isFolder = item.type === 'folder';
    
    // Check if this item is selected
    const isSelected = selectedFile === item.id;
    
    // Handle item click
    const handleItemClick = () => {
      if (isFolder) {
        toggleFolder(item.id);
      } else {
        openTab(item.id);
      }
    };
    
    return (
      <>
        <div
          className={`flex items-center py-0.5 px-2 cursor-pointer rounded-sm text-sidebar-foreground ${
            isSelected ? 'bg-[#cccccc29]' : 'hover:bg-[#cccccc15]'
          }`}
          style={{ paddingLeft: `${depth * 12 + 4}px` }}
          onClick={handleItemClick}
          onContextMenu={(e) => handleItemContextMenu(e, item)}
        >
          {isFolder ? (
            <div className="pr-1">
              {item.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </div>
          ) : (
            <div className="w-4"></div>
          )}
          
          <div className="mr-1.5">
            {isFolder ? (
              item.isOpen ? <FolderOpen size={16} className="folder-open-icon" /> : <Folder size={16} className="folder-icon" />
            ) : (
              getFileIcon(item.name)
            )}
          </div>
          
          {renamingItemId === item.id ? (
            <input
              ref={renameInputRef}
              defaultValue={item.name}
              className="flex-1 bg-sidebar-foreground bg-opacity-10 px-1 rounded text-white outline-none"
              onKeyDown={(e) => handleRename(e, item.id)}
              onBlur={() => setRenamingItemId(null)}
            />
          ) : (
            <span className="text-sm truncate">{item.name}</span>
          )}
        </div>
        
        {isFolder && item.isOpen && (
          <div>
            {item.children?.map((child: FileSystemItem) => (
              <FileExplorerItem
                key={child.id}
                item={child}
                depth={depth + 1}
                handleItemContextMenu={handleItemContextMenu}
                renamingItemId={renamingItemId}
                renameInputRef={renameInputRef}
                handleRename={handleRename}
                newItemType={newItemType}
                newItemParentPath={newItemParentPath}
                newItemInputRef={newItemInputRef}
                handleCreateNewItem={handleCreateNewItem}
              />
            ))}
            
            {newItemType && newItemParentPath === item.path && (
              <div
                className="flex items-center py-0.5 px-2"
                style={{ paddingLeft: `${(depth + 1) * 12 + 8}px` }}
              >
                <div className="mr-1.5">
                  {newItemType === 'file' ? (
                    <FileText size={16} className="file-icon" />
                  ) : (
                    <Folder size={16} className="folder-icon" />
                  )}
                </div>
                <input
                  ref={newItemInputRef}
                  className="flex-1 bg-sidebar-foreground bg-opacity-10 px-1 rounded text-white outline-none"
                  placeholder={newItemType === 'file' ? 'File name...' : 'Folder name...'}
                  onKeyDown={handleCreateNewItem}
                  onBlur={() => setNewItemType(null)}
                />
              </div>
            )}
          </div>
        )}
      </>
    );
  };

  // Search Result Item component
  const SearchResultItem = ({ item, handleItemContextMenu }: { item: FileSystemItem, handleItemContextMenu: any }) => {
    const { openTab } = useEditor();
    
    const handleItemClick = () => {
      if (item.type === 'file') {
        openTab(item.id);
      }
    };
    
    return (
      <div
        className="flex items-center py-0.5 px-2 cursor-pointer rounded-sm text-sidebar-foreground hover:bg-[#cccccc15]"
        onClick={handleItemClick}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        <div className="mr-1.5">
          {item.type === 'folder' ? (
            <Folder size={16} className="folder-icon" />
          ) : (
            getFileIcon(item.name)
          )}
        </div>
        <span className="text-sm truncate">{item.name}</span>
      </div>
    );
  };

  return (
    <div 
      className="h-full overflow-auto bg-sidebar flex flex-col"
      onContextMenu={handleContextMenu}
    >
      <div className="px-2 py-0.5 flex justify-between items-center border-b border-border">
        <h1 className="text-slate-400 text-sm font-medium mr-4">File Explorer</h1>
        <div className="flex space-x-1">
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={() => setIsSearching(!isSearching)}
          >
            <Search size={16} />
          </button>
          <button 
            className="p-1 text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded transition-colors"
            onClick={() => startCreatingNewItem(files[0].path, 'file')}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
      
      {isSearching && (
        <div className="px-2 py-2 border-b border-border">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full bg-sidebar-foreground bg-opacity-10 text-sm px-3 py-1 rounded text-sidebar-foreground outline-none"
              placeholder="Search files..."
              autoFocus
            />
            {searchQuery && (
              <button 
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-white"
                onClick={() => {
                  setSearchQuery('');
                  handleSearch('');
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}
      
      <div className="flex-1 overflow-auto">
        {isSearching ? (
          <div className="px-2 py-1">
            {searchResults.length > 0 ? (
              searchResults.map(item => (
                <SearchResultItem 
                  key={item.id} 
                  item={item} 
                  handleItemContextMenu={handleItemContextMenu}
                />
              ))
            ) : (
              <div className="text-sm text-slate-400 px-2 py-1">
                No results found
              </div>
            )}
          </div>
        ) : (
          <div className="px-2 py-1">
            {files.map(item => (
              <FileExplorerItem 
                key={item.id}
                item={item}
                handleItemContextMenu={handleItemContextMenu}
                renamingItemId={renamingItemId}
                renameInputRef={renameInputRef}
                handleRename={handleRename}
                newItemType={newItemType}
                newItemParentPath={newItemParentPath}
                newItemInputRef={newItemInputRef}
                handleCreateNewItem={handleCreateNewItem}
                setRenamingItemId={setRenamingItemId}
              />
            ))}
          </div>
        )}
      </div>
      
      {/* Main Context Menu */}
      {showContextMenu && (
        <div 
          className="menu-dropdown fixed mt-1 bg-[#1a1e26] border border-border rounded shadow-lg z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => startCreatingNewItem(files[0].path, 'file')}>
            <FileText size={14} className="mr-2" />
            New File
          </MenuItem>
          <MenuItem onClick={() => startCreatingNewItem(files[0].path, 'folder')}>
            <Folder size={14} className="mr-2" />
            New Folder
          </MenuItem>
        </div>
      )}
      
      {/* File Item Context Menu */}
      {showFileItemMenu && selectedItemId && (
        <div 
          className="menu-dropdown fixed mt-1 bg-[#1a1e26] border border-border rounded shadow-lg z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => startRenaming(selectedItemId)}>
            <Edit size={14} className="mr-2" />
            Rename
          </MenuItem>
          <MenuItem onClick={() => handleDeleteItem(selectedItemId)}>
            <Trash size={14} className="mr-2" />
            Delete
          </MenuItem>
        </div>
      )}
      
      {/* Folder Item Context Menu */}
      {showFolderItemMenu && selectedItemId && selectedItemPath && (
        <div 
          className="menu-dropdown fixed mt-1 bg-[#1a1e26] border border-border rounded shadow-lg z-50"
          style={{ top: contextMenuPosition.y, left: contextMenuPosition.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem onClick={() => startCreatingNewItem(selectedItemPath, 'file')}>
            <FileText size={14} className="mr-2 opacity-70" />
            New File
          </MenuItem>
          <MenuItem onClick={() => startCreatingNewItem(selectedItemPath, 'folder')}>
            <FolderPlus size={14} className="mr-2" />
            New Folder
          </MenuItem>
          <MenuItem onClick={() => startRenaming(selectedItemId)}>
            <Edit size={14} className="mr-2" />
            Rename
          </MenuItem>
          <MenuItem onClick={() => handleDeleteItem(selectedItemId)}>
            <Trash size={14} className="mr-2" />
            Delete
          </MenuItem>
        </div>
      )}
    </div>
  );
};

export default FileExplorer;
