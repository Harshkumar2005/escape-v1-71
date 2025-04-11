/*import React, { useState } from 'react';
import { Github, FileCode, Loader } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';
import { GithubRepoLoader } from './GithubRepoLoader';

export const ProjectStartup: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showGithubLoader, setShowGithubLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetFileSystem } = useFileSystem();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleStartNewProject = () => {
    setIsLoading(true);
    
    // Add a small delay to show loading state
    setTimeout(() => {
      resetFileSystem();
      toast.success('New project created successfully');
      setIsLoading(false);
      handleClose();
    }, 800);
  };

  const handleLoadFromGithub = () => {
    setShowGithubLoader(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md bg-sidebar border-border">
          <DialogHeader>
            <DialogTitle className="text-sidebar-foreground">Welcome to Code Editor</DialogTitle>
            <DialogDescription className="text-sidebar-foreground opacity-70">
              Choose how you want to get started with your project
            </DialogDescription>
          </DialogHeader>
          
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
                  Import code from an existing public repository
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
                  Begin with a blank workspace
                </div>
              </div>
            </Button>
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
*/

import React, { useState } from 'react';
import { Github, FileCode, Loader, Ghost } from 'lucide-react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { toast } from 'sonner';
import { GithubRepoLoader } from './GithubRepoLoader';

export const ProjectStartup = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [showGithubLoader, setShowGithubLoader] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { resetFileSystem } = useFileSystem();

  const handleClose = () => {
    setIsOpen(false);
  };

  const handleStartNewProject = () => {
    setIsLoading(true);
    
    setTimeout(() => {
      resetFileSystem();
      toast.success('New project created successfully');
      setIsLoading(false);
      handleClose();
    }, 800);
  };

  const handleLoadFromGithub = () => {
    setShowGithubLoader(true);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-sidebar border-border overflow-hidden rounded-lg">
          <div className="h-screen flex flex-col justify-center items-center">
            <div className="mb-12 flex items-center">
              <Ghost className="h-12 w-12 mr-4 text-blue-500" />
              <h1 className="text-6xl font-bold text-sidebar-foreground">ESCAPE.esc</h1>
            </div>
            
            <div className="text-center mb-12">
              <p className="text-xl text-sidebar-foreground opacity-70">Your next-generation code editor</p>
            </div>
            
            <div className="grid grid-cols-2 gap-8 w-full max-w-2xl">
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-4 h-48 p-6 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg transition-all hover:scale-105"
                onClick={handleLoadFromGithub}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-12 w-12 text-blue-500 animate-spin" />
                ) : (
                  <Github className="h-12 w-12 text-blue-500" />
                )}
                <div className="text-center">
                  <div className="font-medium text-xl mb-2">Load from GitHub</div>
                  <div className="text-sm text-muted-foreground">
                    Import code from a public repository
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="flex flex-col items-center justify-center gap-4 h-48 p-6 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg transition-all hover:scale-105"
                onClick={handleStartNewProject}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader className="h-12 w-12 text-green-500 animate-spin" />
                ) : (
                  <FileCode className="h-12 w-12 text-green-500" />
                )}
                <div className="text-center">
                  <div className="font-medium text-xl mb-2">Start New Project</div>
                  <div className="text-sm text-muted-foreground">
                    Begin with a blank workspace
                  </div>
                </div>
              </Button>
            </div>
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

export default ProjectStartup;
