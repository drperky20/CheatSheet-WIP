# 🚀 Quick Setup Guide

This guide helps you get the AG-UI CheatSheet template running locally.

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd CheatSheet

# 2. Set up environment variables
cp .env.example .env
# Edit .env and add your OpenRouter API key

# 3. Run the automated setup
./start.sh    # macOS/Linux
start.bat     # Windows
```

## 🔑 Required Configuration

### Get an OpenRouter API Key
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Generate an API key
4. Add it to your `.env` file:
   ```env
   OPENROUTER_API_KEY=your-api-key-here
   ```

### Environment File
The project uses a root `.env` file for all secrets and configuration:
- Copy `.env.example` to `.env`
- Fill in your actual API keys and values
- **Never commit the `.env` file to version control**

## 🏃‍♂️ Running the Application

### Automated (Recommended)
```bash
./start.sh    # Installs deps, builds, and starts both servers
```

### Manual
```bash
cd CheatSheet
npm install   # Installs both Node.js and Python dependencies
npm run dev   # Starts UI (3000) and Agent (8123) servers
```

## 🌐 Access Points

Once running:
- **Frontend UI**: http://localhost:3000
- **Agent API**: http://localhost:8123
- **API Docs**: http://localhost:8123/docs
- **LangGraph Studio**: https://smith.langchain.com/studio/?baseUrl=http://localhost:8123

## 🔧 Troubleshooting

### Common Issues

**"Module not found" errors:**
```bash
cd CheatSheet && npm install
```

**"API key not configured" errors:**
```bash
# Check your .env file exists and has the key
cat .env | grep OPENROUTER_API_KEY
```

**Port already in use:**
```bash
# Kill existing processes
pkill -f "next dev" && pkill -f "langgraph dev"
```

### Getting Help
1. Check the logs in `CheatSheet/logs/`
2. Ensure all prerequisites are installed:
   - Node.js 18+
   - Python 3.8+
   - npm
3. Try the manual setup process

## 🔒 Security Notes

- All secrets are in the root `.env` file
- The `.env` file is git-ignored
- Use `.env.example` as a template
- Never commit real API keys to version control

## 📚 Next Steps

Once you have it running:
1. Explore the demo features (theme colors, proverbs, weather)
2. Read `BOILERPLATE_STATUS.md` to understand the template
3. Start planning your SaaS transformation
4. Replace demo features with your business logic

---

**Need help?** Check the main README.md for detailed documentation.