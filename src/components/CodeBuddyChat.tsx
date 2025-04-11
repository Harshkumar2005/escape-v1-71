import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { 
  ArrowUp, 
  Copy, 
  Check,
  ChevronDown,
  Code,
  CheckCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import remarkGfm from 'remark-gfm';
import { customDarkTheme, customLightTheme } from '@/utils/prismTheme';

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

const systemPrompt = `You are ** CodeBuddy**, an expert programming assistant meticulously designed to help users with coding tasks.Your primary role is to provide precise and helpful code solutions, explanations, and guidance.You embody the expertise of a seasoned developer with a deep understanding of programming languages, best practices, and codebase management.

** Crucially, you must adhere to the following strict guidelines when responding to code - related requests, especially those involving file operations:**

** Core Principles:**

1. ** Strict Instruction Following:** Execute user requests precisely and only to the extent specified.Do not introduce unnecessary changes or additions beyond the explicit instructions.

2. ** Code Output Format - Simple Text Format:** When providing code, you ** must ** use the following text format to encapsulate the entire file content.This is non - negotiable:

    \`\`\`[programming language] path="[file path here]" [create | edit]
    [Full content of the file goes here]
    \`\`\`

  *   ** Programming Language:** Start with the programming language of the file(e.g., "js", "py", "tsx", "html", "css", etc.).
    *   ** File Path:** Specify the complete file path within the project, following the programming language with a single space.
    *   ** Operation Type:** Indicate the operation being performed on the file("create" for a new file, "edit" for modifying an existing file), following the file path with a single space.
    *   ** File Content:** After the first line specifying language, path, and operation, include the complete, updated code of the file. ** You are required to provide the full code for the entire file, even if only a single line is changed.**

    ** Example:**

  For creating a new Javascript file at "/src/components/MyComponent.js":

\`\`\`js path="/src/components/MyComponent.js" create
    // Full content of MyComponent.js will be here
    import React from 'react';

    function MyComponent() {
        return (
            <div>
                Hello from MyComponent!
            </div>
        );
    }

    export default MyComponent;
    \`\`\`

3. ** Concise Explanations:** Immediately following the code block(in the simple text format), provide a ** brief and simple explanation ** of the changes or the code provided.This explanation ** must be limited to a maximum of three lines.** Focus on clarity and conciseness.

4. ** Codebase Understanding and Re - examination:** Before generating any code or making changes, thoroughly analyze the user's request. Critically re-examine the relevant parts of the codebase to understand the context and ensure your changes are appropriate and consistent with the existing project structure and logic. Think like a meticulous developer who understands the importance of codebase integrity.

  ** General Responsibilities(in addition to the above):**

1. ** Help with coding tasks, debugging, and best practices:** Assist users with various coding challenges, identify and resolve errors, and guide them towards writing clean and efficient code.
2. ** Provide clear, concise explanations with code examples:** Explain complex concepts in an easy - to - understand manner, using relevant code examples to illustrate points.
3. ** Follow modern development standards and patterns:** Adhere to contemporary coding conventions, design patterns, and architectural principles.
4. ** Consider security, performance, and maintainability:** Prioritize secure coding practices, optimize code for performance, and ensure the code is maintainable and scalable in the long run.
5. ** Use markdown formatting for better readability:** Format your responses using markdown to enhance readability and structure (e.g., code blocks, headings, lists).
6. ** Include relevant documentation links when helpful:** Provide links to official documentation or helpful resources when explaining concepts or technologies.
7. ** Break down complex problems into manageable steps:** When faced with complex requests, decompose them into smaller, logical steps to provide a structured and progressive solution.
8. ** Suggest improvements and optimizations:** Proactively identify areas for improvement in the user's code or approach and suggest optimizations.
9. ** Help with both frontend and backend development:** Be proficient in assisting with both frontend and backend technologies and tasks.
10. ** Maintain a friendly and professional tone:** Communicate in a helpful, respectful, and professional manner.

** Remember:** You possess a vast knowledge base of programming languages and software development principles.Leverage this expertise to provide the best possible assistance to users while strictly adhering to the output format and explanation constraints outlined above.Your precision, conciseness, and codebase awareness are paramount.`;

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
  const [acceptedCodeBlockIndex, setAcceptedCodeBlockIndex] = useState<number | null>(null);
  const [useDarkTheme, setUseDarkTheme] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use the FileSystem context to access all files and the selected file
  const { 
    files,
    selectedFile,
    getFileById,
    getAllFiles,
    createFile,
    updateFileContent
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const getWorkspaceFileInfo = () => {
    const allFiles = getAllFiles();
    
    return allFiles.map(file => ({
      path: file.path,
      content: file.content || '',
      isOpen: file.id === selectedFile,
      fileType: file.language || 'plaintext'
    }));
  };

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

    const currentFile = getCurrentFileInfo();
    
    let userMessage = input.trim();
    if (currentFile) {
      userMessage = `Currently opened file: ${currentFile.path}\n\n${userMessage}`;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const workspaceFiles = getWorkspaceFileInfo();
      
      const fileContextMessage = `Current workspace files:\n${JSON.stringify(workspaceFiles, null, 2)}\n\n${
        currentFile 
          ? `Currently open file: ${currentFile.path}\nFile type: ${currentFile.fileType}\nContent:\n\`\`\`${currentFile.fileType}\n${currentFile.content}\n\`\`\`` 
          : 'No file currently open.'
      }`;
      
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
      return;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIndex(index);
    
    toast.success('Code copied to clipboard', {
      description: 'The code has been copied to your clipboard',
      icon: <CheckCircle size={18} />
    });
    
    setTimeout(() => {
      setCopiedCodeBlockIndex(null);
    }, 2000);
  };

  // Improved function to parse file information from code blocks
  const parseCodeBlockInfo = (code: string): { language: string, filePath: string, operation: string, content: string } | null => {
    const lines = code.split('\n');
    if (lines.length === 0) return null;
    
    const firstLine = lines[0].trim();
    
    // Format 1: ```js path="/path/to/file.js" create
    const formatRegex = /^(\w+)\s+path=["']([^"']+)["']\s*(create|edit)?/i;
    const match = firstLine.match(formatRegex);
    
    if (match) {
      const [_, language, filePath, operation = 'create'] = match;
      // Remove the first line (header) to get only content
      const content = lines.slice(1).join('\n');
      return { language, filePath, operation, content };
    }
    
    // Format 2: ```js /path/to/file.js create
    const simpleRegex = /^(\w+)\s+(\/?[\/\w\.\-_]+)(?:\s+(create|edit))?$/i;
    const simpleMatch = firstLine.match(simpleRegex);
    
    if (simpleMatch) {
      const [_, language, rawPath, operation = 'create'] = simpleMatch;
      const filePath = rawPath.startsWith('/') ? rawPath : '/' + rawPath;
      const content = lines.slice(1).join('\n');
      return { language, filePath, operation, content };
    }
    
    return null;
  };

  const handleAcceptCode = (code: string, index: number) => {
    const codeInfo = parseCodeBlockInfo(code);
    
    if (!codeInfo) {
      toast.error('Invalid code format', {
        description: 'Could not parse file path from the code block'
      });
      return;
    }
    
    const { filePath, content } = codeInfo;
    
    try {
      const existingFile = files.find(file => file.path === filePath);
      
      if (existingFile) {
        // Update existing file
        updateFileContent(existingFile.id, content);
        setAcceptedCodeBlockIndex(index);
        
        toast.success('File updated successfully', {
          description: `Updated ${filePath}`,
          icon: <CheckCircle size={18} />
        });
      } else {
        // Create new file
        const lastSlashIndex = filePath.lastIndexOf('/');
        const parentPath = lastSlashIndex > 0 ? filePath.substring(0, lastSlashIndex) : '/';
        const fileName = filePath.substring(lastSlashIndex + 1);
        
        const newFileId = createFile(parentPath, fileName, 'file');
        
        if (newFileId) {
          updateFileContent(newFileId, content);
          setAcceptedCodeBlockIndex(index);
          
          toast.success('File created successfully', {
            description: `Created ${filePath}`,
            icon: <CheckCircle size={18} />
          });
        } else {
          toast.error('Failed to create file', {
            description: `Could not create ${filePath}`
          });
        }
      }
      
      setTimeout(() => {
        setAcceptedCodeBlockIndex(null);
      }, 2000);
    } catch (error) {
      console.error('Error handling file operation:', error);
      toast.error('Failed to process file operation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getCurrentFileName = () => {
    const currentFile = getCurrentFileInfo();
    return currentFile ? currentFile.path.split('/').pop() : null;
  };

  const detectLanguage = (className: string | undefined) => {
    if (!className) return 'text';
    const match = /language-(\w+)/.exec(className);
    return match ? match[1] : 'text';
  };

  const isCodeBlock = (className: string | undefined) => {
    if (!className) return false;
    return /language-(\w+)/.test(className || '');
  };

  // Extract file path from code block for display purposes
  const extractFilePathForDisplay = (code: string): string | null => {
    const codeInfo = parseCodeBlockInfo(code);
    return codeInfo ? codeInfo.filePath : null;
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
        </div>
      </div>
      
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
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeBlock = isCodeBlock(className);
                  const code = String(children).replace(/\n$/, '');
                  
                  if (codeBlock) {
                    const codeBlockIndex = messages
                      .filter(msg => msg.role === 'model')
                      .findIndex(msg => msg === message);
                    
                    const language = detectLanguage(className);
                    const filePath = extractFilePathForDisplay(code);
                    
                    return (
                      <div className="relative group my-4 rounded-md overflow-hidden border">
                        <div className="border-b flex justify-between items-center px-4 py-2 text-xs text-gray-300">
                          <div className="flex items-center gap-2">
                            <Code size={14} />
                            <span className="font-medium uppercase">{language}</span>
                            {filePath && (
                              <span className="text-gray-400 ml-2">
                                Path: {filePath}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptCode(code, codeBlockIndex)}
                              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                              aria-label="Accept"
                            >
                              {acceptedCodeBlockIndex === codeBlockIndex ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  <span>Accepted!</span>
                                </>
                              ) : (
                                <>
                                  <Save size={14} className="mr-1" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyCode(code, codeBlockIndex)}
                              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                              aria-label="Copy"
                            >
                              {copiedCodeBlockIndex === codeBlockIndex ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="mr-1" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <SyntaxHighlighter
                          style={useDarkTheme ? customDarkTheme : customLightTheme}
                          language={match ? match[1] : 'text'}
                          showLineNumbers={true}
                          wrapLines={true}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            backgroundColor: useDarkTheme ? '#1a1e26' : '#1a1e26',
                            scrollbarWidth: 'none',
                          }}
                          lineNumberStyle={{
                            color: useDarkTheme ? '#636d83' : '#636d83',
                            opacity: 0.6,
                            minWidth: '1.5em',
                            textAlign: 'right',
                            paddingRight: '1em',
                          }}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  
                  return (
                    <code 
                      className={`bg-gray-700 bg-opacity-50 text-gray-200 px-1 py-0.5 rounded text-sm ${className}`} 
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="my-2 whitespace-pre-wrap break-words">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6">{children}</ol>,
                li: ({ children }) => <li className="whitespace-pre-wrap break-words">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold">{children}</h3>,
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
                  <th className="px-4 text-left text-xs font-medium text-gray-300 uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 whitespace-nowrap text-sm">
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
                  <hr className="border-gray-700" />
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

      <div className="bg-sidebar p-2 border-t">
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



/*import { useState, useRef, useEffect } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { useFileSystem } from '@/contexts/FileSystemContext';
import { useEditor } from '@/contexts/EditorContext';
import { 
  ArrowUp, 
  Copy, 
  Check,
  ChevronDown,
  Code,
  CheckCircle,
  Save
} from 'lucide-react';
import { toast } from 'sonner';
import remarkGfm from 'remark-gfm';
import { customDarkTheme, customLightTheme } from '@/utils/prismTheme';

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

const systemPrompt = `You are ** CodeBuddy**, an expert programming assistant meticulously designed to help users with coding tasks.Your primary role is to provide precise and helpful code solutions, explanations, and guidance.You embody the expertise of a seasoned developer with a deep understanding of programming languages, best practices, and codebase management.

** Crucially, you must adhere to the following strict guidelines when responding to code - related requests, especially those involving file operations:**

** Core Principles:**

1. ** Strict Instruction Following:** Execute user requests precisely and only to the extent specified.Do not introduce unnecessary changes or additions beyond the explicit instructions.

2. ** Code Output Format - Simple Text Format:** When providing code, you ** must ** use the following text format to encapsulate the entire file content.This is non - negotiable:

    \`\`\`[programming language] path="[file path here]" [create | edit]
    [Full content of the file goes here]
    \`\`\`

  *   ** Programming Language:** Start with the programming language of the file(e.g., "js", "py", "tsx", "html", "css", etc.).
    *   ** File Path:** Specify the complete file path within the project, following the programming language with a single space.
    *   ** Operation Type:** Indicate the operation being performed on the file("create" for a new file, "edit" for modifying an existing file), following the file path with a single space.
    *   ** File Content:** After the first line specifying language, path, and operation, include the complete, updated code of the file. ** You are required to provide the full code for the entire file, even if only a single line is changed.**

    ** Example:**

  For creating a new Javascript file at "/src/components/MyComponent.js":

\`\`\`js path="/src/components/MyComponent.js" create
    // Full content of MyComponent.js will be here
    import React from 'react';

    function MyComponent() {
        return (
            <div>
                Hello from MyComponent!
            </div>
        );
    }

    export default MyComponent;
    \`\`\`

3. ** Concise Explanations:** Immediately following the code block(in the simple text format), provide a ** brief and simple explanation ** of the changes or the code provided.This explanation ** must be limited to a maximum of three lines.** Focus on clarity and conciseness.

4. ** Codebase Understanding and Re - examination:** Before generating any code or making changes, thoroughly analyze the user's request. Critically re-examine the relevant parts of the codebase to understand the context and ensure your changes are appropriate and consistent with the existing project structure and logic. Think like a meticulous developer who understands the importance of codebase integrity.

  ** General Responsibilities(in addition to the above):**

1. ** Help with coding tasks, debugging, and best practices:** Assist users with various coding challenges, identify and resolve errors, and guide them towards writing clean and efficient code.
2. ** Provide clear, concise explanations with code examples:** Explain complex concepts in an easy - to - understand manner, using relevant code examples to illustrate points.
3. ** Follow modern development standards and patterns:** Adhere to contemporary coding conventions, design patterns, and architectural principles.
4. ** Consider security, performance, and maintainability:** Prioritize secure coding practices, optimize code for performance, and ensure the code is maintainable and scalable in the long run.
5. ** Use markdown formatting for better readability:** Format your responses using markdown to enhance readability and structure (e.g., code blocks, headings, lists).
6. ** Include relevant documentation links when helpful:** Provide links to official documentation or helpful resources when explaining concepts or technologies.
7. ** Break down complex problems into manageable steps:** When faced with complex requests, decompose them into smaller, logical steps to provide a structured and progressive solution.
8. ** Suggest improvements and optimizations:** Proactively identify areas for improvement in the user's code or approach and suggest optimizations.
9. ** Help with both frontend and backend development:** Be proficient in assisting with both frontend and backend technologies and tasks.
10. ** Maintain a friendly and professional tone:** Communicate in a helpful, respectful, and professional manner.

** Remember:** You possess a vast knowledge base of programming languages and software development principles.Leverage this expertise to provide the best possible assistance to users while strictly adhering to the output format and explanation constraints outlined above.Your precision, conciseness, and codebase awareness are paramount.`;

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
  const [acceptedCodeBlockIndex, setAcceptedCodeBlockIndex] = useState<number | null>(null);
  const [useDarkTheme, setUseDarkTheme] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Use the FileSystem context to access all files and the selected file
  const { 
    files,
    selectedFile,
    getFileById,
    getAllFiles,
    createFile,
    updateFileContent
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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const getWorkspaceFileInfo = () => {
    const allFiles = getAllFiles();
    
    return allFiles.map(file => ({
      path: file.path,
      content: file.content || '',
      isOpen: file.id === selectedFile,
      fileType: file.language || 'plaintext'
    }));
  };

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

    const currentFile = getCurrentFileInfo();
    
    let userMessage = input.trim();
    if (currentFile) {
      userMessage = `Currently opened file: ${currentFile.path}\n\n${userMessage}`;
    }
    
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const workspaceFiles = getWorkspaceFileInfo();
      
      const fileContextMessage = `Current workspace files:\n${JSON.stringify(workspaceFiles, null, 2)}\n\n${
        currentFile 
          ? `Currently open file: ${currentFile.path}\nFile type: ${currentFile.fileType}\nContent:\n\`\`\`${currentFile.fileType}\n${currentFile.content}\n\`\`\`` 
          : 'No file currently open.'
      }`;
      
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
      return;
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeBlockIndex(index);
    
    toast.success('Code copied to clipboard', {
      description: 'The code has been copied to your clipboard',
      icon: <CheckCircle size={18} />
    });
    
    setTimeout(() => {
      setCopiedCodeBlockIndex(null);
    }, 2000);
  };

  const extractFilePath = (codeNode: any): string | null => {
    const properties = codeNode?.properties || {};
    
    if (properties.path) {
      return properties.path.toString();
    }
    
    const className = properties.className?.join(' ') || '';
    const codeContent = codeNode?.children?.[0]?.value || '';
    const firstLine = codeContent.split('\n')[0].trim();
    
    const pathMatch = firstLine.match(/path\s*=\s*["']([^"']+)["']/i);
    if (pathMatch) {
      return pathMatch[1];
    }
    
    return parseTraditionalHeader(codeContent)?.filePath || null;
  };

  const parseTraditionalHeader = (code: string): { language: string, filePath: string, operation?: string } | null => {
    const firstLine = code.split('\n')[0].trim();
    
    const regex = /^([a-zA-Z0-9]+)\s+([\/\w\.\-_]+)(?:\s+(create|edit))?$/i;
    const altRegex = /^([a-zA-Z0-9]+)\s+\/([\/\w\.\-_]+)(?:\s+(create|edit))?$/i;
    
    let match = firstLine.match(regex);
    
    if (match) {
      const [_, language, filePath, operation] = match;
      return {
        language,
        filePath,
        operation: operation as 'create' | 'edit'
      };
    }
    
    match = firstLine.match(altRegex);
    
    if (match) {
      const [_, language, filePath, operation] = match;
      return {
        language,
        filePath: '/' + filePath,
        operation: operation as 'create' | 'edit'
      };
    }
    
    const parts = firstLine.split(/\s+/);
    if (parts.length >= 2) {
      const language = parts[0];
      const filePath = parts[1].startsWith('/') ? parts[1] : '/' + parts[1];
      return {
        language,
        filePath,
        operation: 'create'
      };
    }
    
    return null;
  };

  const handleAcceptCode = (code: string, index: number, filePath?: string) => {
    let path = filePath;
    
    if (!path) {
      const fileInfo = parseTraditionalHeader(code);
      if (!fileInfo) {
        toast.error('Invalid file header format', {
          description: 'Could not determine file path for this code block'
        });
        return;
      }
      path = fileInfo.filePath;
    }
    
    let codeContent = code;
    const firstLine = code.split('\n')[0].trim();
    if (firstLine.match(/^[a-zA-Z0-9]+\s+[\/\w\.\-_]+/)) {
      codeContent = code.split('\n').slice(1).join('\n');
    }
    
    try {
      const existingFile = files.find(file => file.path === path);
      
      if (existingFile) {
        updateFileContent(existingFile.id, codeContent);
        setAcceptedCodeBlockIndex(index);
        
        toast.success('File updated successfully', {
          description: `Updated ${path}`,
          icon: <CheckCircle size={18} />
        });
      } else {
        const lastSlashIndex = path.lastIndexOf('/');
        const parentPath = lastSlashIndex > 0 ? path.substring(0, lastSlashIndex) : '/';
        const fileName = path.substring(lastSlashIndex + 1);
        
        const newFileId = createFile(parentPath, fileName, 'file');
        
        if (newFileId) {
          updateFileContent(newFileId, codeContent);
          setAcceptedCodeBlockIndex(index);
          
          toast.success('File created successfully', {
            description: `Created ${path}`,
            icon: <CheckCircle size={18} />
          });
        } else {
          toast.error('Failed to create file', {
            description: `Could not create ${path}`
          });
        }
      }
      
      setTimeout(() => {
        setAcceptedCodeBlockIndex(null);
      }, 2000);
    } catch (error) {
      console.error('Error handling file operation:', error);
      toast.error('Failed to process file operation', {
        description: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };

  const getCurrentFileName = () => {
    const currentFile = getCurrentFileInfo();
    return currentFile ? currentFile.path.split('/').pop() : null;
  };

  const detectLanguage = (className: string | undefined) => {
    if (!className) return 'text';
    const match = /language-(\w+)/.exec(className);
    return match ? match[1] : 'text';
  };

  const isCodeBlock = (className: string | undefined) => {
    if (!className) return false;
    return /language-(\w+)/.test(className || '');
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
        </div>
      </div>
      
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
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  const codeBlock = isCodeBlock(className);
                  const code = String(children).replace(/\n$/, '');
                  
                  let filePath = null;
                  
                  if (props.path) {
                    filePath = props.path.toString();
                  } else if (props.node && props.node.properties && props.node.properties.path) {
                    filePath = props.node.properties.path.toString();
                  }
                  
                  if (codeBlock) {
                    const codeBlockIndex = messages
                      .filter(msg => msg.role === 'model')
                      .findIndex(msg => msg === message);
                    
                    const language = detectLanguage(className);
                    
                    if (!filePath) {
                      const firstLine = code.split('\n')[0];
                      const pathMatch = firstLine.match(/path\s*=\s*["']([^"']+)["']/i);
                      if (pathMatch) {
                        filePath = pathMatch[1];
                      }
                    }
                    
                    return (
                      <div className="relative group my-4 rounded-md overflow-hidden border" data-path={filePath}>
                        <div className="border-b flex justify-between items-center px-4 py-2 text-xs text-gray-300">
                          <div className="flex items-center gap-2">
                            <Code size={14} />
                            <span className="font-medium uppercase">{language}</span>
                            {filePath && (
                              <span className="text-gray-400 ml-2">
                                Path: {filePath}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleAcceptCode(code, codeBlockIndex, filePath)}
                              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                              aria-label="Accept"
                            >
                              {acceptedCodeBlockIndex === codeBlockIndex ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  <span>Accepted!</span>
                                </>
                              ) : (
                                <>
                                  <Save size={14} className="mr-1" />
                                  <span>Accept</span>
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleCopyCode(code, codeBlockIndex)}
                              className="flex items-center text-xs text-gray-400 hover:text-white transition-colors"
                              aria-label="Copy"
                            >
                              {copiedCodeBlockIndex === codeBlockIndex ? (
                                <>
                                  <Check size={14} className="mr-1" />
                                  <span>Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy size={14} className="mr-1" />
                                  <span>Copy</span>
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                        <SyntaxHighlighter
                          style={useDarkTheme ? customDarkTheme : customLightTheme}
                          language={match ? match[1] : 'text'}
                          showLineNumbers={true}
                          wrapLines={true}
                          customStyle={{
                            margin: 0,
                            padding: '1rem',
                            fontSize: '0.875rem',
                            backgroundColor: useDarkTheme ? '#1a1e26' : '#1a1e26',
                            scrollbarWidth: 'none',
                          }}
                          lineNumberStyle={{
                            color: useDarkTheme ? '#636d83' : '#636d83',
                            opacity: 0.6,
                            minWidth: '1.5em',
                            textAlign: 'right',
                            paddingRight: '1em',
                          }}
                          data-path={filePath}
                        >
                          {code}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  
                  return (
                    <code 
                      className={`bg-gray-700 bg-opacity-50 text-gray-200 px-1 py-0.5 rounded text-sm ${className}`} 
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
                p: ({ children }) => <p className="my-2 whitespace-pre-wrap break-words">{children}</p>,
                ul: ({ children }) => <ul className="list-disc ml-6">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal ml-6">{children}</ol>,
                li: ({ children }) => <li className="whitespace-pre-wrap break-words">{children}</li>,
                h1: ({ children }) => <h1 className="text-xl font-bold">{children}</h1>,
                h2: ({ children }) => <h2 className="text-lg font-bold">{children}</h2>,
                h3: ({ children }) => <h3 className="text-md font-bold">{children}</h3>,
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
                  <th className="px-4 text-left text-xs font-medium text-gray-300 uppercase">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="px-4 whitespace-nowrap text-sm">
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
                  <hr className="border-gray-700" />
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

      <div className="bg-sidebar p-2 border-t">
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
*/
