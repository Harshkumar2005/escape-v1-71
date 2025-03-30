
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import GithubRepoLoader from './GithubRepoLoader';
import { Button } from '@/components/ui/button';
import { FolderPlus, Github } from 'lucide-react';

const ProjectStartup: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [showGithubLoader, setShowGithubLoader] = useState(false);
  
  // Check if the app is first loaded
  useEffect(() => {
    const hasProjectLoaded = sessionStorage.getItem('projectLoaded');
    
    if (!hasProjectLoaded) {
      // Show the startup modal on first load
      setShowModal(true);
      
      // Mark that we've shown the modal
      sessionStorage.setItem('projectLoaded', 'true');
    }
  }, []);
  
  const handleStartNewProject = () => {
    setShowModal(false);
    // Logic for starting a new empty project goes here
  };
  
  const handleLoadFromGithub = () => {
    setShowModal(false);
    setShowGithubLoader(true);
  };
  
  return (
    <>
      {/* Startup modal with options */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <div className="space-y-4 py-2">
            <h2 className="text-lg font-semibold text-center">Start a New Project</h2>
            <p className="text-sm text-muted-foreground text-center">
              Choose how you want to start your coding project
            </p>
            
            <div className="flex flex-col space-y-2">
              <Button 
                onClick={handleStartNewProject}
                className="justify-start text-left"
                variant="outline"
              >
                <FolderPlus className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span>New Empty Project</span>
                  <span className="text-xs text-muted-foreground">
                    Create a blank workspace to build from scratch
                  </span>
                </div>
              </Button>
              
              <Button 
                onClick={handleLoadFromGithub}
                className="justify-start text-left"
                variant="outline"
              >
                <Github className="mr-2 h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span>Load from GitHub</span>
                  <span className="text-xs text-muted-foreground">
                    Import an existing repository from GitHub
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* GitHub loader */}
      {showGithubLoader && (
        <Dialog open={showGithubLoader} onOpenChange={setShowGithubLoader}>
          <DialogContent className="sm:max-w-xl max-h-[80vh] overflow-y-auto">
            <GithubRepoLoader />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ProjectStartup;
