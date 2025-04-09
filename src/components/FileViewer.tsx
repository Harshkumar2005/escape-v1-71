import { useState } from 'react';
import { useFileContext } from '@/contexts/FileContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { SaveIcon, EditIcon, XIcon } from 'lucide-react';

export function FileViewer() {
  const { files, currentFile, writeFile } = useFileContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  const currentFileInfo = currentFile 
    ? files.find(f => f.path === currentFile) 
    : null;
  
  const handleEdit = () => {
    if (currentFileInfo) {
      setEditedContent(currentFileInfo.content);
      setIsEditing(true);
    }
  };
  
  const handleSave = async () => {
    if (currentFileInfo) {
      try {
        await writeFile(currentFileInfo.path, editedContent);
        setIsEditing(false);
      } catch (error) {
        console.error('Error saving file:', error);
      }
    }
  };
  
  const handleCancel = () => {
    setIsEditing(false);
  };
  
  if (!currentFileInfo) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        <p>No file selected</p>
      </div>
    );
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-800">
      <div className="p-2 border-b border-gray-700 flex justify-between items-center">
        <h2 className="text-lg font-semibold truncate">{currentFileInfo.path}</h2>
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button 
                className="p-1 rounded hover:bg-gray-700"
                onClick={handleSave}
                title="Save"
              >
                <SaveIcon size={16} />
              </button>
              <button 
                className="p-1 rounded hover:bg-gray-700"
                onClick={handleCancel}
                title="Cancel"
              >
                <XIcon size={16} />
              </button>
            </>
          ) : (
            <button 
              className="p-1 rounded hover:bg-gray-700"
              onClick={handleEdit}
              title="Edit"
            >
              <EditIcon size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {isEditing ? (
          <textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full bg-gray-900 text-gray-100 font-mono p-4 rounded"
            spellCheck="false"
          />
        ) : (
          <SyntaxHighlighter
            language={currentFileInfo.fileType}
            style={vscDarkPlus}
            customStyle={{ margin: 0, height: '100%' }}
          >
            {currentFileInfo.content}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
} 