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
import { Github, FileCode, Loader, Ghost, Code2, ChevronRight } from 'lucide-react';
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
        <DialogContent className="max-w-5xl p-0 bg-sidebar border-border overflow-hidden rounded-xl">
          <div className="flex h-screen">
            {/* Left side with background image/pattern */}
            <div className="hidden md:flex md:w-1/3 bg-gradient-to-b from-blue-800 to-indigo-900 items-center justify-center p-8">
              <div className="text-center">
                <Ghost className="h-24 w-24 mx-auto mb-6 text-white" />
                <h2 className="text-2xl font-bold text-white mb-4">Welcome to your coding journey</h2>
                <p className="text-blue-200 text-sm">
                  Create, collaborate, and build your next great project with ESCAPE.esc
                </p>
              </div>
            </div>
            
            {/* Right side with content */}
            <div className="w-full md:w-2/3 flex flex-col p-8 bg-sidebar">
              <div className="flex items-center mb-12">
                <Ghost className="h-10 w-10 mr-3 text-blue-500" />
                <h1 className="text-4xl font-bold text-sidebar-foreground">ESCAPE.esc</h1>
              </div>
              
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-sidebar-foreground mb-2">Get Started</h2>
                <p className="text-sidebar-foreground opacity-70">Choose how you want to begin your project</p>
              </div>
              
              <div className="space-y-4 flex-grow">
                <Button
                  variant="outline"
                  className="flex items-center justify-between w-full p-5 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                  onClick={handleLoadFromGithub}
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <div className="rounded-lg p-2 bg-blue-500/10 mr-4">
                      {isLoading ? (
                        <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                      ) : (
                        <Github className="h-6 w-6 text-blue-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-lg">GitHub Repository</div>
                      <div className="text-sm text-muted-foreground">
                        Clone from existing repository
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-between w-full p-5 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                  onClick={handleStartNewProject}
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <div className="rounded-lg p-2 bg-green-500/10 mr-4">
                      {isLoading ? (
                        <Loader className="h-6 w-6 text-green-500 animate-spin" />
                      ) : (
                        <FileCode className="h-6 w-6 text-green-500" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-lg">New Project</div>
                      <div className="text-sm text-muted-foreground">
                        Start with an empty workspace
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-between w-full p-5 bg-terminal hover:bg-terminal/90 border-border text-sidebar-foreground rounded-lg group"
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <div className="rounded-lg p-2 bg-purple-500/10 mr-4">
                      <Code2 className="h-6 w-6 text-purple-500" />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-lg">Templates</div>
                      <div className="text-sm text-muted-foreground">
                        Start with a predefined project template
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
                </Button>
              </div>
              
              <div className="mt-8 pt-4 border-t border-border/40">
                <p className="text-sm text-sidebar-foreground opacity-50">
                  ESCAPE.esc • Modern code editor for modern developers
                </p>
              </div>
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
