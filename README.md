# CheatSheet - AI-Powered Academic Workspace

CheatSheet is a comprehensive academic automation platform that combines [LangGraph](https://www.langchain.com/langgraph) AI agents with [CopilotKit](https://copilotkit.ai) for an autonomous academic workspace. It features Canvas LMS integration, real-time browser automation, and intelligent document generation powered by **Qwen 3 235B** via OpenRouter.

## ✨ Features

- 🎯 **Mission-Based Workflow**: Course → Assignment → AI Mission interface
- 🎨 **Glassmorphism UI**: Modern, responsive design with real-time updates
- 🤖 **Autonomous AI Agent**: LangGraph-powered agent with browser automation
- 📚 **Canvas LMS Integration**: Automatic course and assignment synchronization
- 📝 **Real-time Document Generation**: Live document editing with AI assistance
- 🔄 **Real-time Communication**: SSE and Supabase real-time for live updates
- 🛡️ **Enterprise Security**: Row-level security and encrypted credential storage

## Prerequisites

- Node.js 18+ 
- Python 3.12+
- [Supabase Account](https://supabase.com) (free tier available)
- Any of the following package managers:
  - [pnpm](https://pnpm.io/installation) (recommended)
  - npm
  - [yarn](https://classic.yarnpkg.com/lang/en/docs/install/#mac-stable)
  - [bun](https://bun.sh/)
- OpenRouter API Key (for the Qwen LangGraph agent) - **Already configured**
- Canvas LMS credentials (optional, for Canvas integration)

> **Note:** This repository ignores lock files (package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb) to avoid conflicts between different package managers. Each developer should generate their own lock file using their preferred package manager. After that, make sure to delete it from the .gitignore.

## Getting Started

### 🚀 Quick Start (Recommended)

#### 1. Clone and Setup
```bash
git clone <repository-url>
cd CheatSheet
```

#### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your API keys and Supabase credentials
```

#### 3. Setup Supabase (Automated)
```bash
cd CheatSheet/scripts
./setup-supabase.sh
```
This script will:
- Install Supabase CLI if needed
- Link to your Supabase project  
- Apply all database migrations
- Set up Row Level Security
- Configure Canvas LMS and agent functions

#### 4. Start Development
**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

**Or via npm (from CheatSheet directory):**
```bash
cd CheatSheet
npm run start:full     # macOS/Linux
npm run start:windows  # Windows
```

This script will:
- ✅ Check prerequisites (Node.js, Python, npm)
- ✅ Install all dependencies (npm + Python)
- ✅ Build the Next.js application
- ✅ Start both UI and agent servers
- ✅ Provide detailed logging
- ✅ Save logs to `logs/` directory

### Manual Setup

If you prefer manual control:

1. Navigate to the CheatSheet directory and install dependencies:
```bash
cd CheatSheet
npm install  # This also installs Python dependencies
```

2. Copy and configure the environment file:
```bash
cp .env.example .env
# Edit .env and add your OpenRouter API key
```

3. Start development servers:
```bash
npm run dev
```

This will start both the UI and agent servers concurrently.

## Model Configuration

This app is configured to use **Qwen 3 235B** (qwen/qwen3-235b-a22b-07-25) via OpenRouter:

- **Model**: Qwen 3 235B - A powerful open-source model
- **Provider**: OpenRouter - Unified API for multiple LLMs
- **Configuration**: `CheatSheet/agent/agent.py:69-73`
- **Environment**: `.env` (project root)

To change the model, edit the `model` parameter in `CheatSheet/agent/agent.py`:
```python
model = ChatOpenAI(
    model="qwen/qwen3-235b-a22b-07-25",  # Change this line
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
```

## Available Scripts
The following scripts can also be run using your preferred package manager:
- `start:full` - Complete setup and start (macOS/Linux)
- `start:windows` - Complete setup and start (Windows)
- `dev` - Starts both UI and agent servers in development mode
- `dev:debug` - Starts development servers with debug logging enabled
- `dev:ui` - Starts only the Next.js UI server
- `dev:agent` - Starts only the LangGraph agent server
- `build` - Builds the Next.js application for production
- `start` - Starts the production server
- `lint` - Runs ESLint for code linting
- `install:agent` - Installs Python dependencies for the agent

## Documentation

The main UI component is in `CheatSheet/src/app/page.tsx`. You can:
- Modify the theme colors and styling
- Add new frontend actions
- Customize the CopilotKit sidebar appearance

## 🗄️ Database & Backend

CheatSheet uses **Supabase** for its database, authentication, and real-time features:

### Database Features
- **PostgreSQL** with Row Level Security (RLS)
- **Canvas LMS Integration** with encrypted credential storage
- **Agent Session Management** with real-time updates
- **Chat History** with message threading
- **User Profiles** with preferences and settings

### Key Functions
- `sync_canvas_courses()` - Sync Canvas course data
- `create_agent_session()` - Start new AI missions
- `add_agent_message()` - Real-time chat messaging
- `get_user_courses_with_assignments()` - Dashboard data

For detailed setup instructions, see [SUPABASE_SETUP.md](CheatSheet/SUPABASE_SETUP.md).

## 🔧 Environment Variables

Your `.env` file should include:

```env
# OpenRouter (AI Model)
OPENROUTER_API_KEY=your_openrouter_api_key

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# JWT for Agent API
JWT_SECRET=your_jwt_secret_here

# Development
NODE_ENV=development
UI_PORT=3000
AGENT_PORT=8123
```

## 📚 Documentation

- **[Supabase Setup Guide](CheatSheet/SUPABASE_SETUP.md)** - Complete database setup
- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/) - Learn more about LangGraph
- [CopilotKit Documentation](https://docs.copilotkit.ai) - Explore CopilotKit's capabilities
- [Supabase Documentation](https://supabase.com/docs) - Database and auth features
- [Next.js Documentation](https://nextjs.org/docs) - Learn about Next.js features and API
- [YFinance Documentation](https://pypi.org/project/yfinance/) - Financial data tools

## Contributing

Feel free to submit issues and enhancement requests! This starter is designed to be easily extensible.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Troubleshooting

### Agent Connection Issues
If you see "I'm having trouble connecting to my tools", make sure:
1. The LangGraph agent is running on port 8000
2. Your OpenAI API key is set correctly
3. Both servers started successfully

### Python Dependencies
If you encounter Python import errors:
```bash
npm install:agent
```