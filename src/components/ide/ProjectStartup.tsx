
import React, { useState } from 'react';
import { Github, FileCode, Loader, AlertTriangle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useWebContainer } from '@/contexts/WebContainerContext';
import { toast } from 'sonner';
import { GithubRepoLoader } from './GithubRepoLoader';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export const ProjectStartup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showGithubLoader, setShowGithubLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetFileSystem } = useFileSystem();
  const { bootstrapProject, hasWebContainerError, webContainerError } = useWebContainer();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleStartNewProject = async () => {
    setIsLoading(true);
    
    try {
      // Reset the file system first
      resetFileSystem();
      
      // Then bootstrap the project in WebContainer
      if (!hasWebContainerError) {
        await bootstrapProject();
        toast.success('New project created and loaded in WebContainer environment');
      } else {
        // If WebContainer failed, just proceed with editor-only mode
        toast.info('Starting in editor-only mode (WebContainer not available)');
      }
    } catch (error) {
      console.error('Error starting new project:', error);
      toast.error('Failed to initialize project. Using editor-only mode.');
    } finally {
      setIsLoading(false);
      handleClose();
    }
  };

  const handleLoadFromGithub = () => {
    setShowGithubLoader(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-sidebar border-border">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">Welcome to WebContainer IDE</DialogTitle>
            <DialogDescription className="text-sidebar-foreground opacity-70">
              Choose how you want to get started with your in-browser development environment
            </DialogDescription>
          </DialogHeader>
          
          {hasWebContainerError && (
            <Alert variant="destructive" className="bg-red-900/20 border-red-900/50 mb-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>WebContainer Error</AlertTitle>
              <AlertDescription>
                {webContainerError?.includes('Unable to create more instances') 
                  ? 'You\'ve reached the limit of WebContainer instances. Try closing other tabs or refreshing.'
                  : 'Failed to initialize WebContainer. Running in editor-only mode.'}
              </AlertDescription>
            </Alert>
          )}
          
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 h-20 px-4 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground"
              onClick={handleLoadFromGithub}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-6 w-6 text-blue-500 animate-spin" />
              ) : (
                <Github className="h-6 w-6 text-blue-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Load from GitHub</div>
                <div className="text-sm text-muted-foreground">
                  Import code from an existing public repository{hasWebContainerError ? ' (Editor Only)' : ' into WebContainer'}
                </div>
              </div>
            </Button>
            
            <Button
              variant="outline"
              className="flex items-center justify-start gap-2 h-20 px-4 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground"
              onClick={handleStartNewProject}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader className="h-6 w-6 text-green-500 animate-spin" />
              ) : (
                <FileCode className="h-6 w-6 text-green-500" />
              )}
              <div className="text-left">
                <div className="font-medium">Start New Project</div>
                <div className="text-sm text-muted-foreground">
                  Begin with a basic project template{hasWebContainerError ? ' (Editor Only)' : ' in WebContainer'}
                </div>
              </div>
            </Button>
          </div>

          <div className="text-xs text-slate-400 mt-2">
            <p>WebContainer allows you to run Node.js directly in your browser.</p>
            {hasWebContainerError ? (
              <p className="text-yellow-400">Currently in editor-only mode. Some features will be limited.</p>
            ) : (
              <p>You can edit files, run commands in the terminal, and execute your code - all in this browser tab.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {showGithubLoader && (
        <GithubRepoLoader 
          isOpen={showGithubLoader} 
          onClose={() => {
            setShowGithubLoader(false);
            handleClose();
          }}
        />
      )}
    </>
  );
};
