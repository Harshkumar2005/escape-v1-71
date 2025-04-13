
import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { downloadFilesAsZip } from '@/utils/zipUtils';
import { toast } from 'sonner';

const ZipDownloader: React.FC = () => {
  const { files } = useFileSystem();
  const [isDownloading, setIsDownloading] = useState(false);
  
  const handleDownload = async () => {
    try {
      // Show loading state
      setIsDownloading(true);
      toast.loading('Generating ZIP file...');
      
      // Start the download process
      await downloadFilesAsZip(files, 'code-buddy-project.zip');
      
      // Show success toast
      toast.dismiss();
      toast.success('ZIP file downloaded successfully');
    } catch (error) {
      console.error('Error downloading ZIP file:', error);
      
      // Show error toast
      toast.dismiss();
      toast.error('Failed to generate ZIP file');
    } finally {
      setIsDownloading(false);
    }
  };
  
  return (
    <button
      onClick={handleDownload}
      disabled={isDownloading}
      className="flex items-center gap-1 text-sm text-slate-400 hover:text-white hover:bg-[#cccccc29] rounded px-1.5 py-0.5 transition-colors"
      title="Download project as ZIP"
    >
      {isDownloading ? (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Creating ZIP</span>
        </>
      ) : (
        <>
          <Download size={14} />
          <span>Download ZIP</span>
        </>
      )}
    </button>
  );
};

export default ZipDownloader;
