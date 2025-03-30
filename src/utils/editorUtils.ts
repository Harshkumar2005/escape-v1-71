
import { editor } from 'monaco-editor';

// Helper function to convert monaco Position or Selection to IRange
export const positionToRange = (
  position: editor.IPosition | editor.ISelection
): editor.IRange => {
  if ('startLineNumber' in position) {
    // It's already a selection/range
    return position;
  }
  
  // It's a position, convert to range
  return {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  };
};

// Create a file context menu utility
export const createFileContextMenuItems = (
  onRename: () => void,
  onDelete: () => void,
  onDuplicate: () => void,
  onCopy: () => void,
  onPaste: () => void
) => {
  return [
    { label: 'Rename', action: onRename },
    { label: 'Delete', action: onDelete },
    { label: 'Duplicate', action: onDuplicate },
    { label: 'Copy', action: onCopy },
    { label: 'Paste', action: onPaste }
  ];
};
