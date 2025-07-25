import { useCallback } from 'react'; // useState, useEffect removed - not used in this hook
import { useAgentStore } from '@/stores/agentStore';

// These interface definitions are currently unused but kept for future type safety
// when direct agent session manipulation is needed
// interface AgentSession and interface AgentUpdate - removed to fix unused variable warnings

export function useAgentSession(assignmentId: string) {
  // Use the global agent store
  const {
    currentSession,
    sessionStatus,
    messages,
    isConnected,
    startSession: globalStartSession,
    pauseSession: globalPauseSession,
    resumeSession: globalResumeSession,
    cancelSession: globalCancelSession
  } = useAgentStore();

  // Wrapper functions for this specific assignment
  const startSession = useCallback(async () => {
    await globalStartSession(assignmentId, `Complete assignment ${assignmentId}`);
  }, [assignmentId, globalStartSession]);

  const pauseSession = useCallback(async () => {
    await globalPauseSession();
  }, [globalPauseSession]);

  const resumeSession = useCallback(async () => {
    await globalResumeSession();
  }, [globalResumeSession]);

  const cancelSession = useCallback(async () => {
    await globalCancelSession();
  }, [globalCancelSession]);

  // Filter session and messages for this assignment if needed
  const session = currentSession?.assignment_id === assignmentId ? currentSession : null;
  const status = session ? sessionStatus : 'idle';

  return {
    session,
    status,
    messages,
    isConnected,
    startSession,
    pauseSession,
    resumeSession,
    cancelSession
  };
}