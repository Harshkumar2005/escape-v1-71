
import React from 'react';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import AICoworker from './AICoworker';
import LogsPanel from './LogsPanel';

interface AITerminalContainerProps {
  maximizeTerminal?: () => void;
  minimizeTerminal?: () => void;
}

const AITerminalContainer: React.FC<AITerminalContainerProps> = ({ 
  maximizeTerminal, 
  minimizeTerminal 
}) => {
  return (
    <div className="h-full bg-terminal">
      <ResizablePanelGroup direction="horizontal">
        <ResizablePanel defaultSize={60} minSize={30}>
          <AICoworker 
            maximizePanel={maximizeTerminal}
            minimizePanel={minimizeTerminal}
          />
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={40} minSize={20}>
          <LogsPanel 
            maximizePanel={maximizeTerminal}
            minimizePanel={minimizeTerminal}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};

export default AITerminalContainer;
