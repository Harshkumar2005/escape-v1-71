
// Helper function to get language from file extension
export const getLanguageFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
    case 'ts':
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
    case 'scss':
    case 'sass':
      return 'css';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    case 'py':
      return 'python';
    case 'rb':
      return 'ruby';
    case 'php':
      return 'php';
    case 'c':
    case 'cpp':
    case 'h':
      return 'c';
    case 'java':
      return 'java';
    case 'go':
      return 'go';
    case 'rs':
      return 'rust';
    case 'sh':
    case 'bash':
      return 'shell';
    case 'sql':
      return 'sql';
    case 'xml':
    case 'svg':
      return 'xml';
    case 'yaml':
    case 'yml':
      return 'yaml';
    default:
      return 'plaintext';
  }
};

// Helper function to get icon color for file type
export const getFileTypeColor = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'js':
    case 'jsx':
      return '#F7DF1E'; // JavaScript yellow
    case 'ts':
    case 'tsx':
      return '#3178C6'; // TypeScript blue
    case 'html':
    case 'htm':
      return '#E34F26'; // HTML orange
    case 'css':
    case 'scss':
    case 'sass':
      return '#1572B6'; // CSS blue
    case 'json':
      return '#000000'; // JSON black
    case 'md':
      return '#083FA1'; // Markdown blue
    case 'py':
      return '#3776AB'; // Python blue
    case 'rb':
      return '#CC342D'; // Ruby red
    case 'php':
      return '#777BB4'; // PHP purple
    case 'java':
      return '#007396'; // Java blue
    case 'c':
    case 'cpp':
    case 'h':
      return '#00599C'; // C/C++ blue
    case 'go':
      return '#00ADD8'; // Go blue
    case 'rs':
      return '#DEA584'; // Rust orange
    case 'svg':
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
      return '#FFB13B'; // Image files orange
    case 'pdf':
      return '#FF0000'; // PDF red
    case 'docx':
    case 'doc':
      return '#2B579A'; // Word blue
    case 'xlsx':
    case 'xls':
      return '#217346'; // Excel green
    case 'pptx':
    case 'ppt':
      return '#D24726'; // PowerPoint red
    default:
      return '#8E9196'; // Default grey
  }
};
