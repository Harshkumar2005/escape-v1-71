
import { useState } from 'react';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Save, Edit, X } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

export function FileViewer() {
  const { selectedFile, getFileById, updateFileContent } = useFileSystem();
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState('');
  
  const currentFileInfo = selectedFile
    ? getFileById(selectedFile)
    : null;
  
  const handleEdit = () => {
    if (currentFileInfo) {
      setEditedContent(currentFileInfo.content || '');
      setIsEditing(true);
    }
  };
  
  const handleSave = async () => {
    if (currentFileInfo && currentFileInfo.id) {
      try {
        updateFileContent(currentFileInfo.id, editedContent);
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
                <Save size={16} />
              </button>
              <button 
                className="p-1 rounded hover:bg-gray-700"
                onClick={handleCancel}
                title="Cancel"
              >
                <X size={16} />
              </button>
            </>
          ) : (
            <button 
              className="p-1 rounded hover:bg-gray-700"
              onClick={handleEdit}
              title="Edit"
            >
              <Edit size={16} />
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-auto p-4">
        {isEditing ? (
          <Textarea
            value={editedContent}
            onChange={(e) => setEditedContent(e.target.value)}
            className="w-full h-full bg-gray-900 text-gray-100 font-mono p-4 rounded resize-none"
            spellCheck="false"
          />
        ) : (
          <SyntaxHighlighter
            language={currentFileInfo.language || 'plaintext'}
            style={vscDarkPlus}
            customStyle={{ margin: 0, height: '100%' }}
            showLineNumbers={true}
            wrapLines={true}
            wrapLongLines={true}
          >
            {currentFileInfo.content || ''}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
}
