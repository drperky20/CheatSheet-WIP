"""Main FastAPI application for CheatSheet agent"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from contextlib import asynccontextmanager
from dotenv import load_dotenv

from .routes import router
from ..browser_mcp.manager import browser_manager

# Load environment variables from project root directory
load_dotenv(dotenv_path="../../.env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle"""
    # Startup
    logger.info("Starting CheatSheet Agent API...")
    
    yield
    
    # Shutdown
    logger.info("Shutting down CheatSheet Agent API...")
    await browser_manager.cleanup_all_sessions()

# Create FastAPI app
app = FastAPI(
    title="CheatSheet Agent API",
    description="Academic task automation agent with Canvas LMS integration",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
cors_origins = [
    os.getenv("CORS_ORIGIN", "http://localhost:3000"),
    os.getenv("NEXT_PUBLIC_SITE_URL", "http://localhost:3000"),
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routes
app.include_router(router)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "CheatSheet Agent API",
        "version": "1.0.0",
        "status": "online",
        "docs": "/docs",
        "health": "/api/v1/health"
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("AGENT_PORT", "8000"))
    
    uvicorn.run(
        "api.main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )