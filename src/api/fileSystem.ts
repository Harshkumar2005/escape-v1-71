// Mock implementation for file system operations
import EventEmitter from 'events';
import mime from 'mime-types';

// Cache for file contents
const fileCache = new Map<string, { content: string; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Mock file system data
const mockFileSystem = {
  files: new Map<string, string>(),
  directories: new Set<string>(),
};

// Event emitter for file changes
export const fileWatcher = new EventEmitter();
let watcher: any = null;

// Initialize file watcher
export function initFileWatcher(dir: string = '.') {
  console.log('Mock file watcher initialized');
  return () => {};
}

// Get file type based on extension
export function getFileType(filePath: string): string {
  // Extract extension from path
  const ext = filePath.split('.').pop()?.toLowerCase() || '';
  
  // Map common extensions to language types for syntax highlighting
  const languageMap: Record<string, string> = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'html': 'html',
    'css': 'css',
    'scss': 'scss',
    'json': 'json',
    'md': 'markdown',
    'py': 'python',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'go': 'go',
    'rs': 'rust',
    'php': 'php',
    'rb': 'ruby',
    'swift': 'swift',
    'kt': 'kotlin',
    'sh': 'bash',
    'sql': 'sql',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
  };
  
  return languageMap[ext] || 'plaintext';
}

// API functions that will be called from the frontend
export async function listFiles(dir: string = '.'): Promise<string[]> {
  // Return mock file list
  return Array.from(mockFileSystem.files.keys());
}

export async function readFile(filePath: string): Promise<string> {
  try {
    // Check cache first
    const cached = fileCache.get(filePath);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.content;
    }
    
    // Get content from mock file system
    const content = mockFileSystem.files.get(filePath) || '';
    
    // Update cache
    fileCache.set(filePath, { content, timestamp: now });
    
    return content;
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    throw error;
  }
}

export async function writeFile(filePath: string, content: string): Promise<void> {
  try {
    // Update mock file system
    mockFileSystem.files.set(filePath, content);
    
    // Update cache
    fileCache.set(filePath, { content, timestamp: Date.now() });
    
    // Emit file changed event
    fileWatcher.emit('fileChanged', filePath);
  } catch (error) {
    console.error(`Error writing file ${filePath}:`, error);
    throw error;
  }
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    // Remove from mock file system
    mockFileSystem.files.delete(filePath);
    
    // Remove from cache
    fileCache.delete(filePath);
    
    // Emit file removed event
    fileWatcher.emit('fileRemoved', filePath);
  } catch (error) {
    console.error(`Error deleting file ${filePath}:`, error);
    throw error;
  }
}

export async function createDirectory(dirPath: string): Promise<void> {
  try {
    // Add to mock directories
    mockFileSystem.directories.add(dirPath);
    
    // Emit directory created event
    fileWatcher.emit('directoryCreated', dirPath);
  } catch (error) {
    console.error(`Error creating directory ${dirPath}:`, error);
    throw error;
  }
}

// API route handlers - these will be used by the server
export async function handleListFiles(req: Request): Promise<Response> {
  return new Response(JSON.stringify(Array.from(mockFileSystem.files.keys())), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleReadFile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const filePath = url.searchParams.get('path') || '';
  const content = mockFileSystem.files.get(filePath) || '';
  const fileType = getFileType(filePath);
  
  return new Response(JSON.stringify({ content, fileType }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleWriteFile(req: Request): Promise<Response> {
  const { path, content } = await req.json();
  mockFileSystem.files.set(path, content);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleDeleteFile(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const filePath = url.searchParams.get('path') || '';
  mockFileSystem.files.delete(filePath);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function handleCreateDirectory(req: Request): Promise<Response> {
  const { path } = await req.json();
  mockFileSystem.directories.add(path);
  
  return new Response(JSON.stringify({ success: true }), {
    headers: { 'Content-Type': 'application/json' }
  });
} 