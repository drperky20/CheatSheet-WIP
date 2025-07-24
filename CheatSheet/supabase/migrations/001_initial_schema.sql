-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Core tables with RLS
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tenant_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  email TEXT UNIQUE NOT NULL,
  canvas_domain TEXT,
  encrypted_canvas_token TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE agent_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignment_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('planning', 'executing', 'paused', 'completed', 'failed')),
  browser_session_id TEXT,
  final_document JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own sessions" ON agent_sessions
  FOR ALL USING (auth.uid() = user_id);