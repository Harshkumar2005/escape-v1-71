
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import FileExplorer from './FileExplorer';
import EditorArea from './EditorArea';
import AITerminalContainer from './AITerminalContainer';
import StatusBar from './StatusBar';
import CommandPalette from './CommandPalette';
import { FileSystemProvider } from '@/contexts/FileSystemContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontProvider } from '@/contexts/FontContext';
import TopBar from './TopBar';
import { Toaster } from 'sonner';

const CodeEditorIDE: React.FC = () => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [terminalSize, setTerminalSize] = useState(30);
  const [prevTerminalSize, setPrevTerminalSize] = useState(30);
  
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
      
      // Toggle terminal: Ctrl/Cmd + `
      if ((e.ctrlKey || e.metaKey) && e.key === '`') {
        e.preventDefault();
        setShowTerminal(prev => !prev);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Handle terminal maximize/minimize
  const maximizeTerminal = () => {
    setPrevTerminalSize(terminalSize);
    setTerminalSize(70);
  };
  
  const minimizeTerminal = () => {
    setTerminalSize(prevTerminalSize);
  };
  
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
                  {/* Left Sidebar */}
                  {showLeftSidebar && (
                    <>
                      <ResizablePanel defaultSize={20} minSize={15} maxSize={30}>
                        <FileExplorer />
                      </ResizablePanel>
                      <ResizableHandle withHandle />
                    </>
                  )}
                  
                  {/* Main Content Area */}
                  <ResizablePanel defaultSize={showLeftSidebar ? 80 : 100}>
                    <ResizablePanelGroup direction="vertical">
                      {/* Editor Area */}
                      <ResizablePanel defaultSize={showTerminal ? 70 : 100}>
                        <EditorArea />
                      </ResizablePanel>
                      
                      {/* AI Terminal and Logs Container */}
                      {showTerminal && (
                        <>
                          <ResizableHandle withHandle />
                          <ResizablePanel 
                            defaultSize={30} 
                            minSize={10} 
                            maxSize={90}
                            onResize={size => setTerminalSize(size)}
                          >
                            <AITerminalContainer 
                              maximizeTerminal={maximizeTerminal}
                              minimizeTerminal={minimizeTerminal}
                            />
                          </ResizablePanel>
                        </>
                      )}
                    </ResizablePanelGroup>
                  </ResizablePanel>
                  
                  {/* Right Sidebar (Optional) */}
                  {showRightSidebar && (
                    <>
                      <ResizableHandle withHandle />
                      <ResizablePanel defaultSize={20}>
                        <div className="h-full bg-sidebar p-2">
                          {/* Right sidebar content - could be extensions, outline, etc. */}
                          <h3 className="text-sm font-medium mb-2">Outline</h3>
                          {/* Outline content would go here */}
                        </div>
                      </ResizablePanel>
                    </>
                  )}
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
            </div>
          </EditorProvider>
        </FileSystemProvider>
      </FontProvider>
    </ThemeProvider>
  );
};

export default CodeEditorIDE;
