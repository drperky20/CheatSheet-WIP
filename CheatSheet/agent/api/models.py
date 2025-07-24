"""API request/response models"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class TaskType(str, Enum):
    """Types of academic tasks"""
    RESEARCH = "research"
    ESSAY = "essay"
    QUIZ = "quiz"
    FORM = "form"
    DISCUSSION = "discussion"
    ANALYSIS = "analysis"

class TaskStatus(str, Enum):
    """Task execution status"""
    INITIALIZING = "initializing"
    PLANNING = "planning"
    EXECUTING = "executing"
    REVIEWING = "reviewing"
    COMPLETED = "completed"
    FAILED = "failed"
    PAUSED = "paused"

class AgentInvokeRequest(BaseModel):
    """Request to start a new agent task"""
    task_description: str = Field(..., description="Natural language description of the task")
    task_type: TaskType = Field(..., description="Type of academic task")
    assignment_id: Optional[str] = Field(None, description="Canvas assignment ID if applicable")
    course_id: Optional[str] = Field(None, description="Canvas course ID if applicable")
    canvas_domain: Optional[str] = Field(None, description="Canvas instance domain")
    additional_context: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Additional context for the task")
    headless_browser: bool = Field(True, description="Run browser in headless mode")

class AgentInvokeResponse(BaseModel):
    """Response after starting an agent task"""
    session_id: str = Field(..., description="Unique session identifier")
    status: str = Field(..., description="Initial status of the task")
    stream_url: str = Field(..., description="URL to stream real-time updates")
    estimated_time: Optional[int] = Field(None, description="Estimated completion time in seconds")

class AgentUpdate(BaseModel):
    """Real-time update from agent"""
    session_id: str
    timestamp: datetime
    event_type: str  # status_change, tool_call, progress, error, complete
    status: TaskStatus
    progress: int = Field(ge=0, le=100, description="Completion percentage")
    message: Optional[str] = None
    data: Optional[Dict[str, Any]] = None
    
class AgentResult(BaseModel):
    """Final result of an agent task"""
    session_id: str
    status: TaskStatus
    completed_at: datetime
    document_content: Optional[str] = None
    document_type: Optional[str] = None
    error: Optional[str] = None
    metrics: Dict[str, Any] = Field(default_factory=dict)

class SessionStatus(BaseModel):
    """Current status of an agent session"""
    session_id: str
    status: TaskStatus
    progress: int
    started_at: datetime
    updated_at: datetime
    browser_active: bool
    current_url: Optional[str] = None
    error_count: int = 0

class HealthCheck(BaseModel):
    """API health check response"""
    status: str = "healthy"
    timestamp: datetime = Field(default_factory=datetime.now)
    version: str = "1.0.0"
    active_sessions: int = 0