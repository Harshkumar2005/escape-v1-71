
import React, { useEffect, useState } from 'react';
import { getIconClassByName } from '@exuanbo/file-icons-js';
import { Folder, FolderOpen } from 'lucide-react';

interface FileIconProps {
  fileName: string;
  isDirectory?: boolean;
  isOpen?: boolean;
  size?: number;
}

const FileIcon: React.FC<FileIconProps> = ({ 
  fileName, 
  isDirectory = false, 
  isOpen = false,
  size = 16
}) => {
  const [iconClass, setIconClass] = useState<string>('');
  
  useEffect(() => {
    if (!isDirectory) {
      const className = getIconClassByName(fileName);
      setIconClass(className);
    }
  }, [fileName, isDirectory]);

  if (isDirectory) {
    return isOpen 
      ? <FolderOpen size={size} className="text-yellow-500" /> 
      : <Folder size={size} className="text-yellow-500" />;
  }

  // If no icon class was found, we'll just use a default style
  const defaultClass = "text-gray-500";
  
  return (
    <span 
      className={`file-icon ${iconClass || defaultClass}`}
      style={{ fontSize: `${size}px` }}
    >
      {!iconClass && '📄'}
    </span>
  );
};

export default FileIcon;
