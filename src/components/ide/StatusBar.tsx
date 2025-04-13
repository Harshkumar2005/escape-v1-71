
import React from 'react';
import { Terminal, SplitSquareHorizontal, Sidebar, PanelRightOpen, GitCompare } from 'lucide-react';
import ZipDownloader from './ZipDownloader';

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
  return (
    <div className="flex items-center justify-between px-3 py-1 bg-status-bar text-slate-400 text-xs">
      <div className="flex items-center space-x-3">
        <button 
          className="hover:text-white flex items-center gap-1 transition-colors"
          onClick={toggleLeftSidebar}
        >
          <Sidebar size={14} />
          <span>Explorer</span>
        </button>
        
        <button 
          className="hover:text-white flex items-center gap-1 transition-colors"
          onClick={toggleTerminal}
        >
          <Terminal size={14} />
          <span>Terminal</span>
        </button>
        
        <button 
          className="hover:text-white flex items-center gap-1 transition-colors"
          onClick={toggleRightSidebar}
        >
          <PanelRightOpen size={14} />
          <span>AI Assistant</span>
        </button>
        
        <ZipDownloader />
      </div>
      
      <div className="flex items-center space-x-3">
        <div className="flex items-center">
          <GitCompare size={14} className="mr-1" />
          <span>main</span>
        </div>
        
        <span>TypeScript</span>
        <span>Spaces: 2</span>
        <span>UTF-8</span>
      </div>
    </div>
  );
};

export default StatusBar;
