
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Loader2, GitBranch, FolderPlus } from 'lucide-react';
import { getLanguageFromExtension } from '@/utils/languageUtils';
import { useToast } from '@/hooks/use-toast';

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string | null;
  type: 'file' | 'dir';
  content?: string;
  encoding?: string;
  _links: {
    self: string;
    git: string;
    html: string;
  };
}

const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const { createFile, addLogMessage } = useFileSystem();
  const { toast } = useToast();

  // Parse GitHub URL to extract owner and repo
  const parseGitHubUrl = (url: string): { owner: string; repo: string } | null => {
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname !== 'github.com') {
        return null;
      }
      
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      if (pathParts.length < 2) {
        return null;
      }
      
      return { owner: pathParts[0], repo: pathParts[1] };
    } catch (e) {
      return null;
    }
  };

  // Fetch content from GitHub API recursively
  const fetchDirectoryContent = async (
    owner: string, 
    repo: string, 
    path: string = ''
  ): Promise<GitHubFileContent[]> => {
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}`;
    
    try {
      setLoadingStep(`Fetching ${path || 'root directory'}...`);
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching from GitHub:', error);
      throw error;
    }
  };

  // Fetch file content
  const fetchFileContent = async (
    url: string
  ): Promise<string> => {
    try {
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // GitHub API returns content as base64 encoded
      if (data.encoding === 'base64' && data.content) {
        return atob(data.content.replace(/\n/g, ''));
      }
      
      return '';
    } catch (error) {
      console.error('Error fetching file content:', error);
      return '';
    }
  };

  // Process files and directories recursively
  const processGitHubContents = async (
    owner: string,
    repo: string,
    contents: GitHubFileContent[],
    parentPath: string = '/my-project'
  ) => {
    for (const item of contents) {
      if (item.type === 'dir') {
        // Create folder
        const folderPath = `${parentPath}/${item.name}`;
        createFile(parentPath, item.name, 'folder');
        
        // Fetch and process contents of this directory
        try {
          setLoadingStep(`Processing directory: ${item.path}`);
          const dirContents = await fetchDirectoryContent(owner, repo, item.path);
          await processGitHubContents(owner, repo, dirContents, folderPath);
        } catch (error) {
          console.error(`Error processing directory ${item.path}:`, error);
          addLogMessage('error', `Failed to process directory: ${item.path}`);
        }
      } else if (item.type === 'file') {
        try {
          setLoadingStep(`Fetching file: ${item.path}`);
          // Skip binary files
          if (!item.download_url) {
            addLogMessage('warning', `Skipped binary file: ${item.path}`);
            continue;
          }
          
          // Fetch file content
          const content = await fetchFileContent(item.url);
          
          // Create file in our filesystem
          const fileId = createFile(parentPath, item.name, 'file');
          
          // Set file content if we have a file ID
          if (fileId) {
            // File contents will be updated by the createFile function
            addLogMessage('info', `Loaded file: ${item.path}`);
          }
        } catch (error) {
          console.error(`Error processing file ${item.path}:`, error);
          addLogMessage('error', `Failed to load file: ${item.path}`);
        }
      }
    }
  };

  // Handle loading the GitHub repository
  const handleLoadRepo = async () => {
    const repoInfo = parseGitHubUrl(repoUrl);
    
    if (!repoInfo) {
      toast({
        title: "Invalid GitHub URL",
        description: "Please enter a valid GitHub repository URL (e.g., https://github.com/owner/repo)",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Get root contents of the repo
      const rootContents = await fetchDirectoryContent(repoInfo.owner, repoInfo.repo);
      
      // Add a log message
      addLogMessage('info', `Loading GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`);
      
      // Process all files and directories
      await processGitHubContents(repoInfo.owner, repoInfo.repo, rootContents);
      
      toast({
        title: "Repository Loaded",
        description: `Successfully loaded ${repoInfo.owner}/${repoInfo.repo}`,
        variant: "default"
      });
      
      addLogMessage('success', `Successfully loaded GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`);
      
      // Close the dialog
      onClose();
    } catch (error) {
      console.error('Error loading repository:', error);
      toast({
        title: "Error Loading Repository",
        description: "Failed to load the GitHub repository. Please check the URL and try again.",
        variant: "destructive"
      });
      
      addLogMessage('error', `Failed to load GitHub repository: ${repoUrl}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle creating a new empty project
  const handleNewProject = () => {
    // Add a log message
    addLogMessage('info', 'Creating new empty project');
    
    // Create basic project structure
    createFile('/my-project', 'src', 'folder');
    createFile('/my-project/src', 'components', 'folder');
    createFile('/my-project/src', 'App.tsx', 'file');
    createFile('/my-project/src', 'index.tsx', 'file');
    createFile('/my-project', 'package.json', 'file');
    createFile('/my-project', 'README.md', 'file');
    
    toast({
      title: "Project Created",
      description: "New empty project has been created",
      variant: "default"
    });
    
    addLogMessage('success', 'Empty project created successfully');
    
    // Close the dialog
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Open Project</DialogTitle>
          <DialogDescription>
            Choose how you want to start your project
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-6 py-4">
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <GitBranch className="h-4 w-4" />
              Load from GitHub Repository
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="https://github.com/username/repository" 
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                disabled={isLoading}
              />
              <Button 
                onClick={handleLoadRepo} 
                disabled={isLoading || !repoUrl.trim()}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load'
                )}
              </Button>
            </div>
            {isLoading && (
              <div className="text-xs text-muted-foreground">
                {loadingStep}
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <FolderPlus className="h-4 w-4" />
              Start a New Empty Project
            </div>
            <Button 
              variant="outline" 
              onClick={handleNewProject}
              disabled={isLoading}
            >
              Create New Project
            </Button>
          </div>
        </div>
        
        <DialogFooter className="flex justify-between">
          <Button variant="ghost" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default GithubRepoLoader;
