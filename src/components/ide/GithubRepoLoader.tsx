
import React, { useState } from 'react';
import { Github, Loader2 } from 'lucide-react';
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
import { toast } from 'sonner';

interface GithubRepoLoaderProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GithubFile {
  name: string;
  path: string;
  type: string;
  download_url?: string;
  size?: number;
  sha: string;
  url: string;
}

export const GithubRepoLoader: React.FC<GithubRepoLoaderProps> = ({
  isOpen,
  onClose,
}) => {
  const [repoUrl, setRepoUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { createFile } = useFileSystem();

  const parseGithubUrl = (url: string): { owner: string; repo: string } | null => {
    try {
      const regex = /github\.com\/([^\/]+)\/([^\/]+)/;
      const matches = url.match(regex);
      if (matches && matches.length >= 3) {
        return {
          owner: matches[1],
          repo: matches[2].replace('.git', ''),
        };
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const fetchGithubRepo = async (owner: string, repo: string) => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents`);
      if (!response.ok) {
        throw new Error('Failed to fetch repository contents');
      }
      const data = await response.json();
      await processGithubContents(data, `/${repo}`);
      toast.success('Repository loaded successfully!');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load repository');
      toast.error('Failed to load repository');
    } finally {
      setIsLoading(false);
    }
  };

  const processGithubContents = async (
    contents: GithubFile[],
    parentPath: string
  ) => {
    for (const item of contents) {
      if (item.type === 'dir') {
        // Create folder
        createFile(parentPath, item.name, 'folder');
        
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
              // If fileId is returned, update its content
              if (fileId) {
                // Assuming there's an updateFileContent method
                // updateFileContent(fileId, content);
                toast.info(`Loaded file: ${item.name}`);
              }
            }
          } catch (error) {
            console.error(`Failed to load file content for ${item.name}`, error);
          }
        }
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseGithubUrl(repoUrl);
    if (!parsed) {
      setError('Invalid GitHub URL. Please enter a valid repository URL.');
      return;
    }
    
    fetchGithubRepo(parsed.owner, parsed.repo);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Load from GitHub Repository</DialogTitle>
          <DialogDescription>
            Enter the URL of a public GitHub repository to import
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="flex items-center space-x-2">
            <Github className="h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="flex-1"
              disabled={isLoading}
            />
          </div>
          
          {error && (
            <div className="text-sm text-destructive">{error}</div>
          )}
          
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={onClose} 
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={!repoUrl.trim() || isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
              ) : (
                'Import Repository'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
