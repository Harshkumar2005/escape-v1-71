import React, { useState, useEffect } from 'react';
import { Command, Save, Settings, File as FileIcon, Edit as EditIcon, Eye, HelpCircle, Copy, Clipboard, Download, Upload, Trash2, Undo, Redo, RotateCcw, X, LayoutGrid } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { positionToRange } from '@/utils/editorUtils';
import FontSelector from './FontSelector';
import { toast } from 'sonner';

const TopBar: React.FC = () => {
  const { saveActiveFile, activeTabId, undoTabClose, monacoInstance } = useEditor();
  const { createFile, deleteFile, addLogMessage } = useFileSystem();
  
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S to save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleAction('save');
      }
      
      // Ctrl+Y or Ctrl+Shift+Z for redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
        e.preventDefault();
        handleAction('redo');
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTabId]);
  
  // Handle opening/closing menus
  const toggleMenu = (menuName: string) => {
    if (activeMenu === menuName) {
      setActiveMenu(null);
    } else {
      setActiveMenu(menuName);
    }
  };
  
  // Handle menu item actions
  const handleAction = (action: string) => {
    switch (action) {
      case 'new-file':
        createFile('/my-project', 'untitled.txt', 'file');
        addLogMessage('success', 'New file created');
        toast.success('New file created');
        break;
      case 'save':
        saveActiveFile();
        addLogMessage('success', 'File saved');
        toast.success('File saved');
        break;
      case 'delete':
        if (activeTabId) {
          deleteFile(activeTabId);
          addLogMessage('success', 'File deleted');
          toast.success('File deleted');
        } else {
          addLogMessage('error', 'No file selected');
          toast.error('No file selected');
        }
        break;
      case 'copy':
        if (monacoInstance) {
          const selection = monacoInstance.getSelection();
          if (selection && !selection.isEmpty()) {
            const text = monacoInstance.getModel()?.getValueInRange(selection);
            if (text) {
              navigator.clipboard.writeText(text);
              addLogMessage('success', 'Content copied to clipboard');
              toast.success('Content copied to clipboard');
            }
          }
        }
        break;
      case 'cut':
        if (monacoInstance) {
          const selection = monacoInstance.getSelection();
          if (selection && !selection.isEmpty()) {
            const text = monacoInstance.getModel()?.getValueInRange(selection);
            if (text) {
              navigator.clipboard.writeText(text);
              const range = positionToRange(selection);
              monacoInstance.executeEdits('', [{ range, text: '' }]);
              addLogMessage('success', 'Content cut to clipboard');
              toast.success('Content cut to clipboard');
            }
          }
        }
        break;
      case 'paste':
        if (monacoInstance) {
          navigator.clipboard.readText().then(text => {
            const selection = monacoInstance.getSelection();
            const position = selection || monacoInstance.getPosition();
            if (position) {
              const range = positionToRange(position);
              monacoInstance.executeEdits('', [{ range, text }]);
              addLogMessage('success', 'Content pasted from clipboard');
              toast.success('Content pasted from clipboard');
            }
          });
        }
        break;
      case 'undo':
        if (monacoInstance) {
          monacoInstance.trigger('', 'undo', null);
          addLogMessage('success', 'Undo operation');
          toast.success('Undo operation');
        } else {
          undoTabClose();
          toast.success('Reopened closed tab');
        }
        break;
      case 'redo':
        if (monacoInstance) {
          monacoInstance.trigger('', 'redo', null);
          addLogMessage('success', 'Redo operation');
          toast.success('Redo operation');
        }
        break;
      case 'toggle-minimap':
        addLogMessage('success', 'Minimap toggled');
        toast.success('Minimap toggled');
        break;
      case 'toggle-wrap':
        addLogMessage('success', 'Word wrap toggled');
        toast.success('Word wrap toggled');
        break;
      case 'keyboard-shortcuts':
        addLogMessage('info', 'Keyboard shortcuts coming soon');
        toast.info('Keyboard shortcuts coming soon');
        break;
      case 'about':
        addLogMessage('info', 'Code Editor IDE - Version 1.0.0');
        toast.info('Code Editor IDE - Version 1.0.0');
        break;
      default:
        break;
    }
    
    setActiveMenu(null);
  };
  
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-status-bar text-slate-400 text-sm border-b border-border">
      <div className="flex items-center space-x-1">
        <h1 className="font-medium mr-4">Code Editor IDE</h1>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'file' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('file')}
          >
            File
          </button>
          {activeMenu === 'file' && (
            <div className="menu-dropdown mt-1 left-0">
              <div className="menu-item" onClick={() => handleAction('new-file')}>
                <FileIcon size={14} className="mr-2" />
                New File
              </div>
              <div className="menu-item" onClick={() => handleAction('save')}>
                <Save size={14} className="mr-2" />
                Save
                <span className="ml-auto text-xs opacity-70">Ctrl+S</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-item" onClick={() => handleAction('delete')}>
                <Trash2 size={14} className="mr-2" />
                Delete
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'edit' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('edit')}
          >
            Edit
          </button>
          {activeMenu === 'edit' && (
            <div className="menu-dropdown mt-1 left-0">
              <div className="menu-item" onClick={() => handleAction('undo')}>
                <Undo size={14} className="mr-2" />
                Undo
                <span className="ml-auto text-xs opacity-70">Ctrl+Z</span>
              </div>
              <div className="menu-item" onClick={() => handleAction('redo')}>
                <Redo size={14} className="mr-2" />
                Redo
                <span className="ml-auto text-xs opacity-70">Ctrl+Y</span>
              </div>
              <div className="menu-separator"></div>
              <div className="menu-item" onClick={() => handleAction('copy')}>
                <Copy size={14} className="mr-2" />
                Copy
                <span className="ml-auto text-xs opacity-70">Ctrl+C</span>
              </div>
              <div className="menu-item" onClick={() => handleAction('cut')}>
                <Clipboard size={14} className="mr-2" />
                Cut
                <span className="ml-auto text-xs opacity-70">Ctrl+X</span>
              </div>
              <div className="menu-item" onClick={() => handleAction('paste')}>
                <Clipboard size={14} className="mr-2" />
                Paste
                <span className="ml-auto text-xs opacity-70">Ctrl+V</span>
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'view' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('view')}
          >
            View
          </button>
          {activeMenu === 'view' && (
            <div className="menu-dropdown mt-1 left-0">
              <div className="menu-item" onClick={() => handleAction('toggle-minimap')}>
                <LayoutGrid size={14} className="mr-2" />
                Toggle Minimap
              </div>
              <div className="menu-item" onClick={() => handleAction('toggle-wrap')}>
                <RotateCcw size={14} className="mr-2" />
                Toggle Word Wrap
              </div>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button 
            className={`px-2 py-0.5 hover:text-white transition-colors ${activeMenu === 'help' ? 'text-white' : ''}`}
            onClick={() => toggleMenu('help')}
          >
            Help
          </button>
          {activeMenu === 'help' && (
            <div className="menu-dropdown mt-1 left-0">
              <div className="menu-item" onClick={() => handleAction('keyboard-shortcuts')}>
                <Command size={14} className="mr-2" />
                Keyboard Shortcuts
              </div>
              <div className="menu-item" onClick={() => handleAction('about')}>
                <HelpCircle size={14} className="mr-2" />
                About
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <FontSelector />
        
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={() => handleAction('save')}
          title="Save (Ctrl+S)"
        >
          <Save size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          title="Command Palette (Ctrl+P)"
        >
          <Command size={16} />
        </button>
        
        <button 
          className="p-1 hover:text-white transition-colors"
          title="Settings"
        >
          <Settings size={16} />
        </button>
      </div>
    </div>
  );
};

export default TopBar;
