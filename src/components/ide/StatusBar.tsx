
import React, { useState, useEffect } from 'react';
import { GitBranch, Terminal, Columns, Sun, Moon, Save } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useEditor } from '@/contexts/EditorContext';
import { useFileSystem } from '@/contexts/FileSystemContext';

interface StatusBarProps {
  toggleTerminal: () => void;
  toggleLeftSidebar: () => void;
  toggleRightSidebar: () => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ 
  toggleTerminal, 
  toggleLeftSidebar, 
  toggleRightSidebar 
}) => {
  const { theme, toggleTheme } = useTheme();
  const { activeTabId, saveActiveFile } = useEditor();
  const { getFileById, addLogMessage } = useFileSystem();
  const [time, setTime] = useState<string>('');
  const [activeFileInfo, setActiveFileInfo] = useState({ 
    language: 'Text', 
    path: '' 
  });
  
  // Update time every minute
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      }));
    };
    
    updateTime();
    const intervalId = setInterval(updateTime, 60000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Update file info when active tab changes
  useEffect(() => {
    if (activeTabId) {
      const file = getFileById(activeTabId);
      if (file) {
        setActiveFileInfo({
          language: file.language ? file.language.charAt(0).toUpperCase() + file.language.slice(1) : 'Text',
          path: file.path
        });
      }
    } else {
      setActiveFileInfo({ language: 'Text', path: '' });
    }
  }, [activeTabId, getFileById]);
  
  return (
    <div className="flex items-center justify-between px-3 py-1.5 bg-status-bar text-slate-400 border-t border-border">
      <div className="flex items-center space-x-4">
        <div className="flex items-center text-[14px]">
          <GitBranch size={14} className="mr-1.5" />
          <span>main</span>
        </div>
        
        <button 
          className="flex items-center hover:text-white transition-colors text-[14px]"
          onClick={() => {
            toggleLeftSidebar();
            addLogMessage('info', 'Toggled explorer sidebar');
          }}
        >
          <Columns size={14} className="mr-1.5" />
          <span>Explorer</span>
        </button>
        
        <button 
          className="flex items-center hover:text-white transition-colors text-[14px]"
          onClick={saveActiveFile}
          title="Save (Ctrl+S)"
        >
          <Save size={14} className="mr-1.5" />
          <span>Save</span>
        </button>
      </div>
      
      <div className="flex items-center space-x-4">
        {activeFileInfo.path && (
          <span className="text-slate-500 max-w-xs truncate text-[14px]" title={activeFileInfo.path}>
            {activeFileInfo.path}
          </span>
        )}
        
        <span className="text-[14px]">{activeFileInfo.language}</span>
        
        <span className="text-[14px]">{time}</span>
        
        <button
          className="flex items-center hover:text-white transition-colors"
          onClick={() => {
            toggleTheme();
            addLogMessage('info', `Switched to ${theme === 'dark' ? 'light' : 'dark'} theme`);
          }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
        </button>
      </div>
    </div>
  );
};

export default StatusBar;
