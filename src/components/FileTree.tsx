
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
            className={`flex items-center py-0.5 px-2 text-sm cursor-pointer hover:bg-slate-700 ${selectedFile === item.name ? 'active-file' : ''}`}
            onClick={() => onSelectFile(item.name)}
          >
            {item.icon || <File size={16} className="file-icon" />}
            <span className="file-text">{item.name}</span>
          </div>
        );
      } else {
        return (
          <div key={index} className="cursor-pointer">
            <div className="flex items-center py-0.5 px-2 text-sm hover:bg-slate-700">
              {item.icon || <Folder size={16} className="folder-icon" />}
              <span className="file-text">{item.name}</span>
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
    <div className="h-full overflow-y-auto">
      {renderItems(items)}
    </div>
  );
};

export default FileTree;
