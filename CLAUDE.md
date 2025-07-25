# CLAUDE.md - CheatSheet Project Documentation

This file provides comprehensive guidance to Claude Code when working with the CheatSheet codebase - a sophisticated AI-powered academic workspace with autonomous agent capabilities.

## 🎯 Project Overview

**CheatSheet** is a production-ready full-stack AI academic workspace that combines modern web technologies with autonomous AI agents to automate academic tasks. The system implements a "CEO-Remote Operative" pattern where LangGraph agents execute complex academic workflows while maintaining seamless UI integration through CopilotKit.

### Core Architecture
- **Frontend**: Next.js 15.3.2 + React 19 + TypeScript + Tailwind CSS 4.x
- **AI Integration**: CopilotKit 1.9.3 + LangGraph 0.4.10 + OpenRouter (Qwen 3 235B)
- **Database**: Supabase with comprehensive schema, RLS, and real-time features
- **Agent Runtime**: Python 3.12+ with FastAPI + comprehensive tool ecosystem
- **State Management**: Zustand with real-time subscriptions and persistence
- **Automation**: Browser automation via MCP protocol with 8 specialized tools

### Key Value Proposition
Autonomous academic task execution with real-time UI integration, Canvas LMS integration, and sophisticated browser automation for research and assignment completion.

## 📁 Current Directory Structure

```
CheatSheet/
├── src/                              # Next.js Application Source
│   ├── app/                         # App Router Pages & API Routes
│   │   ├── api/copilotkit/route.ts  # CopilotKit-LangGraph integration endpoint
│   │   ├── auth/                    # Complete Authentication System
│   │   │   ├── login/page.tsx       # Login page with Google OAuth
│   │   │   ├── callback/route.ts    # OAuth callback handler
│   │   │   └── confirm/route.ts     # Email confirmation handler
│   │   ├── dashboard/page.tsx       # Main app dashboard (139 lines)
│   │   ├── mission/[id]/page.tsx    # Individual mission workspace
│   │   ├── layout.tsx               # Root layout with CopilotKit provider
│   │   ├── page.tsx                 # Home page with auth redirect logic
│   │   └── globals.css              # Glass-morphism design system
│   ├── components/                  # React Component Library
│   │   ├── auth/LoginForm.tsx       # Complete authentication component
│   │   ├── dashboard/               # Dashboard Components
│   │   │   ├── CourseList.tsx       # Course selection with Canvas integration
│   │   │   └── AssignmentList.tsx   # Assignment grid with action buttons
│   │   └── mission/                 # Mission Workspace Components
│   │       ├── MissionWorkspace.tsx # Main workspace with tabs (257 lines)
│   │       ├── BrowserBlock.tsx     # Browser automation display
│   │       ├── DocumentBlock.tsx    # Document editor component
│   │       └── ChatPanel.tsx        # Agent chat interface
│   ├── hooks/
│   │   └── useAgentSession.ts       # Agent session management hook
│   ├── stores/                      # Zustand State Management
│   │   ├── canvasStore.ts           # Canvas LMS integration store
│   │   ├── agentStore.ts            # Agent session management (366 lines)
│   │   └── uiStore.ts               # UI state management
│   └── lib/supabase/                # Supabase Integration Layer
│       ├── client.ts                # Browser-side Supabase client
│       ├── server.ts                # Server-side Supabase client
│       └── services.ts              # Complete service layer (426 lines)
├── agent/                           # Python LangGraph Agent System
│   ├── agent.py                     # Main agent with ReAct pattern (198 lines)
│   ├── api/                         # FastAPI Web Server
│   │   ├── main.py                  # FastAPI app with CORS/lifecycle
│   │   ├── routes.py                # API route handlers
│   │   ├── auth.py                  # Authentication middleware
│   │   ├── models.py                # Pydantic data models
│   │   └── sse.py                   # Server-sent events implementation
│   ├── browser_mcp/                 # Browser Automation via MCP
│   │   ├── client.py                # MCP client implementation
│   │   └── manager.py               # Browser session management
│   ├── tools/                       # Comprehensive Agent Tool Ecosystem
│   │   ├── canvas_tool.py           # Canvas LMS integration (191 lines)
│   │   └── browser_toolkit.py       # Browser automation toolkit (464 lines)
│   ├── requirements.txt             # Python dependencies
│   └── langgraph.json              # LangGraph CLI configuration
├── supabase/                        # Database Configuration
│   └── migrations/                  # SQL Migration Files
│       ├── 001_initial_schema.sql   # Core tables with RLS
│       ├── 002_enhanced_schema.sql  # Extended schema (181 lines)
│       ├── 003_canvas_functions.sql # Canvas integration (297 lines)
│       └── 004_agent_functions.sql  # Agent session functions
├── scripts/                         # Development & Setup Scripts
│   ├── setup-agent.sh/.bat         # Cross-platform agent setup
│   └── setup-supabase.sh           # Database setup automation
├── package.json                     # Node.js with concurrent dev scripts
├── tailwind.config.ts               # Extended Tailwind with animations
├── tsconfig.json                    # Strict TypeScript configuration
├── next.config.ts                   # Next.js with Turbopack config
└── .mcp.json                        # MCP server configuration
```

## 🛠️ Technology Stack Deep Dive

### Frontend Technologies
- **Next.js 15.3.2**: App Router, Server Components, Turbopack, TypeScript strict mode
- **React 19.0.0**: Latest React with concurrent features and streaming
- **Tailwind CSS 4.x**: Custom glass-morphism design system with animations
- **CopilotKit 1.9.3**: AI chat interface with agent integration and streaming
- **Zustand 5.0.6**: State management with persistence and real-time subscriptions
- **Lucide React 0.525.0**: Comprehensive icon library
- **TypeScript 5.x**: Strict mode with path resolution (`@/*`)

### Backend & AI Stack
- **LangGraph 0.4.10**: Agent state management and workflow orchestration
- **LangChain 0.3.26**: LLM utilities and tool integration
- **OpenRouter API**: LLM provider access (Qwen 3 235B model)
- **FastAPI + Uvicorn**: High-performance Python web server
- **Supabase**: PostgreSQL with Auth, RLS, and real-time subscriptions
- **MCP Protocol**: Browser automation with session management

### Database Schema (Production-Ready)

#### Core Tables with RLS
```sql
-- User profiles with Canvas integration
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tenant_id UUID DEFAULT uuid_generate_v4() NOT NULL,
  email TEXT UNIQUE NOT NULL,
  canvas_domain TEXT,                    -- Canvas LMS instance URL
  encrypted_canvas_token TEXT,           -- Secure Canvas API token
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canvas courses with comprehensive metadata
CREATE TABLE courses (
  id BIGINT PRIMARY KEY,                 -- Canvas course ID
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  course_code TEXT,
  term TEXT,
  start_date DATE,
  end_date DATE,
  enrollment_type TEXT,
  is_active BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments with due dates and requirements
CREATE TABLE assignments (
  id BIGINT PRIMARY KEY,                 -- Canvas assignment ID
  course_id BIGINT REFERENCES courses(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  due_at TIMESTAMPTZ,
  points_possible NUMERIC,
  submission_types TEXT[],
  allowed_extensions TEXT[],
  is_completed BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI agent sessions with comprehensive tracking
CREATE TABLE agent_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  assignment_id BIGINT REFERENCES assignments(id),
  name TEXT NOT NULL,
  status TEXT CHECK (status IN ('idle', 'planning', 'executing', 'paused', 'completed', 'failed')),
  browser_session_id TEXT,              -- Browser automation context
  current_url TEXT,                     -- Current browser location
  progress_percentage INTEGER DEFAULT 0,
  final_document JSONB,                 -- Completed work output
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Agent chat messages with role tracking
CREATE TABLE agent_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  session_id UUID REFERENCES agent_sessions(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('user', 'assistant', 'system', 'tool')) NOT NULL,
  content TEXT NOT NULL,
  tool_calls JSONB,                     -- Tool execution details
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Advanced Database Features
- **Row Level Security (RLS)** on all user data tables
- **Real-time subscriptions** for live UI updates
- **PostgreSQL functions** for Canvas sync and agent operations
- **Automated triggers** for timestamp updates
- **Performance indexes** on foreign keys and query patterns
- **Tenant isolation** via user_id for multi-user support

## 🤖 AI Agent Architecture (Production-Ready)

### Core Agent (`agent/agent.py` - 198 lines)
```python
class AcademicAgent:
    """
    Production LangGraph agent implementing ReAct pattern
    with comprehensive tool integration and error handling
    """
    def __init__(self):
        self.llm = ChatOpenAI(
            model="qwen/qwen-110b-chat",  # OpenRouter integration
            temperature=0.1,
            streaming=True
        )
        self.tools = [
            canvas_tool,           # Canvas LMS integration
            *browser_toolkit       # 8 browser automation tools
        ]
        
    async def workflow(self, state: AgentState) -> AgentState:
        """ReAct cycle: Reasoning → Action → Observation"""
        # Context-aware system messages
        # Tool execution with error handling
        # State persistence with Supabase
        # Real-time UI updates via SSE
```

### Comprehensive Tool Ecosystem

#### Canvas LMS Tool (`tools/canvas_tool.py` - 191 lines)
- **Complete Canvas API integration** with async support
- **Course and assignment fetching** with metadata
- **Submission handling** for various file types
- **Rate limiting** and error recovery
- **Credential management** with encryption

#### Browser Toolkit (`tools/browser_toolkit.py` - 464 lines)
8 specialized browser automation tools:
1. **`navigate_to`** - URL navigation with wait conditions
2. **`click_element`** - Smart clicking with selector validation
3. **`type_text`** - Text input with form handling
4. **`extract_content`** - Structured content extraction
5. **`take_screenshot`** - Full page and element screenshots
6. **`fill_form`** - Automated form completion
7. **`wait_for_element`** - Element visibility waiting
8. **`extract_data`** - Structured data extraction with schemas

### Agent API Server (`agent/api/`)
- **FastAPI application** with comprehensive CORS setup
- **Lifecycle management** for browser sessions and cleanup
- **Authentication middleware** with Supabase integration
- **Server-sent events** for real-time agent updates
- **Health monitoring** and status endpoints
- **Request/response models** with Pydantic validation

## 🎨 Glass-Morphism Design System

### Core Design Language
```css
/* Primary glass effect */
.glass-effect {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(16px);
  border-radius: 16px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

/* Interactive glass elements */
.glass-button {
  @apply glass-effect transition-all duration-200;
  @apply hover:bg-white/20 active:bg-white/30;
  @apply hover:border-white/30 hover:shadow-xl;
}

/* Glass form inputs */
.glass-input {
  @apply glass-effect bg-white/5 border-white/20;
  @apply focus:border-white/40 focus:bg-white/10;
  @apply placeholder:text-white/50;
}
```

### Component Library Features
- **Glass cards** with hover animations and shadow effects
- **Glass buttons** with active states and ripple effects
- **Glass inputs** with focus transitions and validation states
- **Responsive grid** layouts with mobile-first approach
- **Animation system** using Tailwind transitions
- **Accessibility** compliance with proper contrast ratios

### Mobile-First Responsive Design
- **iOS safe area** handling for notched devices
- **Touch-friendly** button sizes (minimum 48px targets)
- **Responsive breakpoints** for tablet and desktop
- **Gesture support** for mobile interactions

## 🔄 State Management (Zustand with Real-Time)

### Agent Store (`agentStore.ts` - 366 lines)
```typescript
interface AgentStore {
  // Session management
  sessions: Record<string, AgentSession>;
  activeSession: string | null;
  
  // Real-time updates
  subscribeToSession: (sessionId: string) => void;
  handleRealtimeUpdate: (payload: any) => void;
  
  // Browser activity tracking
  updateBrowserActivity: (sessionId: string, activity: BrowserActivity) => void;
  
  // Document synchronization
  updateDocument: (sessionId: string, content: any) => void;
  
  // Chat interface
  sendMessage: (sessionId: string, message: string) => Promise<void>;
  streamResponse: (sessionId: string) => AsyncGenerator<string>;
}
```

### Canvas Store (`canvasStore.ts`)
```typescript
interface CanvasStore {
  // Course management with caching
  courses: Course[];
  assignments: Assignment[];
  
  // Canvas API integration
  fetchCourses: () => Promise<Course[]>;
  fetchAssignments: (courseId: string) => Promise<Assignment[]>;
  
  // Credential management
  canvasCredentials: CanvasCredentials | null;
  updateCredentials: (credentials: CanvasCredentials) => void;
  
  // Persistent storage with selective serialization
  persist: {
    name: 'canvas-store';
    partialize: (state) => ({ courses: state.courses, assignments: state.assignments });
  };
}
```

### Real-Time Features
- **Supabase real-time subscriptions** for agent sessions and messages
- **Server-sent events** from agent backend for tool execution
- **Optimistic UI updates** with automatic rollback on errors
- **Connection status** monitoring with reconnection logic

## 🚀 Development Workflow & Commands

### Initial Setup
```bash
# Clone and install dependencies
git clone <repository>
cd CheatSheet
npm install                    # Install Node.js dependencies
npm run install:agent         # Automatic Python environment setup

# Environment configuration
cp .env.example .env          # Copy environment template
# Edit .env with your API keys and Supabase credentials
```

### Development Commands
```bash
# Primary development (runs both UI and agent concurrently)
npm run dev                   # Start UI (port 3000) + Agent (port 8123)
npm run dev:debug            # Debug mode with enhanced logging

# Individual services
npm run dev:ui               # Next.js UI server only
npm run dev:agent            # LangGraph agent server only

# Production build and deployment
npm run build                # Production build with optimization
npm run start                # Production server
npm run lint                 # ESLint code quality checks
npx tsc --noEmit            # TypeScript compilation verification
```

### Concurrent Development Features
- **Turbopack** for lightning-fast Next.js development
- **Hot reload** for both frontend and backend changes
- **Color-coded logging** to distinguish UI vs agent output
- **Automatic Python environment** activation and dependency installation
- **Integrated error handling** with clear stack traces

## 🔐 Security & Authentication

### Multi-Layer Security Implementation
1. **Supabase Authentication**
   - Email/password with secure hashing
   - Google OAuth integration
   - JWT token management with automatic refresh
   - Session persistence with secure storage

2. **Row Level Security (RLS)**
   - User-scoped data access on all tables
   - Tenant isolation via user_id
   - Policy-based permissions for courses, assignments, sessions

3. **Canvas Integration Security**
   - Encrypted token storage in database
   - Domain validation for Canvas instances
   - API rate limiting and error handling
   - Secure credential transmission

4. **Agent Security**
   - Authentication middleware for all agent API calls
   - Browser session isolation per user
   - Secure tool execution with input validation
   - Automatic cleanup of sensitive data

## 📊 Real-Time Architecture

### Supabase Real-Time Subscriptions
```typescript
// Agent session updates
supabase
  .channel('agent_sessions')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'agent_sessions',
    filter: `user_id=eq.${userId}`
  }, (payload) => {
    // Update UI state in real-time
    agentStore.handleRealtimeUpdate(payload);
  })
  .subscribe();
```

### Server-Sent Events (SSE)
```python
# Agent backend streaming
async def stream_agent_updates(session_id: str):
    async for update in agent_execution:
        yield f"data: {json.dumps(update)}\n\n"
        # Tool calls, progress updates, browser activity
```

### Live Features
- **Agent status updates** (idle, planning, executing, completed)
- **Browser activity streaming** (page navigation, element interactions)
- **Chat message delivery** with typing indicators
- **Progress tracking** with percentage completion
- **Error notifications** with recovery options

## 🎯 Current Implementation Status

### ✅ Production-Ready Features
- **Complete authentication system** with OAuth and email confirmation
- **Comprehensive database schema** with 6 tables and RLS policies
- **Full agent architecture** with ReAct pattern and tool integration
- **Real-time state management** with Zustand and Supabase subscriptions
- **Glass-morphism UI framework** with responsive design
- **Canvas LMS integration** foundation with API tools
- **Browser automation toolkit** with 8 specialized tools
- **Development environment** with concurrent servers and hot reload
- **Migration system** with 4 comprehensive database migrations

### 🔧 Advanced Production Components
- **Agent session management** (366 lines of state management)
- **Supabase service layer** (426 lines of database operations)
- **Mission workspace interface** (257 lines of React components)
- **Browser automation toolkit** (464 lines of specialized tools)
- **Canvas LMS integration** (191 lines of API interaction)
- **FastAPI server** with lifecycle management and SSE

### 🚧 Integration & Enhancement Opportunities
- **Canvas API tokens** require user configuration for full functionality
- **Browser automation** uses MCP protocol (requires browser-use server)
- **Document editing** needs TipTap rich text editor integration
- **Real Canvas LMS testing** with institutional accounts
- **Advanced AI tools** for research, citation, and writing assistance

### 📈 Architecture Maturity Level
This codebase represents a **sophisticated, production-ready foundation** with:
- **Enterprise-grade security** patterns
- **Modern React/TypeScript** best practices
- **Scalable state management** architecture
- **Comprehensive error handling** and logging
- **Real-time capabilities** throughout the stack
- **Professional development workflow** with automated setup

## 🛠️ Key Environment Variables

### Required Configuration
```bash
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Model Configuration (Required)
OPENROUTER_API_KEY=your_openrouter_api_key

# Development & Debugging (Optional)
COPILOTKIT_API_KEY=your_copilotkit_api_key
LANGSMITH_API_KEY=your_langsmith_key_for_tracing
NODE_ENV=development
```

### Canvas LMS Integration
```bash
# Canvas credentials are stored per-user in the database
# Users configure their Canvas domain and API token through the UI
# Format: https://[institution].instructure.com
```

## 📋 Development Guidelines

### Code Style & Patterns
- **TypeScript Strict Mode**: All code must type-check without errors
- **React Server Components**: Use server components for data fetching when possible
- **Client Components**: Only when interactivity or hooks are required
- **Error Boundaries**: Comprehensive error handling with user-friendly fallbacks
- **Async/Await**: Consistent async patterns with proper error handling
- **Path Imports**: Use `@/` prefix for all internal imports (`@/components`, `@/lib`, etc.)

### File Organization Principles
- **Feature-based organization**: Group related components, hooks, and utilities
- **Barrel exports**: Use index.ts files for clean imports
- **Type definitions**: Co-locate types with their implementations
- **Database migrations**: All schema changes via numbered migration files
- **Agent tools**: Self-contained modules with comprehensive error handling

### Testing & Quality Assurance
```bash
# TypeScript compilation check
npx tsc --noEmit

# Code quality and linting
npm run lint

# Runtime testing in development
npm run dev              # Manual testing with hot reload
npm run dev:debug        # Enhanced logging for debugging
```

## 🚨 Critical Production Considerations

### Security Best Practices
- **Never commit API keys** - use .env files with .gitignore
- **Validate all user inputs** before database operations
- **Use RLS policies** for all data access patterns
- **Encrypt sensitive data** like Canvas tokens and user credentials
- **Implement rate limiting** for Canvas API calls
- **Sanitize browser automation** inputs to prevent XSS

### Performance Optimization
- **Server Components** for static content to reduce client bundle
- **Client Components** only when interactivity is required
- **Database indexing** on foreign keys and frequent query columns
- **LLM rate limiting** to prevent API quota exhaustion
- **Browser session cleanup** to prevent memory leaks
- **Real-time subscription** management to avoid connection leaks

### Debugging & Monitoring Tools
- **LangSmith integration** for LLM call tracing (optional)
- **Supabase Dashboard** for database inspection and real-time logs
- **Browser DevTools** with React DevTools extension
- **FastAPI docs** at `http://localhost:8123/docs` for API testing
- **Agent logging** with structured output for debugging

## 🎯 Architecture Decision Records

### Why LangGraph + CopilotKit?
- **LangGraph**: Provides robust agent state management and tool orchestration
- **CopilotKit**: Handles UI integration and streaming without custom WebSocket code
- **Together**: Creates seamless agent-UI communication with minimal boilerplate

### Why Zustand over Redux?
- **Simplicity**: Less boilerplate for complex state management
- **TypeScript**: Excellent TypeScript support with type inference
- **Real-time**: Easy integration with Supabase subscriptions
- **Performance**: Selective re-renders and built-in optimization

### Why Supabase over Custom Backend?
- **Rapid development**: Authentication, database, and real-time out of the box
- **Security**: Row Level Security policies for multi-tenant architecture
- **Scalability**: PostgreSQL with automatic scaling and backups
- **Integration**: Seamless Next.js integration with Server Components

## 📖 Key Learning Resources

- **LangGraph Documentation**: https://langchain-ai.github.io/langgraph/
- **CopilotKit Integration Guide**: https://docs.copilotkit.ai/
- **Supabase Auth Patterns**: https://supabase.com/docs/guides/auth
- **Next.js App Router**: https://nextjs.org/docs/app
- **Zustand State Management**: https://github.com/pmndrs/zustand
- **Canvas LMS API**: https://canvas.instructure.com/doc/api/

---

## Quick Reference Commands

```bash
# Development (Primary)
npm run dev                    # Start concurrent UI + agent servers
npm run dev:debug             # Debug mode with enhanced logging
npm run build                 # Production build with optimization
npm run lint                  # ESLint code quality checks
npx tsc --noEmit             # TypeScript compilation verification

# Agent Development
cd agent && source .venv/bin/activate  # Activate Python environment (Linux/Mac)
cd agent && .venv\Scripts\activate     # Activate Python environment (Windows)
python agent.py              # Run agent directly for testing
uvicorn api.main:app --reload # Run FastAPI server independently

# Database Management
supabase start                # Start local Supabase (if installed)
supabase db reset             # Reset local database with migrations
supabase gen types typescript # Generate TypeScript types from schema
```

## 🔗 Integration Points Summary

### Canvas LMS Integration
- **API Authentication**: User-provided tokens stored encrypted
- **Course Sync**: Automatic fetching of courses and assignments
- **Assignment Submission**: Direct submission capability through agent
- **Grade Tracking**: Progress monitoring and completion status

### Browser Automation
- **MCP Protocol**: Modern browser automation via Model Context Protocol
- **Session Management**: Isolated browser contexts per user session
- **Real-time Updates**: Live browser activity streaming to UI
- **Screenshot Capture**: Visual progress tracking and debugging

### AI Agent Workflow
- **Multi-step Planning**: Complex academic task breakdown
- **Tool Orchestration**: Coordinated use of Canvas and browser tools
- **Progress Tracking**: Real-time status updates and completion metrics
- **Error Recovery**: Robust error handling with user notification

**Remember**: This is a sophisticated, production-ready academic automation platform with enterprise-grade architecture, comprehensive security, and modern development practices. Always validate user inputs, maintain proper error handling, and follow the established patterns throughout the codebase.