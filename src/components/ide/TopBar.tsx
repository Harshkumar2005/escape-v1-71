//components/ide/TopBar.tsx
import React, { useState } from 'react';
import { Command, Save, Settings, File as FileIcon, Edit as EditIcon, Eye, HelpCircle, Copy, Clipboard, Download, Upload, Trash2, Undo, Redo, RotateCcw, X, LayoutGrid, HardDriveDownload, Ghost, Option, Undo2, Redo2, Loader2 } from 'lucide-react';
import { FloppyDisk } from "@phosphor-icons/react";
import { useEditor } from '@/contexts/EditorContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import FontSelector from './FontSelector';
//import { //toast } from 'sonner';
import { createAndDownloadZip } from '@/utils/zipUtils';
import { SlashLg } from 'react-bootstrap-icons';
const TopBar: React.FC = () => {
  const { saveActiveFile, activeTabId, undoLastAction, redoLastAction } = useEditor();
  const { createFile, deleteFile, addLogMessage, getAllFiles } = useFileSystem();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Handle opening/closing menus
  const toggleMenu = (menuName: string) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Get all files from the file system
      const allFiles = getAllFiles();
      
      // Important: We directly pass the file objects, not just the paths
      await createAndDownloadZip(allFiles);
      
      addLogMessage('success', 'Project downloaded as ZIP file');
    } catch (error) {
      console.error('Error downloading project:', error);
      //toast.error('Failed to download project');
      addLogMessage('error', 'Failed to download project');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Handle menu item actions
  const handleAction = (action: string) => {
    switch (action) {
      case 'new-file':
        createFile('/my-project', 'untitled.txt', 'file');
        addLogMessage('success', 'New file created');
        break;
      case 'save':
        saveActiveFile();
        break;
      case 'delete':
        if (activeTabId) {
          deleteFile(activeTabId);
          addLogMessage('success', 'File deleted');
        } else {
          addLogMessage('error', 'No file selected');
        }
        break;
      case 'copy':
        if (document.execCommand('copy')) {
          //toast.success('Content copied to clipboard');
        }
        break;
      case 'cut':
        if (document.execCommand('cut')) {
          //toast.success('Content cut to clipboard');
        }
        break;
      case 'paste':
        if (document.execCommand('paste')) {
          //toast.success('Content pasted from clipboard');
        }
        break;
      case 'undo':
        undoLastAction();
        break;
      case 'redo':
        redoLastAction();
        break;
      case 'toggle-minimap':
        addLogMessage('success', 'Minimap toggled');
        break;
      case 'toggle-wrap':
        addLogMessage('success', 'Word wrap toggled');
        break;
      case 'keyboard-shortcuts':
        //toast.info('Keyboard shortcuts: Ctrl+S to save, Ctrl+Z to undo, Ctrl+Y to redo');
        break;
      case 'about':
        addLogMessage('info', 'Code Editor IDE - Version 1.0.0');
        break;
      default:
        break;
    }
    
    // Close menu after action
    setActiveMenu(null);
  };
  
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-status-bar text-slate-400 text-sm border-b border-border">
      <div className="flex items-center space-x-1">
        <Ghost className="text-sidebar-foreground" strokeWidth={2.25} size={16} />
        <h1 className="text-sidebar-foreground font-medium mr-4">ESCAPE.esc</h1>
        <div className="relative" style={{
            marginLeft: '20px',
          }}>
        <button 
          className="py-0.5 gap-1 flex items-center hover:text-white"
          onClick={() => handleAction('undo')}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
          Undo
        </button>
        </div>
        <SlashLg size={16} style={{ transform: 'rotate(-20deg)', marginTop: '1px', opacity: 0.5 }} />
        <div className="relative">
        <button 
          className="py-0.5 gap-1 flex items-center hover:text-white"
          onClick={() => handleAction('redo')}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
          Redo
        </button>
        </div>
        <SlashLg size={16} style={{ transform: 'rotate(-20deg)', marginTop: '1px', opacity: 0.5 }} />
        <div className="relative">
         <button 
          className="py-0.5 gap-1.5 flex items-center hover:text-white"
          onClick={() => handleAction('save')}
          title="Save (Ctrl+S)"
        >
          <FloppyDisk size={17} />
           Save
        </button>
        </div>
        <SlashLg size={16} style={{ transform: 'rotate(-20deg)', marginTop: '1px', opacity: 0.5 }} />
         <div className="relative">
         <button 
          className="py-0.5 gap-1.5 flex items-center hover:text-white"
          onClick={handleDownload}
          disabled={isDownloading}
        >
        {isDownloading ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              <span>Creating ZIP</span>
            </>
          ) : (
            <>
              <HardDriveDownload size={15} />
              <span>Download</span>
            </>
          )}
        </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <p className="p-1 hover:text-white transition-colors">Logs:</p>
       
      </div>
    </div>
  );
};

export default TopBar;
