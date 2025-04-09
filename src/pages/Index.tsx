
import React from 'react';
import CodeEditorIDE from '@/components/ide/CodeEditorIDE';
import { CodeBuddyChat } from '@/components/CodeBuddyChat';

const Index = () => {
  return (
    <div className="h-screen w-screen overflow-hidden flex">
      <div className="flex-1 h-full">
        <CodeEditorIDE />
      </div>
      <div className="w-96 h-full border-l border-gray-800">
        <CodeBuddyChat />
      </div>
    </div>
  );
};

export default Index;
