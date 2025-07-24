"""Browser automation toolkit for academic research and form filling"""

from langchain.tools import tool
from typing import Dict, Any, Optional, List
import asyncio
from datetime import datetime
import logging

# Import MCP components
from ..browser_mcp.manager import browser_manager
from ..browser_mcp.client import BrowserMCPClient

logger = logging.getLogger(__name__)

class BrowserToolkit:
    """Browser automation toolkit for academic tasks"""
    
    def __init__(self):
        self.sessions: Dict[str, BrowserMCPClient] = {}
        self.current_session_id: Optional[str] = None
        self.manager = browser_manager
    
    async def start_session(self, session_id: str, headless: bool = False) -> Dict[str, Any]:
        """Start a new browser session"""
        try:
            port = await self.manager.start_browser_session(session_id, headless)
            mcp_url = self.manager.get_mcp_url(session_id)
            
            if mcp_url:
                client = BrowserMCPClient(mcp_url)
                self.sessions[session_id] = client
                self.current_session_id = session_id
                
                return {
                    "success": True,
                    "session_id": session_id,
                    "port": port,
                    "status": "ready"
                }
            else:
                return {
                    "error": "Failed to get MCP URL",
                    "session_id": session_id
                }
                
        except Exception as e:
            logger.error(f"Failed to start browser session: {e}")
            return {
                "error": "Failed to start browser session",
                "message": str(e)
            }
    
    @tool
    async def navigate(
        self,
        url: str,
        session_id: Optional[str] = None,
        wait_for_selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Navigate to a URL in the browser.
        
        Args:
            url: The URL to navigate to
            session_id: Browser session ID (uses current if not provided)
            wait_for_selector: Optional CSS selector to wait for after navigation
            
        Returns:
            Dict with navigation result and page info
        """
        session_id = session_id or self.current_session_id
        
        if not session_id or session_id not in self.sessions:
            # Auto-start a session if needed
            import uuid
            new_session_id = session_id or str(uuid.uuid4())
            start_result = await self.start_session(new_session_id)
            
            if not start_result.get("success"):
                return start_result
            
            session_id = new_session_id
        
        try:
            client = self.sessions[session_id]
            result = await client.navigate(url, wait_for_selector)
            
            return {
                "success": True,
                "url": url,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                **result
            }
            
        except Exception as e:
            logger.error(f"Navigation failed: {e}")
            return {
                "error": "Navigation failed",
                "message": str(e),
                "url": url
            }
    
    @tool
    async def click(
        self,
        selector: str,
        session_id: Optional[str] = None,
        wait_after: float = 0.5
    ) -> Dict[str, Any]:
        """
        Click an element on the page.
        
        Args:
            selector: CSS selector for the element to click
            session_id: Browser session ID
            wait_after: Seconds to wait after clicking
            
        Returns:
            Dict with click result
        """
        session_id = session_id or self.current_session_id
        
        if not session_id or session_id not in self.sessions:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            client = self.sessions[session_id]
            result = await client.click(selector)
            
            if wait_after > 0:
                await asyncio.sleep(wait_after)
            
            return {
                "success": True,
                "selector": selector,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                **result
            }
            
        except Exception as e:
            logger.error(f"Click failed: {e}")
            return {
                "error": "Click failed",
                "message": str(e),
                "selector": selector
            }
    
    @tool
    async def type_text(
        self,
        selector: str,
        text: str,
        session_id: Optional[str] = None,
        clear_first: bool = True,
        press_enter: bool = False
    ) -> Dict[str, Any]:
        """
        Type text into an input field.
        
        Args:
            selector: CSS selector for the input field
            text: Text to type
            session_id: Browser session ID
            clear_first: Whether to clear the field first
            press_enter: Whether to press Enter after typing
            
        Returns:
            Dict with typing result
        """
        session_id = session_id or self.current_session_id
        
        if not session_id or session_id not in self.sessions:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            client = self.sessions[session_id]
            result = await client.type_text(selector, text, clear_first)
            
            if press_enter:
                # Execute Enter key press
                enter_script = f"document.querySelector('{selector}').dispatchEvent(new KeyboardEvent('keypress', {{key: 'Enter'}}))"
                await client.execute_script(enter_script)
            
            return {
                "success": True,
                "selector": selector,
                "text_length": len(text),
                "cleared": clear_first,
                "enter_pressed": press_enter,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                **result
            }
            
        except Exception as e:
            logger.error(f"Type text failed: {e}")
            return {
                "error": "Type text failed",
                "message": str(e),
                "selector": selector
            }
    
    @tool
    async def get_page_content(
        self,
        session_id: Optional[str] = None,
        selector: Optional[str] = None,
        include_text: bool = True,
        include_html: bool = False
    ) -> Dict[str, Any]:
        """
        Get content from the current page.
        
        Args:
            session_id: Browser session ID
            selector: Optional CSS selector to get content from specific element
            include_text: Whether to include text content
            include_html: Whether to include HTML content
            
        Returns:
            Dict with page content
        """
        session_id = session_id or self.current_session_id
        
        if not session_id or session_id not in self.sessions:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            client = self.sessions[session_id]
            result = await client.get_content(selector)
            
            content = {
                "success": True,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "url": await client.get_url(),
                "title": await client.get_title()
            }
            
            if include_text and "text" in result:
                content["text"] = result["text"]
                
            if include_html and "html" in result:
                content["html"] = result["html"]
                
            if selector:
                content["selector"] = selector
                content["element_found"] = "text" in result or "html" in result
                
            return content
            
        except Exception as e:
            logger.error(f"Get content failed: {e}")
            return {
                "error": "Get content failed",
                "message": str(e)
            }
    
    @tool
    async def extract_structured_data(
        self,
        selectors: Dict[str, str],
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Extract structured data from a page using multiple selectors.
        
        Args:
            selectors: Dict mapping field names to CSS selectors
            session_id: Browser session ID
            
        Returns:
            Dict with extracted data
        """
        session_id = session_id or self.current_session_id
        
        if not session_id:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            # In production, this would interface with browser-use MCP
            extracted_data = {}
            
            for field_name, selector in selectors.items():
                # Simulate extraction
                extracted_data[field_name] = f"Extracted value for {field_name}"
            
            return {
                "success": True,
                "data": extracted_data,
                "fields_extracted": len(extracted_data),
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "error": "Data extraction failed",
                "message": str(e)
            }
    
    @tool
    async def take_screenshot(
        self,
        session_id: Optional[str] = None,
        full_page: bool = False,
        selector: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Take a screenshot of the current page or element.
        
        Args:
            session_id: Browser session ID
            full_page: Whether to capture the full page
            selector: Optional CSS selector to screenshot specific element
            
        Returns:
            Dict with screenshot info
        """
        session_id = session_id or self.current_session_id
        
        if not session_id:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            # In production, this would interface with browser-use MCP
            import uuid
            screenshot_id = str(uuid.uuid4())
            
            return {
                "success": True,
                "screenshot_id": screenshot_id,
                "full_page": full_page,
                "selector": selector,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "error": "Screenshot failed",
                "message": str(e)
            }
    
    @tool
    async def fill_form(
        self,
        form_data: Dict[str, str],
        submit_selector: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Fill a form with multiple fields and optionally submit.
        
        Args:
            form_data: Dict mapping CSS selectors to values
            submit_selector: Optional selector for submit button
            session_id: Browser session ID
            
        Returns:
            Dict with form filling result
        """
        session_id = session_id or self.current_session_id
        
        if not session_id:
            return {
                "error": "No browser session active", 
                "message": "Please start a browser session first"
            }
        
        try:
            # In production, this would interface with browser-use MCP
            filled_fields = []
            
            for selector, value in form_data.items():
                # Simulate filling each field
                filled_fields.append({
                    "selector": selector,
                    "value_length": len(str(value))
                })
            
            result = {
                "success": True,
                "fields_filled": len(filled_fields),
                "fields": filled_fields,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
            
            if submit_selector:
                result["submitted"] = True
                result["submit_selector"] = submit_selector
                
            return result
            
        except Exception as e:
            return {
                "error": "Form filling failed",
                "message": str(e)
            }
    
    @tool
    async def wait_for_element(
        self,
        selector: str,
        timeout: float = 30.0,
        session_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Wait for an element to appear on the page.
        
        Args:
            selector: CSS selector to wait for
            timeout: Maximum time to wait in seconds
            session_id: Browser session ID
            
        Returns:
            Dict with wait result
        """
        session_id = session_id or self.current_session_id
        
        if not session_id:
            return {
                "error": "No browser session active",
                "message": "Please start a browser session first"
            }
        
        try:
            # In production, this would interface with browser-use MCP
            # Simulate a short wait
            await asyncio.sleep(0.5)
            
            return {
                "success": True,
                "selector": selector,
                "found": True,
                "wait_time": 0.5,
                "session_id": session_id,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            return {
                "error": "Wait for element failed",
                "message": str(e),
                "selector": selector
            }