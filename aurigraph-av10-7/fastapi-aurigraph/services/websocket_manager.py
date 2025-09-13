"""
WebSocket Manager for real-time updates
Handles all WebSocket connections and broadcasting
"""

import asyncio
import json
from datetime import datetime
from typing import List, Dict, Any
from fastapi import WebSocket, WebSocketDisconnect

class WebSocketManager:
    """Manage WebSocket connections and broadcasting"""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.is_broadcasting = False
        
    async def connect(self, websocket: WebSocket):
        """Accept and store WebSocket connection"""
        await websocket.accept()
        self.active_connections.append(websocket)
        print(f"📡 WebSocket connected. Total connections: {len(self.active_connections)}")
        
    async def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            print(f"📡 WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific WebSocket"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending personal message: {e}")
            await self.disconnect(websocket)
    
    async def broadcast_message(self, message: dict):
        """Send message to all connected WebSockets"""
        if not self.active_connections:
            return
            
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to connection: {e}")
                disconnected.append(connection)
        
        # Remove disconnected connections
        for connection in disconnected:
            await self.disconnect(connection)
    
    async def broadcast_state(self, state_data: dict):
        """Broadcast platform state to all connections"""
        message = {
            "type": "state_update",
            "timestamp": datetime.now().isoformat(),
            "data": state_data
        }
        await self.broadcast_message(message)
    
    async def broadcast_alert(self, alert_data: dict):
        """Broadcast alert to all connections"""
        message = {
            "type": "alert",
            "timestamp": datetime.now().isoformat(),
            "data": alert_data
        }
        await self.broadcast_message(message)
    
    async def broadcast_loop(self):
        """Background loop for periodic broadcasts"""
        self.is_broadcasting = True
        while self.is_broadcasting:
            try:
                # Send ping to keep connections alive
                if self.active_connections:
                    ping_message = {
                        "type": "ping",
                        "timestamp": datetime.now().isoformat(),
                        "connections": len(self.active_connections)
                    }
                    await self.broadcast_message(ping_message)
                
                await asyncio.sleep(30)  # Ping every 30 seconds
            except Exception as e:
                print(f"WebSocket broadcast loop error: {e}")
                await asyncio.sleep(10)
    
    def stop_broadcasting(self):
        """Stop the broadcast loop"""
        self.is_broadcasting = False
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)
    
    async def disconnect_all(self):
        """Disconnect all WebSocket connections"""
        for connection in self.active_connections.copy():
            try:
                await connection.close()
            except Exception:
                pass
            await self.disconnect(connection)