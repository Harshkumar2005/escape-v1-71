
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Editor, OnMount, useMonaco } from '@monaco-editor/react';
import { X, Circle, CopyCheck, Save, ClipboardCopy, Undo, Redo, RotateCcw } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFont } from '@/contexts/FontContext';
import { toast } from 'sonner';

// Tab component for the editor
interface TabProps {
  id: string;
  name: string;
  isActive: boolean;
  isModified: boolean;
  onClick: () => void;
  onClose: (e: React.MouseEvent) => void;
}

const Tab: React.FC<TabProps> = ({ id, name, isActive, isModified, onClick, onClose }) => {
  return (
    <div 
      className={`flex items-center px-3 py-1 border-r border-border cursor-pointer ${
        isActive ? 'bg-tab-active text-white' : 'bg-tab-inactive text-slate-400 hover:text-white'
      }`}
      onClick={onClick}
    >
      <span className="text-sm truncate max-w-40">{name}</span>
      {isModified && <Circle size={8} className="ml-2 fill-current text-blue-500" />}
      <button 
        className="ml-2 p-0.5 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded-sm transition-colors"
        onClick={onClose}
      >
        <X size={14} />
      </button>
    </div>
  );
};

const EditorArea: React.FC = () => {
  const { 
    openedTabs, 
    activeTabId, 
    openTab, 
    closeTab, 
    setActiveTab, 
    updateMonacoInstance,
    saveActiveFile,
    updateTabContent,
    getTabContent,
    undoTabClose
  } = useEditor();
  
  const { getFileById } = useFileSystem();
  const { editorTheme } = useTheme();
  const { editorFont } = useFont();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  const [isCopying, setIsCopying] = useState(false);
  
  // Set up Monaco editor
  const handleEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    updateMonacoInstance(editor);
    
    // Set up editor options for better coding experience
    editor.updateOptions({
      fontSize: 14,
      fontFamily: editorFont + ", 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
      minimap: { enabled: true },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'all',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      linkedEditing: true,
      formatOnPaste: true,
      formatOnType: true,
      autoClosingBrackets: 'always',
      autoClosingQuotes: 'always',
      autoIndent: 'full',
      tabSize: 2,
      wordWrap: 'on',
    });
    
    // Set up keyboard shortcuts
    // Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      saveActiveFile();
      toast.success('File saved');
    });
    
    // Ctrl+Z and Ctrl+Y already work for undo/redo
    
    // Ctrl+C to copy
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyC, () => {
      const selection = editor.getSelection();
      if (selection && !selection.isEmpty()) {
        const text = editor.getModel()?.getValueInRange(selection);
        if (text) {
          navigator.clipboard.writeText(text).then(() => {
            setIsCopying(true);
            setTimeout(() => setIsCopying(false), 1000);
          });
        }
      }
    });

    // Ctrl+V to paste - Monaco handles this natively
  };
  
  // Get active file language
  const getFileLanguage = () => {
    if (!activeTabId) return 'plaintext';
    const file = getFileById(activeTabId);
    return file?.language || 'plaintext';
  };
  
  // Handle editor value changes
  const handleEditorChange = (value: string | undefined) => {
    if (activeTabId && value !== undefined) {
      updateTabContent(activeTabId, value);
    }
  };
  
  // Handle tab close
  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
  };

  // Handle undo tab close
  const handleUndoTabClose = () => {
    undoTabClose();
    toast.success('Reopened closed tab');
  };
  
  // Set up Monaco editor themes
  useEffect(() => {
    if (monaco) {
      // Define custom dark theme for the editor
      monaco.editor.defineTheme('custom-dark', {
        base: 'vs-dark',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A737D' },
          { token: 'keyword', foreground: 'C678DD' },
          { token: 'string', foreground: '98C379' },
          { token: 'number', foreground: 'D19A66' },
          { token: 'operator', foreground: '56B6C2' },
          { token: 'function', foreground: '61AFEF' },
          { token: 'variable', foreground: 'E06C75' },
          { token: 'type', foreground: 'E5C07B' },
        ],
        colors: {
          'editor.background': '#1A1E2B',
          'editor.foreground': '#D4D4D4',
          'editorCursor.foreground': '#AEAFAD',
          'editor.lineHighlightBackground': '#2C313C',
          'editorLineNumber.foreground': '#858585',
          'editor.selectionBackground': '#264F78',
          'editor.inactiveSelectionBackground': '#3A3D41',
          'editorSuggestWidget.background': '#1A1E2B',
          'editorSuggestWidget.border': '#383E4C',
          'editorSuggestWidget.selectedBackground': '#2C313C',
          'editorHoverWidget.background': '#1A1E2B',
          'editorHoverWidget.border': '#383E4C',
        }
      });
      
      // Define custom light theme for the editor
      monaco.editor.defineTheme('custom-light', {
        base: 'vs',
        inherit: true,
        rules: [
          { token: 'comment', foreground: '6A737D' },
          { token: 'keyword', foreground: 'D73A49' },
          { token: 'string', foreground: '032F62' },
          { token: 'number', foreground: '005CC5' },
          { token: 'operator', foreground: 'D73A49' },
          { token: 'function', foreground: '6F42C1' },
          { token: 'variable', foreground: 'E36209' },
          { token: 'type', foreground: '6F42C1' },
        ],
        colors: {
          'editor.background': '#F8F8F8',
          'editor.foreground': '#24292E',
          'editorCursor.foreground': '#24292E',
          'editor.lineHighlightBackground': '#F0F0F0',
          'editorLineNumber.foreground': '#6E7781',
          'editor.selectionBackground': '#B4D8FE',
          'editor.inactiveSelectionBackground': '#E5EBF1',
          'editorSuggestWidget.background': '#FFFFFF',
          'editorSuggestWidget.border': '#E1E4E8',
          'editorSuggestWidget.selectedBackground': '#F1F2F3',
          'editorHoverWidget.background': '#FFFFFF',
          'editorHoverWidget.border': '#E1E4E8',
        }
      });
    }
  }, [monaco]);

  // Add context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (!editorRef.current) return;
    
    const editor = editorRef.current;
    const selection = editor.getSelection();
    const hasSelection = selection && !selection.isEmpty();
    
    // Create custom minimalist context menu
    const contextMenu = document.createElement('div');
    contextMenu.className = 'absolute z-50 bg-sidebar border border-border rounded shadow-md py-1 min-w-32';
    contextMenu.style.left = `${e.clientX}px`;
    contextMenu.style.top = `${e.clientY}px`;
    
    // Add menu items
    const createMenuItem = (icon: JSX.Element, text: string, onClick: () => void, disabled: boolean = false) => {
      const item = document.createElement('div');
      item.className = `px-2 py-1 text-sm flex items-center ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-sidebar-foreground hover:bg-opacity-10 cursor-pointer'} text-sidebar-foreground opacity-90`;
      
      if (!disabled) {
        item.onclick = () => {
          onClick();
          document.body.removeChild(contextMenu);
        };
      }
      
      // Render icon
      const iconContainer = document.createElement('span');
      iconContainer.className = 'mr-2 text-slate-400';
      const iconSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      iconSvg.setAttribute('width', '14');
      iconSvg.setAttribute('height', '14');
      iconSvg.setAttribute('viewBox', '0 0 24 24');
      iconSvg.setAttribute('fill', 'none');
      iconSvg.setAttribute('stroke', 'currentColor');
      iconSvg.setAttribute('stroke-width', '2');
      iconSvg.setAttribute('stroke-linecap', 'round');
      iconSvg.setAttribute('stroke-linejoin', 'round');
      
      // This is a simplified approach - in reality you'd need to recreate the icon's paths
      // For demo purposes, we'll just use a placeholder
      iconSvg.innerHTML = '<circle cx="12" cy="12" r="10" />';
      
      iconContainer.appendChild(iconSvg);
      item.appendChild(iconContainer);
      
      const textSpan = document.createElement('span');
      textSpan.textContent = text;
      item.appendChild(textSpan);
      
      return item;
    };
    
    // Copy
    contextMenu.appendChild(createMenuItem(
      <ClipboardCopy size={14} />, 
      'Copy',
      () => {
        const text = editor.getModel()?.getValueInRange(selection);
        if (text) {
          navigator.clipboard.writeText(text);
          toast.success('Copied to clipboard');
        }
      },
      !hasSelection
    ));
    
    // Cut
    contextMenu.appendChild(createMenuItem(
      <ClipboardCopy size={14} />, 
      'Cut',
      () => {
        const text = editor.getModel()?.getValueInRange(selection);
        if (text) {
          navigator.clipboard.writeText(text);
          editor.executeEdits('', [{ range: selection, text: '' }]);
          toast.success('Cut to clipboard');
        }
      },
      !hasSelection
    ));
    
    // Paste
    contextMenu.appendChild(createMenuItem(
      <ClipboardCopy size={14} />, 
      'Paste',
      async () => {
        try {
          const text = await navigator.clipboard.readText();
          editor.executeEdits('', [{ range: selection || editor.getPosition(), text }]);
          toast.success('Pasted from clipboard');
        } catch (err) {
          toast.error('Failed to paste: ' + (err instanceof Error ? err.message : String(err)));
        }
      }
    ));
    
    // Add separator
    const separator = document.createElement('div');
    separator.className = 'my-1 border-t border-border';
    contextMenu.appendChild(separator);
    
    // Undo
    contextMenu.appendChild(createMenuItem(
      <Undo size={14} />, 
      'Undo',
      () => {
        editor.trigger('contextmenu', 'undo', null);
      }
    ));
    
    // Redo
    contextMenu.appendChild(createMenuItem(
      <Redo size={14} />, 
      'Redo',
      () => {
        editor.trigger('contextmenu', 'redo', null);
      }
    ));
    
    // Save
    contextMenu.appendChild(createMenuItem(
      <Save size={14} />, 
      'Save',
      () => {
        saveActiveFile();
        toast.success('File saved');
      }
    ));
    
    // Add the context menu to the document
    document.body.appendChild(contextMenu);
    
    // Remove when clicking outside
    const handleOutsideClick = () => {
      if (document.body.contains(contextMenu)) {
        document.body.removeChild(contextMenu);
      }
      document.removeEventListener('click', handleOutsideClick);
    };
    
    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  }, [saveActiveFile]);
  
  return (
    <div className="h-full flex flex-col">
      {/* Editor toolbar with actions */}
      <div className="flex items-center justify-between bg-sidebar border-b border-border px-2 py-1">
        {/* Tabs bar */}
        <div className="flex items-center overflow-x-auto flex-1">
          {openedTabs.map(tab => (
            <Tab
              key={tab.id}
              id={tab.id}
              name={tab.name}
              isActive={tab.id === activeTabId}
              isModified={tab.isModified}
              onClick={() => setActiveTab(tab.id)}
              onClose={(e) => handleCloseTab(e, tab.id)}
            />
          ))}
        </div>
        
        {/* Editor actions */}
        <div className="flex items-center space-x-1">
          <button
            className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={handleUndoTabClose}
            title="Undo Close Tab (Reopen)"
          >
            <RotateCcw size={14} />
          </button>
          
          <button
            className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={() => {
              saveActiveFile();
              toast.success('File saved');
            }}
            title="Save File (Ctrl+S)"
          >
            <Save size={14} />
          </button>
          
          <button
            className="p-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={() => {
              if (editorRef.current) {
                const selection = editorRef.current.getSelection();
                if (selection && !selection.isEmpty()) {
                  const text = editorRef.current.getModel()?.getValueInRange(selection);
                  if (text) {
                    navigator.clipboard.writeText(text).then(() => {
                      setIsCopying(true);
                      toast.success('Copied to clipboard');
                      setTimeout(() => setIsCopying(false), 1000);
                    });
                  }
                }
              }
            }}
            title="Copy Selection (Ctrl+C)"
          >
            {isCopying ? <CopyCheck size={14} /> : <ClipboardCopy size={14} />}
          </button>
        </div>
      </div>
      
      {/* Editor */}
      <div className="flex-1" onContextMenu={handleContextMenu}>
        {activeTabId ? (
          <Editor
            height="100%"
            defaultLanguage={getFileLanguage()}
            language={getFileLanguage()}
            value={getTabContent(activeTabId)}
            theme={editorTheme}
            onChange={handleEditorChange}
            onMount={handleEditorMount}
            options={{
              readOnly: false,
              automaticLayout: true,
              autoIndent: 'full',
              formatOnPaste: true,
              formatOnType: true,
              autoClosingBrackets: 'always',
              autoClosingQuotes: 'always',
              wordWrap: 'on',
              quickSuggestions: {
                other: true,
                comments: true,
                strings: true
              },
              suggestOnTriggerCharacters: true,
              acceptSuggestionOnCommitCharacter: true,
              tabCompletion: 'on',
              parameterHints: {
                enabled: true,
                cycle: true
              },
              fontFamily: editorFont + ", 'JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', monospace",
            }}
          />
        ) : (
          <div className="h-full flex items-center justify-center bg-editor text-slate-400">
            <div className="text-center">
              <p>No file is open</p>
              <p className="text-sm mt-1">Open a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EditorArea;
