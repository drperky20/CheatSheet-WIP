@echo off
setlocal enabledelayedexpansion

REM CheatSheet AG-UI App Startup Script for Windows
REM This script installs dependencies, builds the app, and starts both UI and agent servers

echo.
echo ================================
echo CheatSheet AG-UI App Setup
echo ================================
echo.

REM Check prerequisites
echo [%date% %time%] Checking prerequisites...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed. Please install Node.js 18+ and try again.
    pause
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    where python3 >nul 2>nul
    if !errorlevel! neq 0 (
        echo [ERROR] Python is not installed. Please install Python 3.8+ and try again.
        pause
        exit /b 1
    )
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] npm is not installed. Please install npm and try again.
    pause
    exit /b 1
)

echo [SUCCESS] Prerequisites check passed
echo.

REM Display environment info
echo [INFO] Environment Information:
for /f "tokens=*" %%i in ('node --version') do echo    Node.js: %%i
for /f "tokens=*" %%i in ('npm --version') do echo    npm: %%i
for /f "tokens=*" %%i in ('python --version 2^>^&1') do echo    Python: %%i
echo    Working Directory: %cd%
echo.

REM Change to CheatSheet directory
cd CheatSheet
if %errorlevel% neq 0 (
    echo [ERROR] CheatSheet directory not found. Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if .env file exists (before cd to CheatSheet)
echo [%date% %time%] Checking OpenRouter API configuration...
if not exist "..\.env" (
    echo [ERROR] .env file not found in project root!
    echo Please copy .env.example to .env and add your API keys
    pause
    exit /b 1
)

findstr /C:"OPENROUTER_API_KEY=" ..\.env >nul
if %errorlevel% neq 0 (
    echo [WARNING] OpenRouter API key may not be configured properly
    echo Please ensure .env contains: OPENROUTER_API_KEY=your-key-here
) else (
    echo [SUCCESS] OpenRouter API key configured
)
echo.

REM Install npm dependencies
echo [%date% %time%] Installing npm dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install npm dependencies
    pause
    exit /b 1
)
echo [SUCCESS] npm dependencies installed successfully
echo.

REM Install Python dependencies
echo [%date% %time%] Installing Python dependencies...
cd agent
pip install -r requirements.txt
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install Python dependencies
    cd ..
    pause
    exit /b 1
)
cd ..
echo [SUCCESS] Python dependencies installed successfully
echo.

REM Build the Next.js app
echo [%date% %time%] Building Next.js application...
call npm run build
if %errorlevel% neq 0 (
    echo [WARNING] Build failed, but continuing with development mode...
) else (
    echo [SUCCESS] Next.js build completed successfully
)
echo.

REM Create logs directory
if not exist "logs" mkdir logs

REM Start the development servers
echo [%date% %time%] Starting development servers...
echo [INFO] UI Server will be available at: http://localhost:3000
echo [INFO] Agent Server will be available at: http://localhost:8123
echo [INFO] Logs will be saved to logs\ directory
echo.
echo Press Ctrl+C to stop the servers
echo.

REM Start with logging
call npm run dev 2>&1 | tee logs\startup-%date:~-4,4%%date:~-10,2%%date:~-7,2%-%time:~0,2%%time:~3,2%%time:~6,2%.log

pause