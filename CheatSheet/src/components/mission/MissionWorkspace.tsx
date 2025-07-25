'use client';

import { useState } from 'react';
import { BrowserBlock } from './BrowserBlock';
import { DocumentBlock } from './DocumentBlock';
import { ChatPanel } from './ChatPanel';
import { useAgentSession } from '@/hooks/useAgentSession';
import { 
  Play, 
  Pause, 
  Square, 
  MessageSquare, 
  Monitor, 
  FileText, 
  Activity,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { type Assignment } from '@/lib/supabase/services';

interface MissionWorkspaceProps {
  assignmentId: string;
  assignment: Assignment;
}

export function MissionWorkspace({ assignmentId, assignment }: MissionWorkspaceProps) {
  const { session, status, messages, isConnected, startSession, pauseSession, resumeSession, cancelSession } = useAgentSession(assignmentId);
  const [activeTab, setActiveTab] = useState<'workspace' | 'chat'>('workspace');
  const [workspaceLayout, setWorkspaceLayout] = useState<'split' | 'browser' | 'document'>('split');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'idle': return 'text-gray-400';
      case 'planning': return 'text-blue-400';
      case 'executing': return 'text-green-400';
      case 'paused': return 'text-yellow-400';
      case 'completed': return 'text-green-400';
      case 'failed': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'idle': return <Square className="w-4 h-4" />;
      case 'planning': return <Activity className="w-4 h-4 animate-pulse" />;
      case 'executing': return <Activity className="w-4 h-4 animate-spin" />;
      case 'paused': return <Pause className="w-4 h-4" />;
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <AlertCircle className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Control Header */}
      <div className="glass-effect border-b border-white/20 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`flex items-center space-x-2 ${getStatusColor(status)}`}>
              {getStatusIcon(status)}
              <span className="font-medium capitalize">{status}</span>
            </div>
            
            {session && (
              <div className="text-sm text-gray-400">
                Progress: {session.progress}%
              </div>
            )}
            
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`} />
          </div>
          
          <div className="flex items-center space-x-2">
            {status === 'idle' && (
              <button
                onClick={startSession}
                className="glass-button flex items-center space-x-2 text-green-400 hover:text-green-300"
              >
                <Play className="w-4 h-4" />
                <span>Engage Agent</span>
              </button>
            )}
            
            {status === 'executing' && (
              <button
                onClick={pauseSession}
                className="glass-button flex items-center space-x-2 text-yellow-400 hover:text-yellow-300"
              >
                <Pause className="w-4 h-4" />
                <span>Pause</span>
              </button>
            )}
            
            {status === 'paused' && (
              <>
                <button
                  onClick={resumeSession}
                  className="glass-button flex items-center space-x-2 text-green-400 hover:text-green-300"
                >
                  <Play className="w-4 h-4" />
                  <span>Resume</span>
                </button>
                <button
                  onClick={cancelSession}
                  className="glass-button flex items-center space-x-2 text-red-400 hover:text-red-300"
                >
                  <Square className="w-4 h-4" />
                  <span>Stop</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'workspace'
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Workspace</span>
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('chat')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'chat'
                ? 'bg-white/20 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <div className="flex items-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
              {messages.length > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                  {messages.length}
                </span>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'workspace' && (
          <div className="h-full p-4">
            {/* Workspace Layout Controls */}
            <div className="flex justify-end mb-4">
              <div className="glass-effect rounded-lg p-1 flex space-x-1">
                <button
                  onClick={() => setWorkspaceLayout('split')}
                  className={`p-2 rounded text-xs ${
                    workspaceLayout === 'split' ? 'bg-white/20 text-white' : 'text-gray-400'
                  }`}
                  title="Split View"
                >
                  Split
                </button>
                <button
                  onClick={() => setWorkspaceLayout('browser')}
                  className={`p-2 rounded text-xs ${
                    workspaceLayout === 'browser' ? 'bg-white/20 text-white' : 'text-gray-400'
                  }`}
                  title="Browser Only"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setWorkspaceLayout('document')}
                  className={`p-2 rounded text-xs ${
                    workspaceLayout === 'document' ? 'bg-white/20 text-white' : 'text-gray-400'
                  }`}
                  title="Document Only"
                >
                  <FileText className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Workspace Content */}
            <div className="h-[calc(100%-64px)]">
              {workspaceLayout === 'split' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
                  <div className="h-full">
                    {session?.browser_session_id && (
                      <BrowserBlock sessionId={session.browser_session_id} />
                    )}
                  </div>
                  <div className="h-full">
                    <DocumentBlock 
                      content={session?.document_content || ''} 
                      editable={status === 'paused' || status === 'idle'}
                      assignment={assignment}
                    />
                  </div>
                </div>
              )}
              
              {workspaceLayout === 'browser' && session?.browser_session_id && (
                <BrowserBlock sessionId={session.browser_session_id} />
              )}
              
              {workspaceLayout === 'document' && (
                <DocumentBlock 
                  content={session?.document_content || ''} 
                  editable={status === 'paused' || status === 'idle'}
                  assignment={assignment}
                />
              )}
              
              {/* Empty state */}
              {!session?.browser_session_id && workspaceLayout !== 'document' && (
                <div className="glass-card h-full flex items-center justify-center">
                  <div className="text-center">
                    <Monitor className="w-12 h-12 text-gray-500 mx-auto mb-4" />
                    <p className="text-gray-400">No active browser session</p>
                    <p className="text-gray-500 text-sm mt-2">
                      Start the agent to begin automation
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="h-full p-4">
            <ChatPanel 
              sessionId={session?.id}
              messages={messages}
              assignment={assignment}
            />
          </div>
        )}
      </div>
    </div>
  );
}