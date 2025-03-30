
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Bot, Paperclip, ArrowUp, ArrowDown, Maximize2, Minimize2 } from 'lucide-react';

interface AICoworkerProps {
  maximizePanel?: () => void;
  minimizePanel?: () => void;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const AICoworker: React.FC<AICoworkerProps> = ({ maximizePanel, minimizePanel }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your AI coding assistant. How can I help you today?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isMaximized, setIsMaximized] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSendMessage = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Simulate AI response
    setTimeout(() => {
      let response = '';
      
      if (inputValue.toLowerCase().includes('hello') || inputValue.toLowerCase().includes('hi')) {
        response = 'Hello! How can I assist with your coding today?';
      } else if (inputValue.toLowerCase().includes('help')) {
        response = 'I can help you with coding tasks, explain concepts, or suggest optimizations. What are you working on?';
      } else if (inputValue.toLowerCase().includes('code') || inputValue.toLowerCase().includes('function')) {
        response = 'Would you like me to help you write or optimize some code? Please share more details about what you\'re trying to accomplish.';
      } else {
        response = 'I\'m here to assist with your development tasks. Can you provide more details about what you need help with?';
      }

      const aiMessage: Message = {
        id: Date.now().toString(),
        type: 'assistant',
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    }, 1000);
  };

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
    if (!isMaximized) {
      if (maximizePanel) maximizePanel();
    } else {
      if (minimizePanel) minimizePanel();
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };

  return (
    <div className="h-full flex flex-col bg-terminal">
      {/* AI Coworker Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-sidebar border-b border-border">
        <div className="flex items-center">
          <Bot size={16} className="mr-2 text-blue-400" />
          <span className="text-sm font-medium text-sidebar-foreground opacity-90">AI Coworker</span>
        </div>
        <div className="flex items-center">
          <button 
            className="p-1 ml-1 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded transition-colors"
            onClick={toggleMaximize}
            title={isMaximized ? "Restore Panel" : "Maximize Panel"}
          >
            {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {messages.map(message => (
          <div 
            key={message.id} 
            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-3/4 rounded-lg px-4 py-2 ${
                message.type === 'user' 
                  ? 'bg-blue-500 bg-opacity-20 text-white' 
                  : 'bg-sidebar-foreground bg-opacity-10 text-terminal-foreground'
              }`}
            >
              <div className="flex items-center mb-1">
                {message.type === 'assistant' ? (
                  <Bot size={14} className="mr-1 text-blue-400" />
                ) : (
                  <User size={14} className="mr-1 text-green-400" />
                )}
                <span className="text-xs opacity-75">
                  {message.type === 'assistant' ? 'AI Assistant' : 'You'} • {formatTimestamp(message.timestamp)}
                </span>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {message.content}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-border">
        <div className="relative flex items-end">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Ask something or type a command..."
            className="w-full rounded-lg bg-sidebar-foreground bg-opacity-10 text-terminal-foreground border border-border p-2 pr-10 text-sm resize-none outline-none min-h-[60px] max-h-[150px]"
            rows={2}
          />
          <button 
            className="absolute right-3 bottom-3 p-1.5 text-slate-400 hover:text-white hover:bg-sidebar-foreground hover:bg-opacity-10 rounded-full transition-colors"
            onClick={handleSendMessage}
            disabled={!inputValue.trim()}
          >
            <Send size={16} className={!inputValue.trim() ? 'opacity-50' : ''} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AICoworker;
