
import React, { useState } from 'react';
import { File, Folder } from 'lucide-react';

type FileItem = {
  name: string;
  type: 'file';
  icon?: React.ReactNode;
};

type FolderItem = {
  name: string;
  type: 'folder';
  icon?: React.ReactNode;
  children: (FileItem | FolderItem)[];
  open?: boolean;
};

type FileTreeProps = {
  items: (FileItem | FolderItem)[];
  selectedFile: string;
  onSelectFile: (fileName: string) => void;
  onFileDrop?: (item: FileItem | FolderItem, targetFolder: FolderItem) => void;
  onExternalFileDrop?: (files: FileList, targetPath: string) => void;
};

const FileTree: React.FC<FileTreeProps> = ({ 
  items, 
  selectedFile, 
  onSelectFile, 
  onFileDrop, 
  onExternalFileDrop 
}) => {
  const [draggedOver, setDraggedOver] = useState<string | null>(null);
  
  const handleDragStart = (e: React.DragEvent, item: FileItem | FolderItem) => {
    e.dataTransfer.setData('application/json', JSON.stringify(item));
    e.dataTransfer.effectAllowed = 'move';
  };
  
  const handleDragOver = (e: React.DragEvent, item: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(item.name);
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDragLeave = () => {
    setDraggedOver(null);
  };
  
  const handleDrop = (e: React.DragEvent, targetFolder: FolderItem) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggedOver(null);
    
    // Check if this is an external file drop (from the user's file system)
    if (e.dataTransfer.files.length > 0 && onExternalFileDrop) {
      onExternalFileDrop(e.dataTransfer.files, targetFolder.name);
      return;
    }
    
    // Handle internal item drop (moving files/folders within the application)
    try {
      const itemData = e.dataTransfer.getData('application/json');
      if (itemData && onFileDrop) {
        const draggedItem = JSON.parse(itemData);
        onFileDrop(draggedItem, targetFolder);
      }
    } catch (error) {
      console.error('Error processing dropped item:', error);
    }
  };
  
  const renderItems = (items: (FileItem | FolderItem)[]) => {
    return items.map((item, index) => {
      if (item.type === 'file') {
        return (
          <div 
            key={index}
            className={`file-explorer-item flex items-center py-0.5 px-2 text-sm cursor-pointer rounded-sm ${selectedFile === item.name ? 'selected' : ''}`}
            onClick={() => onSelectFile(item.name)}
            draggable={!!onFileDrop}
            onDragStart={(e) => handleDragStart(e, item)}
          >
            {item.icon || <File size={16} className="file-icon mr-1.5" />}
            <span className="file-text truncate">{item.name}</span>
          </div>
        );
      } else {
        return (
          <div 
            key={index} 
            className="cursor-pointer"
          >
            <div 
              className={`file-explorer-item flex items-center py-0.5 px-2 text-sm rounded-sm ${
                draggedOver === item.name ? 'bg-primary/20 border border-primary/40' : ''
              }`}
              draggable={!!onFileDrop}
              onDragStart={(e) => handleDragStart(e, item)}
              onDragOver={(e) => handleDragOver(e, item)}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, item)}
            >
              {item.icon || <Folder size={16} className="folder-icon mr-1.5" />}
              <span className="file-text truncate">{item.name}</span>
            </div>
            <div className="pl-4">
              {renderItems(item.children)}
            </div>
          </div>
        );
      }
    });
  };

  return (
    <div 
      className="h-full overflow-y-auto py-1"
      onDragLeave={handleDragLeave}
    >
      {renderItems(items)}
    </div>
  );
};

export default FileTree;
