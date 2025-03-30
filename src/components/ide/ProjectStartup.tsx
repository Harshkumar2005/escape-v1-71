
import React, { useState, useEffect } from 'react';
import GithubRepoLoader from './GithubRepoLoader';

const ProjectStartup: React.FC = () => {
  const [showGithubLoader, setShowGithubLoader] = useState(false);
  
  // Check if the app is first loaded
  useEffect(() => {
    const hasProjectLoaded = sessionStorage.getItem('projectLoaded');
    
    if (!hasProjectLoaded) {
      // Show the GitHub loader on first load
      setShowGithubLoader(true);
      
      // Mark that we've shown the loader
      sessionStorage.setItem('projectLoaded', 'true');
    }
  }, []);
  
  const handleClose = () => {
    setShowGithubLoader(false);
  };
  
  return (
    <>
      <GithubRepoLoader isOpen={showGithubLoader} onClose={handleClose} />
    </>
  );
};

export default ProjectStartup;
