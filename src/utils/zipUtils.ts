
import JSZip from 'jszip';
import { toast } from 'sonner';
import { FileSystemItem } from '@/contexts/FileSystemContext';

// Define the interface for our global window property
declare global {
  interface Window {
    fileSystemInstance: {
      getAllFiles: () => FileSystemItem[];
    } | undefined;
  }
}

export async function createAndDownloadZip(files: string[]): Promise<void> {
  try {
    const zip = new JSZip();
    
    // Add all files to the zip
    for (const filePath of files) {
      try {
        // Use the content from our virtual file system instead of trying to read actual files
        // Get the filePath segment after the project root name
        const pathSegments = filePath.split('/');
        const fileName = pathSegments[pathSegments.length - 1];
        
        // Get access to the file system instance
        const fs = window.fileSystemInstance;
        if (!fs) {
          toast.error("File system not initialized");
          console.error("File system not initialized for ZIP creation");
          return;
        }
        
        const allFiles = fs.getAllFiles();
        console.log("Available files for ZIP:", allFiles.map(f => f.path));
        
        const fileToAdd = allFiles.find(f => f.path === filePath);
        
        if (fileToAdd && fileToAdd.content) {
          console.log(`Adding file to ZIP: ${filePath}`);
          zip.file(filePath, fileToAdd.content);
        } else {
          console.warn(`File content not found for ${filePath}`);
        }
      } catch (error) {
        console.error(`Error adding file ${filePath} to zip:`, error);
        // Continue with other files even if one fails
      }
    }
    
    // Generate the zip file
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'codebase.zip';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Project files downloaded successfully');
  } catch (error) {
    console.error('Error creating zip file:', error);
    toast.error('Failed to create zip file');
    throw error;
  }
}

// Helper to make the FileSystem instance accessible globally for the ZIP generation
export function setupFileSystemForZip(fileSystemInstance: { getAllFiles: () => FileSystemItem[] }): void {
  // Store the file system instance in the window object for access during ZIP creation
  window.fileSystemInstance = fileSystemInstance;
}
