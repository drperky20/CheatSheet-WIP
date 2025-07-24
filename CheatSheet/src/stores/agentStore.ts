import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { agentService, realtimeService, type AgentSession, type AgentMessage } from '@/lib/supabase/services';

// Use imported types from services
// interface AgentSession and AgentMessage are now imported

interface AgentUpdate {
  type: 'status_change' | 'progress' | 'browser_navigation' | 'document_update' | 'tool_call' | 'stream';
  status?: string;
  progress?: number;
  url?: string;
  content?: string;
  tool?: string;
  message?: string;
}

interface AgentState {
  // Session data
  currentSession: AgentSession | null;
  sessionStatus: 'idle' | 'planning' | 'executing' | 'paused' | 'completed' | 'failed';
  
  // Real-time updates
  messages: AgentMessage[];
  browserUrl: string | null;
  documentContent: string;
  completionPercentage: number;
  
  // SSE connection
  isConnected: boolean;
  
  // Actions
  startSession: (assignmentId: string, taskDescription: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  cancelSession: () => Promise<void>;
  updateFromSSE: (update: AgentUpdate) => void;
  addMessage: (message: AgentMessage) => void;
  setConnectionStatus: (connected: boolean) => void;
}

export const useAgentStore = create<AgentState>()(
  subscribeWithSelector((set, get) => ({
    currentSession: null,
    sessionStatus: 'idle',
    messages: [],
    browserUrl: null,
    documentContent: '',
    completionPercentage: 0,
    isConnected: false,
    
    startSession: async (assignmentId: string, taskDescription: string) => {
      try {
        // Create session in Supabase
        const sessionData = await agentService.createSession(
          assignmentId,
          taskDescription,
          'research'
        );
        
        const newSession: AgentSession = {
          id: sessionData.session_id,
          assignment_id: assignmentId,
          assignment_name: taskDescription,
          task_type: 'research',
          status: 'planning',
          progress: 0,
          browser_session_id: null,
          browser_url: null,
          document_content: null,
          error_message: null,
          session_data: {},
          created_at: sessionData.created_at,
          updated_at: sessionData.created_at
        };
        
        set({
          currentSession: newSession,
          sessionStatus: 'planning',
          messages: [],
          completionPercentage: 0
        });
        
        // Start real-time subscriptions
        subscribeToAgentUpdates(sessionData.session_id);
        
        // Also start the backend agent via API
        startBackendAgent(sessionData.session_id, assignmentId, taskDescription);
        
      } catch (error) {
        console.error('Failed to start session:', error);
        set({ sessionStatus: 'failed' });
      }
    },
    
    pauseSession: async () => {
      const { currentSession } = get();
      if (!currentSession) return;
      
      try {
        await agentService.updateSession(currentSession.id, { status: 'paused' });
        set({ sessionStatus: 'paused' });
        
        // Also pause the backend agent
        fetch(`/api/v1/agent/pause/${currentSession.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }).catch(console.error);
      } catch (error) {
        console.error('Failed to pause session:', error);
      }
    },
    
    resumeSession: async () => {
      const { currentSession } = get();
      if (!currentSession) return;
      
      try {
        await agentService.updateSession(currentSession.id, { status: 'executing' });
        set({ sessionStatus: 'executing' });
        
        // Also resume the backend agent
        fetch(`/api/v1/agent/resume/${currentSession.id}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }).catch(console.error);
      } catch (error) {
        console.error('Failed to resume session:', error);
      }
    },
    
    cancelSession: async () => {
      const { currentSession } = get();
      if (!currentSession) return;
      
      try {
        await agentService.cancelSession(currentSession.id, 'Cancelled by user');
        
        // Also cancel the backend agent
        fetch(`/api/v1/agent/cancel/${currentSession.id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        }).catch(console.error);
        
        set({
          currentSession: null,
          sessionStatus: 'idle',
          messages: [],
          browserUrl: null,
          documentContent: '',
          completionPercentage: 0,
          isConnected: false
        });
      } catch (error) {
        console.error('Failed to cancel session:', error);
      }
    },
    
    updateFromSSE: (update: AgentUpdate) => {
      const { currentSession } = get();
      
      switch (update.type) {
        case 'status_change':
          if (update.status) {
            set({ 
              sessionStatus: update.status as AgentState['sessionStatus'],
              currentSession: currentSession ? {
                ...currentSession,
                status: update.status as AgentSession['status']
              } : null
            });
          }
          break;
          
        case 'progress':
          if (update.progress !== undefined) {
            set({ 
              completionPercentage: update.progress,
              currentSession: currentSession ? {
                ...currentSession,
                progress: update.progress
              } : null
            });
          }
          break;
          
        case 'browser_navigation':
          if (update.url) {
            set({ 
              browserUrl: update.url,
              currentSession: currentSession ? {
                ...currentSession,
                browser_session_id: currentSession.browser_session_id || 'browser-1'
              } : null
            });
          }
          break;
          
        case 'document_update':
          if (update.content) {
            set({ 
              documentContent: update.content,
              currentSession: currentSession ? {
                ...currentSession,
                document_content: update.content
              } : null
            });
          }
          break;
          
        case 'tool_call':
        case 'stream':
          // Create a message with proper AgentMessage structure
          const messageData = {
            id: Date.now().toString(), // Temporary ID
            message_type: update.type === 'tool_call' ? 'tool_call' as const : 'agent' as const,
            content: update.message || update.content || '',
            tool_name: update.tool || null,
            metadata: { type: update.type },
            created_at: new Date().toISOString()
          };
          
          const message: AgentMessage = messageData;
          
          set(state => ({
            messages: [...state.messages, message]
          }));
          break;
      }
    },
    
    addMessage: (message: AgentMessage) => {
      set(state => ({
        messages: [...state.messages, message]
      }));
    },
    
    setConnectionStatus: (connected: boolean) => {
      set({ isConnected: connected });
    }
  }))
);

// Real-time subscription functions
function subscribeToAgentUpdates(sessionId: string) {
  const { updateFromSSE, setConnectionStatus } = useAgentStore.getState();

  // Subscribe to session updates
  const sessionSubscription = realtimeService.subscribeToAgentSession(
    sessionId,
    (payload) => {
      const session = payload.new as AgentSession;
      updateFromSSE({
        type: 'status_change',
        status: session.status,
        progress: session.progress
      });
      
      if (session.browser_url) {
        updateFromSSE({
          type: 'browser_navigation',
          url: session.browser_url
        });
      }
      
      if (session.document_content) {
        updateFromSSE({
          type: 'document_update',
          content: session.document_content
        });
      }
    }
  );

  // Subscribe to new messages
  const messagesSubscription = realtimeService.subscribeToAgentMessages(
    sessionId,
    (payload) => {
      const message = payload.new as AgentMessage;
      updateFromSSE({
        type: message.message_type === 'tool_call' ? 'tool_call' : 'stream',
        message: message.content || '',
        tool: message.tool_name || undefined
      });
    }
  );

  setConnectionStatus(true);

  // Store subscriptions for cleanup
  (window as unknown as Record<string, unknown>).agentSubscriptions = {
    session: sessionSubscription,
    messages: messagesSubscription
  };

  // Also start SSE for backend agent API
  const eventSource = new EventSource(
    `/api/v1/agent/stream/${sessionId}`,
    { withCredentials: true }
  );

  eventSource.onmessage = (event) => {
    try {
      const update: AgentUpdate = JSON.parse(event.data);
      updateFromSSE(update);
    } catch (error) {
      console.error('Failed to parse SSE message:', error);
    }
  };

  eventSource.onerror = (error) => {
    console.error('SSE connection error:', error);
    eventSource.close();
  };

  (window as unknown as Record<string, unknown>).agentEventSource = eventSource;
}

// Start the backend agent via API
async function startBackendAgent(sessionId: string, assignmentId: string, taskDescription: string) {
  try {
    const response = await fetch('/api/v1/agent/invoke', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify({ 
        session_id: sessionId,
        assignment_id: assignmentId,
        task_description: taskDescription,
        task_type: 'research'
      })
    });
    
    if (!response.ok) {
      console.error('Failed to start backend agent:', response.statusText);
    }
  } catch (error) {
    console.error('Failed to start backend agent:', error);
  }
}

// Cleanup function for subscriptions
export function cleanupAgentSSE() {
  // Cleanup SSE
  if ((window as unknown as Record<string, unknown>).agentEventSource) {
    ((window as unknown as Record<string, unknown>).agentEventSource as EventSource).close();
    delete (window as unknown as Record<string, unknown>).agentEventSource;
  }
  
  // Cleanup Supabase subscriptions
  if ((window as unknown as Record<string, unknown>).agentSubscriptions) {
    const subs = (window as unknown as Record<string, unknown>).agentSubscriptions as {
      session: ReturnType<typeof realtimeService.subscribeToAgentSession>;
      messages: ReturnType<typeof realtimeService.subscribeToAgentMessages>;
    };
    if (subs.session) realtimeService.unsubscribe(subs.session);
    if (subs.messages) realtimeService.unsubscribe(subs.messages);
    delete (window as unknown as Record<string, unknown>).agentSubscriptions;
  }
}