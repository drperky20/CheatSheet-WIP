# CLAUDE.md - CheatSheet Project Documentation

This file provides comprehensive guidance to Claude Code when working with the CheatSheet codebase - an autonomous academic workspace powered by AI agents.

## 🎯 Project Overview

**CheatSheet** is a full-stack AI-powered academic workspace that combines modern web technologies with autonomous AI agents to assist students and educators with academic tasks.

### Core Architecture
- **Frontend**: Next.js 15.3.2 + React 19 + TypeScript + Tailwind CSS
- **AI Integration**: CopilotKit 1.9.3 + LangGraph 0.4.10 + OpenRouter (Qwen 3 235B)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **Agent Runtime**: Python 3.12+ with FastAPI + Uvicorn

### Key Value Proposition
CEO-Remote Operative pattern where the LangGraph agent acts as an autonomous "Remote Operative" executing complex academic tasks while maintaining seamless UI integration through CopilotKit.

## 📁 Directory Structure & Key Files

```
CheatSheet/
├── src/                           # Next.js Application Source
│   ├── app/                      # App Router Pages & API Routes
│   │   ├── api/copilotkit/       # CopilotKit integration endpoint
│   │   ├── auth/                 # Authentication system
│   │   │   ├── login/page.tsx    # Google OAuth login page
│   │   │   └── callback/route.ts # OAuth callback handler
│   │   ├── dashboard/page.tsx    # Main application dashboard
│   │   ├── globals.css           # Global styles + glass-card effects
│   │   ├── layout.tsx            # Root layout with CopilotKit provider
│   │   └── page.tsx             # Home page with auth redirect logic
│   └── components/               # React Components
│       └── auth/                 # Authentication components
│           └── LoginForm.tsx     # Google sign-in component
├── lib/                          # Shared Utilities
│   └── supabase/                # Supabase client configurations
│       ├── client.ts            # Browser-side Supabase client
│       └── server.ts            # Server-side Supabase client
├── agent/                        # Python LangGraph Agent
│   ├── agent.py                 # Main agent workflow with ReAct pattern
│   ├── requirements.txt         # Python dependencies
│   ├── langgraph.json          # LangGraph configuration
│   └── .venv/                  # Python virtual environment
├── supabase/                     # Database Configuration
│   └── migrations/              # SQL migration files
│       └── 001_initial_schema.sql # Core tables + RLS policies
├── scripts/                      # Development Scripts
├── package.json                  # Node.js project configuration
├── tsconfig.json                # TypeScript configuration
├── next.config.ts               # Next.js configuration
├── .env.example                 # Environment variables template
└── CLAUDE.md                    # This file - project guidance
```

## 🏗️ Technology Stack Deep Dive

### Frontend Technologies
- **Next.js 15.3.2**: App Router, Server Components, TypeScript strict mode
- **React 19.0.0**: Latest React with concurrent features
- **Tailwind CSS 4.x**: Utility-first styling with custom glass effects
- **CopilotKit 1.9.3**: AI chat interface with agent integration
- **Zustand 5.0.6**: State management (planned for complex UI state)
- **TipTap 3.0.7**: Rich text editor (planned for document editing)
- **Framer Motion 12.23.7**: Animations (planned for enhanced UX)
- **Lucide React 0.525.0**: Icon library

### Backend & AI Stack
- **LangGraph 0.4.10**: Agent state management and workflow
- **LangChain 0.3.26**: LLM utilities and integrations
- **OpenRouter API**: LLM provider access (Qwen 3 235B)
- **FastAPI + Uvicorn**: Python web server for agent
- **Supabase**: PostgreSQL database with Auth and RLS

### Database Schema
```sql
-- Core user profile with tenant isolation
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tenant_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  email TEXT UNIQUE NOT NULL,
  canvas_domain TEXT,                    -- Canvas LMS integration
  encrypted_canvas_token TEXT,           -- Secure token storage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI agent session tracking
CREATE TABLE agent_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignment_id TEXT NOT NULL,
  status TEXT CHECK (status IN ('planning', 'executing', 'paused', 'completed', 'failed')),
  browser_session_id TEXT,              -- Browser automation context
  final_document JSONB,                 -- Completed work output
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🔧 Development Workflow

### Setup Commands
```bash
# Initial setup
npm install                    # Install Node.js dependencies
python3 -m venv agent/.venv   # Create Python virtual environment
source agent/.venv/bin/activate  # Activate virtual environment (Linux/Mac)
pip install -r agent/requirements.txt  # Install Python dependencies

# Environment configuration
cp .env.example .env          # Copy environment template
# Edit .env with your API keys and Supabase credentials
```

### Development Commands
```bash
npm run dev                   # Start concurrent UI + agent development
npm run dev:debug            # Debug mode with enhanced logging
npm run build                # Production build
npm run lint                 # Code quality checks
npx tsc --noEmit             # TypeScript compilation check
```

### Key Environment Variables
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Model Configuration (Required)
OPENROUTER_API_KEY=your_openrouter_api_key

# Optional Integrations
COPILOTKIT_API_KEY=your_copilotkit_api_key
LANGSMITH_API_KEY=your_langsmith_api_key_for_debugging
```

## 🎨 UI/UX Design System

### Glass Card Effect
```css
.glass-card {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  padding: 2rem;
  box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.37);
}
```

### Color Scheme
- Primary gradient: `from-gray-900 to-black`
- Glass overlay: `rgba(255, 255, 255, 0.1)`
- Text hierarchy: `text-white`, `text-gray-300`, `text-gray-600`

## 🔐 Authentication Flow

### Google OAuth Implementation
1. **Login**: User clicks "Continue with Google" in `LoginForm.tsx:handleGoogleLogin()`
2. **OAuth**: Supabase redirects to Google OAuth
3. **Callback**: Google redirects to `/auth/callback` route
4. **Session**: `route.ts:GET()` exchanges code for session
5. **Redirect**: User redirected to `/dashboard` on success

### Security Features
- **Row Level Security (RLS)** on all user data tables
- **Tenant isolation** via `tenant_id` for multi-user support
- **Encrypted token storage** for Canvas LMS integration
- **Server-side session management** with Supabase Auth

## 🤖 AI Agent Architecture

### LangGraph Agent (`agent/agent.py`)
```python
# ReAct Pattern Implementation
class AcademicAgent:
    def __init__(self):
        self.llm = ChatOpenAI(model="qwen/qwen-110b-chat")  # OpenRouter
        self.tools = [weather_tool]  # Extensible tool system
        
    def workflow(self):
        # Reasoning → Action → Observation cycle
        # State management with LangGraph
        # Tool execution with error handling
```

### CopilotKit Integration
- **Frontend**: `CopilotSidebar` component in layout
- **Backend**: API endpoint at `/api/copilotkit`
- **State Sync**: Shared state between UI and agent
- **Tool Calls**: Frontend actions trigger agent tools

## 📋 Current Implementation Status

### ✅ Completed Features
- **Authentication System**: Google OAuth with Supabase Auth
- **Database Foundation**: Multi-tenant PostgreSQL with RLS
- **AI Agent Framework**: LangGraph + CopilotKit integration
- **UI Foundation**: Glass-effect design with authentication flow
- **Development Environment**: Cross-platform setup with scripts
- **TypeScript Configuration**: Strict mode with path resolution

### 🚧 Placeholder Implementations
- **Dashboard**: Basic layout without functional features
- **Agent Tools**: Sample weather tool only
- **Document Management**: TipTap installed but not integrated

### 📋 Planned Phase 2 Features
- **Canvas LMS Integration**: Assignment sync and submission
- **Document Workspace**: Rich text editing with AI assistance
- **Browser Automation**: Research and data gathering tools
- **Advanced AI Tools**: Research, writing, citation management
- **Collaboration**: Multi-user academic workflows

## 🛠️ Development Guidelines

### Code Style & Patterns
- **TypeScript Strict Mode**: All code must type-check without errors
- **React Patterns**: Functional components, hooks, server components where appropriate
- **Error Handling**: Comprehensive try-catch with user-friendly error states
- **Async/Await**: Consistent async pattern throughout
- **Path Imports**: Use `@/` prefix for all internal imports

### File Organization
- **Components**: Organized by feature (`auth/`, `dashboard/`, etc.)
- **API Routes**: Follow Next.js App Router conventions
- **Database**: All changes via migrations in `supabase/migrations/`
- **Agent Code**: Python code in `agent/` directory with virtual environment

### Testing Strategy
```bash
# TypeScript compilation
npx tsc --noEmit

# Linting
npm run lint

# Runtime testing
npm run dev  # Manual testing with hot reload
```

## 🚨 Critical Considerations

### Security Requirements
- **Never commit API keys** - use .env files only
- **Validate all user inputs** before database operations
- **Use RLS policies** for all data access
- **Encrypt sensitive data** like Canvas tokens

### Performance Considerations
- **Server Components** for static content where possible
- **Client Components** only when interactivity is required
- **Database indexing** on foreign keys and frequent query columns
- **LLM rate limiting** to prevent API overuse

### Debugging Tools
- **LangSmith**: Optional LLM call tracing (set LANGSMITH_API_KEY)
- **Supabase Dashboard**: Database inspection and real-time logs
- **Browser DevTools**: Frontend debugging with React DevTools
- **Python Debugger**: Use debugpy for agent debugging

## 🎯 Development Priorities

### Immediate Tasks (Phase 2)
1. **Canvas LMS Integration**: Connect to institutional Canvas instances
2. **Document Workspace**: Implement rich text editing with AI assistance
3. **Agent Tool Expansion**: Add research, citation, and writing tools
4. **User Dashboard**: Build assignment tracking and progress management

### Architecture Improvements
1. **State Management**: Implement Zustand for complex UI state
2. **Error Boundaries**: Add React error boundaries for better UX
3. **Loading States**: Implement skeleton loading for all async operations
4. **Offline Support**: Add service worker for offline document editing

## 📖 Key Learning Resources

- **LangGraph Documentation**: https://langchain-ai.github.io/langgraph/
- **CopilotKit Guides**: https://docs.copilotkit.ai/
- **Supabase Auth**: https://supabase.com/docs/guides/auth
- **Next.js App Router**: https://nextjs.org/docs/app

---

## Quick Reference Commands

```bash
# Development
npm run dev                    # Start development servers
npm run build                  # Production build
npm run lint                   # Code quality check
npx tsc --noEmit              # TypeScript check

# Database
supabase start                # Local Supabase (if installed)
supabase db reset             # Reset local database

# Agent Development
cd agent && source .venv/bin/activate  # Activate Python environment
python agent.py              # Run agent directly
```

**Remember**: Always check authentication state, validate user inputs, and maintain proper error handling throughout the application.