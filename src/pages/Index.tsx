
import React from 'react';
import CodeEditorIDE from '@/components/ide/CodeEditorIDE';
import { CodeBuddyChat } from '@/components/CodeBuddyChat';

const Index = () => {
  return (
    <div className= "h-screen w-screen overflow-hidden" style = {{ filter: 'brightness(1.1) contrast(1.1)' }}>
      <CodeEditorIDE />
    </div>
  );
};

export default Index;
