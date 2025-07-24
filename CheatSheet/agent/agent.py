"""
CheatSheet Academic Agent - Main entry point.
Defines the workflow graph, state, tools, nodes and edges for academic task automation.
"""

import os
from typing import Any, List, Dict, Optional
from typing_extensions import Literal
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, BaseMessage
from langchain_core.runnables import RunnableConfig
from langchain.tools import tool
from langgraph.graph import StateGraph, END
from langgraph.types import Command
from langgraph.graph import MessagesState
from langgraph.prebuilt import ToolNode
from dotenv import load_dotenv

# Import academic tools
from tools.canvas_tool import canvas_lms_tool, analyze_assignment_requirements
from tools.browser_toolkit import BrowserToolkit

# Load environment variables from parent directory .env file
load_dotenv(dotenv_path="../.env")

# Initialize browser toolkit
browser_toolkit = BrowserToolkit()

class CheatSheetAgentState(MessagesState):
    """
    State for academic task automation.
    Manages Canvas context, browser sessions, and task progress.
    """
    # Canvas context
    canvas_assignment_id: Optional[str] = None
    canvas_course_id: Optional[str] = None
    assignment_details: Dict[str, Any] = {}
    
    # Browser session
    browser_session_id: Optional[str] = None
    browser_active: bool = False
    current_url: Optional[str] = None
    
    # Task progress
    task_type: str = ""  # research, quiz, essay, form
    task_status: str = "initializing"
    completion_percentage: int = 0
    
    # Document generation
    document_content: str = ""
    document_type: str = ""  # essay, report, answers
    
    # Error handling
    error_count: int = 0
    last_error: Optional[str] = None
    
    # Tools from CopilotKit UI
    tools: List[Any] = []

# Academic tools for the agent
backend_tools = [
    canvas_lms_tool,
    analyze_assignment_requirements,
    browser_toolkit.navigate,
    browser_toolkit.click,
    browser_toolkit.type_text,
    browser_toolkit.get_page_content,
    browser_toolkit.extract_structured_data,
    browser_toolkit.take_screenshot,
    browser_toolkit.fill_form,
    browser_toolkit.wait_for_element,
]

# Extract tool names from backend_tools for comparison
backend_tool_names = [tool.name for tool in backend_tools]


async def chat_node(state: CheatSheetAgentState, config: RunnableConfig) -> Command[Literal["tool_node", "__end__"]]:
    """
    Academic agent chat node implementing the ReAct design pattern.
    Handles Canvas LMS integration, browser automation, and academic task completion.
    """

    # 1. Define the model using OpenRouter with Qwen
    model = ChatOpenAI(
        model="qwen/qwen3-235b-a22b-07-25",
        base_url="https://openrouter.ai/api/v1",
        api_key=os.getenv("OPENROUTER_API_KEY")
    )

    # 2. Bind the tools to the model
    model_with_tools = model.bind_tools(
        [
            *state.get("tools", []), # bind tools defined by CopilotKit UI
            *backend_tools,
        ],
        parallel_tool_calls=False,  # Disable for safer execution
    )

    # 3. Build context-aware system message
    context_parts = []
    
    if state.get("canvas_assignment_id"):
        context_parts.append(f"Canvas Assignment ID: {state.canvas_assignment_id}")
    
    if state.get("assignment_details"):
        context_parts.append(f"Assignment: {state.assignment_details.get('name', 'Unknown')}")
        if 'type' in state.assignment_details:
            context_parts.append(f"Type: {state.assignment_details['type']}")
        if 'word_count' in state.assignment_details:
            context_parts.append(f"Required words: {state.assignment_details['word_count']}")
    
    if state.get("browser_session_id"):
        context_parts.append(f"Browser session active: {state.browser_session_id}")
    
    if state.get("task_type"):
        context_parts.append(f"Current task: {state.task_type}")
    
    context_str = "\n".join(context_parts) if context_parts else "No specific context"
    
    system_message = SystemMessage(
        content=f"""You are an advanced academic assistant specialized in helping students complete academic tasks.
        
Current Context:
{context_str}

Your capabilities include:
- Canvas LMS integration for assignment retrieval and submission
- Browser automation for research and form filling
- Document generation for essays, reports, and responses
- Intelligent task completion with academic integrity

Task Status: {state.get('task_status', 'initializing')}
Progress: {state.get('completion_percentage', 0)}%

Always maintain academic standards and produce high-quality, original work."""
    )

    # 4. Run the model to generate a response
    response = await model_with_tools.ainvoke([
        system_message,
        *state["messages"],
    ], config)

    # only route to tool node if tool is not in the tools list
    if route_to_tool_node(response):
        print("routing to tool node")
        return Command(
            goto="tool_node",
            update={
                "messages": [response],
            }
        )

    # 5. We've handled all tool calls, so we can end the graph.
    return Command(
        goto=END,
        update={
            "messages": [response],
        }
    )

def route_to_tool_node(response: BaseMessage):
    """
    Route to tool node if any tool call in the response matches a backend tool name.
    """
    tool_calls = getattr(response, "tool_calls", None)
    if not tool_calls:
        return False

    for tool_call in tool_calls:
        if tool_call.get("name") in backend_tool_names:
            return True
    return False

# Define the workflow graph
workflow = StateGraph(CheatSheetAgentState)
workflow.add_node("chat_node", chat_node)
workflow.add_node("tool_node", ToolNode(tools=backend_tools))
workflow.add_edge("tool_node", "chat_node")
workflow.set_entry_point("chat_node")

graph = workflow.compile()

# FastAPI integration
if __name__ == "__main__":
    import uvicorn
    from api.main import app
    
    # Run the FastAPI server
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
