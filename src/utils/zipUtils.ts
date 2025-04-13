//src/utils/zipUtils.ts
import JSZip from 'jszip';
import { toast } from 'sonner';
import { FileSystemItem } from '@/contexts/FileSystemContext';

export async function createAndDownloadZip(filePaths: string[]): Promise<void> {
  try {
    const zip = new JSZip();
    
    // Get all files from the file system context
    // We'll need to access this through the current module scope
    // The file system data should be coming through the filePaths parameter
    
    // First check if we have any files to zip
    if (!filePaths || filePaths.length === 0) {
      toast.error('No files found to download');
      return;
    }
    
    // Get access to all files in the file system
    // We need to access the FileSystemContext directly here
    // This is handled by getting the file System data from React Context
    // which will be passed as file paths from the TopBar component
    
    // Import and get the fileSystem from the context
    const { useFileSystem } = await import('@/contexts/FileSystemContext');
    const fileSystem = useFileSystem();
    const allFiles = fileSystem.getAllFiles();
    
    console.log("Available files for ZIP:", allFiles.map(f => f.path));
    
    // Add each file to the zip
    let filesAdded = 0;
    
    for (const filePath of filePaths) {
      // Skip folders, we only want to add files
      const fileItem = allFiles.find(file => file.path === filePath && file.type === 'file');
      
      if (fileItem && fileItem.content !== undefined) {
        // For the zip structure, we want to maintain the relative path
        // but remove the project root folder name
        const pathInZip = fileItem.path.split('/').slice(2).join('/');
        
        // Only add if there's actual content
        if (pathInZip) {
          zip.file(pathInZip, fileItem.content || '');
          filesAdded++;
        }
      }
    }
    
    if (filesAdded === 0) {
      toast.warning('No valid files found to add to ZIP');
      return;
    }
    
    // Generate the zip file as a blob
    const zipBlob = await zip.generateAsync({ type: 'blob' });
    
    // Create a download link and trigger the download
    const url = URL.createObjectURL(zipBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'project-files.zip';
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Project downloaded with ${filesAdded} files`);
  } catch (error) {
    console.error('Error creating zip file:', error);
    toast.error('Failed to create zip file');
    throw error;
  }
}
