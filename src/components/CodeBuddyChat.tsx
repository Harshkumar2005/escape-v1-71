
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Send, Plus, X } from 'lucide-react';

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

export function CodeBuddyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  return (
    <div className="flex flex-col h-screen bg-[#141414] text-gray-100 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-3 border-b border-gray-800">
        <h2 className="text-xl font-semibold">Chat</h2>
        <div className="flex items-center gap-2">
          <button className="p-1.5 hover:bg-gray-700 rounded-full">
            <Plus size={18} />
          </button>
          <button className="p-1.5 hover:bg-gray-700 rounded-full">
            <X size={18} />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'ml-auto bg-[#2a2a2a] rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                : 'bg-[#1e1e1e] w-full rounded-lg'
            } p-4 max-w-3xl`}
          >
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !inline && match ? (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
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
          <div className="bg-[#1e1e1e] w-full rounded-lg p-4 max-w-3xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-800">
        <div className="flex items-center bg-[#2a2a2a] rounded-lg">
          <div className="flex items-center gap-1 p-2 pl-3">
            <button type="button" className="p-1 text-gray-400 hover:text-gray-200">
              @
            </button>
            <span className="text-gray-600 mx-1">|</span>
            <button type="button" className="p-1 text-gray-400 hover:text-gray-200">
              •••
            </button>
            <span className="text-gray-600 mx-1">Image</span>
          </div>
          
          <div className="flex-1">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Plan, search, build anything..."
              className="w-full bg-transparent text-gray-100 px-2 py-3 focus:outline-none"
              disabled={isLoading}
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="bg-[#3a3a3a] text-white px-4 py-2 m-1 rounded-md hover:bg-[#4a4a4a] flex items-center gap-2 disabled:opacity-50 disabled:hover:bg-[#3a3a3a]"
          >
            <span>Send</span>
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
