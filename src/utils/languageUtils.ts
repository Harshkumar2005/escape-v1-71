// Helper function to get language from file extension
export const getLanguageFromExtension = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    case 'js':
      return 'javascript';
    case 'jsx':
      return 'javascript';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'scss':
    case 'sass':
      return 'scss';
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
      return 'cpp';
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
    case 'vue':
      return 'vue';
    case 'graphql':
    case 'gql':
      return 'graphql';
    case 'swift':
      return 'swift';
    case 'kt':
    case 'kts':
      return 'kotlin';
    case 'dart':
      return 'dart';
    default:
      return 'plaintext';
  }
};

// Helper function to get icon color for file type
export const getFileTypeColor = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  
  switch (extension) {
    // JavaScript & TypeScript
    case 'js':
      return '#F7DF1E'; // JavaScript yellow
    case 'jsx':
      return '#61DAFB'; // React blue
    case 'ts':
      return '#3178C6'; // TypeScript blue
    case 'tsx':
      return '#007ACC'; // TypeScript React blue
      
    // Web Technologies
    case 'html':
    case 'htm':
      return '#E34F26'; // HTML orange
    case 'css':
      return '#1572B6'; // CSS blue
    case 'scss':
    case 'sass':
      return '#CD6799'; // Sass pink
      
    // Data formats
    case 'json':
      return '#000000'; // JSON black
    case 'xml':
      return '#F1662A'; // XML orange
    case 'yaml':
    case 'yml':
      return '#CB171E'; // YAML red
    case 'toml':
      return '#9C4221'; // TOML brown
    case 'md':
      return '#083FA1'; // Markdown blue
      
    // Programming languages
    case 'py':
      return '#3776AB'; // Python blue
    case 'rb':
      return '#CC342D'; // Ruby red
    case 'php':
      return '#777BB4'; // PHP purple
    case 'java':
      return '#007396'; // Java blue
    case 'c':
      return '#A8B9CC'; // C light blue
    case 'cpp':
    case 'h':
      return '#00599C'; // C++ blue
    case 'go':
      return '#00ADD8'; // Go blue
    case 'rs':
      return '#DEA584'; // Rust orange
    case 'swift':
      return '#F05138'; // Swift orange
    case 'kt':
    case 'kts':
      return '#7F52FF'; // Kotlin purple
    case 'dart':
      return '#0175C2'; // Dart blue
      
    // Shell & Scripts
    case 'sh':
    case 'bash':
      return '#4EAA25'; // Bash green
    case 'ps1':
      return '#012456'; // PowerShell blue
    case 'bat':
    case 'cmd':
      return '#C1C1C1'; // Batch grey
      
    // Database
    case 'sql':
      return '#E38C00'; // SQL orange
    case 'graphql':
    case 'gql':
      return '#E10098'; // GraphQL pink
      
    // Config files
    case 'gitignore':
      return '#F05032'; // Git red
    case 'env':
    case 'env.local':
    case 'env.development':
    case 'env.production':
      return '#ECD53F'; // Env yellow
      
    // Images & Media
    case 'svg':
      return '#FFB13B'; // SVG orange
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'webp':
      return '#FF9900'; // Image files orange
      
    // Documents
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
      
    // Other common extensions
    case 'vue':
      return '#41B883'; // Vue green
    case 'svelte':
      return '#FF3E00'; // Svelte orange
    case 'lock':
      return '#F29D0C'; // Lock files
    case 'log':
      return '#828282'; // Log files grey
      
    default:
      return '#8E9196'; // Default grey
  }
};

// Get file icon name based on file extension
export const getFileIconName = (filename: string): string => {
  const extension = filename.split('.').pop()?.toLowerCase() || '';
  const name = filename.toLowerCase();
  
  // Check for special filenames first
  if (name === 'package.json' || name === 'package-lock.json' || name === 'yarn.lock') {
    return 'package';
  }
  
  if (name === '.gitignore' || name === '.gitconfig') {
    return 'git';
  }
  
  if (name.startsWith('dockerfile') || name === 'docker-compose.yml' || name === 'docker-compose.yaml') {
    return 'docker';
  }
  
  if (name === 'readme.md') {
    return 'book';
  }
  
  if (name.includes('tsconfig') || name.includes('tslint')) {
    return 'typescript';
  }
  
  if (name.includes('.env')) {
    return 'settings';
  }
  
  // Then check by extension
  switch (extension) {
    // JavaScript & TypeScript
    case 'js':
    case 'jsx':
      return 'file-text';
    case 'ts': 
    case 'tsx':
      return 'file-code';
      
    // Web Technologies
    case 'html':
    case 'htm':
      return 'file-text';
    case 'css':
    case 'scss':
    case 'sass':
      return 'file-text';
      
    // Data formats  
    case 'json':
      return 'braces';
    case 'xml':
    case 'svg':
      return 'code';
    case 'yaml':
    case 'yml':
      return 'file-text';
    case 'md':
      return 'file-text';
      
    // Images
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif':
    case 'webp':
      return 'image';
      
    // Documents
    case 'pdf':
      return 'file-text';
    case 'docx':
    case 'doc':
      return 'file-text';
    case 'xlsx':
    case 'xls': 
      return 'table';
      
    // Programming languages
    case 'py':
    case 'rb':
    case 'php':
    case 'java':
    case 'c':
    case 'cpp':
    case 'h':
    case 'go':
    case 'rs':
    case 'swift':
    case 'kt':
      return 'file-code';
      
    // Shell scripts
    case 'sh':
    case 'bash':
    case 'ps1':
    case 'bat':
    case 'cmd':
      return 'terminal';
      
    // Config files
    case 'gitignore':
      return 'git';
    case 'env':
      return 'settings';
      
    default:
      return 'file';
  }
};
