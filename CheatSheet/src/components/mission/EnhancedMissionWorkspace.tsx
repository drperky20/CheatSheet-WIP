'use client';

import { useState } from 'react';
import { BrowserBlock } from './BrowserBlock';
import { DocumentBlock } from './DocumentBlock';
import { useAgentSession } from '@/hooks/useAgentSession';
import { 
  Play, 
  Pause, 
  Square, 
  Monitor, 
  FileText, 
  Activity,
  CheckCircle,
  AlertCircle,
  Target
} from 'lucide-react';
import { type Assignment } from '@/lib/supabase/services';
import { CopilotChat } from "@copilotkit/react-ui";
import { useCopilotAction, useCopilotReadable } from "@copilotkit/react-core";
import ClientOnlyIcon from '@/components/ui/ClientOnlyIcon';

interface EnhancedMissionWorkspaceProps {
  assignmentId: string;
  assignment: Assignment;
}

export function EnhancedMissionWorkspace({ assignmentId, assignment }: EnhancedMissionWorkspaceProps) {
  const { 
    session, 
    status, 
    messages, 
    isConnected, 
    startSession, 
    pauseSession, 
    resumeSession, 
    cancelSession 
  } = useAgentSession(assignmentId);
  
  const [workspaceLayout, setWorkspaceLayout] = useState<'split' | 'browser' | 'document'>('split');

  // Provide assignment context to CopilotKit
  useCopilotReadable({
    description: "Current assignment details",
    value: {
      id: assignment.id,
      name: assignment.name,
      description: assignment.description,
      dueDate: assignment.due_at,
      pointsPossible: assignment.points_possible,
      submissionTypes: assignment.submission_types,
      hasSubmittedSubmissions: assignment.has_submitted_submissions,
      workflowState: assignment.workflow_state,
      isOverdue: assignment.is_overdue
    }
  });

  // Provide session context to CopilotKit
  useCopilotReadable({
    description: "Current agent session status and progress",
    value: {
      status: status,
      isConnected: isConnected,
      progressPercentage: session?.progress || 0,
      currentUrl: session?.browser_url || null,
      messagesCount: messages.length
    }
  });

  // CopilotKit actions for mission control
  useCopilotAction({
    name: "startMission",
    description: "Start the AI agent mission for the current assignment",
    parameters: [],
    handler: async () => {
      await startSession();
      return "Mission started! The AI agent is now working on your assignment.";
    }
  });

  useCopilotAction({
    name: "pauseMission", 
    description: "Pause the current AI agent mission",
    parameters: [],
    handler: async () => {
      await pauseSession();
      return "Mission paused. You can resume it anytime.";
    }
  });

  useCopilotAction({
    name: "resumeMission",
    description: "Resume the paused AI agent mission", 
    parameters: [],
    handler: async () => {
      await resumeSession();
      return "Mission resumed! The AI agent is continuing work on your assignment.";
    }
  });

  useCopilotAction({
    name: "cancelMission",
    description: "Cancel the current AI agent mission",
    parameters: [],
    handler: async () => {
      await cancelSession();
      return "Mission cancelled. All progress has been saved.";
    }
  });

  useCopilotAction({
    name: "changeWorkspaceLayout",
    description: "Change the workspace layout view",
    parameters: [
      {
        name: "layout",
        type: "string",
        description: "The layout type: 'split', 'browser', or 'document'",
        required: true
      }
    ],
    handler: async ({ layout }) => {
      if (['split', 'browser', 'document'].includes(layout)) {
        setWorkspaceLayout(layout as 'split' | 'browser' | 'document');
        return `Workspace layout changed to ${layout} view.`;
      }
      return "Invalid layout type. Use 'split', 'browser', or 'document'.";
    }
  });

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

  const getActionButton = () => {
    switch (status) {
      case 'idle':
        return (
          <button
            onClick={startSession}
            className="glass-button-success flex items-center space-x-2 px-6 py-3"
            disabled={!isConnected}
          >
            <ClientOnlyIcon icon={Play} className="w-4 h-4" />
            <span>Start Mission</span>
          </button>
        );
      case 'planning':
      case 'executing':
        return (
          <button
            onClick={pauseSession}
            className="glass-button flex items-center space-x-2 px-6 py-3"
          >
            <ClientOnlyIcon icon={Pause} className="w-4 h-4" />
            <span>Pause Mission</span>
          </button>
        );
      case 'paused':
        return (
          <div className="flex space-x-2">
            <button
              onClick={resumeSession}
              className="glass-button-success flex items-center space-x-2 px-4 py-3"
            >
              <ClientOnlyIcon icon={Play} className="w-4 h-4" />
              <span>Resume</span>
            </button>
            <button
              onClick={cancelSession}
              className="glass-button-danger flex items-center space-x-2 px-4 py-3"
            >
              <ClientOnlyIcon icon={Square} className="w-4 h-4" />
              <span>Cancel</span>
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="h-screen relative flex flex-col overflow-hidden">
      {/* Enhanced Background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 gradient-mesh" />
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="floating-orb orb-purple w-96 h-96 top-20 -left-32 animate-float" />
        <div className="floating-orb orb-indigo w-80 h-80 bottom-20 -right-32 animate-float" style={{ animationDelay: '4s' }} />
        <div className="aurora-bg absolute top-1/3 right-1/4 w-[600px] h-[400px] rounded-full" />
      </div>
      
      {/* Premium Header */}
      <header className="glass border-b border-white/10 safe-top backdrop-blur-xl z-50">
        <div className="px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center space-x-5">
              <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-600/20 shadow-glow">
                <ClientOnlyIcon icon={Target} className="w-8 h-8 text-purple-300" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gradient-animate mb-2 truncate">
                  {assignment.name}
                </h1>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                    <span className={`${getStatusColor(status)}`}>
                      {getStatusIcon(status)}
                    </span>
                    <span className={`text-sm font-semibold capitalize ${getStatusColor(status)}`}>
                      {status}
                    </span>
                  </div>
                  {session?.progress && (
                    <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      <span className="text-sm text-gray-300 font-medium">
                        {session.progress}% complete
                      </span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 glass rounded-full px-4 py-2">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    <span className={`text-sm font-medium ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                      {isConnected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {getActionButton()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Workspace Area */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Layout Toggle */}
          <div className="lg:hidden p-4 border-b border-white/10">
            <div className="flex space-x-2">
              <button
                onClick={() => setWorkspaceLayout('browser')}
                className={`glass-button p-2 ${workspaceLayout === 'browser' ? 'bg-blue-500/20' : ''}`}
              >
                <ClientOnlyIcon icon={Monitor} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWorkspaceLayout('document')}
                className={`glass-button p-2 ${workspaceLayout === 'document' ? 'bg-blue-500/20' : ''}`}
              >
                <ClientOnlyIcon icon={FileText} className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWorkspaceLayout('split')}
                className={`glass-button p-2 ${workspaceLayout === 'split' ? 'bg-blue-500/20' : ''}`}
              >
                <span className="text-xs">Split</span>
              </button>
            </div>
          </div>

          {/* Browser Block */}
          <div className={`
            ${workspaceLayout === 'browser' ? 'flex-1' : ''}
            ${workspaceLayout === 'document' ? 'hidden lg:block lg:w-1/2' : ''}
            ${workspaceLayout === 'split' ? 'flex-1 lg:w-1/2' : ''}
            ${workspaceLayout === 'browser' && 'lg:block'}
            ${workspaceLayout === 'document' && 'hidden lg:block'}
          `}>
            <BrowserBlock 
              sessionId={session?.id || ''}
            />
          </div>

          {/* Document Block */}
          <div className={`
            ${workspaceLayout === 'document' ? 'flex-1' : ''}
            ${workspaceLayout === 'browser' ? 'hidden lg:block lg:w-1/2' : ''}
            ${workspaceLayout === 'split' ? 'flex-1 lg:w-1/2' : ''}
            ${workspaceLayout === 'document' && 'lg:block'}
            ${workspaceLayout === 'browser' && 'hidden lg:block'}
          `}>
            <DocumentBlock 
              content={session?.document_content || ''}
              editable={status !== 'executing'}
              assignment={assignment}
            />
          </div>
        </div>

        {/* AI Chat Panel */}
        <div className="w-full lg:w-96 border-l border-white/10">
          <CopilotChat
            className="h-full glass-panel m-0 rounded-none border-0"
            labels={{
              title: "Mission Control",
              initial: `🎯 **Mission Control Activated**

I'm your AI assistant for this assignment: **${assignment.name}**

I can help you:
• **Control the mission** - Start, pause, resume, or cancel
• **Monitor progress** - Track agent activity and completion
• **Switch layouts** - Change workspace views  
• **Answer questions** - About the assignment or process
• **Provide guidance** - Optimize your workflow

The autonomous agent will handle the heavy lifting while I keep you informed and in control.

What would you like to do?`,
              placeholder: "Ask about the mission or give commands..."
            }}
            instructions={`You are the Mission Control AI for CheatSheet, managing an autonomous agent working on academic assignments.

CURRENT CONTEXT:
- Assignment: ${assignment.name}
- Status: ${status}
- Progress: ${session?.progress || 0}%
- Connected: ${isConnected}

CAPABILITIES:
- Start/pause/resume/cancel missions using the provided actions
- Change workspace layouts (split/browser/document views)
- Monitor and explain agent progress and activities
- Answer questions about the assignment and process
- Provide strategic guidance for academic success

PERSONALITY: Be professional, encouraging, and focused on mission success. Use mission/space terminology when appropriate. Keep the user informed and confident about the autonomous process.`}
          />
        </div>
      </div>
    </div>
  );
}