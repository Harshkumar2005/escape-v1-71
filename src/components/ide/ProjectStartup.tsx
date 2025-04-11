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
import { Github, FileCode, Loader, Ghost, ArrowRight } from 'lucide-react';
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
        <DialogContent className="max-w-6xl p-0 border-none overflow-hidden rounded-none">
          <div className="h-screen flex flex-col bg-black">
            <div className="flex-grow flex flex-col justify-center items-center px-8">
              <div className="mb-8 flex items-center justify-center relative">
                <div className="absolute inset-0 blur-lg bg-cyan-500/20 rounded-full"></div>
                <Ghost className="h-20 w-20 mr-5 text-cyan-400 relative z-10" />
                <h1 className="text-8xl font-black text-white relative z-10 tracking-tighter">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-pink-500">ESCAPE</span>
                  <span className="text-pink-500">.esc</span>
                </h1>
              </div>
              
              <p className="text-lg text-cyan-200 mb-16 tracking-wide">CODING ON THE EDGE</p>
              
              <div className="w-full max-w-3xl space-y-6">
                <Button
                  variant="outline"
                  className="flex items-center justify-between w-full p-6 bg-black border border-cyan-500/50 text-white rounded-md hover:bg-cyan-950/30 transition-all group"
                  onClick={handleLoadFromGithub}
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <div className="rounded-full p-3 bg-cyan-900/40 mr-6 group-hover:bg-cyan-800/50 transition-colors">
                      {isLoading ? (
                        <Loader className="h-8 w-8 text-cyan-400 animate-spin" />
                      ) : (
                        <Github className="h-8 w-8 text-cyan-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xl mb-1">GitHub Repository</div>
                      <div className="text-sm text-cyan-300/70">
                        Connect to existing code
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-cyan-400 group-hover:translate-x-1 transition-transform" />
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center justify-between w-full p-6 bg-black border border-pink-500/50 text-white rounded-md hover:bg-pink-950/30 transition-all group"
                  onClick={handleStartNewProject}
                  disabled={isLoading}
                >
                  <div className="flex items-center">
                    <div className="rounded-full p-3 bg-pink-900/40 mr-6 group-hover:bg-pink-800/50 transition-colors">
                      {isLoading ? (
                        <Loader className="h-8 w-8 text-pink-400 animate-spin" />
                      ) : (
                        <FileCode className="h-8 w-8 text-pink-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-xl mb-1">New Project</div>
                      <div className="text-sm text-pink-300/70">
                        Start from scratch
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="h-6 w-6 text-pink-400 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>
            
            <div className="py-4 border-t border-cyan-900/30 text-center">
              <p className="text-sm text-cyan-500/50">ESCAPE.esc v2.0.4 • Next-gen coding environment</p>
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
