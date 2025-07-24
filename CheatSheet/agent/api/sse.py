"""Server-Sent Events utilities"""

import asyncio
import json
from typing import AsyncGenerator, Dict, Any, Optional
from datetime import datetime
import logging

logger = logging.getLogger(__name__)

class SSEManager:
    """Manages Server-Sent Events connections"""
    
    def __init__(self):
        self.connections: Dict[str, asyncio.Queue] = {}
        self.active_sessions: Dict[str, Dict[str, Any]] = {}
    
    async def connect(self, session_id: str, user_id: str) -> AsyncGenerator[str, None]:
        """
        Create a new SSE connection for a session.
        
        Yields SSE-formatted events.
        """
        queue = asyncio.Queue()
        self.connections[session_id] = queue
        
        try:
            # Send initial connection event
            yield self._format_sse({
                "event": "connected",
                "data": {
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat()
                }
            })
            
            # Keep connection alive and send events
            while True:
                try:
                    # Wait for events with timeout for keepalive
                    event = await asyncio.wait_for(queue.get(), timeout=30.0)
                    
                    if event is None:  # Disconnect signal
                        break
                        
                    yield self._format_sse(event)
                    
                except asyncio.TimeoutError:
                    # Send keepalive ping
                    yield self._format_sse({
                        "event": "ping",
                        "data": {"timestamp": datetime.now().isoformat()}
                    })
                    
        except asyncio.CancelledError:
            logger.info(f"SSE connection cancelled for session {session_id}")
            raise
        finally:
            # Cleanup
            if session_id in self.connections:
                del self.connections[session_id]
    
    async def send_event(self, session_id: str, event: Dict[str, Any]):
        """Send an event to a specific session"""
        if session_id in self.connections:
            await self.connections[session_id].put(event)
    
    async def broadcast_event(self, event: Dict[str, Any]):
        """Broadcast an event to all connected sessions"""
        for session_id in list(self.connections.keys()):
            await self.send_event(session_id, event)
    
    async def disconnect(self, session_id: str):
        """Disconnect a session"""
        if session_id in self.connections:
            await self.connections[session_id].put(None)
    
    def _format_sse(self, event: Dict[str, Any]) -> str:
        """Format an event for SSE"""
        lines = []
        
        if "event" in event:
            lines.append(f"event: {event['event']}")
        
        if "id" in event:
            lines.append(f"id: {event['id']}")
        
        if "retry" in event:
            lines.append(f"retry: {event['retry']}")
        
        # Always include data
        data = event.get("data", {})
        lines.append(f"data: {json.dumps(data)}")
        
        # SSE requires double newline after event
        return "\\n".join(lines) + "\\n\\n"
    
    def get_active_sessions_count(self) -> int:
        """Get count of active SSE connections"""
        return len(self.connections)


# Global SSE manager instance
sse_manager = SSEManager()