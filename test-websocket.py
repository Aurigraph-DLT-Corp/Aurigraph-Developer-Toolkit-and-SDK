#!/usr/bin/env python3

import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:3088/ws"
    try:
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Send a test message
            test_message = {
                "type": "getStatus"
            }
            await websocket.send(json.dumps(test_message))
            print("📤 Sent test message")
            
            # Wait for response
            response = await asyncio.wait_for(websocket.recv(), timeout=5)
            data = json.loads(response)
            print(f"📥 Received response: {data}")
            
            return True
            
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_websocket())
    if result:
        print("🚀 WebSocket connectivity verified!")
    else:
        print("⚠️  WebSocket connectivity issues detected")