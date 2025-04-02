
import { FileSystemItem } from '@/contexts/FileSystemContext';

// Convert our file system structure to WebContainer format
export const convertToWebContainerFormat = (items: FileSystemItem[]): Record<string, any> => {
  const result: Record<string, any> = {};
  
  for (const item of items) {
    const name = item.name;
    
    if (item.type === 'folder') {
      result[name] = {
        directory: convertToWebContainerFormat(item.children || [])
      };
    } else {
      result[name] = {
        file: {
          contents: item.content || ''
        }
      };
    }
  }
  
  return result;
};

// Extract the parent path from a full path
export const getParentPath = (path: string): string => {
  const parts = path.split('/');
  parts.pop();
  return parts.join('/') || '/';
};

// Get the file name from a path
export const getFileName = (path: string): string => {
  const parts = path.split('/');
  return parts[parts.length - 1];
};
