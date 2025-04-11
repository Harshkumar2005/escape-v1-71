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
import { Github, FileCode, Loader, Ghost, Globe, Terminal, ChevronRight } from 'lucide-react';
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
        <DialogContent className="max-w-6xl p-0 bg-sidebar border-border overflow-hidden rounded-lg">
          <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-900 to-black">
            <header className="border-b border-zinc-800 p-6">
              <div className="flex items-center justify-center">
                <Ghost className="h-8 w-8 mr-3 text-zinc-300" />
                <h1 className="text-3xl font-bold text-zinc-200">ESCAPE.esc</h1>
              </div>
            </header>
            
            <div className="flex-grow flex flex-col items-center justify-center p-6">
              <div className="max-w-4xl w-full">
                <div className="text-center mb-12">
                  <Ghost className="h-16 w-16 mx-auto mb-4 text-zinc-300" />
                  <h2 className="text-5xl font-extrabold text-white mb-6">ESCAPE.esc</h2>
                  <p className="text-xl text-zinc-400">How would you like to begin?</p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="col-span-1 md:col-span-2">
                    <Button
                      variant="outline"
                      className="w-full flex items-center justify-between p-6 bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-lg transition-all group"
                      onClick={handleLoadFromGithub}
                      disabled={isLoading}
                    >
                      <div className="flex items-center">
                        <div className="bg-zinc-800 rounded-full p-4 mr-4 group-hover:bg-zinc-700 transition-colors">
                          {isLoading ? (
                            <Loader className="h-8 w-8 text-blue-400 animate-spin" />
                          ) : (
                            <Github className="h-8 w-8 text-blue-400" />
                          )}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-xl mb-1">Continue with GitHub</div>
                          <div className="text-sm text-zinc-400">
                            Clone an existing repository to start working on it
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-6 w-6 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                    </Button>
                  </div>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-between p-6 bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-lg transition-all group"
                    onClick={handleStartNewProject}
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      <div className="bg-zinc-800 rounded-full p-4 mr-4 group-hover:bg-zinc-700 transition-colors">
                        {isLoading ? (
                          <Loader className="h-8 w-8 text-green-400 animate-spin" />
                        ) : (
                          <FileCode className="h-8 w-8 text-green-400" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xl mb-1">New Project</div>
                        <div className="text-sm text-zinc-400">
                          Begin with a clean workspace
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-between p-6 bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-lg transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      <div className="bg-zinc-800 rounded-full p-4 mr-4 group-hover:bg-zinc-700 transition-colors">
                        <Terminal className="h-8 w-8 text-purple-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xl mb-1">Command Line</div>
                        <div className="text-sm text-zinc-400">
                          Access the terminal environment
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="flex items-center justify-between p-6 bg-zinc-900/80 border border-zinc-700 hover:border-zinc-500 text-zinc-200 rounded-lg transition-all group"
                    disabled={isLoading}
                  >
                    <div className="flex items-center">
                      <div className="bg-zinc-800 rounded-full p-4 mr-4 group-hover:bg-zinc-700 transition-colors">
                        <Globe className="h-8 w-8 text-cyan-400" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-xl mb-1">Browse Examples</div>
                        <div className="text-sm text-zinc-400">
                          Explore sample projects and templates
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="h-6 w-6 text-zinc-500 group-hover:text-zinc-300 transition-colors" />
                  </Button>
                </div>
              </div>
            </div>
            
            <footer className="border-t border-zinc-800 p-4 text-center">
              <p className="text-sm text-zinc-500">ESCAPE.esc • Made for developers by developers</p>
            </footer>
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
