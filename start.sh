#!/bin/bash

# CheatSheet AG-UI App Startup Script
# This script installs dependencies, builds the app, and starts both UI and agent servers

set -e  # Exit on any error

# Color codes for better logging
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ✗${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Main startup function
main() {
    log "🚀 Starting CheatSheet AG-UI App Setup..."
    
    # Check prerequisites
    log "📋 Checking prerequisites..."
    
    if ! command_exists node; then
        log_error "Node.js is not installed. Please install Node.js 18+ and try again."
        exit 1
    fi
    
    if ! command_exists python3; then
        log_error "Python 3 is not installed. Please install Python 3.8+ and try again."
        exit 1
    fi
    
    if ! command_exists npm; then
        log_error "npm is not installed. Please install npm and try again."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
    
    # Display environment info
    log "🔍 Environment Information:"
    echo "   Node.js: $(node --version)"
    echo "   npm: $(npm --version)"
    echo "   Python: $(python3 --version)"
    echo "   Working Directory: $(pwd)"
    
    # Check if .env file exists and has the required key
    log "🔑 Checking OpenRouter API configuration..."
    if [ ! -f "agent/.env" ]; then
        log_error "agent/.env file not found!"
        exit 1
    fi
    
    if ! grep -q "OPENROUTER_API_KEY=sk-or" agent/.env; then
        log_warning "OpenRouter API key may not be configured properly"
        log "Please ensure agent/.env contains: OPENROUTER_API_KEY=your-key-here"
    else
        log_success "OpenRouter API key configured"
    fi
    
    # Install npm dependencies
    log "📦 Installing npm dependencies..."
    if npm install; then
        log_success "npm dependencies installed successfully"
    else
        log_error "Failed to install npm dependencies"
        exit 1
    fi
    
    # Check Python dependencies (should be installed by postinstall via npm)
    log "🐍 Checking Python dependencies..."
    if [ -d "agent/.venv" ]; then
        log_success "Python virtual environment found (.venv)"
        log "Python dependencies are managed via npm's postinstall script"
    else
        log_warning "No virtual environment found, but dependencies may be installed globally"
    fi
    
    # Build the Next.js app (optional for development)
    log "🔨 Building Next.js application..."
    if npm run build; then
        log_success "Next.js build completed successfully"
    else
        log_warning "Build failed, but continuing with development mode..."
    fi
    
    # Create logs directory
    mkdir -p logs
    
    # Start the development servers
    log "🌟 Starting development servers..."
    log "📱 UI Server will be available at: http://localhost:3000"
    log "🤖 Agent Server will be available at: http://localhost:8123"
    log "📝 Logs will be saved to logs/ directory"
    
    # Start with detailed logging
    npm run dev 2>&1 | tee logs/startup-$(date +%Y%m%d-%H%M%S).log
}

# Cleanup function
cleanup() {
    log "🧹 Cleaning up..."
    # Kill any background processes if needed
    pkill -f "next dev" 2>/dev/null || true
    pkill -f "langgraph dev" 2>/dev/null || true
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Check if we're in the right directory
if [ ! -f "CheatSheet/package.json" ]; then
    log_error "CheatSheet/package.json not found. Please run this script from the project root directory."
    exit 1
fi

# Change to CheatSheet directory
cd CheatSheet

# Run main function
main "$@"