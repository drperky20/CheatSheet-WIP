"""Browser MCP Manager for managing browser-use instances"""

import subprocess
import asyncio
import os
import json
from typing import Dict, Optional, Any, List
from datetime import datetime
import aiohttp
import logging

logger = logging.getLogger(__name__)

class BrowserMCPManager:
    """Manages browser-use MCP server instances for academic automation"""
    
    def __init__(self):
        self.processes: Dict[str, subprocess.Popen] = {}
        self.ports: Dict[str, int] = {}
        self.sessions: Dict[str, Dict[str, Any]] = {}
        self.next_port = 9000
        self.base_sessions_dir = "./browser_sessions"
        
        # Ensure sessions directory exists
        os.makedirs(self.base_sessions_dir, exist_ok=True)
    
    async def start_browser_session(self, session_id: str, headless: bool = False) -> int:
        """
        Start a new browser-use MCP server for a session.
        
        Args:
            session_id: Unique session identifier
            headless: Whether to run browser in headless mode
            
        Returns:
            Port number where the MCP server is running
        """
        if session_id in self.processes:
            logger.warning(f"Session {session_id} already exists")
            return self.ports[session_id]
        
        port = self.next_port
        self.next_port += 1
        
        # Create session directory
        session_dir = os.path.join(self.base_sessions_dir, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Prepare command
        cmd = [
            'npx', 'browser-use', '--mcp',
            '--port', str(port),
            '--session-dir', session_dir
        ]
        
        if headless:
            cmd.append('--headless')
        
        try:
            # Start browser-use in MCP mode
            process = subprocess.Popen(
                cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                env={**os.environ, 'NODE_ENV': 'production'}
            )
            
            self.processes[session_id] = process
            self.ports[session_id] = port
            self.sessions[session_id] = {
                'id': session_id,
                'port': port,
                'started_at': datetime.now().isoformat(),
                'headless': headless,
                'status': 'starting'
            }
            
            # Wait for server to be ready
            await self._wait_for_server(port)
            
            self.sessions[session_id]['status'] = 'ready'
            logger.info(f"Browser session {session_id} started on port {port}")
            
            return port
            
        except Exception as e:
            logger.error(f"Failed to start browser session: {e}")
            # Cleanup on failure
            if session_id in self.processes:
                self.processes[session_id].terminate()
                del self.processes[session_id]
            if session_id in self.ports:
                del self.ports[session_id]
            if session_id in self.sessions:
                del self.sessions[session_id]
            raise
    
    async def _wait_for_server(self, port: int, timeout: int = 30):
        """Wait for MCP server to be ready"""
        start_time = asyncio.get_event_loop().time()
        
        while asyncio.get_event_loop().time() - start_time < timeout:
            try:
                async with aiohttp.ClientSession() as session:
                    async with session.get(f'http://localhost:{port}/health') as response:
                        if response.status == 200:
                            return
            except:
                pass
            
            await asyncio.sleep(0.5)
        
        raise TimeoutError(f"MCP server on port {port} did not start within {timeout} seconds")
    
    async def stop_browser_session(self, session_id: str):
        """
        Stop a browser session and cleanup resources.
        
        Args:
            session_id: Session to stop
        """
        if session_id not in self.processes:
            logger.warning(f"Session {session_id} not found")
            return
        
        try:
            # Terminate the process
            process = self.processes[session_id]
            process.terminate()
            
            # Wait for graceful shutdown
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                # Force kill if needed
                process.kill()
            
            # Cleanup
            del self.processes[session_id]
            del self.ports[session_id]
            
            if session_id in self.sessions:
                self.sessions[session_id]['status'] = 'stopped'
                self.sessions[session_id]['stopped_at'] = datetime.now().isoformat()
            
            logger.info(f"Browser session {session_id} stopped")
            
        except Exception as e:
            logger.error(f"Error stopping session {session_id}: {e}")
    
    async def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get information about a session"""
        return self.sessions.get(session_id)
    
    async def list_active_sessions(self) -> List[Dict[str, Any]]:
        """List all active sessions"""
        active_sessions = []
        
        for session_id, info in self.sessions.items():
            if session_id in self.processes and info.get('status') == 'ready':
                active_sessions.append(info)
        
        return active_sessions
    
    async def cleanup_all_sessions(self):
        """Stop all active sessions (cleanup on shutdown)"""
        session_ids = list(self.processes.keys())
        
        for session_id in session_ids:
            await self.stop_browser_session(session_id)
        
        logger.info("All browser sessions cleaned up")
    
    def get_mcp_url(self, session_id: str) -> Optional[str]:
        """Get the MCP server URL for a session"""
        port = self.ports.get(session_id)
        if port:
            return f"http://localhost:{port}"
        return None


# Global instance
browser_manager = BrowserMCPManager()