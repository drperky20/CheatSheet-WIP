"""Test script for CheatSheet Agent API"""

import asyncio
import aiohttp
import json
from datetime import datetime
from api.auth import create_test_token

async def test_agent_api():
    """Test the agent API endpoints"""
    
    # Create a test token
    test_user_id = "test-user-123"
    token = create_test_token(test_user_id)
    
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    base_url = "http://localhost:8000"
    
    async with aiohttp.ClientSession() as session:
        # 1. Health check
        print("1. Testing health check...")
        async with session.get(f"{base_url}/api/v1/health") as resp:
            health = await resp.json()
            print(f"   Health: {health}")
        
        # 2. Start an agent task
        print("\n2. Starting agent task...")
        task_request = {
            "task_description": "Research the latest developments in quantum computing and create a 500-word summary",
            "task_type": "research",
            "headless_browser": True
        }
        
        async with session.post(
            f"{base_url}/api/v1/agent/invoke",
            headers=headers,
            json=task_request
        ) as resp:
            if resp.status == 200:
                invoke_response = await resp.json()
                session_id = invoke_response["session_id"]
                print(f"   Session ID: {session_id}")
                print(f"   Stream URL: {invoke_response['stream_url']}")
                print(f"   Estimated time: {invoke_response['estimated_time']}s")
            else:
                print(f"   Error: {resp.status} - {await resp.text()}")
                return
        
        # 3. Get session status
        print("\n3. Getting session status...")
        await asyncio.sleep(2)  # Wait a bit
        
        async with session.get(
            f"{base_url}/api/v1/agent/status/{session_id}",
            headers=headers
        ) as resp:
            if resp.status == 200:
                status = await resp.json()
                print(f"   Status: {status['status']}")
                print(f"   Progress: {status['progress']}%")
            else:
                print(f"   Error: {resp.status}")
        
        # 4. Stream events (for a few seconds)
        print("\n4. Streaming events...")
        try:
            async with session.get(
                f"{base_url}/api/v1/agent/stream/{session_id}",
                headers=headers
            ) as resp:
                async for line in resp.content:
                    if line:
                        decoded = line.decode('utf-8').strip()
                        if decoded.startswith('data:'):
                            data = decoded[5:].strip()
                            if data:
                                try:
                                    event_data = json.loads(data)
                                    print(f"   Event: {event_data}")
                                except json.JSONDecodeError:
                                    pass
                        
                        # Stop after a few events
                        await asyncio.sleep(0.1)
                        if asyncio.get_event_loop().time() > asyncio.get_event_loop().time() + 5:
                            break
                            
        except Exception as e:
            print(f"   Streaming ended: {e}")
        
        # 5. Cancel the session
        print("\n5. Cancelling session...")
        async with session.delete(
            f"{base_url}/api/v1/agent/cancel/{session_id}",
            headers=headers
        ) as resp:
            if resp.status == 200:
                result = await resp.json()
                print(f"   Result: {result}")
            else:
                print(f"   Error: {resp.status}")

if __name__ == "__main__":
    print("CheatSheet Agent API Test")
    print("=" * 50)
    
    asyncio.run(test_agent_api())