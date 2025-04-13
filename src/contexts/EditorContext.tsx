import React, { createContext, useContext, useState, useEffect } from 'react';
import { editor } from 'monaco-editor';
import { useFileSystem } from './FileSystemContext';
import { toast } from 'sonner';

interface TabInfo {
  id: string;
  name: string;
  language: string;
  path: string;
  isModified: boolean;
  content?: string; // Store content per tab
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
  saveAllFiles: () => void;
  moveTab: (fromIndex: number, toIndex: number) => void;
  getTabContent: (tabId: string) => string;
  updateTabContent: (tabId: string, content: string) => void;
  undoLastAction: () => void;
  redoLastAction: () => void;
}

interface EditorHistoryAction {
  type: 'content' | 'tab' | 'delete';
  tabId: string;
  content?: string;
  previousContent?: string;
  tabInfo?: TabInfo;
}

const STORAGE_KEY_PREFIX = 'code-editor-tab-';
const TABS_STORAGE_KEY = 'code-editor-tabs';
const ACTIVE_TAB_KEY = 'code-editor-active-tab';

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export const EditorProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { getFileById, updateFileContent, selectFile } = useFileSystem();
  const [openedTabs, setOpenedTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<editor.IStandaloneCodeEditor | null>(null);
  const [undoStack, setUndoStack] = useState<EditorHistoryAction[]>([]);
  const [redoStack, setRedoStack] = useState<EditorHistoryAction[]>([]);

  useEffect(() => {
    try {
      const savedTabsJson = sessionStorage.getItem(TABS_STORAGE_KEY);
      const savedActiveTab = sessionStorage.getItem(ACTIVE_TAB_KEY);
      
      if (savedTabsJson) {
        const savedTabs: TabInfo[] = JSON.parse(savedTabsJson);
        
        const loadedTabs = savedTabs.map(tab => {
          const savedContent = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${tab.id}`);
          return {
            ...tab,
            content: savedContent || ''
          };
        });
        
        setOpenedTabs(loadedTabs);
        
        if (savedActiveTab) {
          setActiveTabId(savedActiveTab);
          selectFile(savedActiveTab);
        }
      }
    } catch (error) {
      console.error('Error loading saved tabs:', error);
    }
  }, []);

  useEffect(() => {
    try {
      const tabsForStorage = openedTabs.map(({ id, name, language, path, isModified }) => ({
        id, name, language, path, isModified
      }));
      
      sessionStorage.setItem(TABS_STORAGE_KEY, JSON.stringify(tabsForStorage));
      
      openedTabs.forEach(tab => {
        if (tab.content !== undefined) {
          sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${tab.id}`, tab.content);
        }
      });
      
      if (activeTabId) {
        sessionStorage.setItem(ACTIVE_TAB_KEY, activeTabId);
      }
    } catch (error) {
      console.error('Error saving tabs to session storage:', error);
    }
  }, [openedTabs, activeTabId]);

  const getTabContent = (tabId: string): string => {
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab?.content !== undefined) {
      return tab.content;
    }
    
    const storedContent = sessionStorage.getItem(`${STORAGE_KEY_PREFIX}${tabId}`);
    if (storedContent !== null) {
      return storedContent;
    }
    
    const file = getFileById(tabId);
    return file?.content || '';
  };

  const updateTabContent = (tabId: string, content: string) => {
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab) {
      const previousContent = tab.content;
      setUndoStack(prev => [...prev, {
        type: 'content',
        tabId,
        previousContent,
        content
      }]);
      setRedoStack([]);
    }
    
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === tabId 
          ? { ...tab, content, isModified: true } 
          : tab
      )
    );
    
    sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${tabId}`, content);
  };

  const openTab = (fileId: string) => {
    const file = getFileById(fileId);
    
    if (!file || file.type !== 'file') return;
    
    const existingTab = openedTabs.find(tab => tab.id === fileId);
    
    if (!existingTab) {
      const content = file.content || '';
      
      const newTab: TabInfo = {
        id: fileId,
        name: file.name,
        language: file.language || 'plaintext',
        path: file.path,
        isModified: false,
        content
      };
      
      setOpenedTabs(prevTabs => [...prevTabs, newTab]);
      
      sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${fileId}`, content);
    }
    
    setActiveTabId(fileId);
    selectFile(fileId);
  };

  const closeTab = (tabId: string) => {
    const tab = openedTabs.find(t => t.id === tabId);
    if (tab) {
      setUndoStack(prev => [...prev, {
        type: 'tab',
        tabId,
        tabInfo: tab
      }]);
      setRedoStack([]);
    }
    
    setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId));
    
    sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${tabId}`);
    
    if (activeTabId === tabId) {
      const newActiveTab = openedTabs.length > 1 ? 
        openedTabs.find(tab => tab.id !== tabId)?.id || null : 
        null;
      
      setActiveTabId(newActiveTab);
      if (newActiveTab) {
        selectFile(newActiveTab);
      }
    }
  };

  const setActiveTab = (tabId: string) => {
    setActiveTabId(tabId);
    selectFile(tabId);
  };

  const updateMonacoInstance = (instance: editor.IStandaloneCodeEditor | null) => {
    setMonacoInstance(instance);
  };

  const saveActiveFile = () => {
    if (!activeTabId) return;
    
    const tabContent = getTabContent(activeTabId);
    
    updateFileContent(activeTabId, tabContent);
    
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { ...tab, isModified: false } : tab
      )
    );
    
    toast.success(`File ${openedTabs.find(tab => tab.id === activeTabId)?.name} saved`);
  };

  const saveAllFiles = () => {
    openedTabs.forEach(tab => {
      const content = getTabContent(tab.id);
      updateFileContent(tab.id, content);
    });
    
    setOpenedTabs(prevTabs => 
      prevTabs.map(tab => ({ ...tab, isModified: false }))
    );
    
    toast.success('All files saved');
  };

  const moveTab = (fromIndex: number, toIndex: number) => {
    setOpenedTabs(prevTabs => {
      const newTabs = [...prevTabs];
      const [movedTab] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, movedTab);
      return newTabs;
    });
  };

  const undoLastAction = () => {
    const lastAction = undoStack[undoStack.length - 1];
    if (!lastAction) return;
    
    setUndoStack(prev => prev.slice(0, -1));
    
    setRedoStack(prev => [...prev, lastAction]);
    
    if (lastAction.type === 'content' && lastAction.previousContent !== undefined) {
      setOpenedTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === lastAction.tabId 
            ? { ...tab, content: lastAction.previousContent, isModified: true } 
            : tab
        )
      );
      
      if (lastAction.previousContent) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastAction.tabId}`, lastAction.previousContent);
      }
      
      toast.info('Undid last edit');
    } else if (lastAction.type === 'tab' && lastAction.tabInfo) {
      setOpenedTabs(prevTabs => [...prevTabs, lastAction.tabInfo!]);
      
      if (lastAction.tabInfo.content) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastAction.tabId}`, lastAction.tabInfo.content);
      }
      
      toast.info(`Restored tab: ${lastAction.tabInfo.name}`);
    }
  };

  const redoLastAction = () => {
    const lastRedoAction = redoStack[redoStack.length - 1];
    if (!lastRedoAction) return;
    
    setRedoStack(prev => prev.slice(0, -1));
    
    setUndoStack(prev => [...prev, lastRedoAction]);
    
    if (lastRedoAction.type === 'content') {
      setOpenedTabs(prevTabs => 
        prevTabs.map(tab => 
          tab.id === lastRedoAction.tabId 
            ? { ...tab, content: lastRedoAction.content, isModified: true } 
            : tab
        )
      );
      
      if (lastRedoAction.content) {
        sessionStorage.setItem(`${STORAGE_KEY_PREFIX}${lastRedoAction.tabId}`, lastRedoAction.content);
      }
      
      toast.info('Redid last edit');
    } else if (lastRedoAction.type === 'tab') {
      setOpenedTabs(prevTabs => prevTabs.filter(tab => tab.id !== lastRedoAction.tabId));
      
      sessionStorage.removeItem(`${STORAGE_KEY_PREFIX}${lastRedoAction.tabId}`);
      
      toast.info(`Closed tab: ${lastRedoAction.tabInfo?.name}`);
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
      saveAllFiles,
      moveTab,
      getTabContent,
      updateTabContent,
      undoLastAction,
      redoLastAction
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
