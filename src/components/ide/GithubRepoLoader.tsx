/*
import React, { useState } from 'react';
import { Github, Search, Loader, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';

// Types for GitHub API responses
interface GithubFile {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size?: number;
  download_url?: string;
  url: string;
}

interface GithubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
}

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const { replaceFileSystem, createFile, updateFileContent, addLogMessage } = useFileSystem();

  const parseGithubUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        return null;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }
      
      return {
        owner: pathParts[0],
        repo: pathParts[1],
        branch: pathParts[3] || 'main' // Default to 'main' if no branch specified
      };
    } catch (e) {
      return null;
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    setProgress('Validating repository URL...');
    
    const repoInfo = parseGithubUrl(repoUrl);
    if (!repoInfo) {
      setError('Invalid GitHub URL. Please enter a valid GitHub repository URL.');
      setLoading(false);
      return;
    }
    
    try {
      // First, get repo information
      setProgress('Fetching repository information...');
      const repoResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`);
      
      if (!repoResponse.ok) {
        throw new Error('Repository not found or not accessible');
      }
      
      const repoData: GithubRepo = await repoResponse.json();
      
      // Setup new empty file system with the repo name
      setProgress('Setting up file system...');
      replaceFileSystem(repoData.name);
      
      // Fetch contents of the repository
      setProgress('Fetching repository contents...');
      const contentsResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents?ref=${repoData.default_branch}`);
      
      if (!contentsResponse.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      
      const contents: GithubFile[] = await contentsResponse.json();
      
      // Process repository contents
      setProgress('Processing repository files...');
      await processGithubContents(contents, `/${repoData.name}`);
      
      toast.success(`Repository ${repoData.name} imported successfully!`);
      setLoading(false);
      addLogMessage('success', `Imported GitHub repository: ${repoData.full_name}`);
      onClose();
    } catch (error) {
      console.error('Error importing repository:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoading(false);
      addLogMessage('error', `Failed to import repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processGithubContents = async (
    contents: GithubFile[],
    parentPath: string
  ) => {
    for (const item of contents) {
      setProgress(`Processing ${item.name}...`);
      
      if (item.type === 'dir') {
        // Create folder
        const folderId = createFile(parentPath, item.name, 'folder');
        
        // Fetch and process subdirectory contents
        const response = await fetch(item.url);
        if (response.ok) {
          const subContents = await response.json();
          await processGithubContents(subContents, `${parentPath}/${item.name}`);
        }
      } else if (item.type === 'file') {
        // Skip large files (>500KB) to prevent performance issues
        if (item.size && item.size > 500000) {
          toast.warning(`Skipped large file: ${item.name}`);
          continue;
        }
        
        // Fetch file content
        if (item.download_url) {
          try {
            const fileResponse = await fetch(item.download_url);
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              
              // Create file with content
              const fileId = createFile(parentPath, item.name, 'file');
              if (fileId) {
                updateFileContent(fileId, content);
                addLogMessage('info', `Loaded file: ${item.name}`);
              }
            }
          } catch (error) {
            console.error(`Failed to load file content for ${item.name}`, error);
            addLogMessage('warning', `Failed to load file: ${item.name}`);
          }
        }
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="text-sidebar-foreground flex items-center gap-2">
            <Github className="h-5 w-5" /> Import from GitHub
          </DialogTitle>
          <DialogDescription className="text-sidebar-foreground opacity-70">
            Enter the URL of a public GitHub repository to import
          </DialogDescription>
        </DialogHeader>

        <div className="py-6">
          <div className="flex items-center space-x-2">
            <Input
              placeholder="https://github.com/username/repo"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="bg-terminal text-terminal-foreground border-border flex-grow"
              disabled={loading}
            />
            <Button 
              type="submit" 
              onClick={handleImport}
              disabled={loading || !repoUrl.trim()}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {loading ? <Loader size={16} className="animate-spin mr-2" /> : <Search size={16} className="mr-2" />}
              {loading ? 'Importing...' : 'Import'}
            </Button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500 bg-opacity-20 border border-red-500 border-opacity-30 rounded text-red-400 text-sm">
              <div className="flex items-start">
                <X size={16} className="mt-0.5 mr-2 flex-shrink-0" />
                <span>{error}</span>
              </div>
            </div>
          )}

          {loading && (
            <div className="mt-6 flex flex-col items-center justify-center space-y-4 p-6 bg-terminal border border-border rounded">
              <div className="flex flex-col items-center">
                <Loader size={48} className="text-blue-500 animate-spin mb-4" />
                <div className="text-terminal-foreground font-medium">{progress}</div>
                <div className="text-sm text-slate-400 mt-1">Please wait while we import your repository...</div>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-slate-400">
            <p>Note: Only public repositories are supported. Large files and binary files may be skipped.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
*/


import React, { useState } from 'react';
import { Github, Search, Loader, X, ChevronRight, FileCode, Download, Ghost} from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';

// Types for GitHub API responses
interface GithubFile {
  name: string;
  path: string;
  type: 'dir' | 'file';
  size?: number;
  download_url?: string;
  url: string;
}

interface GithubRepo {
  name: string;
  full_name: string;
  description: string;
  html_url: string;
  default_branch: string;
}

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const { replaceFileSystem, createFile, updateFileContent, addLogMessage } = useFileSystem();

  const parseGithubUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        return null;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }
      
      return {
        owner: pathParts[0],
        repo: pathParts[1],
        branch: pathParts[3] || 'main' // Default to 'main' if no branch specified
      };
    } catch (e) {
      return null;
    }
  };

  const handleImport = async () => {
    setError(null);
    setLoading(true);
    setProgress('Validating repository URL...');
    setProgressPercentage(10);
    
    const repoInfo = parseGithubUrl(repoUrl);
    if (!repoInfo) {
      setError('Invalid GitHub URL. Please enter a valid GitHub repository URL.');
      setLoading(false);
      return;
    }
    
    try {
      // First, get repo information
      setProgress('Fetching repository information...');
      setProgressPercentage(20);
      const repoResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}`);
      
      if (!repoResponse.ok) {
        throw new Error('Repository not found or not accessible');
      }
      
      const repoData: GithubRepo = await repoResponse.json();
      setProgressPercentage(30);
      
      // Setup new empty file system with the repo name
      setProgress('Setting up file system...');
      setProgressPercentage(40);
      replaceFileSystem(repoData.name);
      
      // Fetch contents of the repository
      setProgress('Fetching repository contents...');
      setProgressPercentage(50);
      const contentsResponse = await fetch(`https://api.github.com/repos/${repoInfo.owner}/${repoInfo.repo}/contents?ref=${repoData.default_branch}`);
      
      if (!contentsResponse.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      
      const contents: GithubFile[] = await contentsResponse.json();
      setProgressPercentage(60);
      
      // Process repository contents
      setProgress('Processing repository files...');
      await processGithubContents(contents, `/${repoData.name}`);
      
      setProgressPercentage(100);
      toast.success(`Repository ${repoData.name} imported successfully!`);
      setLoading(false);
      addLogMessage('success', `Imported GitHub repository: ${repoData.full_name}`);
      onClose();
    } catch (error) {
      console.error('Error importing repository:', error);
      setError(error instanceof Error ? error.message : 'An unknown error occurred');
      setLoading(false);
      addLogMessage('error', `Failed to import repository: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const processGithubContents = async (
    contents: GithubFile[],
    parentPath: string
  ) => {
    const totalItems = contents.length;
    let processedItems = 0;
    
    for (const item of contents) {
      setProgress(`Processing ${item.name}...`);
      
      if (item.type === 'dir') {
        // Create folder
        const folderId = createFile(parentPath, item.name, 'folder');
        
        // Fetch and process subdirectory contents
        const response = await fetch(item.url);
        if (response.ok) {
          const subContents = await response.json();
          await processGithubContents(subContents, `${parentPath}/${item.name}`);
        }
      } else if (item.type === 'file') {
        // Skip large files (>500KB) to prevent performance issues
        if (item.size && item.size > 500000) {
          toast.warning(`Skipped large file: ${item.name}`);
          continue;
        }
        
        // Fetch file content
        if (item.download_url) {
          try {
            const fileResponse = await fetch(item.download_url);
            if (fileResponse.ok) {
              const content = await fileResponse.text();
              
              // Create file with content
              const fileId = createFile(parentPath, item.name, 'file');
              if (fileId) {
                updateFileContent(fileId, content);
                addLogMessage('info', `Loaded file: ${item.name}`);
              }
            }
          } catch (error) {
            console.error(`Failed to load file content for ${item.name}`, error);
            addLogMessage('warning', `Failed to load file: ${item.name}`);
          }
        }
      }
      
      processedItems++;
      setProgressPercentage(60 + Math.floor((processedItems / totalItems) * 40));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl p-0 bg-sidebar overflow-hidden rounded-lg">
        <div className="min-h-screen flex flex-col bg-sidebar">
          <header className="p-6">
            <div className="justify-center flex items-center">
              <Ghost className="mt-2 h-14 w-14 mr-4 text-sidebar-foreground" />
              <h1 className="text-6xl font-extrabold text-sidebar-foreground">
                ESCAPE.esc
              </h1>
            </div>
          </header>
          
          <div className="flex-grow p-8 flex flex-col">
            {!loading ? (
              <div className="max-w-3xl mx-auto w-full">
                <div className="mb-8">
                  <label htmlFor="repo-url" className="block text-xl font-medium text-sidebar-foreground mb-2">
                    Repository URL
                  </label>
                  <div className="flex gap-4">
                    <Input
                      id="repo-url"
                      placeholder="https://github.com/username/repository"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                      className="bg-terminal text-terminal-foreground border-border text-lg p-6 flex-grow"
                    />
                    <Button 
                      onClick={handleImport}
                      disabled={!repoUrl.trim()}
                      className="bg-terminal hover:bg-terminal/90 border border-border text-sidebar-foreground text-lg p-6 flex items-center gap-2 min-w-32"
                    >
                      <Search className="h-6 w-6" />
                      Import
                    </Button>
                  </div>
                  
                  {error && (
                    <div className="mt-6 p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                      <div className="flex items-start">
                        <X className="h-6 w-6 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="text-red-400">{error}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-8">
                  <h2 className="text-xl font-medium text-sidebar-foreground mb-4">Popular repositories</h2>
                  <div className="space-y-4">
                    <Button
                      variant="outline"
                      className="flex items-center justify-between w-full p-8 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                      onClick={() => setRepoUrl('https://github.com/facebook/react')}
                    >
                      <div className="flex items-center">
                        <Github className="text-sidebar-foreground mr-4" style={{
                    height: "1.68rem",
                    width: "1.68rem",
                    marginLeft: "-10px"
                   }}/>
                        <div className="text-left">
                          <div className="font-medium text-lg">facebook/react</div>
                          <div className="text-sm text-sidebar-foreground opacity-70">
                            A JavaScript library for building user interfaces
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-sidebar-foreground opacity-70 group-hover:opacity-100" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex items-center justify-between w-full p-8 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                      onClick={() => setRepoUrl('https://github.com/vercel/next.js')}
                    >
                      <div className="flex items-center">
                        <Github className="text-sidebar-foreground mr-4" style={{
                    height: "1.68rem",
                    width: "1.68rem",
                    marginLeft: "-10px"
                   }}/><div className="text-left">
                          <div className="font-medium text-lg">vercel/next.js</div>
                          <div className="text-sm text-sidebar-foreground opacity-70">
                            The React Framework for Production
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-sidebar-foreground opacity-70 group-hover:opacity-100" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      className="flex items-center justify-between w-full p-8 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                      onClick={() => setRepoUrl('https://github.com/tailwindlabs/tailwindcss')}
                    >
                      <div className="flex items-center">
                        <Github className="text-sidebar-foreground mr-4" style={{
                    height: "1.68rem",
                    width: "1.68rem",
                    marginLeft: "-10px"
                   }}/><div className="text-left">
                          <div className="font-medium text-lg">tailwindlabs/tailwindcss</div>
                          <div className="text-sm text-sidebar-foreground opacity-70">
                            A utility-first CSS framework for rapid UI development
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-sidebar-foreground opacity-70 group-hover:opacity-100" />
                    </Button>
                  </div>
                </div>
                
                <div className="mt-8 text-center text-sidebar-foreground opacity-50 text-sm">
                  <p>Note: Only public repositories are supported. Large files (500KB) may be skipped.</p>
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center">
                <div className="mb-16 w-full max-w-lg text-center">
                  <div className="flex flex-col items-center mb-8">
                    <Loader className="h-20 w-20 text-sidebar-foreground animate-spin mb-8" />
                    <h2 className="text-2xl font-bold text-sidebar-foreground mb-2">{progress}</h2>
                    <p className="text-sidebar-foreground opacity-70">Please wait while we import your repository...</p>
                  </div>
                  
                  <div className="w-full bg-terminal rounded-full h-4 mb-6">
                    <div 
                      className="bg-sidebar-foreground h-4 rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    ></div>
                  </div>
                  
                  <div className="hidden space-y-4 text-left">
                    <div className="flex items-center gap-3 p-4 bg-terminal rounded-lg">
                      <FileCode className="h-6 w-6 text-sidebar-foreground" />
                      <div className="text-sidebar-foreground">Setting up file system structure...</div>
                    </div>
                    
                    <div className="flex items-center gap-3 p-4 bg-terminal rounded-lg">
                      <Download className="h-6 w-6 text-sidebar-foreground" />
                      <div className="text-sidebar-foreground">Downloading files from GitHub...</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <footer className="hidden border-t border-border p-4 flex justify-between items-center">
            <p className="text-sm text-sidebar-foreground opacity-50">ESCAPE.esc • GitHub Integration</p>
            {!loading && (
              <Button
                variant="outline"
                className="bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground"
                onClick={onClose}
              >
                Cancel
              </Button>
            )}
          </footer>
        </div>
      </DialogContent>
    </Dialog>
  );
};
