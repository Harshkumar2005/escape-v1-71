
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { 
  Send, 
  Plus, 
  X, 
  RefreshCw, 
  MoreHorizontal, 
  Globe, 
  FileType,
  ChevronDown,
} from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const systemPrompt = `You are CodeBuddy, an expert programming assistant. Your role is to:
1. Help users with coding tasks, debugging, and best practices
2. Provide clear, concise explanations with code examples
3. Follow modern development standards and patterns
4. Consider security, performance, and maintainability
5. Use markdown formatting for better readability
6. Include relevant documentation links when helpful
7. Break down complex problems into manageable steps
8. Suggest improvements and optimizations
9. Help with both frontend and backend development
10. Maintain a friendly and professional tone`;

const fileTypes = [
  { id: 'migrate', label: 'migrate.ts', icon: 'typescript' },
  { id: 'merger', label: 'message-merger.rs', icon: 'rust' }
];

export function CodeBuddyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('gemini-1.5-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Use the FileSystem context to access all files and the selected file
  const { 
    files,
    selectedFile,
    getFileById,
    getAllFiles
  } = useFileSystem();
  
  // Use the Editor context to get the active tab's content
  const { openedTabs, activeTabId, getTabContent } = useEditor();

  const genAI = new GoogleGenerativeAI("AIzaSyBUSTc2Ux0c8iNu66zSc-v43Ie36te6q3Y");
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      topK: 64,
      maxOutputTokens: 8192,
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to gather workspace file information
  const getWorkspaceFileInfo = () => {
    // Get all files from the file system context
    const allFiles = getAllFiles();
    
    return allFiles.map(file => ({
      path: file.path,
      content: file.content || '',
      isOpen: file.id === selectedFile,
      fileType: file.language || 'plaintext'
    }));
  };

  // Get information about the currently active file
  const getCurrentFileInfo = () => {
    if (!activeTabId) return null;
    
    const activeFile = getFileById(activeTabId);
    if (!activeFile) return null;
    
    return {
      path: activeFile.path,
      fileType: activeFile.language || 'plaintext',
      content: getTabContent(activeTabId) || activeFile.content || ''
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Gather workspace information
      const workspaceFiles = getWorkspaceFileInfo();
      const currentFile = getCurrentFileInfo();
      
      // Prepare file context for the AI
      const fileContextMessage = `Current workspace files:\n${JSON.stringify(workspaceFiles, null, 2)}\n\n${
        currentFile 
          ? `Currently open file: ${currentFile.path}\nFile type: ${currentFile.fileType}\nContent:\n\`\`\`${currentFile.fileType}\n${currentFile.content}\n\`\`\`` 
          : 'No file currently open.'
      }`;
      
      // Log the context being sent (for debugging)
      console.log("Sending context to AI:", fileContextMessage);

      const chat = model.startChat({
        history: [
          {
            role: 'user',
            parts: [{ text: systemPrompt }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand my role as CodeBuddy. How can I assist you with your programming needs today?' }],
          },
          {
            role: 'user',
            parts: [{ text: fileContextMessage }],
          },
          {
            role: 'model',
            parts: [{ text: 'I understand the file context. How can I help you with your code?' }],
          },
          ...messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }],
          })),
        ],
      });

      const result = await chat.sendMessage(userMessage);
      const response = await result.response;
      const text = response.text();

      setMessages(prev => [...prev, { role: 'model', content: text }]);
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        content: 'Sorry, I encountered an error. Please try again.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to render the file type icon
  const renderFileIcon = (type: string) => {
    switch (type) {
      case 'typescript':
        return <span className="text-blue-400 text-xs mr-1">TS</span>;
      case 'rust':
        return <span className="text-orange-400 text-xs mr-1">🦀</span>;
      case 'image':
        return null;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-100 overflow-hidden">
      {/* Chat message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'ml-auto bg-[#cccccc29] p-4 rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                : 'w-full rounded-lg'
            } p-2 max-w-3xl`}
          >
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !node?.position?.start.column ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match ? match[1] : 'text'}
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  ) : (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        {isLoading && (
          <div className="w-full rounded-lg p-4 max-w-3xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area with file tags */}
      <div className="bg-sidebar p-2 border-t">
        {/* File type tags */}
        <div className="flex items-center gap-2 mb-2 overflow-x-auto pb-2 scrollbar-none">
          
          {fileTypes.map(type => (
            <button 
              key={type.id} 
              className="text-gray-300 rounded-md px-2 py-1 text-sm flex items-center hover:bg-[#333333]"
            >
              {renderFileIcon(type.icon)}
              {type.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-sidebar rounded-lg overflow-hidden">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Plan, search, build anything..."
              className="w-full text-gray-100 px-3 py-3 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          
          {/* Agent selector and send button */}
          <div className="flex items-center justify-between mt-2 border-t border-gray-800 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-sm">Agent</span>
              <button className="flex items-center gap-1 bg-[#cccccc29] rounded-md px-2 py-1 text-sm">
                <span>{selectedAgent}</span>
                <ChevronDown size={14} />
              </button>
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-[#cccccc29] text-white px-4 py-1.5 rounded-md flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-[#333333]"
            >
              <span>Send</span>
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
