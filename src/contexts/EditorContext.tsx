
import React, { createContext, useContext, useState, useEffect } from 'react';
import { editor } from 'monaco-editor';
import { useFileSystem } from './FileSystemContext';

interface TabInfo {
  id: string;
  name: string;
  language: string;
  path: string;
  isModified: boolean;
  content?: string; // Store content per tab
  lastSavedContent?: string; // Track saved state separately
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
  updateTabContent: (tabId: string, content: string) => void;
  getTabContent: (tabId: string) => string;
  undoTabClose: () => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getFileById, updateFileContent, selectFile } = useFileSystem();
  const [openedTabs, setOpenedTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [closedTabs, setClosedTabs] = useState<TabInfo[]>([]); // For undo close
  
  // Load tabs from session storage on initial load
  useEffect(() => {
    try {
      const storedTabs = sessionStorage.getItem('editorTabs');
      const storedActiveTab = sessionStorage.getItem('activeTabId');
      
      if (storedTabs) {
        const parsedTabs = JSON.parse(storedTabs);
        setOpenedTabs(parsedTabs);
      }
      
      if (storedActiveTab) {
        setActiveTabId(storedActiveTab);
        selectFile(storedActiveTab);
      }
    } catch (error) {
      console.error('Error loading editor state from session storage:', error);
    }
  }, []);
  
  // Save tabs to session storage whenever they change
  useEffect(() => {
    try {
      sessionStorage.setItem('editorTabs', JSON.stringify(openedTabs));
      if (activeTabId) {
        sessionStorage.setItem('activeTabId', activeTabId);
      }
    } catch (error) {
      console.error('Error saving editor state to session storage:', error);
    }
  }, [openedTabs, activeTabId]);

  // Open a tab for a file
  const openTab = (fileId: string) => {
    const file = getFileById(fileId);
    
    if (!file || file.type !== 'file') return;
    
    // Check if tab is already open
    const existingTab = openedTabs.find(tab => tab.id === fileId);
    
    if (!existingTab) {
      // Add new tab with content
      const newTab: TabInfo = {
        id: fileId,
        name: file.name,
        language: file.language || 'plaintext',
        path: file.path,
        isModified: file.isModified || false,
        content: file.content || '',
        lastSavedContent: file.content || '',
      };
      
      setOpenedTabs(prevTabs => [...prevTabs, newTab]);
    }
    
    // Set as active tab
    setActiveTabId(fileId);
    selectFile(fileId);
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    // Store the closed tab for potential undo
    const tabToClose = openedTabs.find(tab => tab.id === tabId);
    if (tabToClose) {
      setClosedTabs(prev => [tabToClose, ...prev.slice(0, 9)]); // Keep last 10 closed tabs
    }
    
    setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    // If closing the active tab, select another one
    if (activeTabId === tabId) {
      setActiveTabId(openedTabs.length > 1 ? 
        openedTabs.find(tab => tab.id !== tabId)?.id || null : 
        null);
    }
  };

  // Undo tab close
  const undoTabClose = () => {
    if (closedTabs.length > 0) {
      const [tabToRestore, ...remainingClosedTabs] = closedTabs;
      
      setClosedTabs(remainingClosedTabs);
      setOpenedTabs(prev => [...prev, tabToRestore]);
      setActiveTabId(tabToRestore.id);
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

  // Update tab content
  const updateTabContent = (tabId: string, content: string) => {
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => {
        if (tab.id === tabId) {
          // Compare with last saved content to determine if modified
          const isModified = content !== tab.lastSavedContent;
          return { ...tab, content, isModified };
        }
        return tab;
      })
    );
  };

  // Get tab content
  const getTabContent = (tabId: string): string => {
    const tab = openedTabs.find(tab => tab.id === tabId);
    return tab?.content || '';
  };

  // Save the active file
  const saveActiveFile = () => {
    if (!activeTabId) return;
    
    const activeTab = openedTabs.find(tab => tab.id === activeTabId);
    if (!activeTab) return;
    
    // Update file content in the file system
    updateFileContent(activeTabId, activeTab.content || '');
    
    // Update tab state to remove modified indicator
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { 
          ...tab, 
          isModified: false,
          lastSavedContent: tab.content 
        } : tab
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
      moveTab,
      updateTabContent,
      getTabContent,
      undoTabClose
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
