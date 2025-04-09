
import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { Textarea } from '@/components/ui/textarea';
import { 
  Send, 
  Plus, 
  X, 
  RefreshCw, 
  MoreHorizontal, 
  ChevronDown,
  Copy,
  CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

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

const availableAgents = [
  { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
  { id: 'claude-3-sonnet', name: 'Claude 3 Sonnet' },
  { id: 'gpt-4o', name: 'GPT-4o' }
];

export function CodeBuddyChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState('gemini-1.5-flash');
  const [showAgentDropdown, setShowAgentDropdown] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
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

  // Get information about the currently active file
  const getCurrentFileInfo = () => {
    if (!activeTabId) return null;
    
    const activeFile = getFileById(activeTabId);
    if (!activeFile) return null;
    
    return {
      path: activeFile.path,
      name: activeFile.name,
      fileType: activeFile.language || 'plaintext',
      content: getTabContent(activeTabId) || activeFile.content || ''
    };
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    
    // Get current file info
    const currentFile = getCurrentFileInfo();
    let messageWithFileContext = userMessage;
    
    // Prepend currently opened file information
    if (currentFile) {
      messageWithFileContext = `Currently opened file: ${currentFile.path}\n\n${userMessage}`;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: messageWithFileContext }]);
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

      const result = await chat.sendMessage(messageWithFileContext);
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

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code)
      .then(() => {
        setCopiedIndex(index);
        toast.success("Code copied to clipboard!");
        setTimeout(() => setCopiedIndex(null), 2000);
      })
      .catch(err => {
        console.error('Failed to copy code:', err);
        toast.error("Failed to copy code");
      });
  };

  const selectAgent = (agentId: string) => {
    setSelectedAgent(agentId);
    setShowAgentDropdown(false);
  };

  return (
    <div className="flex flex-col h-full bg-sidebar text-gray-100 overflow-hidden">
      {/* Top bar */}
      <div className="flex justify-between items-center p-3 border-b border-gray-800">
        <h2 className="font-semibold text-lg">Chat</h2>
        <div className="flex items-center space-x-2 text-gray-400">
          <button className="hover:text-gray-300">
            <Plus size={18} />
          </button>
          <button className="hover:text-gray-300">
            <RefreshCw size={18} />
          </button>
          <button className="hover:text-gray-300">
            <MoreHorizontal size={18} />
          </button>
          <button className="hover:text-gray-300">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Chat message area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 overflow-x-hidden">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${
              message.role === 'user'
                ? 'ml-auto bg-[#cccccc29] p-4 rounded-tl-lg rounded-tr-lg rounded-bl-lg'
                : 'w-full rounded-lg'
            } p-2 max-w-3xl break-words`}
          >
            <ReactMarkdown
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const language = match ? match[1] : 'text';
                  
                  if (!inline) {
                    const code = String(children).replace(/\n$/, '');
                    return (
                      <div className="relative">
                        <div className="flex justify-between items-center bg-[#1E1E1E] px-4 py-1 rounded-t-md border-b border-gray-700">
                          <span className="text-xs text-gray-400">{language}</span>
                          <button 
                            onClick={() => handleCopyCode(code, index)}
                            className="text-gray-400 hover:text-white flex items-center gap-1"
                          >
                            {copiedIndex === index ? (
                              <><CheckCircle size={14} /> Copied</>
                            ) : (
                              <><Copy size={14} /> Copy code</>
                            )}
                          </button>
                        </div>
                        <SyntaxHighlighter
                          language={language}
                          style={vscDarkPlus}
                          customStyle={{ margin: 0, borderRadius: '0 0 6px 6px' }}
                          showLineNumbers={true}
                          wrapLines={true}
                          wrapLongLines={true}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return (
                    <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
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

      {/* Input area */}
      <div className="bg-sidebar p-3 border-t border-gray-800">
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative bg-[#2a2a2a] rounded-lg">
            {getCurrentFileInfo() && (
              <div className="absolute top-2 left-3 text-blue-400 text-sm z-10">
                @{getCurrentFileInfo()?.name}
              </div>
            )}
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Plan, search, build anything...${getCurrentFileInfo() ? '' : ''}`}
              className="bg-transparent border-none text-gray-100 min-h-[80px] pt-7 resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            />
          </div>
          
          {/* Agent selector and send button */}
          <div className="flex items-center justify-between mt-2 border-t border-gray-800 pt-2">
            <div className="flex items-center gap-2 relative">
              <span className="text-gray-400 text-sm">Agent</span>
              <button 
                type="button"
                className="flex items-center gap-1 bg-[#cccccc29] rounded-md px-2 py-1 text-sm"
                onClick={() => setShowAgentDropdown(!showAgentDropdown)}
              >
                <span>{availableAgents.find(a => a.id === selectedAgent)?.name || selectedAgent}</span>
                <ChevronDown size={14} />
              </button>
              
              {/* Dropdown for agent selection */}
              {showAgentDropdown && (
                <div className="absolute top-full left-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-md shadow-lg z-10">
                  {availableAgents.map(agent => (
                    <button
                      key={agent.id}
                      type="button"
                      className="block w-full text-left px-4 py-2 text-sm hover:bg-[#3a3a3a] text-gray-300"
                      onClick={() => selectAgent(agent.id)}
                    >
                      {agent.name}
                    </button>
                  ))}
                </div>
              )}
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
