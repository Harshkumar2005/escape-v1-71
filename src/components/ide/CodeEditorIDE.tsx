
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import FileExplorer from './FileExplorer';
import EditorArea from './EditorArea';
import AICoworker from './AICoworker';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import { FileSystemProvider } from '@/contexts/FileSystemContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontProvider } from '@/contexts/FontContext';
import TopBar from './TopBar';
import { Toaster } from 'sonner';
import { ProjectStartup } from './ProjectStartup';

const CodeEditorIDE: React.FC = () => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showTerminal, setShowTerminal] = useState(true);
  
  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command palette: Ctrl/Cmd + P
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        setShowCommandPalette(prev => !prev);
      }
      
      // Toggle left sidebar: Ctrl/Cmd + B
      if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
        e.preventDefault();
        setShowLeftSidebar(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  return (
    <ThemeProvider>
      <FontProvider>
        <FileSystemProvider>
          <EditorProvider>
            <div className="flex flex-col h-full w-full bg-editor text-foreground">
              <Toaster position="bottom-right" />
              <TopBar />
              
              <div className="flex-1 flex overflow-hidden">
                <ResizablePanelGroup direction="horizontal">
                  {/* Left Sidebar - File Explorer (fixed on the left) */}
                  <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    <FileExplorer />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  {/* Main Editor Area (center) */}
                  <ResizablePanel defaultSize={60}>
                    <EditorArea />
                  </ResizablePanel>
                  
                  <ResizableHandle withHandle />
                  
                  {/* AI Coworker (fixed on the right) */}
                 {/* <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                    {/* <AICoworker />
                  </ResizablePanel>*/}
                </ResizablePanelGroup>
              </div>
              
              {/* Status Bar */}
              <StatusBar 
                toggleTerminal={() => setShowTerminal(prev => !prev)}
                toggleLeftSidebar={() => setShowLeftSidebar(prev => !prev)}
                toggleRightSidebar={() => setShowRightSidebar(prev => !prev)}
              />
              
              {/* Command Palette */}
              {showCommandPalette && (
                <CommandPalette 
                  onClose={() => setShowCommandPalette(false)}
                />
              )}

              {/* Project Startup Dialog */}
              <ProjectStartup />
            </div>
          </EditorProvider>
        </FileSystemProvider>
      </FontProvider>
    </ThemeProvider>
  );
};

export default CodeEditorIDE;
