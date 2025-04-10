
import React from 'react';
import fileIcons from 'file-icons-js';

interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

const FileIcon: React.FC<FileIconProps> = ({ 
  filename, 
  size = 16, 
  className = '' 
}) => {
  const iconClass = fileIcons.getClassWithColor(filename);

  return (
    <i 
      className={`${iconClass} ${className}`} 
      style={{ fontSize: size, display: 'inline-block' }}
    ></i>
  );
};

export default FileIcon;
