# CheatSheet - Current State Documentation

**Last Updated:** July 23, 2025  
**Project Status:** ✅ Fully Configured and Ready to Run

## 🏗️ Project Overview

CheatSheet is a modern AI-powered application built with:
- **Frontend:** Next.js 15.3.2 with TypeScript and TailwindCSS
- **AI Integration:** CopilotKit for seamless AI interactions
- **Backend Agent:** LangGraph (Python) with AG-UI bindings
- **LLM Model:** Qwen 3 235B via OpenRouter
- **Architecture:** Concurrent UI and Agent servers with real-time communication

## 📁 Directory Structure

```
/Users/austinmorgan/CheatSheet/
├── README.md                    # Main project documentation
├── Current State.md             # This file - project state documentation
├── start.sh                     # macOS/Linux automated startup script
├── start.bat                    # Windows automated startup script
└── CheatSheet/                  # Main application directory
    ├── package.json             # Node.js dependencies and scripts
    ├── package-lock.json        # Locked dependency versions
    ├── tsconfig.json            # TypeScript configuration
    ├── next.config.ts           # Next.js configuration
    ├── eslint.config.mjs        # ESLint configuration
    ├── postcss.config.mjs       # PostCSS configuration
    ├── next-env.d.ts            # Next.js TypeScript definitions
    ├── LICENSE                  # MIT License
    ├── .venv/                   # Python virtual environment (auto-created)
    ├── .next/                   # Next.js build output (auto-created)
    ├── node_modules/            # Node.js dependencies (auto-installed)
    ├── logs/                    # Application logs directory
    │   └── startup-*.log        # Timestamped startup logs
    ├── agent/                   # LangGraph Python agent
    │   ├── agent.py             # Main agent implementation with Qwen
    │   ├── langgraph.json       # LangGraph configuration
    │   ├── requirements.txt     # Python dependencies
    │   └── .env                 # Environment variables (API keys)
    ├── src/                     # Next.js source code
    │   └── app/                 # App router directory
    │       ├── page.tsx         # Main UI component with CopilotKit
    │       ├── layout.tsx       # Root layout with providers
    │       ├── globals.css      # Global styles
    │       ├── favicon.ico      # App favicon
    │       └── api/             # API routes
    │           └── copilotkit/
    │               └── route.ts # CopilotKit API endpoint
    ├── public/                  # Static assets
    │   ├── file.svg
    │   ├── globe.svg
    │   ├── next.svg
    │   ├── vercel.svg
    │   └── window.svg
    └── scripts/                 # Utility scripts
        ├── setup-agent.sh       # Unix agent setup
        └── setup-agent.bat      # Windows agent setup
```

## 🔧 Configuration Details

### Environment Variables (`CheatSheet/agent/.env`)
```env
# OpenRouter API Key for LangGraph agent
OPENROUTER_API_KEY=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

# OpenAI compatibility settings for OpenRouter
OPENAI_API_KEY=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
OPENAI_BASE_URL=https://openrouter.ai/api/v1
```

### LLM Configuration (`CheatSheet/agent/agent.py`)
```python
# Lines 69-73: OpenRouter with Qwen model
model = ChatOpenAI(
    model="qwen/qwen3-235b-a22b-07-25",
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY")
)
```

### Server Ports
- **UI Server:** http://localhost:3000 (Next.js)
- **Agent Server:** http://localhost:8123 (LangGraph)
- **API Docs:** http://localhost:8123/docs
- **LangGraph Studio:** https://smith.langchain.com/studio/?baseUrl=http://localhost:8123

## 🚀 Available Features

### 1. Frontend Actions (CopilotKit)
- **Theme Color Change:** "Set the theme to [color]"
- **Proverb Management:** "Add a proverb about [topic]"
- **Interactive Sidebar:** Always-open chat interface

### 2. Backend Tools (LangGraph)
- **Weather Tool:** `get_weather(location)` - Returns mock weather data
- **Extensible Architecture:** Easy to add new tools in `agent.py`

### 3. Shared State Management
- Real-time state synchronization between frontend and agent
- Persistent proverbs list with add/remove functionality
- Theme color state management

### 4. Generative UI
- Weather cards generated dynamically based on tool calls
- Responsive design with TailwindCSS
- Glassmorphism UI effects

## 📦 Dependencies

### Node.js Dependencies (Key Packages)
- `@copilotkit/react-core`: 1.9.3
- `@copilotkit/react-ui`: 1.9.3
- `@copilotkit/runtime`: 1.9.3
- `@ag-ui/langgraph`: 0.0.7
- `next`: 15.3.2
- `react`: ^19.0.0
- `typescript`: ^5.0.0

### Python Dependencies (Key Packages)
- `langchain`: 0.3.26
- `langgraph`: 0.4.10
- `langchain-openai`: >=0.0.1
- `python-dotenv`: >=1.0.0
- `fastapi`: >=0.115.5
- `uvicorn`: >=0.29.0

## 🏃‍♂️ Running the Application

### Quick Start (Recommended)
```bash
# From project root
./start.sh    # macOS/Linux
start.bat     # Windows
```

### Manual Start
```bash
cd CheatSheet
npm install   # Install all dependencies
npm run dev   # Start both servers concurrently
```

### Individual Servers
```bash
cd CheatSheet
npm run dev:ui     # UI only (port 3000)
npm run dev:agent  # Agent only (port 8123)
```

## 🔍 Current Working State

### ✅ What's Working
- Full dependency installation (npm + Python)
- OpenRouter integration with Qwen 3 235B model
- Concurrent server startup
- UI/Agent communication via CopilotKit
- Theme color changing
- Proverb management
- Weather tool with generative UI
- Logging system
- Cross-platform startup scripts

### ⚠️ Known Limitations
- Weather data is mocked (returns 70°F for any location)
- Python environment must use virtual environment on macOS
- Some npm audit warnings (7 vulnerabilities - can be fixed with `npm audit fix`)

## 📝 Recent Changes
1. Configured OpenRouter with Qwen 3 235B model
2. Updated `agent.py` to use OpenRouter instead of OpenAI
3. Created automated startup scripts (`start.sh`, `start.bat`)
4. Moved README and startup scripts to project root
5. Added comprehensive logging system
6. Updated all file paths for new structure

## 🛠️ Development Tips

### Adding New Tools
1. Define tool function in `agent/agent.py` with `@tool` decorator
2. Add to `backend_tools` list
3. Optionally create frontend action in `src/app/page.tsx`

### Changing the LLM Model
Edit `CheatSheet/agent/agent.py` line 71:
```python
model="your-preferred-model",  # Change this
```

### Environment Management
- Python dependencies are installed in `.venv` (managed by npm)
- Use `npm install` to handle both Node.js and Python deps
- Manual Python package installation: `cd CheatSheet/agent && ./.venv/bin/pip install package-name`

## 🔒 Security Notes
- API keys are stored in `CheatSheet/agent/.env`
- `.env` file should be added to `.gitignore` before committing
- Current API key is for development/testing only

## 📊 Performance
- Build time: ~15-20 seconds
- Startup time: ~5-10 seconds for both servers
- Memory usage: ~200-300MB combined
- Qwen 3 235B response time: Varies based on OpenRouter load

## 🐛 Troubleshooting

### Common Issues
1. **"Module not found" errors:** Run `npm install` from CheatSheet directory
2. **Python import errors:** Check `.venv` activation or run `npm run install:agent`
3. **Port already in use:** Kill existing processes or change ports in config
4. **API key errors:** Verify `.env` file exists and contains valid key

### Debug Commands
```bash
# Check running processes
ps aux | grep -E "next|langgraph"

# Kill all related processes
pkill -f "next dev" && pkill -f "langgraph dev"

# Check logs
tail -f CheatSheet/logs/startup-*.log
```

## 🎯 Next Steps
1. Implement real weather API integration
2. Add more backend tools (database queries, file operations, etc.)
3. Enhance UI with more interactive components
4. Add authentication and user sessions
5. Deploy to production environment

---

**Project Health:** 🟢 Fully Operational  
**Last Tested:** July 23, 2025  
**Maintained By:** AI Agent Configuration System