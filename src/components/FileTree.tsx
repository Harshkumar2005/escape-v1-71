
import React from 'react';
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
};

const FileTree: React.FC<FileTreeProps> = ({ items, selectedFile, onSelectFile }) => {
  const renderItems = (items: (FileItem | FolderItem)[]) => {
    return items.map((item, index) => {
      if (item.type === 'file') {
        return (
          <div 
            key={index}
            className={`file-explorer-item flex items-center py-0.5 px-2 text-sm cursor-pointer rounded-sm ${selectedFile === item.name ? 'selected' : ''}`}
            onClick={() => onSelectFile(item.name)}
          >
            {item.icon || <File size={16} className="file-icon mr-1.5" />}
            <span className="file-text truncate">{item.name}</span>
          </div>
        );
      } else {
        return (
          <div key={index} className="cursor-pointer">
            <div className="file-explorer-item flex items-center py-0.5 px-2 text-sm rounded-sm">
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
    <div className="h-full overflow-y-auto py-1.5 scrollbar-none">
      {renderItems(items)}
    </div>
  );
};

export default FileTree;
