import React, { useState, Dispatch, SetStateAction } from 'react';
import { useFileContext } from '@/contexts/FileContext';
import { Folder, ChevronRight, ChevronDown, Plus } from 'lucide-react';
import { FileIcon, defaultStyles } from 'react-file-icon';
import type { FileNode } from '@/contexts/FileContext';

export const FileExplorer: React.FC = () => {
  const { files, setFiles, selectedFile, setSelectedFile, createDirectory } = useFileContext();
  const [showNewFolderInput, setShowNewFolderInput] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');

  const toggleDirectory = (node: FileNode) => {
    setFiles((prevFiles: FileNode[]) =>
      prevFiles.map(f =>
        f.path === node.path ? { ...f, isOpen: !f.isOpen } : f
      )
    );
  };

  const handleFileClick = (node: FileNode) => {
    setSelectedFile(node);
  };

  const handleCreateFolder = () => {
    if (newFolderName) {
      createDirectory(newFolderName);
      setNewFolderName('');
      setShowNewFolderInput(false);
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase() || '';
    
    if (extension) {
      const styles = (defaultStyles as any)[extension] || {};
      return (
        <div className="w-4 h-4 flex-shrink-0">
          <FileIcon extension={extension} {...styles} />
        </div>
      );
    }
    
    return null;
  };

  const renderNode = (node: FileNode) => {
    const isDirectory = node.children && node.children.length > 0;
    const isSelected = selectedFile?.path === node.path;

    return (
      <div key={node.path} className="pl-4">
        <div
          className={`flex items-center space-x-2 py-1 px-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
            isSelected ? 'bg-blue-100 dark:bg-blue-900' : ''
          }`}
          onClick={() => (isDirectory ? toggleDirectory(node) : handleFileClick(node))}
        >
          {isDirectory ? (
            <>
              {node.isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              <Folder size={16} className="text-yellow-500" />
            </>
          ) : (
            <>
              <span className="w-4" />
              {getFileIcon(node.path.split('/').pop() || '') || <div className="w-4 h-4" />}
            </>
          )}
          <span className="text-sm">{node.path.split('/').pop()}</span>
        </div>
        {isDirectory && node.isOpen && node.children.map(child => renderNode(child))}
      </div>
    );
  };

  return (
    <div className="h-full border-r dark:border-gray-700 bg-white dark:bg-gray-900 w-64 overflow-y-auto">
      <div className="p-4">
        <button
          className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
          onClick={() => setShowNewFolderInput(true)}
        >
          <Plus size={16} />
          <span>New Folder</span>
        </button>
        {showNewFolderInput && (
          <div className="mt-2 flex space-x-2">
            <input
              type="text"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              className="flex-1 px-2 py-1 text-sm border rounded dark:bg-gray-800 dark:border-gray-700"
              placeholder="Folder name"
            />
            <button
              onClick={handleCreateFolder}
              className="px-2 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Create
            </button>
          </div>
        )}
      </div>
      <div className="mt-2">
        {files.map(node => renderNode(node))}
      </div>
    </div>
  );
};
