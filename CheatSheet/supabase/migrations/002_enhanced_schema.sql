-- Enhanced schema for CheatSheet with comprehensive Canvas LMS and Agent integration
-- ===================================================================================

-- Additional tables for Canvas integration
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  term TEXT,
  enrollment_state TEXT DEFAULT 'active',
  student_count INTEGER,
  canvas_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS assignments (
  id TEXT PRIMARY KEY,
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  points_possible DECIMAL,
  submission_types TEXT[],
  has_submitted_submissions BOOLEAN DEFAULT false,
  workflow_state TEXT DEFAULT 'published',
  canvas_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced agent sessions table
ALTER TABLE agent_sessions 
ADD COLUMN IF NOT EXISTS course_id TEXT REFERENCES courses(id),
ADD COLUMN IF NOT EXISTS assignment_name TEXT,
ADD COLUMN IF NOT EXISTS task_type TEXT DEFAULT 'research',
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS browser_url TEXT,
ADD COLUMN IF NOT EXISTS document_content TEXT,
ADD COLUMN IF NOT EXISTS error_message TEXT,
ADD COLUMN IF NOT EXISTS session_data JSONB DEFAULT '{}';

-- Agent session messages for chat history
CREATE TABLE IF NOT EXISTS agent_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  message_type TEXT NOT NULL CHECK (message_type IN ('user', 'agent', 'system', 'tool_call')),
  content TEXT,
  tool_name TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences and settings
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id UUID REFERENCES auth.users(id) PRIMARY KEY,
  canvas_domain TEXT,
  encrypted_canvas_token TEXT,
  ui_preferences JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "browser": true}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses
CREATE POLICY "Users can view own courses" ON courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own courses" ON courses
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for assignments
CREATE POLICY "Users can view own assignments" ON assignments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own assignments" ON assignments
  FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for agent messages
CREATE POLICY "Users can view own agent messages" ON agent_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agent_sessions 
      WHERE agent_sessions.id = agent_messages.session_id 
      AND agent_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own agent messages" ON agent_messages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM agent_sessions 
      WHERE agent_sessions.id = agent_messages.session_id 
      AND agent_sessions.user_id = auth.uid()
    )
  );

-- RLS Policies for user preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own preferences" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user_id ON assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_user_id ON agent_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_sessions_status ON agent_sessions(status);
CREATE INDEX IF NOT EXISTS idx_agent_messages_session_id ON agent_messages(session_id);

-- Update profiles table with additional fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS display_name TEXT,
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC',
ADD COLUMN IF NOT EXISTS preferences JSONB DEFAULT '{}';

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NOW()
  );
  
  INSERT INTO public.user_preferences (user_id, created_at)
  VALUES (NEW.id, NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add update triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at
  BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_agent_sessions_updated_at
  BEFORE UPDATE ON agent_sessions
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();