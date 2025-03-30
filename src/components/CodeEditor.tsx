
import React, { useState } from 'react';
import FileTree from './FileTree';
import Editor from './Editor';
import Terminal from './Terminal';
import Tabs from './Tabs';
import StatusBar from './StatusBar';
import { File, Folder } from 'lucide-react';

const fileTreeData = [
  {
    name: 'zed-test',
    type: 'folder' as const,
    children: [
      { name: 'node_modules', type: 'folder' as const, children: [] },
      { name: '.gitignore', type: 'file' as const },
      { name: 'bun.lockb', type: 'file' as const },
      { name: 'index.ts', type: 'file' as const },
      { name: 'package.json', type: 'file' as const },
      { name: 'README.md', type: 'file' as const },
      { name: 'tsconfig.json', type: 'file' as const },
    ],
  },
];

const fileContents: Record<string, { content: string; language: string }> = {
  'index.ts': {
    content: 'console.log("Hello Zed!");\n',
    language: 'typescript',
  },
};

const terminalOutput = [
  'package name (zed-test):',
  'entry point (index.ts):',
  '',
  'Done! A package.json file was saved in the current directory.',
  '+ index.ts',
  '+ .gitignore',
  '+ tsconfig.json (for editor auto-complete)',
  '+ README.md',
  '',
  'To get started, run:',
  '    bun run index.ts',
  'yahia@Yahias-MacBook-Pro zed-test %',
];

const CodeEditor: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState('index.ts');
  const [activeTab, setActiveTab] = useState('index.ts');

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    setActiveTab(fileName);
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Main content area */}
      <div className="flex flex-1 overflow-hidden">
        {/* File tree sidebar */}
        <div className="w-60 bg-sidebar border-r border-border">
          <div className="p-2 text-sm text-sidebar-foreground border-b border-border">
            zed-test
          </div>
          <FileTree 
            items={fileTreeData}
            selectedFile={selectedFile}
            onSelectFile={handleFileSelect}
          />
        </div>

        {/* Editor area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Tabs */}
          <Tabs 
            tabs={[activeTab]}
            activeTab={activeTab}
            onSelectTab={setActiveTab}
          />

          {/* Code editor */}
          <div className="flex-1 overflow-hidden">
            <Editor 
              content={fileContents[selectedFile]?.content || ''}
              language={fileContents[selectedFile]?.language || 'plaintext'}
            />
          </div>

          {/* Terminal */}
          <div className="h-64 border-t border-border">
            <Terminal output={terminalOutput} />
          </div>
        </div>
      </div>

      {/* Status bar */}
      <StatusBar 
        projectName="zed-test"
        terminal="zsh"
        time="1:24"
        language="TypeScript"
      />
    </div>
  );
};

export default CodeEditor;
