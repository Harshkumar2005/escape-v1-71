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
import { Github, FileCode, Loader, Ghost, Plus, Code } from 'lucide-react';
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
        <DialogContent className="max-w-5xl p-0 bg-sidebar border-border overflow-hidden rounded-lg">
          <div className="h-screen flex flex-col justify-center items-center bg-sidebar">
            <div className="mb-10 flex items-center">
              <Ghost className="h-16 w-16 mr-4 text-sidebar-foreground" />
              <h1 className="text-7xl font-extrabold text-sidebar-foreground">
                ESCAPE.esc
              </h1>
            </div>
            
            <div className="text-center mb-16">
              <p className="text-xl text-sidebar-foreground opacity-80">Where code meets imagination</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl px-6">
              <Button
                variant="outline"
                className="flex items-center justify-between p-8 bg-terminal hover:bg-terminal/90 border border-border text-sidebar-foreground rounded-xl transition-all hover:shadow-lg"
                onClick={handleLoadFromGithub}
                disabled={isLoading}
              >
                <div className="flex items-center">
                  {isLoading ? (
                    <Loader className="h-14 w-14 text-sidebar-foreground animate-spin mr-6" />
                  ) : (
                    <Github className="h-14 w-14 text-sidebar-foreground mr-6" />
                  )}
                  <div className="text-left">
                    <div className="font-bold text-xl mb-1">GitHub Repository</div>
                    <div className="text-sm text-sidebar-foreground opacity-70">
                      Import from existing repository
                    </div>
                  </div>
                </div>
                <Code className="h-8 w-8 text-sidebar-foreground" />
              </Button>
              
              <Button
                variant="outline"
                className="flex items-center justify-between p-8 bg-terminal hover:bg-terminal/90 border border-border text-sidebar-foreground rounded-xl transition-all hover:shadow-lg"
                onClick={handleStartNewProject}
                disabled={isLoading}
              >
                <div className="flex items-center">
                  {isLoading ? (
                    <Loader className="h-14 w-14 text-sidebar-foreground animate-spin mr-6" />
                  ) : (
                    <FileCode className="h-14 w-14 text-sidebar-foreground mr-6" />
                  )}
                  <div className="text-left">
                    <div className="font-bold text-xl mb-1">Blank Canvas</div>
                    <div className="text-sm text-sidebar-foreground opacity-70">
                      Start with a clean workspace
                    </div>
                  </div>
                </div>
                <Plus className="h-8 w-8 text-sidebar-foreground" />
              </Button>
            </div>
            
            <div className="mt-12 text-center text-sidebar-foreground opacity-50 text-sm">
              <p>ESCAPE.esc — Next-generation code editor</p>
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
