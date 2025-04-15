
import React, { useState, useEffect } from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import FileExplorer from './FileExplorer';
import EditorArea from './EditorArea';
import { CodeBuddyChat } from '../CodeBuddyChat';
import StatusBar from './StatusBar';
import MusicPlayerPanel from './MusicPlayerPanel';
import CommandPalette from './CommandPalette';
import { FileSystemProvider } from '@/contexts/FileSystemContext';
import { EditorProvider } from '@/contexts/EditorContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FontProvider } from '@/contexts/FontContext';
import { MusicProvider } from '@/contexts/MusicContext';
import TopBar from './TopBar';
import { Toaster } from 'sonner';
import { ProjectStartup } from './ProjectStartup';

const CodeEditorIDE: React.FC = () => {
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [showMusicPanel, setShowMusicPanel] = useState(true);
  
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
            <MusicProvider>
              <div className="flex flex-col h-full w-full bg-editor text-foreground">
                <Toaster position="bottom-right" />
                <TopBar />
                
                <div className="flex-1 flex overflow-hidden">
                  <ResizablePanelGroup direction="horizontal">
                    {/* Left Sidebar - File Explorer */}
                    <ResizablePanel defaultSize={19} minSize={15} maxSize={25}>
                      <FileExplorer />
                    </ResizablePanel>
                    
                    <ResizableHandle withHandle />
                    
                    {/* Main Content Area */}
                    <ResizablePanel defaultSize={61}>
                      <ResizablePanelGroup direction="vertical">
                        {/* Editor Area */}
                        <ResizablePanel defaultSize={75}>
                          <EditorArea />
                        </ResizablePanel>
                        
                        {/* Music Player */}
                        {showMusicPanel && (
                          <>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={25} maxSize={35} minSize={20}>
                              <MusicPlayerPanel />
                            </ResizablePanel>
                          </>
                        )}
                      </ResizablePanelGroup>
                    </ResizablePanel>

                    {/* AI Coworker (Right Sidebar) */}
                    {showRightSidebar && (
                      <>
                        <ResizableHandle withHandle />
                        <ResizablePanel defaultSize={29} minSize={23} maxSize={30}>
                          <CodeBuddyChat />
                        </ResizablePanel>
                      </>
                    )}
                  </ResizablePanelGroup>
                </div>

                {/* Status Bar */}
                <StatusBar 
                  toggleTerminal={() => setShowMusicPanel(prev => !prev)}
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
            </MusicProvider>
          </EditorProvider>
        </FileSystemProvider>
      </FontProvider>
    </ThemeProvider>
  );
};

export default CodeEditorIDE;
