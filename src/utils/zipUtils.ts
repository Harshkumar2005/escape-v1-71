
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { FileSystemItem } from '@/contexts/FileSystemContext';

/**
 * Creates and downloads a ZIP file containing all provided files
 * @param files Array of file system items to include in the ZIP
 * @param zipFileName Name for the downloaded ZIP file
 */
export const downloadFilesAsZip = async (
  files: FileSystemItem[],
  zipFileName: string = 'project-files.zip'
): Promise<void> => {
  try {
    const zip = new JSZip();
    
    // Function to recursively add files and folders to the ZIP
    const addToZip = (items: FileSystemItem[], currentPath: string = '') => {
      for (const item of items) {
        const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
        
        if (item.type === 'file') {
          // Add file content to the ZIP
          zip.file(itemPath, item.content || '');
          console.log(`Added file to ZIP: ${itemPath}`);
        } else if (item.type === 'folder' && item.children) {
          // Create folder and add its contents recursively
          const folderPath = itemPath;
          addToZip(item.children, folderPath);
          console.log(`Added folder to ZIP: ${folderPath}`);
        }
      }
    };
    
    // Start adding files to the ZIP
    console.log('Starting ZIP creation process');
    addToZip(files);
    
    // Generate the ZIP file
    const zipBlob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });
    
    console.log(`ZIP file created successfully: ${zipFileName}, size: ${zipBlob.size} bytes`);
    
    // Download the ZIP file
    saveAs(zipBlob, zipFileName);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error creating ZIP file:', error);
    return Promise.reject(error);
  }
};
