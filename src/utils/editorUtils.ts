
import { editor } from 'monaco-editor';

// Type definitions for monaco editor
type Position = editor.Position;
type Selection = editor.Selection;
type IRange = editor.IRange;

// Convert a Position object to an IRange object
export const positionToRange = (position: Position): IRange => {
  return {
    startLineNumber: position.lineNumber,
    startColumn: position.column,
    endLineNumber: position.lineNumber,
    endColumn: position.column
  };
};

// Create a selection range
export const createSelectionRange = (
  startLine: number,
  startColumn: number,
  endLine: number,
  endColumn: number
): Selection => {
  return new Selection(startLine, startColumn, endLine, endColumn);
};
