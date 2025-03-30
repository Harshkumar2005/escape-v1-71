
import React, { createContext, useContext, useState } from 'react';
import { editor } from 'monaco-editor';
import { useFileSystem } from './FileSystemContext';

interface TabInfo {
  id: string;
  name: string;
  language: string;
  path: string;
  isModified: boolean;
}

interface EditorContextType {
  openedTabs: TabInfo[];
  activeTabId: string | null;
  monacoInstance: editor.IStandaloneCodeEditor | null;
  openTab: (fileId: string) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateMonacoInstance: (instance: editor.IStandaloneCodeEditor | null) => void;
  saveActiveFile: () => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getFileById, updateFileContent, selectFile } = useFileSystem();
  const [openedTabs, setOpenedTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<editor.IStandaloneCodeEditor | null>(null);

  // Open a tab for a file
  const openTab = (fileId: string) => {
    const file = getFileById(fileId);
    
    if (!file || file.type !== 'file') return;
    
    // Check if tab is already open
    const existingTab = openedTabs.find(tab => tab.id === fileId);
    
    if (!existingTab) {
      // Add new tab
      const newTab: TabInfo = {
        id: fileId,
        name: file.name,
        language: file.language || 'plaintext',
        path: file.path,
        isModified: file.isModified || false
      };
      
      setOpenedTabs(prevTabs => [...prevTabs, newTab]);
    }
    
    // Set as active tab
    setActiveTabId(fileId);
    selectFile(fileId);
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    // If closing the active tab, select another one
    if (activeTabId === tabId) {
      setActiveTabId(openedTabs.length > 1 ? 
        openedTabs.find(tab => tab.id !== tabId)?.id || null : 
        null);
    }
  };

  // Set active tab
  const setActiveTab = (tabId: string) => {
    setActiveTabId(tabId);
    selectFile(tabId);
  };

  // Update Monaco editor instance
  const updateMonacoInstance = (instance: editor.IStandaloneCodeEditor | null) => {
    setMonacoInstance(instance);
  };

  // Save the active file
  const saveActiveFile = () => {
    if (!activeTabId || !monacoInstance) return;
    
    const content = monacoInstance.getValue();
    updateFileContent(activeTabId, content);
    
    // Update tab state to remove modified indicator
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { ...tab, isModified: false } : tab
      )
    );
  };

  // Move tab (for drag and drop reordering)
  const moveTab = (fromIndex: number, toIndex: number) => {
    setOpenedTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
  };

  return (
    <EditorContext.Provider value={{
      openedTabs,
      activeTabId,
      monacoInstance,
      openTab,
      closeTab,
      setActiveTab,
      updateMonacoInstance,
      saveActiveFile,
      moveTab
    }}>
      {children}
    </EditorContext.Provider>
  );
};

export const useEditor = () => {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
};
