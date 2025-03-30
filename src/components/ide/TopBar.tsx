
import React from 'react';
import { Command, Save, Settings } from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';

const TopBar: React.FC = () => {
  const { saveActiveFile } = useEditor();
  
  return (
    <div className="flex items-center justify-between px-2 py-1 bg-status-bar text-slate-400 text-sm border-b border-border">
      <div className="flex items-center space-x-4">
        <h1 className="font-medium">Code Editor IDE</h1>
        
        <div className="space-x-2">
          <button 
            className="px-2 py-0.5 hover:text-white transition-colors"
          >
            File
          </button>
          <button 
            className="px-2 py-0.5 hover:text-white transition-colors"
          >
            Edit
          </button>
          <button 
            className="px-2 py-0.5 hover:text-white transition-colors"
          >
            View
          </button>
          <button 
            className="px-2 py-0.5 hover:text-white transition-colors"
          >
            Help
          </button>
        </div>
      </div>
      
      <div className="flex items-center space-x-2">
        <button 
          className="p-1 hover:text-white transition-colors"
          onClick={saveActiveFile}
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
