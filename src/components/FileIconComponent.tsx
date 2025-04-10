
import React from 'react';

interface FileIconProps {
  filename: string;
  size?: number;
  className?: string;
}

export const FileIconComponent: React.FC<FileIconProps> = ({ 
  filename, 
  size = 16, 
  className = ""
}) => {
  // Get file extension
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  // Determine icon class based on file extension
  let iconClass = '';
  
  if (extension) {
    iconClass = `icon icon-${extension}`;
  } else {
    // Handle files without extensions (like "README") or folders
    iconClass = 'icon icon-default';
  }
  
  return (
    <i 
      className={`${iconClass} ${className}`} 
      style={{ fontSize: size }}
    >
      {/* Using the first letter of the extension as a fallback */}
      {extension ? extension.charAt(0).toUpperCase() : '•'}
    </i>
  );
};
