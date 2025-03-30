
import React, { createContext, useContext, useState, useEffect } from 'react';
import { editor } from 'monaco-editor';
import { useFileSystem } from './FileSystemContext';

interface TabInfo {
  id: string;
  name: string;
  language: string;
  path: string;
  isModified: boolean;
  content?: string; // Add content to track each tab's content independently
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
  getTabContent: (tabId: string) => string;
  updateTabContent: (tabId: string, content: string) => void;
  undoFileChange: () => void;
  redoFileChange: () => void;
}

// Key prefix for session storage
const SESSION_STORAGE_KEY_PREFIX = 'editor_tab_';

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getFileById, updateFileContent, selectFile, addLogMessage } = useFileSystem();
  const [openedTabs, setOpenedTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  
  // Load opened tabs from session storage on initial render
  useEffect(() => {
    try {
      const savedTabs = sessionStorage.getItem('editor_opened_tabs');
      const savedActiveTabId = sessionStorage.getItem('editor_active_tab_id');
      
      if (savedTabs) {
        const parsedTabs = JSON.parse(savedTabs) as TabInfo[];
        setOpenedTabs(parsedTabs);
        
        // Load content for each tab from session storage
        parsedTabs.forEach(tab => {
          const savedContent = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${tab.id}`);
          if (savedContent) {
            tab.content = savedContent;
          }
        });
      }
      
      if (savedActiveTabId) {
        setActiveTabId(savedActiveTabId);
        selectFile(savedActiveTabId);
      }
    } catch (error) {
      console.error('Error loading editor state from session storage:', error);
    }
  }, []);
  
  // Save opened tabs to session storage whenever they change
  useEffect(() => {
    if (openedTabs.length > 0) {
      try {
        // Store tabs without content to avoid duplication (content is stored separately)
        const tabsForStorage = openedTabs.map(({ content, ...tab }) => tab);
        sessionStorage.setItem('editor_opened_tabs', JSON.stringify(tabsForStorage));
      } catch (error) {
        console.error('Error saving tabs to session storage:', error);
      }
    }
  }, [openedTabs]);
  
  // Save active tab ID to session storage whenever it changes
  useEffect(() => {
    if (activeTabId) {
      try {
        sessionStorage.setItem('editor_active_tab_id', activeTabId);
      } catch (error) {
        console.error('Error saving active tab ID to session storage:', error);
      }
    }
  }, [activeTabId]);
  
  // Get tab content either from memory or session storage
  const getTabContent = (tabId: string): string => {
    // First try to get from state
    const tab = openedTabs.find(tab => tab.id === tabId);
    if (tab?.content !== undefined) {
      return tab.content;
    }
    
    // Then try to get from session storage
    try {
      const storedContent = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${tabId}`);
      if (storedContent) {
        return storedContent;
      }
    } catch (error) {
      console.error('Error retrieving content from session storage:', error);
    }
    
    // Fall back to file system
    const file = getFileById(tabId);
    return file?.content || '';
  };
  
  // Update tab content in memory and session storage
  const updateTabContent = (tabId: string, content: string) => {
    // Update in memory
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, content, isModified: true } 
          : tab
      )
    );
    
    // Update in session storage
    try {
      sessionStorage.setItem(`${SESSION_STORAGE_KEY_PREFIX}${tabId}`, content);
    } catch (error) {
      console.error('Error saving content to session storage:', error);
    }
  };

  // Open a tab for a file
  const openTab = (fileId: string) => {
    const file = getFileById(fileId);
    
    if (!file || file.type !== 'file') return;
    
    // Check if tab is already open
    const existingTab = openedTabs.find(tab => tab.id === fileId);
    
    if (!existingTab) {
      // First try to get content from session storage
      let initialContent: string | undefined;
      try {
        initialContent = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${fileId}`) || undefined;
      } catch (error) {
        console.error('Error retrieving from session storage:', error);
      }
      
      // Add new tab
      const newTab: TabInfo = {
        id: fileId,
        name: file.name,
        language: file.language || 'plaintext',
        path: file.path,
        isModified: false,
        content: initialContent !== undefined ? initialContent : file.content
      };
      
      setOpenedTabs(prevTabs => [...prevTabs, newTab]);
      
      // Save to session storage
      try {
        if (newTab.content !== undefined) {
          sessionStorage.setItem(`${SESSION_STORAGE_KEY_PREFIX}${fileId}`, newTab.content);
        }
      } catch (error) {
        console.error('Error saving to session storage:', error);
      }
    }
    
    // Set as active tab
    setActiveTabId(fileId);
    selectFile(fileId);
  };

  // Close a tab
  const closeTab = (tabId: string) => {
    // Get tab before removing
    const tab = openedTabs.find(tab => tab.id === tabId);
    
    // Remove from memory
    setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    // If we're closing the active tab, select another one
    if (activeTabId === tabId) {
      const remainingTabs = openedTabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
        selectFile(remainingTabs[0].id);
      } else {
        setActiveTabId(null);
      }
    }
    
    // If tab was modified, prompt to save changes
    if (tab?.isModified && monacoInstance) {
      const shouldSave = window.confirm(`Do you want to save changes to ${tab.name} before closing?`);
      if (shouldSave) {
        // Get content from session storage
        try {
          const content = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${tabId}`);
          if (content) {
            updateFileContent(tabId, content);
            addLogMessage('success', `Saved changes to ${tab.name}`);
          }
        } catch (error) {
          console.error('Error retrieving from session storage:', error);
        }
      }
    }
    
    // Clean up session storage
    try {
      sessionStorage.removeItem(`${SESSION_STORAGE_KEY_PREFIX}${tabId}`);
    } catch (error) {
      console.error('Error removing from session storage:', error);
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
    
    try {
      // Get content from session storage first
      let content = sessionStorage.getItem(`${SESSION_STORAGE_KEY_PREFIX}${activeTabId}`);
      
      // If not in session storage, get from monaco
      if (!content && monacoInstance) {
        content = monacoInstance.getValue();
      }
      
      if (content !== null) {
        // Save to file system
        updateFileContent(activeTabId, content);
        
        // Update tab state to remove modified indicator
        setOpenedTabs(prevTabs => 
          prevTabs.map(tab => 
            tab.id === activeTabId ? { ...tab, isModified: false } : tab
          )
        );
        
        addLogMessage('success', 'File saved successfully');
      }
    } catch (error) {
      console.error('Error saving file:', error);
      addLogMessage('error', 'Failed to save file');
    }
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
  
  // Undo file change
  const undoFileChange = () => {
    if (monacoInstance && activeTabId) {
      monacoInstance.trigger('keyboard', 'undo', null);
      addLogMessage('info', 'Undo operation performed');
    }
  };
  
  // Redo file change
  const redoFileChange = () => {
    if (monacoInstance && activeTabId) {
      monacoInstance.trigger('keyboard', 'redo', null);
      addLogMessage('info', 'Redo operation performed');
    }
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
      getTabContent,
      updateTabContent,
      undoFileChange,
      redoFileChange
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
