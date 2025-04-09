import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { 
  Send, 
  Copy, 
  Check,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface Message {
  role: 'user' | 'model';
  content: string;
}

interface AIAgent {
  id: string;
  name: string;
  model: string;
  description: string;
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

// Available AI agents
const availableAgents: AIAgent[] = [
  { 
    id: 'gemini-1.5-flash',
    name: 'Gemini Flash',
    model: 'gemini-1.5-flash',
    description: 'Fast responses, good for quick questions and code generation'
  },
  { 
    id: 'gemini-1.5-pro',
    name: 'Gemini Pro', 
    model: 'gemini-1.5-pro',
    description: 'More powerful reasoning and code optimization capabilities'
  },
  { 
    id: 'gemini-1.0-pro',
    name: 'Gemini 1.0', 
    model: 'gemini-1.0-pro',
    description: 'Stable performance for general coding tasks'
  },
  { 
    id: 'claude-3',
    name: 'Claude 3', 
    model: 'claude-3-sonnet',
    description: 'Exceptional context understanding and code explanation'
  }
];

export function CodeBuddyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(availableAgents[0]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [copiedCodeBlockIndex, setCopiedCodeBlockIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

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

    // Get current file info
    const currentFile = getCurrentFileInfo();
    
    // Prepend current file context to user message
    let userMessage = input.trim();
    if (currentFile) {
      userMessage = `Currently opened file: ${currentFile.path}\n\n${userMessage}`;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Gather workspace information
      const workspaceFiles = getWorkspaceFileInfo();
      
      // Prepare file context for the AI
      const fileContextMessage = `Current workspace files:\n${JSON.stringify(workspaceFiles, null, 2)}\n\n${
        currentFile 
          ? `Currently open file: ${currentFile.path}\nFile type: ${currentFile.fileType}\nContent:\n\`\`\`${currentFile.fileType}\n${currentFile.content}\n\`\`\`` 
          : 'No file currently open.'
      }`;
      
      // Log the context being sent (for debugging)
      console.log("Sending context to AI:", fileContextMessage);

      const model = genAI.getGenerativeModel({
        model: selectedAgent.model,
        generationConfig: {
          temperature: 0.7,
          topP: 0.95,
          topK: 64,
          maxOutputTokens: 8192,
        },
      });

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow shift+enter for line breaks
      return;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIndex(index);
    toast.success('Code copied to clipboard');
    
    // Reset the copied state after 2 seconds
    setTimeout(() => {
      setCopiedCodeBlockIndex(null);
    }, 2000);
  };

  // Get current file name for the input context
  const getCurrentFileName = () => {
    const currentFile = getCurrentFileInfo();
    return currentFile ? currentFile.path.split('/').pop() : null;
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-100 overflow-hidden">
      {/* Chat message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'ml-auto bg-[#cccccc29] p-4 rounded-tl-lg rounded-tr-lg rounded-bl-lg max-w-[85%]'
                : 'w-full max-w-full rounded-lg'
            } p-2`}
          >
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const code = String(children).replace(/\n$/, '');
                  
                  if (!inline && !node?.position?.start.column) {
                    // For code blocks (not inline code)
                    const codeBlockIndex = messages
                      .filter(msg => msg.role === 'model')
                      .findIndex(msg => msg === message);
                    
                    return (
                      <div className="relative">
                        <div className="flex justify-between items-center bg-[#1E1E1E] px-4 py-2 rounded-t-md">
                          <span className="text-xs text-gray-400">
                            {match ? match[1].toUpperCase() : 'CODE'}
                          </span>
                          <button
                            onClick={() => handleCopyCode(code, codeBlockIndex)}
                            className="flex items-center text-xs text-gray-400 hover:text-white"
                          >
                            {copiedCodeBlockIndex === codeBlockIndex ? (
                              <>
                                <Check size={14} className="mr-1" />
                                <span>Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy size={14} className="mr-1" />
                                <span>Copy code</span>
                              </>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={vscDarkPlus}
                          language={match ? match[1] : 'text'}
                          PreTag="div"
                          className="rounded-t-none rounded-b-md"
                          showLineNumbers={true}
                          wrapLines={true}
                          {...props}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                // Add custom styling for other markdown elements to ensure proper wrapping
                p: ({ children }) => <p className="whitespace-pre-wrap break-words">{children}</p>,
                li: ({ children }) => <li className="whitespace-pre-wrap break-words">{children}</li>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-500 pl-4 italic whitespace-pre-wrap break-words">
                    {children}
                  </blockquote>
                ),
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

      {/* Input area with current file context */}
      <div className="bg-sidebar p-2 border-t border-gray-800">
        {/* Current file indicator */}
        {getCurrentFileName() && (
          <div className="mb-2 px-2 py-0.5 rounded-md bg-[#cccccc15] text-sm flex items-center">
            <span className="text-gray-400">@{getCurrentFileName()}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="relative">
          <div className="bg-sidebar rounded-lg overflow-hidden">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask something about your code..."
              className="w-full text-gray-100 px-1 py-0.5 focus:outline-none bg-transparent resize-none min-h-[60px] max-h-[150px]"
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          {/* Agent selector and send button */}
          <div className="flex items-center justify-between mt-2 border-t border-gray-800 pt-2">
            <div className="flex items-center gap-2 relative">
              <span className="text-gray-400 text-sm">Agent</span>
              <button 
                className="flex items-center gap-1 bg-[#cccccc29] rounded-md px-2 py-1 text-sm"
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
                type="button"
              >
                <span>{selectedAgent.name}</span>
                <ChevronDown size={14} />
              </button>
              
              {/* Agent dropdown */}
              {showAgentDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-sidebar-foreground border border-gray-700 rounded-md shadow-lg z-10 w-56">
                  <div className="py-1">
                    {availableAgents.map((agent) => (
                      <button
                        key={agent.id}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-[#cccccc29] flex flex-col"
                        onClick={() => {
                          setSelectedAgent(agent);
                          setShowAgentDropdown(false);
                        }}
                        type="button"
                      >
                        <span className="font-medium">{agent.name}</span>
                        <span className="text-xs text-gray-400 mt-0.5">{agent.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex items-center gap-1 bg-[#cccccc29] rounded-md px-2 py-1 text-sm disabled:opacity-50 disabled:hover:bg-[#333333]"
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
