-- Agent Session Management Functions
-- ===================================

-- Function to create a new agent session
CREATE OR REPLACE FUNCTION create_agent_session(
  p_user_id UUID,
  p_assignment_id TEXT,
  p_assignment_name TEXT,
  p_task_type TEXT DEFAULT 'research'
)
RETURNS TABLE(
  session_id UUID,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  new_session_id UUID;
  new_created_at TIMESTAMPTZ;
BEGIN
  INSERT INTO agent_sessions (
    user_id,
    assignment_id,
    assignment_name,
    task_type,
    status,
    progress,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_assignment_id,
    p_assignment_name,
    p_task_type,
    'planning',
    0,
    NOW(),
    NOW()
  )
  RETURNING id, created_at INTO new_session_id, new_created_at;
  
  RETURN QUERY SELECT new_session_id, new_created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update agent session status
CREATE OR REPLACE FUNCTION update_agent_session(
  p_session_id UUID,
  p_user_id UUID,
  p_status TEXT DEFAULT NULL,
  p_progress INTEGER DEFAULT NULL,
  p_browser_url TEXT DEFAULT NULL,
  p_document_content TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_session_data JSONB DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_sessions 
  SET 
    status = COALESCE(p_status, status),
    progress = COALESCE(p_progress, progress),
    browser_url = COALESCE(p_browser_url, browser_url),
    document_content = COALESCE(p_document_content, document_content),
    error_message = COALESCE(p_error_message, error_message),
    session_data = COALESCE(p_session_data, session_data),
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get agent session details
CREATE OR REPLACE FUNCTION get_agent_session(
  p_session_id UUID,
  p_user_id UUID
)
RETURNS TABLE(
  id UUID,
  assignment_id TEXT,
  assignment_name TEXT,
  task_type TEXT,
  status TEXT,
  progress INTEGER,
  browser_session_id TEXT,
  browser_url TEXT,
  document_content TEXT,
  error_message TEXT,
  session_data JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.assignment_id,
    s.assignment_name,
    s.task_type,
    s.status,
    s.progress,
    s.browser_session_id,
    s.browser_url,
    s.document_content,
    s.error_message,
    s.session_data,
    s.created_at,
    s.updated_at
  FROM agent_sessions s
  WHERE s.id = p_session_id AND s.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's agent sessions with pagination
CREATE OR REPLACE FUNCTION get_user_agent_sessions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0,
  p_status_filter TEXT DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  assignment_id TEXT,
  assignment_name TEXT,
  task_type TEXT,
  status TEXT,
  progress INTEGER,
  browser_url TEXT,
  document_length INTEGER,
  error_message TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  total_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.assignment_id,
    s.assignment_name,
    s.task_type,
    s.status,
    s.progress,
    s.browser_url,
    COALESCE(LENGTH(s.document_content), 0) as document_length,
    s.error_message,
    s.created_at,
    s.updated_at,
    COUNT(*) OVER() as total_count
  FROM agent_sessions s
  WHERE s.user_id = p_user_id
    AND (p_status_filter IS NULL OR s.status = p_status_filter)
  ORDER BY s.updated_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add message to agent session
CREATE OR REPLACE FUNCTION add_agent_message(
  p_session_id UUID,
  p_user_id UUID,
  p_message_type TEXT,
  p_content TEXT,
  p_tool_name TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  new_message_id UUID;
  session_exists BOOLEAN;
BEGIN
  -- Verify session belongs to user
  SELECT EXISTS(
    SELECT 1 FROM agent_sessions 
    WHERE id = p_session_id AND user_id = p_user_id
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  -- Insert message
  INSERT INTO agent_messages (
    session_id,
    message_type,
    content,
    tool_name,
    metadata,
    created_at
  ) VALUES (
    p_session_id,
    p_message_type,
    p_content,
    p_tool_name,
    p_metadata,
    NOW()
  )
  RETURNING id INTO new_message_id;
  
  -- Update session updated_at
  UPDATE agent_sessions 
  SET updated_at = NOW() 
  WHERE id = p_session_id;
  
  RETURN new_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get messages for an agent session
CREATE OR REPLACE FUNCTION get_agent_messages(
  p_session_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE(
  id UUID,
  message_type TEXT,
  content TEXT,
  tool_name TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ
) AS $$
DECLARE
  session_exists BOOLEAN;
BEGIN
  -- Verify session belongs to user
  SELECT EXISTS(
    SELECT 1 FROM agent_sessions 
    WHERE id = p_session_id AND user_id = p_user_id
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RAISE EXCEPTION 'Session not found or access denied';
  END IF;
  
  RETURN QUERY
  SELECT 
    m.id,
    m.message_type,
    m.content,
    m.tool_name,
    m.metadata,
    m.created_at
  FROM agent_messages m
  WHERE m.session_id = p_session_id
  ORDER BY m.created_at ASC
  LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete agent session with final document
CREATE OR REPLACE FUNCTION complete_agent_session(
  p_session_id UUID,
  p_user_id UUID,
  p_final_document JSONB,
  p_document_content TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_sessions 
  SET 
    status = 'completed',
    progress = 100,
    final_document = p_final_document,
    document_content = p_document_content,
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cancel/fail agent session
CREATE OR REPLACE FUNCTION cancel_agent_session(
  p_session_id UUID,
  p_user_id UUID,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE agent_sessions 
  SET 
    status = 'failed',
    error_message = COALESCE(p_error_message, 'Session cancelled by user'),
    updated_at = NOW()
  WHERE id = p_session_id AND user_id = p_user_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get session analytics/stats
CREATE OR REPLACE FUNCTION get_user_session_stats(p_user_id UUID)
RETURNS TABLE(
  total_sessions BIGINT,
  completed_sessions BIGINT,
  failed_sessions BIGINT,
  active_sessions BIGINT,
  avg_completion_time INTERVAL,
  total_documents_generated BIGINT,
  total_words_generated BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*) as total_sessions,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_sessions,
    COUNT(*) FILTER (WHERE status = 'failed') as failed_sessions,
    COUNT(*) FILTER (WHERE status IN ('planning', 'executing', 'paused')) as active_sessions,
    AVG(updated_at - created_at) FILTER (WHERE status = 'completed') as avg_completion_time,
    COUNT(*) FILTER (WHERE final_document IS NOT NULL) as total_documents_generated,
    SUM(
      CASE 
        WHEN document_content IS NOT NULL 
        THEN array_length(string_to_array(document_content, ' '), 1)
        ELSE 0 
      END
    ) as total_words_generated
  FROM agent_sessions
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;