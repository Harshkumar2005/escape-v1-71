//src/utils/zipUtils.ts
import JSZip from 'jszip';
import { toast } from 'sonner';
import { FileSystemItem } from '@/contexts/FileSystemContext';

export async function createAndDownloadZip(files: FileSystemItem[]): Promise<void> {
  try {
    const zip = new JSZip();
    
    // Check if we have any files
    if (!files || files.length === 0) {
      toast.error('No files found to download');
      return;
    }
    
    // Filter to only include actual files (not folders)
    const filesToZip = files.filter(file => file.type === 'file' && file.content !== undefined);
    
    if (filesToZip.length === 0) {
      toast.warning('No valid files found to add to ZIP');
      return;
    }
    
    // Add each file to the zip
    let filesAdded = 0;
    
    for (const fileItem of filesToZip) {
      if (fileItem.content !== undefined) {
        // For the zip structure, remove the project root folder name
        // Split path and remove the first segment (which is the root folder name)
        const pathParts = fileItem.path.split('/').filter(part => part.length > 0);
        const pathInZip = pathParts.slice(1).join('/');
        
        if (pathInZip) {
          zip.file(pathInZip, fileItem.content || '');
          filesAdded++;
          console.log(`Added to zip: ${pathInZip}`);
        }
      }
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
