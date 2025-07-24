"""Canvas LMS integration tool for academic tasks"""

from langchain.tools import tool
from typing import Dict, Any, Optional, List
import aiohttp
import json
from datetime import datetime

@tool
async def canvas_lms_tool(
    action: str,
    endpoint_path: Optional[str] = None,
    params: Optional[Dict[str, Any]] = None,
    canvas_domain: Optional[str] = None,
    canvas_token: Optional[str] = None
) -> Dict[str, Any]:
    """
    Interact with Canvas LMS API for academic tasks.
    
    Args:
        action: The Canvas action to perform (get_assignment, list_courses, submit_assignment, etc.)
        endpoint_path: Optional custom API endpoint path
        params: Optional parameters for the API call
        canvas_domain: Canvas instance domain (e.g., "university.instructure.com")
        canvas_token: Canvas API token (should be retrieved from secure storage)
    
    Returns:
        Dict containing the Canvas API response or error information
    """
    
    # In production, these would come from secure storage
    if not canvas_domain or not canvas_token:
        return {
            "error": "Canvas credentials not configured",
            "message": "Please configure Canvas LMS integration in settings"
        }
    
    base_url = f"https://{canvas_domain}/api/v1"
    
    # Map actions to Canvas API endpoints
    action_map = {
        "get_assignment": {
            "method": "GET",
            "endpoint": endpoint_path or "/courses/{course_id}/assignments/{assignment_id}"
        },
        "list_courses": {
            "method": "GET", 
            "endpoint": "/courses"
        },
        "list_assignments": {
            "method": "GET",
            "endpoint": "/courses/{course_id}/assignments"
        },
        "get_submission": {
            "method": "GET",
            "endpoint": "/courses/{course_id}/assignments/{assignment_id}/submissions/self"
        },
        "submit_assignment": {
            "method": "POST",
            "endpoint": "/courses/{course_id}/assignments/{assignment_id}/submissions"
        },
        "get_rubric": {
            "method": "GET",
            "endpoint": "/courses/{course_id}/assignments/{assignment_id}/rubric"
        }
    }
    
    if action not in action_map:
        return {
            "error": "Invalid action",
            "message": f"Action '{action}' not supported. Supported actions: {list(action_map.keys())}"
        }
    
    action_config = action_map[action]
    endpoint = action_config["endpoint"]
    
    # Format endpoint with parameters
    if params and "{" in endpoint:
        endpoint = endpoint.format(**params)
    
    url = f"{base_url}{endpoint}"
    
    headers = {
        "Authorization": f"Bearer {canvas_token}",
        "Content-Type": "application/json"
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            if action_config["method"] == "GET":
                async with session.get(url, headers=headers, params=params) as response:
                    data = await response.json()
                    
                    if response.status == 200:
                        return {
                            "success": True,
                            "data": data,
                            "action": action,
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "error": f"Canvas API error: {response.status}",
                            "message": data.get("message", "Unknown error"),
                            "details": data
                        }
                        
            elif action_config["method"] == "POST":
                async with session.post(url, headers=headers, json=params) as response:
                    data = await response.json()
                    
                    if response.status in [200, 201]:
                        return {
                            "success": True,
                            "data": data,
                            "action": action,
                            "timestamp": datetime.now().isoformat()
                        }
                    else:
                        return {
                            "error": f"Canvas API error: {response.status}",
                            "message": data.get("message", "Unknown error"),
                            "details": data
                        }
                        
    except Exception as e:
        return {
            "error": "Canvas API connection failed",
            "message": str(e),
            "action": action
        }


# Additional helper tools for specific Canvas operations

@tool
async def analyze_assignment_requirements(
    assignment_data: Dict[str, Any]
) -> Dict[str, Any]:
    """
    Analyze Canvas assignment data to extract key requirements.
    
    Args:
        assignment_data: Raw assignment data from Canvas API
        
    Returns:
        Structured requirements including type, word count, due date, etc.
    """
    
    requirements = {
        "name": assignment_data.get("name", "Untitled Assignment"),
        "description": assignment_data.get("description", ""),
        "due_at": assignment_data.get("due_at"),
        "points_possible": assignment_data.get("points_possible", 0),
        "submission_types": assignment_data.get("submission_types", []),
        "allowed_extensions": assignment_data.get("allowed_extensions", []),
        "rubric": assignment_data.get("rubric", {}),
        "has_rubric": bool(assignment_data.get("rubric")),
    }
    
    # Extract word count if mentioned in description
    import re
    description = requirements["description"].lower()
    
    word_count_match = re.search(r'(\d+)\s*words?', description)
    if word_count_match:
        requirements["word_count"] = int(word_count_match.group(1))
    
    page_count_match = re.search(r'(\d+)\s*pages?', description)
    if page_count_match:
        requirements["page_count"] = int(page_count_match.group(1))
        # Estimate word count from pages (assuming ~250 words per page)
        if "word_count" not in requirements:
            requirements["word_count"] = int(page_count_match.group(1)) * 250
    
    # Determine assignment type
    if "online_quiz" in requirements["submission_types"]:
        requirements["type"] = "quiz"
    elif "online_upload" in requirements["submission_types"]:
        if any(ext in requirements["allowed_extensions"] for ext in ["doc", "docx", "pdf"]):
            requirements["type"] = "essay"
        else:
            requirements["type"] = "file_upload"
    elif "online_text_entry" in requirements["submission_types"]:
        requirements["type"] = "text_response"
    elif "discussion_topic" in requirements["submission_types"]:
        requirements["type"] = "discussion"
    else:
        requirements["type"] = "unknown"
    
    return requirements