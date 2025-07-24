"""API routes for CheatSheet agent"""

from fastapi import APIRouter, Depends, HTTPException, Request, BackgroundTasks
from sse_starlette.sse import EventSourceResponse
import asyncio
import uuid
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from .models import (
    AgentInvokeRequest, AgentInvokeResponse, AgentUpdate,
    AgentResult, SessionStatus, HealthCheck, TaskStatus
)
from .auth import verify_token
from .sse import sse_manager
from ..browser_mcp.manager import browser_manager
from langchain_core.messages import HumanMessage

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1")

# Store active agent tasks
active_tasks: Dict[str, Dict[str, Any]] = {}

@router.get("/health", response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.now(),
        version="1.0.0",
        active_sessions=len(active_tasks)
    )

@router.post("/agent/invoke", response_model=AgentInvokeResponse)
async def invoke_agent(
    request: AgentInvokeRequest,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(verify_token)
):
    """Start a new agent task"""
    session_id = str(uuid.uuid4())
    
    # Store task info
    active_tasks[session_id] = {
        "user_id": user_id,
        "status": TaskStatus.INITIALIZING,
        "started_at": datetime.now(),
        "request": request,
        "progress": 0
    }
    
    # Start agent task in background
    background_tasks.add_task(
        run_agent_task,
        session_id,
        request,
        user_id
    )
    
    # Estimate completion time based on task type
    estimated_times = {
        "research": 120,
        "essay": 300,
        "quiz": 180,
        "form": 60,
        "discussion": 150,
        "analysis": 240
    }
    
    return AgentInvokeResponse(
        session_id=session_id,
        status=TaskStatus.INITIALIZING,
        stream_url=f"/api/v1/agent/stream/{session_id}",
        estimated_time=estimated_times.get(request.task_type, 180)
    )

@router.get("/agent/stream/{session_id}")
async def stream_agent_updates(
    session_id: str,
    request: Request,
    user_id: str = Depends(verify_token)
):
    """SSE endpoint for real-time updates"""
    
    # Verify session belongs to user
    if session_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if active_tasks[session_id]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    async def event_generator():
        """Generate SSE events"""
        async for event in sse_manager.connect(session_id, user_id):
            if await request.is_disconnected():
                break
            yield event
    
    return EventSourceResponse(event_generator())

@router.get("/agent/status/{session_id}", response_model=SessionStatus)
async def get_session_status(
    session_id: str,
    user_id: str = Depends(verify_token)
):
    """Get current status of an agent session"""
    
    if session_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if active_tasks[session_id]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    task_info = active_tasks[session_id]
    
    return SessionStatus(
        session_id=session_id,
        status=task_info["status"],
        progress=task_info.get("progress", 0),
        started_at=task_info["started_at"],
        updated_at=task_info.get("updated_at", task_info["started_at"]),
        browser_active=task_info.get("browser_active", False),
        current_url=task_info.get("current_url"),
        error_count=task_info.get("error_count", 0)
    )

@router.post("/agent/pause/{session_id}")
async def pause_session(
    session_id: str,
    user_id: str = Depends(verify_token)
):
    """Pause an active agent session"""
    
    if session_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if active_tasks[session_id]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    active_tasks[session_id]["status"] = TaskStatus.PAUSED
    active_tasks[session_id]["updated_at"] = datetime.now()
    
    # Send pause event
    await sse_manager.send_event(session_id, {
        "event": "status_change",
        "data": {
            "status": TaskStatus.PAUSED,
            "message": "Task paused by user"
        }
    })
    
    return {"status": "paused", "session_id": session_id}

@router.post("/agent/resume/{session_id}")
async def resume_session(
    session_id: str,
    background_tasks: BackgroundTasks,
    user_id: str = Depends(verify_token)
):
    """Resume a paused agent session"""
    
    if session_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if active_tasks[session_id]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    if active_tasks[session_id]["status"] != TaskStatus.PAUSED:
        raise HTTPException(status_code=400, detail="Session is not paused")
    
    active_tasks[session_id]["status"] = TaskStatus.EXECUTING
    active_tasks[session_id]["updated_at"] = datetime.now()
    
    # Resume task in background
    background_tasks.add_task(
        resume_agent_task,
        session_id
    )
    
    return {"status": "resumed", "session_id": session_id}

@router.delete("/agent/cancel/{session_id}")
async def cancel_session(
    session_id: str,
    user_id: str = Depends(verify_token)
):
    """Cancel an active agent session"""
    
    if session_id not in active_tasks:
        raise HTTPException(status_code=404, detail="Session not found")
    
    if active_tasks[session_id]["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    # Stop browser if active
    if active_tasks[session_id].get("browser_session_id"):
        await browser_manager.stop_browser_session(
            active_tasks[session_id]["browser_session_id"]
        )
    
    # Update status
    active_tasks[session_id]["status"] = TaskStatus.FAILED
    active_tasks[session_id]["error"] = "Cancelled by user"
    
    # Send cancellation event
    await sse_manager.send_event(session_id, {
        "event": "cancelled",
        "data": {
            "message": "Task cancelled by user"
        }
    })
    
    # Disconnect SSE
    await sse_manager.disconnect(session_id)
    
    return {"status": "cancelled", "session_id": session_id}


async def run_agent_task(
    session_id: str,
    request: AgentInvokeRequest,
    user_id: str
):
    """Run the agent task asynchronously"""
    try:
        # Import here to avoid circular imports
        from ..agent import graph, CheatSheetAgentState
        
        # Update status to planning
        active_tasks[session_id]["status"] = TaskStatus.PLANNING
        await send_progress_update(session_id, 10, "Analyzing task requirements...")
        
        # Initialize browser session if needed
        browser_session_id = None
        if request.task_type in ["research", "quiz", "form"]:
            browser_session_id = str(uuid.uuid4())
            port = await browser_manager.start_browser_session(
                browser_session_id,
                headless=request.headless_browser
            )
            active_tasks[session_id]["browser_session_id"] = browser_session_id
            active_tasks[session_id]["browser_active"] = True
            
            await send_progress_update(session_id, 20, "Browser session initialized")
        
        # Create initial state
        initial_state = {
            "messages": [HumanMessage(content=request.task_description)],
            "canvas_assignment_id": request.assignment_id,
            "canvas_course_id": request.course_id,
            "browser_session_id": browser_session_id,
            "task_type": request.task_type.value,
            "task_status": TaskStatus.EXECUTING,
        }
        
        # Update status to executing
        active_tasks[session_id]["status"] = TaskStatus.EXECUTING
        await send_progress_update(session_id, 30, "Starting task execution...")
        
        # Run the agent graph
        config = {"configurable": {"thread_id": session_id}}
        
        async for event in graph.astream_events(initial_state, config, version="v2"):
            # Process events and send updates
            await process_agent_event(session_id, event)
            
            # Check if task was paused or cancelled
            if active_tasks[session_id]["status"] in [TaskStatus.PAUSED, TaskStatus.FAILED]:
                break
        
        # Task completed
        if active_tasks[session_id]["status"] == TaskStatus.EXECUTING:
            active_tasks[session_id]["status"] = TaskStatus.COMPLETED
            await send_progress_update(session_id, 100, "Task completed successfully")
        
    except Exception as e:
        logger.error(f"Agent task failed: {e}")
        active_tasks[session_id]["status"] = TaskStatus.FAILED
        active_tasks[session_id]["error"] = str(e)
        
        await sse_manager.send_event(session_id, {
            "event": "error",
            "data": {
                "error": str(e),
                "message": "Task failed"
            }
        })
    
    finally:
        # Cleanup browser session
        if browser_session_id:
            await browser_manager.stop_browser_session(browser_session_id)
        
        # Send completion event
        await sse_manager.send_event(session_id, {
            "event": "complete",
            "data": {
                "status": active_tasks[session_id]["status"],
                "session_id": session_id
            }
        })
        
        # Disconnect SSE after delay
        await asyncio.sleep(5)
        await sse_manager.disconnect(session_id)


async def send_progress_update(session_id: str, progress: int, message: str):
    """Send a progress update via SSE"""
    active_tasks[session_id]["progress"] = progress
    active_tasks[session_id]["updated_at"] = datetime.now()
    
    await sse_manager.send_event(session_id, {
        "event": "progress",
        "data": {
            "progress": progress,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    })


async def process_agent_event(session_id: str, event: Dict[str, Any]):
    """Process LangGraph events and send relevant updates"""
    event_type = event.get("event")
    
    if event_type == "on_tool_start":
        tool_name = event.get("name", "Unknown tool")
        await sse_manager.send_event(session_id, {
            "event": "tool_call",
            "data": {
                "tool": tool_name,
                "status": "started",
                "timestamp": datetime.now().isoformat()
            }
        })
    
    elif event_type == "on_tool_end":
        tool_name = event.get("name", "Unknown tool")
        await sse_manager.send_event(session_id, {
            "event": "tool_call",
            "data": {
                "tool": tool_name,
                "status": "completed",
                "timestamp": datetime.now().isoformat()
            }
        })
    
    elif event_type == "on_chat_model_stream":
        # Stream partial responses
        content = event.get("data", {}).get("chunk", {}).get("content", "")
        if content:
            await sse_manager.send_event(session_id, {
                "event": "stream",
                "data": {
                    "content": content,
                    "timestamp": datetime.now().isoformat()
                }
            })


async def resume_agent_task(session_id: str):
    """Resume a paused agent task"""
    # Implementation depends on how state is persisted
    # For now, just update status
    await send_progress_update(
        session_id,
        active_tasks[session_id]["progress"],
        "Task resumed"
    )