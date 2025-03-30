
import React, { useRef, useEffect } from 'react';
import { Editor, OnMount, useMonaco } from '@monaco-editor/react';
import { X, Circle } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFont } from '@/contexts/FontContext';

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
  const { openedTabs, activeTabId, openTab, closeTab, setActiveTab, updateMonacoInstance } = useEditor();
  const { getFileById, updateFileContent } = useFileSystem();
  const { editorTheme } = useTheme();
  const { editorFont } = useFont();
  const monaco = useMonaco();
  const editorRef = useRef<any>(null);
  
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
    
    // Set up Ctrl+S to save
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
      if (activeTabId) {
        const content = editor.getValue();
        updateFileContent(activeTabId, content);
      }
    });
  };
  
  // Get active file content
  const getFileContent = () => {
    if (!activeTabId) return '';
    const file = getFileById(activeTabId);
    return file?.content || '';
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
      // Only update if content has changed to avoid infinite loops
      const file = getFileById(activeTabId);
      if (file && file.content !== value) {
        updateFileContent(activeTabId, value);
      }
    }
  };
  
  // Handle tab close
  const handleCloseTab = (e: React.MouseEvent, tabId: string) => {
    e.stopPropagation();
    closeTab(tabId);
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
  
  return (
    <div className="h-full flex flex-col">
      {/* Tabs bar */}
      <div className="flex items-center bg-sidebar border-b border-border overflow-x-auto">
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
      
      {/* Editor */}
      <div className="flex-1">
        {activeTabId ? (
          <Editor
            height="100%"
            defaultLanguage={getFileLanguage()}
            language={getFileLanguage()}
            value={getFileContent()}
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
