
import React, { useState } from 'react';
import { Loader2, Github } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useWebContainer } from '@/contexts/WebContainerContext';
import { convertToWebContainerFormat } from '@/utils/webContainerUtils';
import { toast } from 'sonner';

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({ isOpen, onClose }) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { replaceFileSystem, files } = useFileSystem();
  const { mountFiles } = useWebContainer();

  const extractOwnerAndRepo = (url: string) => {
    // Handle various GitHub URL formats
    const githubRegex = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = url.match(githubRegex);
    
    if (match) {
      const owner = match[1];
      // Remove .git extension if present
      const repo = match[2].replace(/\.git$/, '');
      return { owner, repo };
    }
    
    throw new Error('Invalid GitHub repository URL');
  };

  const handleLoadRepo = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { owner, repo } = extractOwnerAndRepo(repoUrl);
      
      // Fetch repository contents from GitHub API
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (!response.ok) {
        throw new Error(`GitHub API Error: ${response.status}`);
      }
      
      const contents = await response.json();
      
      // Replace file system with new project
      replaceFileSystem(repo);
      
      // Wait for file system state to update
      setTimeout(async () => {
        try {
          // Convert file system to WebContainer format and mount
          const webContainerFiles = convertToWebContainerFormat(files);
          await mountFiles(webContainerFiles);
          
          toast.success(`Repository ${owner}/${repo} loaded successfully`);
          onClose();
        } catch (error: any) {
          toast.error('Failed to initialize WebContainer: ' + error.message);
          console.error('WebContainer error:', error);
        } finally {
          setIsLoading(false);
        }
      }, 800);
    } catch (error: any) {
      console.error('Error loading GitHub repository:', error);
      toast.error(`Failed to load repository: ${error.message}`);
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-sidebar border-border">
        <DialogHeader>
          <DialogTitle className="text-sidebar-foreground flex items-center gap-2">
            <Github size={20} />
            Load from GitHub
          </DialogTitle>
          <DialogDescription className="text-sidebar-foreground opacity-70">
            Enter the URL of a public GitHub repository
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <Input
            placeholder="https://github.com/username/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="bg-terminal text-terminal-foreground border-border"
            disabled={isLoading}
          />
          
          <Button 
            onClick={handleLoadRepo} 
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading Repository...
              </>
            ) : (
              'Load Repository'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
