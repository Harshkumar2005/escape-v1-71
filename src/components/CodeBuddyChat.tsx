
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { 
  ArrowUp, 
  Copy, 
  Check,
  ChevronDown,
  Code,
  CheckCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import remarkGfm from 'remark-gfm';

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
    id: 'gemini-2.0-flash-thinking-exp-01-21',
    name: 'Gemini Exp.', 
    model: 'gemini-2.0-flash-thinking-exp-01-21',
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
  const [selectedAgent, setSelectedAgent] = useState<AIAgent>(availableAgents[1]);
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [copiedCodeBlockIndex, setCopiedCodeBlockIndex] = useState<number | null>(null);
  const [useDarkTheme, setUseDarkTheme] = useState(true);
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

  // Enhanced copy code functionality with better feedback
  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIndex(index);
    
    // Show toast notification
    toast.success('Code copied to clipboard', {
      description: 'The code has been copied to your clipboard',
      icon: <CheckCircle size={18} />
    });
    
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

  // Detect language from the code block language class
  const detectLanguage = (className: string | undefined) => {
    if (!className) return 'text';
    const match = /language-(\w+)/.exec(className);
    return match ? match[1] : 'text';
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-100 overflow-hidden">
      <div className="px-2 py-0.5 flex justify-between items-center border-b border-border">
        <h1 className="text-slate-400 text-sm font-medium mr-4">AI Code Assistant</h1>
        <div className="flex space-x-1">
          <div className="flex items-center gap-2 relative">
            <span className="text-gray-400 text-sm">Agent:</span>
            <button 
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-gray-300 text-sm"
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
          
          {/* Toggle syntax highlighting theme */}
          <button
            onClick={() => setUseDarkTheme(!useDarkTheme)}
            className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-gray-300 text-sm"
            title={useDarkTheme ? "Switch to light theme" : "Switch to dark theme"}
          >
            <Code size={14} />
          </button>
        </div>
      </div>
      
      {/* Chat message area */}
      <div className="flex-1 px-1.5 py-3 space-y-4 overflow-x-hidden" style={{scrollbarWidth: 'none',}}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'text-gray-300 text-sm ml-auto bg-[#cccccc29] rounded-tl-lg rounded-tr-lg rounded-bl-lg max-w-[85%] px-2.5 py-1.5 opacity-90'
                : 'text-gray-300 opacity-90 w-full max-w-full rounded-lg text-sm px-1.5'
            } text-sm`}
          >
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, className, children, inline, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const code = String(children).replace(/\n$/, '');
                  
                  if (!inline && match) {
                    // For code blocks (not inline code)
                    const codeBlockIndex = messages
                      .filter(msg => msg.role === 'model')
                      .findIndex(msg => msg === message);
                    
                    const language = detectLanguage(className);
                    
                    return (
                      <div className="relative group my-4 rounded-md overflow-hidden border border-gray-700">
                        <div className="flex justify-between items-center bg-[#1E1E1E] px-4 py-2 text-xs text-gray-300">
                          <div className="flex items-center gap-2">
                            <Code size={14} />
                            <span className="font-medium uppercase">{language}</span>
                          </div>
                          <button
                            onClick={() => handleCopyCode(code, codeBlockIndex)}
                            className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                            aria-label="Copy code"
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
                          style={useDarkTheme ? vscDarkPlus : oneLight}
                          language={match[1]}
                          showLineNumbers={true}
                          wrapLines={true}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            backgroundColor: useDarkTheme ? '#1E1E1E' : '#f8f8f8'
                          }}
                          lineNumberStyle={{
                            color: useDarkTheme ? '#6b7280' : '#9ca3af',
                            opacity: 0.6,
                            minWidth: '2.5em',
                            textAlign: 'right',
                            paddingRight: '1em'
                          }}
                          {...props}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  
                  // For inline code
                  return (
                    <code 
                      className={`bg-gray-700 bg-opacity-50 text-gray-200 px-1 py-0.5 rounded text-sm ${className}`} 
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                // Add custom styling for other markdown elements
                p: ({ children }) => <p className="my-2 whitespace-pre-wrap break-words">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-6 my-2">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6 my-2">{children}</ol>,
                li: ({ children }) => <li className="my-1 whitespace-pre-wrap break-words">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold my-3">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold my-2">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold my-2">{children}</h3>,
                h4: ({ children }) => <h4 className="font-bold my-1">{children}</h4>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-500 pl-4 italic my-2 whitespace-pre-wrap break-words">
                    {children}
                  </blockquote>
                ),
                a: ({ children, href }) => (
                  <a 
                    href={href} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-400 hover:underline"
                  >
                    {children}
                  </a>
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-4">
                    <table className="min-w-full table-auto border-collapse border border-gray-700">
                      {children}
                    </table>
                  </div>
                ),
                thead: ({ children }) => (
                  <thead className="bg-gray-800">
                    {children}
                  </thead>
                ),
                tbody: ({ children }) => (
                  <tbody className="divide-y divide-gray-700">
                    {children}
                  </tbody>
                ),
                tr: ({ children }) => (
                  <tr className="divide-x divide-gray-700">
                    {children}
                  </tr>
                ),
                th: ({ children }) => (
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-300 uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 py-2 whitespace-nowrap text-sm">
                    {children}
                  </td>
                ),
                strong: ({ children }) => (
                  <strong className="font-bold">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic">
                    {children}
                  </em>
                ),
                hr: () => (
                  <hr className="my-4 border-gray-700" />
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
      <div className="bg-sidebar p-2 border-t">
        {/* Current file indicator */}
        {getCurrentFileName() && (
          <div className="border mb-2 px-2 py-0.5 rounded-md text-sm flex items-center" style={{
            width: 'fit-content',
            marginTop: '-9px',
            borderRadius: '0px 0px 0.375rem 0.375em'
          }}>
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
              className="text-sm w-full text-gray-100 px-1 py-0.5 focus:outline-none bg-transparent resize-none min-h-[60px] max-h-[150px]"
              disabled={isLoading}
              rows={1}
            />
          </div>
          
          {/* Agent selector and send button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="h-7 flex items-center gap-1 bg-[#cccccc29] rounded-md px-1.5 py-0.5 text-sm disabled:opacity-50 disabled:hover:bg-[#333333]"
            >
              <ArrowUp size={18} strokeWidth={3}/>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
