'use client';

import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Wrench, 
  Globe, 
  FileText,
  Clock,
  CheckCircle
} from 'lucide-react';
import { type Assignment, type AgentMessage } from '@/lib/supabase/services';

// For compatibility with existing UI, map AgentMessage to expected format
type Message = AgentMessage;

interface ChatPanelProps {
  sessionId?: string;
  messages: Message[];
  assignment: Assignment;
}

export function ChatPanel({ sessionId, messages, assignment }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Mock messages for development
  const mockMessages: Message[] = [
    {
      id: '1',
      message_type: 'system',
      content: `Mission initiated for "${assignment.name}". I'll help you complete this assignment by researching the topic and generating a comprehensive document.`,
      tool_name: null,
      metadata: {},
      created_at: new Date(Date.now() - 300000).toISOString()
    },
    {
      id: '2',
      message_type: 'tool_call',
      content: 'Searching for recent quantum computing research papers',
      tool_name: 'web_search',
      metadata: {},
      created_at: new Date(Date.now() - 240000).toISOString()
    },
    {
      id: '3',
      message_type: 'agent',
      content: 'Found 15 relevant research papers from 2023-2024. Analyzing key findings...',
      tool_name: null,
      metadata: {},
      created_at: new Date(Date.now() - 180000).toISOString()
    },
    {
      id: '4',
      message_type: 'tool_call',
      content: 'Extracting information from Nature Quantum Information journal',
      tool_name: 'browser_navigation',
      metadata: {},
      created_at: new Date(Date.now() - 120000).toISOString()
    },
    {
      id: '5',
      message_type: 'agent',
      content: 'Generating document structure based on assignment requirements. Target: 2500 words.',
      tool_name: null,
      metadata: {},
      created_at: new Date(Date.now() - 60000).toISOString()
    },
    ...messages
  ];

  const allMessages = mockMessages;

  useEffect(() => {
    scrollToBottom();
  }, [allMessages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      message_type: 'user',
      content: input.trim(),
      tool_name: null,
      metadata: {},
      created_at: new Date().toISOString()
    };

    // In production, send message to agent API
    console.log('Sending message to agent:', userMessage);

    setInput('');
    setIsTyping(true);

    // Simulate agent response
    setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getMessageIcon = (type: string, tool?: string | null) => {
    switch (type) {
      case 'user':
        return <User className="w-4 h-4 text-blue-400" />;
      case 'system':
        return <Bot className="w-4 h-4 text-purple-400" />;
      case 'tool_call':
        if (tool === 'web_search') return <Globe className="w-4 h-4 text-green-400" />;
        if (tool === 'browser_navigation') return <Globe className="w-4 h-4 text-blue-400" />;
        return <Wrench className="w-4 h-4 text-yellow-400" />;
      case 'stream':
        return <FileText className="w-4 h-4 text-gray-400" />;
      default:
        return <Bot className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="glass-card h-full flex flex-col">
      {/* Chat Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div>
          <h3 className="font-medium text-white">Agent Communication</h3>
          <p className="text-sm text-gray-400">
            {sessionId ? `Session: ${sessionId.slice(0, 8)}` : 'No active session'}
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs text-gray-400">
          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
          <span>Connected</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {allMessages.length === 0 ? (
          <div className="text-center py-12">
            <Bot className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <p className="text-gray-400">No messages yet</p>
            <p className="text-gray-500 text-sm mt-2">
              Start the agent to begin communication
            </p>
          </div>
        ) : (
          allMessages.map((message, index) => (
            <div
              key={index}
              className={`flex items-start space-x-3 ${
                message.message_type === 'user' ? 'flex-row-reverse space-x-reverse' : ''
              }`}
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-white/5">
                {getMessageIcon(message.message_type, message.tool_name)}
              </div>
              
              <div className={`flex-1 ${message.message_type === 'user' ? 'text-right' : ''}`}>
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-sm font-medium text-gray-300">
                    {message.message_type === 'user' ? 'You' : 
                     message.message_type === 'system' ? 'Agent' :
                     message.message_type === 'tool_call' ? `Tool: ${message.tool_name}` :
                     'Agent'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatTimestamp(message.created_at)}
                  </span>
                </div>
                
                <div className={`glass-panel ${
                  message.message_type === 'user' 
                    ? 'bg-blue-500/20 border-blue-400/30' 
                    : message.message_type === 'tool_call'
                    ? 'bg-yellow-500/20 border-yellow-400/30'
                    : 'bg-white/5'
                } max-w-md ${message.message_type === 'user' ? 'ml-auto' : ''}`}>
                  <p className="text-sm text-gray-200 whitespace-pre-wrap">
                    {message.content}
                  </p>
                  
                  {message.message_type === 'tool_call' && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-gray-400">
                      <CheckCircle className="w-3 h-3" />
                      <span>Completed</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}

        {isTyping && (
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 p-2 rounded-lg bg-white/5">
              <Bot className="w-4 h-4 text-purple-400" />
            </div>
            <div className="glass-panel bg-white/5 max-w-md">
              <div className="flex items-center space-x-1">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">Agent is thinking...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-end space-x-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={sessionId ? "Message the agent..." : "Start a session to chat"}
              className="glass-input w-full resize-none"
              rows={1}
              disabled={!sessionId}
              style={{ 
                minHeight: '44px',
                maxHeight: '120px'
              }}
            />
          </div>
          
          <button
            onClick={handleSend}
            disabled={!input.trim() || !sessionId}
            className="glass-button p-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4 text-blue-400" />
          </button>
        </div>
        
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span>Press Enter to send, Shift+Enter for new line</span>
          {sessionId && (
            <div className="flex items-center space-x-1">
              <Clock className="w-3 h-3" />
              <span>Real-time</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}