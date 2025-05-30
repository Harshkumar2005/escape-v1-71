import React, { useState, useRef, useEffect } from 'react';
import { 
  File, Folder, FolderOpen, ChevronDown, ChevronRight, Plus, Search, X,
  FileCode, FileText, FileImage, FileVideo, FileAudio, FileJson, FileCheck, 
  FileCog, FileSpreadsheet, Edit, Trash, FolderPlus
} from 'lucide-react';


import {
  FiletypeJs,
  FiletypeJsx,
  FiletypeTsx,
  FiletypeHtml,
  FiletypeCss,
  FiletypePhp,
  FiletypePy,
  FiletypeRb,
  FiletypeJava,
  FiletypeMd,
  FiletypeTxt,
  FileEarmarkImage,
  FileEarmarkPlay,
  FiletypeJson,
  FiletypeXls,
  Terminal,
  GearFill,
  FileEarmark,
  FileEarmarkCode,
  FileEarmarkLock
} from 'react-bootstrap-icons';





import { useFileSystem, FileSystemItem, FileType } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import 'react-contexify/ReactContexify.css';

const CONTEXT_MENU_ID = 'file-explorer-context-menu';
const FILE_ITEM_MENU_ID = 'file-item-context-menu';
const FOLDER_ITEM_MENU_ID = 'folder-item-context-menu';

const getFileIcon = (fileName: string) => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  switch(extension) {
  /*  case 'js':
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
      return <File size={16} className="file-icon" />;*/

case 'js':
      return <FiletypeJs size={17} className="file-icon" />;
    case 'jsx':
      return <FiletypeJsx size={17} className="file-icon" />;
    case 'ts':
      return <FiletypeTsx size={17} className="file-icon" />;
    case 'tsx':
      return <FiletypeTsx size={17} className="file-icon" />;
    case 'html':
      return <FiletypeHtml size={17} className="file-icon" />;
    case 'css':
      return <FiletypeCss size={17} className="file-icon" />;
    case 'php':
      return <FiletypePhp size={17} className="file-icon" />;
    case 'py':
      return <FiletypePy size={17} className="file-icon" />;
    case 'rb':
      return <FiletypeRb size={17} className="file-icon" />;
    case 'java':
      return <FiletypeJava size={17} className="file-icon" />;
    case 'go':
      return <FileEarmarkCode size={17} className="file-icon" />;
    case 'c':
      return <FileEarmarkCode size={17} className="file-icon" />;
    case 'cpp':
      return <FileEarmarkCode size={17} className="file-icon" />;
    case 'cs':
      return <FileEarmarkCode size={17} className="file-icon" />;

    case 'txt':
    case 'rtf':
    case 'log':
      return <FiletypeTxt size={17} className="file-icon" />;
    case 'md':
      return <FiletypeMd size={17} className="file-icon" />;

    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'svg':
    case 'bmp':
    case 'ico':
      return <FileEarmarkImage size={17} className="file-icon" />;

    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'webm':
      return <FileEarmarkPlay size={17} className="file-icon" />;

    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <FileEarmarkPlay size={17} className="file-icon" />;

    case 'json':
      return <FiletypeJson size={17} className="file-icon" />;

    case 'yml':
    case 'yaml':
    case 'toml':
    case 'ini':
    case 'env':
    case 'config':
       return <FileEarmarkLock size={17} className="file-icon" />;

    case 'csv':
    case 'xls':
    case 'xlsx':
      return <FiletypeXls size={17} className="file-icon" />;

    case 'exe':
    case 'bat':
    case 'sh':
      return <Terminal size={17} className="file-icon" />;

    default:
      return <FileEarmarkCode size={17} className="file-icon" />;
      
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
  
  const [contextMenu, setContextMenu] = useState<{
    isOpen: boolean;
    x: number;
    y: number;
    menuType: 'main' | 'file' | 'folder';
    itemId?: string;
    itemPath?: string;
  }>({
    isOpen: false,
    x: 0,
    y: 0,
    menuType: 'main'
  });

  useEffect(() => {
    const handleClickOutside = () => {
      if (contextMenu.isOpen) {
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [contextMenu.isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      menuType: 'main'
    });
  };

  const handleItemContextMenu = (e: React.MouseEvent, item: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    setContextMenu({
      isOpen: true,
      x: e.clientX,
      y: e.clientY,
      menuType: item.type === 'file' ? 'file' : 'folder',
      itemId: item.id,
      itemPath: item.path
    });
  };

  const MenuItem = ({ 
    icon, 
    children, 
    onClick 
  }: { 
    icon: React.ReactNode; 
    children: React.ReactNode; 
    onClick: () => void; 
  }) => (
    <div 
      className="text-sm ml-1 mr-1 rounded menu-item flex items-center px-4 py-1 hover:bg-[#272b34] hover:text-white cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
        setContextMenu(prev => ({ ...prev, isOpen: false }));
      }}
    >
      {icon}
      {children}
    </div>
  );

  const renderFileTree = (items: FileSystemItem[], depth = 0) => {
    return items.map(item => (
      <FileExplorerItem 
        key={item.id}
        item={item}
        depth={depth}
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
    ));
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

  return (
    <div 
      className="h-full bg-sidebar flex flex-col"
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
      
      <div className="flex-1 h-full overflow-auto" style={{scrollbarWidth: 'none',}}>
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
            {renderFileTree(files)}
          </div>
        )}
      </div>
      
      {contextMenu.isOpen && contextMenu.menuType === 'main' && (
        <div 
          className="menu-dropdown mt-1 left-0 bg-[#1a1e26] border border-border rounded shadow-lg z-50 absolute"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem 
            icon={<FileText size={14} className="mr-2" />}
            onClick={() => startCreatingNewItem(files[0].path, 'file')}
          >
            New File
          </MenuItem>
          <MenuItem 
            icon={<Folder size={14} className="mr-2" />}
            onClick={() => startCreatingNewItem(files[0].path, 'folder')}
          >
            New Folder
          </MenuItem>
        </div>
      )}
 
      {contextMenu.isOpen && contextMenu.menuType === 'file' && (
        <div 
          className="menu-dropdown mt-1 left-0 bg-[#1a1e26] border border-border rounded shadow-lg z-50 absolute"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem 
            icon={<Edit size={14} className="mr-2" />}
            onClick={() => startRenaming(contextMenu.itemId!)}
          >
            Rename
          </MenuItem>
          <MenuItem 
            icon={<Trash size={14} className="mr-2" />}
            onClick={() => deleteFile(contextMenu.itemId!)}
          >
            Delete
          </MenuItem>
        </div>
      )}
  
      {contextMenu.isOpen && contextMenu.menuType === 'folder' && (
        <div 
          className="menu-dropdown mt-1 left-0 bg-[#1a1e26] border border-border rounded shadow-lg z-50 absolute"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <MenuItem 
            icon={<FileText size={14} className="mr-2 opacity-70" />}
            onClick={() => startCreatingNewItem(contextMenu.itemPath!, 'file')}
          >
            New File
          </MenuItem>
          <MenuItem 
            icon={<FolderPlus size={14} className="mr-2" />}
            onClick={() => startCreatingNewItem(contextMenu.itemPath!, 'folder')}
          >
            New Folder
          </MenuItem>
          <MenuItem 
            icon={<Edit size={14} className="mr-2" />}
            onClick={() => startRenaming(contextMenu.itemId!)}
          >
            Rename
          </MenuItem>
          <MenuItem 
            icon={<Trash size={14} className="mr-2" />}
            onClick={() => deleteFile(contextMenu.itemId!)}
          >
            Delete
          </MenuItem>
        </div>
      )}
    </div>
  );
};

interface FileExplorerItemProps {
  item: FileSystemItem;
  depth: number;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
  renamingItemId: string | null;
  renameInputRef: React.RefObject<HTMLInputElement>;
  handleRename: (e: React.KeyboardEvent<HTMLInputElement>, itemId: string) => void;
  newItemType: FileType | null;
  newItemParentPath: string;
  newItemInputRef: React.RefObject<HTMLInputElement>;
  handleCreateNewItem: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  setRenamingItemId: React.Dispatch<React.SetStateAction<string | null>>;
}

const FileExplorerItem: React.FC<FileExplorerItemProps> = ({ 
  item, 
  depth,
  handleItemContextMenu,
  renamingItemId,
  renameInputRef,
  handleRename,
  newItemType,
  newItemParentPath,
  newItemInputRef,
  handleCreateNewItem,
  setRenamingItemId
}) => {
  const { toggleFolder, selectedFile } = useFileSystem();
  const { openTab } = useEditor();
  
  const handleItemClick = () => {
    if (item.type === 'folder') {
      toggleFolder(item.id);
    } else {
      openTab(item.id);
    }
  };
  
  const isSelected = selectedFile === item.id;
  const showNewItemInput = newItemType && newItemParentPath === item.path;
  
  return (
    <div>
      <div
        className={`group flex items-center py-0.5 px-1 cursor-pointer rounded ${
          isSelected ? 'bg-[#272b34] text-white' : 'hover:text-white'
        }`}
        style={{ paddingLeft: `${(depth * 12) + 4}px` }}
        onClick={handleItemClick}
        onContextMenu={(e) => handleItemContextMenu(e, item)}
      >
        {item.type === 'folder' && (
          <span className={`mr-1 ${
          isSelected ? 'text-white' : 'group-hover:text-white text-slate-400 group-hover:opacity-100'
        }`}>
            {item.isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
          </span>
        )}
        
        <span className={`mr-1 ${
          isSelected ? 'text-white' : 'group-hover:text-white text-slate-400 group-hover:opacity-100'
        }`}>
          {item.type === 'folder' 
            ? (item.isOpen ? <FolderOpen size={17} /> : <Folder size={17} />)
            : getFileIcon(item.name)
          }
        </span>
        
        {renamingItemId === item.id ? (
          <input
            type="text"
            defaultValue={item.name}
            ref={renameInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={(e) => handleRename(e, item.id)}
            onBlur={() => setTimeout(() => setRenamingItemId(null), 100)}
          />
        ) : (
          <span className={`text-sm truncate ${
          isSelected ? 'text-white' : 'text-sidebar-foreground opacity-90 group-hover:text-white group-hover:opacity-100'
        }`}>{item.name}</span>
        )}
      </div>
      
      {showNewItemInput && (
        <div 
          className="flex items-center py-0.5 px-1"
          style={{ paddingLeft: `${((depth + 1) * 12) + 4}px` }}
        >
          <span className="mr-1 text-slate-400">
            {newItemType === 'folder' ? <Folder size={17} /> : <File size={17} />}
          </span>
          <input
            type="text"
            ref={newItemInputRef}
            className="bg-sidebar-foreground bg-opacity-20 text-sm px-1 rounded text-sidebar-foreground outline-none"
            onKeyDown={handleCreateNewItem}
            placeholder={`New ${newItemType}`}
          />
        </div>
      )}
      
      {item.type === 'folder' && item.isOpen && item.children && (
        <div>
          {item.children.map(child => (
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
              setRenamingItemId={setRenamingItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface SearchResultItemProps {
  item: FileSystemItem;
  handleItemContextMenu: (e: React.MouseEvent, item: FileSystemItem) => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ item, handleItemContextMenu }) => {
  const { openTab } = useEditor();
  
  const handleClick = () => {
    if (item.type === 'file') {
      openTab(item.id);
    }
  };
  
  return (
    <div
      className="flex items-center py-0.5 px-2 cursor-pointer rounded hover:text-white transition-colors"
      onClick={handleClick}
      onContextMenu={(e) => handleItemContextMenu(e, item)}
    >
      <span className="mr-2 text-slate-400">
        {item.type === 'folder' ? <Folder size={17} /> : getFileIcon(item.name)}
      </span>
      <span className="text-sm text-sidebar-foreground hover:text-white opacity-90 truncate">{item.name}</span>
      <span className="text-xs text-slate-500 ml-2 truncate opacity-70">{item.path}</span>
    </div>
  );
};

export default FileExplorer;
