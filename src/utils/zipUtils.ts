import JSZip from 'jszip';
import { toast } from 'sonner';
import { readFile } from '@/api/fileSystem';

export async function createAndDownloadZip(files: string[]): Promise<void> {
  try {
    const zip = new JSZip();
    
    // Add all files to the zip
    await Promise.all(
      files.map(async (filePath) => {
        try {
          const content = await readFile(filePath);
          zip.file(filePath, content);
        } catch (error) {
          console.error(`Error adding file ${filePath} to zip:`, error);
          // Continue with other files even if one fails
        }
      })
    );
    
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
