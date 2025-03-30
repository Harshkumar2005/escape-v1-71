
import React, { useState } from 'react';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, GitBranch, Github } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { getLanguageFromExtension } from '@/utils/languageUtils';

interface GithubFile {
  name: string;
  path: string;
  type: string;
  sha: string;
  url: string;
  size?: number; // Make size optional to match GitHub API
  content?: string;
}

const GithubRepoLoader: React.FC = () => {
  const { createFile, addLogMessage } = useFileSystem();
  const { toast } = useToast();
  
  const [repoUrl, setRepoUrl] = useState('');
  const [branch, setBranch] = useState('main');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ loaded: 0, total: 0 });
  
  // Parse GitHub repo URL to extract owner and repo name
  const parseGithubUrl = (url: string) => {
    try {
      // Handle different GitHub URL formats
      const regex = /github\.com\/([^/]+)\/([^/]+)/;
      const match = url.match(regex);
      
      if (match && match.length >= 3) {
        return {
          owner: match[1],
          repo: match[2].replace('.git', '')
        };
      }
      
      throw new Error('Invalid GitHub repository URL');
    } catch (error) {
      console.error('Error parsing GitHub URL:', error);
      return null;
    }
  };
  
  // Fetch files from a GitHub repository
  const fetchFilesFromGithub = async (owner: string, repo: string, path: string = '') => {
    try {
      // Fetch the contents of the repository at the specified path
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Update progress
      setProgress(prev => ({ ...prev, total: Array.isArray(data) ? data.length : 1 }));
      
      // Process the files and folders
      if (Array.isArray(data)) {
        // It's a directory, process each item
        for (const item of data) {
          if (item.type === 'dir') {
            // Recursively fetch contents of subdirectories
            await fetchFilesFromGithub(owner, repo, item.path);
          } else if (item.type === 'file') {
            // Fetch and process the file
            await fetchFileContent(owner, repo, item);
          }
          
          // Update progress
          setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
        }
      } else if (data.type === 'file') {
        // It's a single file
        await fetchFileContent(owner, repo, data);
        setProgress(prev => ({ ...prev, loaded: prev.loaded + 1 }));
      }
    } catch (error) {
      console.error('Error fetching GitHub repository contents:', error);
      addLogMessage('error', `Failed to fetch repository: ${error instanceof Error ? error.message : String(error)}`);
      toast({
        title: 'Error',
        description: `Failed to fetch repository: ${error instanceof Error ? error.message : String(error)}`,
        variant: 'destructive'
      });
      setIsLoading(false);
    }
  };
  
  // Fetch the content of a specific file
  const fetchFileContent = async (owner: string, repo: string, file: GithubFile) => {
    try {
      // Skip large binary files - check file size if available
      if (isBinaryFile(file.name) || (file.size !== undefined && file.size > 1000000)) {
        addLogMessage('warning', `Skipped large or binary file: ${file.path}`);
        return;
      }
      
      const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${file.path}?ref=${branch}`);
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // GitHub API returns content as base64 encoded
      const content = data.content ? atob(data.content.replace(/\n/g, '')) : '';
      
      // Create the file in our virtual file system
      createFileInProject(file.path, content);
    } catch (error) {
      console.error(`Error fetching file content for ${file.path}:`, error);
      addLogMessage('error', `Failed to fetch file: ${file.path}`);
    }
  };
  
  // Check if a file is likely binary based on extension
  const isBinaryFile = (filename: string) => {
    const binaryExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.ico', '.pdf', '.zip', '.tar', '.gz', '.exe', '.dll', '.so', '.dylib'];
    const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase();
    return binaryExtensions.includes(ext);
  };
  
  // Create a file in our project structure
  const createFileInProject = (path: string, content: string) => {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.substring(1) : path;
    
    // Split the path into parts
    const parts = cleanPath.split('/');
    const fileName = parts.pop() || '';
    
    // Build the parent path
    let parentPath = '/my-project';
    
    // Create folders as needed
    for (const folder of parts) {
      if (folder) {
        // Check if folder exists, create if not
        try {
          createFile(parentPath, folder, 'folder');
        } catch (error) {
          // Folder might already exist, continue
        }
        parentPath += `/${folder}`;
      }
    }
    
    // Create the file
    try {
      const fileId = createFile(parentPath, fileName, 'file');
      
      // Update file content if we have a file ID
      if (fileId) {
        // Get language from file extension
        const language = getLanguageFromExtension(fileName);
        
        // Log success
        addLogMessage('success', `Imported file: ${cleanPath}`);
      }
    } catch (error) {
      console.error(`Error creating file ${cleanPath}:`, error);
      addLogMessage('error', `Failed to create file: ${cleanPath}`);
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const repoInfo = parseGithubUrl(repoUrl);
    
    if (!repoInfo) {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid GitHub repository URL',
        variant: 'destructive'
      });
      return;
    }
    
    setIsLoading(true);
    setProgress({ loaded: 0, total: 0 });
    
    try {
      await fetchFilesFromGithub(repoInfo.owner, repoInfo.repo);
      
      toast({
        title: 'Repository Imported',
        description: `Successfully imported ${repoInfo.owner}/${repoInfo.repo}`,
      });
      
      addLogMessage('success', `Imported GitHub repository: ${repoInfo.owner}/${repoInfo.repo}`);
    } catch (error) {
      console.error('Error importing repository:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : String(error),
        variant: 'destructive'
      });
      
      addLogMessage('error', `Failed to import repository: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="p-4 space-y-4">
      <h2 className="text-lg font-medium">Import GitHub Repository</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="repo-url" className="text-sm font-medium">
            Repository URL
          </label>
          <div className="flex">
            <div className="bg-muted p-2 rounded-l-md border-y border-l border-input">
              <Github size={16} />
            </div>
            <Input
              id="repo-url"
              placeholder="https://github.com/username/repository"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              className="rounded-l-none"
              required
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="branch" className="text-sm font-medium">
            Branch
          </label>
          <div className="flex">
            <div className="bg-muted p-2 rounded-l-md border-y border-l border-input">
              <GitBranch size={16} />
            </div>
            <Input
              id="branch"
              placeholder="main"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="rounded-l-none"
            />
          </div>
        </div>
        
        <Button type="submit" disabled={isLoading} className="w-full">
          {isLoading ? (
            <>
              <Loader2 size={16} className="mr-2 animate-spin" />
              Importing Repository...
              {progress.total > 0 && ` (${progress.loaded}/${progress.total})`}
            </>
          ) : (
            'Import Repository'
          )}
        </Button>
      </form>
      
      {isLoading && progress.total > 0 && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">
            Importing files: {progress.loaded}/{progress.total}
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full"
              style={{
                width: `${Math.min(100, (progress.loaded / progress.total) * 100)}%`
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default GithubRepoLoader;
