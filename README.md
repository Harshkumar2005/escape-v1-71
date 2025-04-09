# AI Code Buddy

A modern chat interface for AI-assisted coding with file system integration.

## Features

- **Chat Interface**: Communicate with an AI coding assistant using a modern chat UI
- **File System Integration**: View, edit, and manage files directly in the interface
- **File Explorer**: Navigate your codebase with a tree-based file explorer
- **File Viewer**: View and edit files with syntax highlighting
- **Real-time File Watching**: Automatically detect and reflect file changes
- **Markdown Rendering**: AI responses are rendered with proper markdown formatting
- **Code Syntax Highlighting**: Code blocks in AI responses are syntax highlighted
- **File Type Detection**: Automatically detect file types for proper syntax highlighting
- **File Operations**: Create, read, update, and delete files

## Technologies Used

- React
- TypeScript
- Vite
- Tailwind CSS
- Google Gemini AI API
- React Markdown
- React Syntax Highlighter
- Chokidar (for file watching)

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Google Gemini API key

### Installation

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file in the root directory with your Gemini API key:
   ```
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```
4. Start the development server:
   ```
   npm run dev
   ```

## Usage

1. **File Explorer**: Navigate your codebase using the file explorer on the left
2. **File Viewer**: View and edit files in the top panel
3. **Chat Interface**: Ask questions about your code in the bottom panel
4. **AI Assistant**: The AI will have access to your file system and can help with coding tasks

## Project Structure

- `src/components/`: React components
  - `CodeBuddyChat.tsx`: Main chat interface
  - `FileContextProvider.tsx`: Context provider for file system operations
  - `FileExplorer.tsx`: File explorer component
  - `FileViewer.tsx`: File viewer component
- `src/api/`: API handlers
  - `fileSystem.ts`: File system operations and API handlers

## License

MIT
