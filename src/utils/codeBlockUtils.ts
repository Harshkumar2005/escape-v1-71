
/**
 * Processes code blocks by removing the first 3 lines
 * Used for preparing code for display or updating in editor
 */
export const processCodeBlock = (content: string): string => {
  const lines = content.split('\n');
  return lines.length > 3 ? lines.slice(3).join('\n') : content;
};

/**
 * Dispatches a custom event when code is accepted
 * This will be caught by the editor component to update files
 */
export const dispatchCodeAccepted = (filePath: string, content: string): void => {
  const event = new CustomEvent('code-accepted', {
    detail: {
      filePath,
      content
    }
  });
  
  window.dispatchEvent(event);
};

/**
 * Extracts path from code block metadata
 * Format: language path="/path/to/file.ext"
 */
export const extractPathFromCodeBlockMeta = (meta: string): string | null => {
  if (!meta) return null;
  
  // Try to extract path="..." pattern
  const pathMatch = meta.match(/path=["']([^"']+)["']/);
  if (pathMatch && pathMatch[1]) {
    return pathMatch[1];
  }
  
  return null;
};
