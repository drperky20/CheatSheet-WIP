"""Browser MCP Client for interacting with browser-use MCP servers"""

import aiohttp
import json
from typing import Dict, Any, Optional, List
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class BrowserMCPClient:
    """Client for interacting with browser-use MCP server"""
    
    def __init__(self, base_url: str):
        self.base_url = base_url.rstrip('/')
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.session:
            await self.session.close()
    
    async def _request(self, method: str, endpoint: str, **kwargs) -> Dict[str, Any]:
        """Make a request to the MCP server"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        
        url = f"{self.base_url}{endpoint}"
        
        try:
            async with self.session.request(method, url, **kwargs) as response:
                data = await response.json()
                
                if response.status >= 400:
                    logger.error(f"MCP request failed: {response.status} - {data}")
                    raise Exception(f"MCP request failed: {data.get('error', 'Unknown error')}")
                
                return data
                
        except aiohttp.ClientError as e:
            logger.error(f"MCP connection error: {e}")
            raise
    
    async def navigate(self, url: str, wait_for: Optional[str] = None) -> Dict[str, Any]:
        """Navigate to a URL"""
        payload = {
            "action": "navigate",
            "params": {
                "url": url
            }
        }
        
        if wait_for:
            payload["params"]["waitFor"] = wait_for
        
        return await self._request("POST", "/browser/navigate", json=payload)
    
    async def click(self, selector: str) -> Dict[str, Any]:
        """Click an element"""
        payload = {
            "action": "click",
            "params": {
                "selector": selector
            }
        }
        
        return await self._request("POST", "/browser/click", json=payload)
    
    async def type_text(self, selector: str, text: str, clear_first: bool = True) -> Dict[str, Any]:
        """Type text into an input"""
        payload = {
            "action": "type",
            "params": {
                "selector": selector,
                "text": text,
                "clearFirst": clear_first
            }
        }
        
        return await self._request("POST", "/browser/type", json=payload)
    
    async def get_content(self, selector: Optional[str] = None) -> Dict[str, Any]:
        """Get page content"""
        payload = {
            "action": "getContent",
            "params": {}
        }
        
        if selector:
            payload["params"]["selector"] = selector
        
        return await self._request("POST", "/browser/content", json=payload)
    
    async def screenshot(self, full_page: bool = False) -> Dict[str, Any]:
        """Take a screenshot"""
        payload = {
            "action": "screenshot",
            "params": {
                "fullPage": full_page
            }
        }
        
        return await self._request("POST", "/browser/screenshot", json=payload)
    
    async def wait_for_selector(self, selector: str, timeout: int = 30000) -> Dict[str, Any]:
        """Wait for an element to appear"""
        payload = {
            "action": "waitFor",
            "params": {
                "selector": selector,
                "timeout": timeout
            }
        }
        
        return await self._request("POST", "/browser/wait", json=payload)
    
    async def execute_script(self, script: str) -> Dict[str, Any]:
        """Execute JavaScript in the browser"""
        payload = {
            "action": "execute",
            "params": {
                "script": script
            }
        }
        
        return await self._request("POST", "/browser/execute", json=payload)
    
    async def fill_form(self, form_data: Dict[str, str]) -> Dict[str, Any]:
        """Fill a form with multiple fields"""
        results = []
        
        for selector, value in form_data.items():
            try:
                result = await self.type_text(selector, value)
                results.append({
                    "selector": selector,
                    "success": True,
                    "result": result
                })
            except Exception as e:
                results.append({
                    "selector": selector,
                    "success": False,
                    "error": str(e)
                })
        
        return {
            "action": "fillForm",
            "results": results,
            "success": all(r["success"] for r in results)
        }
    
    async def extract_data(self, extractors: Dict[str, str]) -> Dict[str, Any]:
        """Extract data from the page using selectors"""
        script = """
        (function() {
            const extractors = %s;
            const results = {};
            
            for (const [key, selector] of Object.entries(extractors)) {
                try {
                    const element = document.querySelector(selector);
                    if (element) {
                        results[key] = element.textContent.trim();
                    } else {
                        results[key] = null;
                    }
                } catch (e) {
                    results[key] = { error: e.message };
                }
            }
            
            return results;
        })();
        """ % json.dumps(extractors)
        
        result = await self.execute_script(script)
        return result.get("result", {})
    
    async def download_file(self, url: str, save_path: str) -> Dict[str, Any]:
        """Download a file from the browser"""
        payload = {
            "action": "download",
            "params": {
                "url": url,
                "savePath": save_path
            }
        }
        
        return await self._request("POST", "/browser/download", json=payload)
    
    async def get_cookies(self) -> List[Dict[str, Any]]:
        """Get browser cookies"""
        result = await self._request("GET", "/browser/cookies")
        return result.get("cookies", [])
    
    async def set_cookie(self, cookie: Dict[str, Any]) -> Dict[str, Any]:
        """Set a browser cookie"""
        return await self._request("POST", "/browser/cookies", json={"cookie": cookie})
    
    async def clear_cookies(self) -> Dict[str, Any]:
        """Clear all browser cookies"""
        return await self._request("DELETE", "/browser/cookies")
    
    async def go_back(self) -> Dict[str, Any]:
        """Navigate back in browser history"""
        return await self._request("POST", "/browser/back")
    
    async def go_forward(self) -> Dict[str, Any]:
        """Navigate forward in browser history"""
        return await self._request("POST", "/browser/forward")
    
    async def refresh(self) -> Dict[str, Any]:
        """Refresh the current page"""
        return await self._request("POST", "/browser/refresh")
    
    async def get_url(self) -> str:
        """Get current page URL"""
        result = await self._request("GET", "/browser/url")
        return result.get("url", "")
    
    async def get_title(self) -> str:
        """Get current page title"""
        result = await self._request("GET", "/browser/title")
        return result.get("title", "")
    
    async def close(self) -> Dict[str, Any]:
        """Close the browser"""
        return await self._request("POST", "/browser/close")