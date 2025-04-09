
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';

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
    getFileById
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
    // Collect file information from the file system context
    const fileInfoList = [];
    
    const processFiles = (items: any[]) => {
      for (const item of items) {
        if (item.type === 'file') {
          fileInfoList.push({
            path: item.path,
            content: item.content || '',
            isOpen: item.id === selectedFile,
            fileType: item.language || 'plaintext'
          });
        }
        
        if (item.children && item.children.length > 0) {
          processFiles(item.children);
        }
      }
    };
    
    processFiles(files);
    return fileInfoList;
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
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'ml-auto bg-blue-600 rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                : 'bg-gray-800 w-full'
            } p-4 max-w-3xl`}
          >
            <ReactMarkdown
              components={{
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  return !match ? (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  ) : (
                    <SyntaxHighlighter
                      style={vscDarkPlus}
                      language={match[1]}
                      PreTag="div"
                      {...props}
                    >
                      {String(children).replace(/\n$/, '')}
                    </SyntaxHighlighter>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
        <div className="flex space-x-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything about coding..."
            className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Thinking...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
