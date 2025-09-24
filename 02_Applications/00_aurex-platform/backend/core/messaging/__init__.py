"""
Message Queue System for Asynchronous Processing
RabbitMQ/Redis-based messaging with pub/sub and task queues
"""
import asyncio
import json
import uuid
from typing import Any, Callable, Dict, Optional
from datetime import datetime
import redis.asyncio as redis
from enum import Enum
import logging

logger = logging.getLogger(__name__)

class MessagePriority(Enum):
    LOW = 1
    NORMAL = 2
    HIGH = 3
    CRITICAL = 4

class MessageQueue:
    """Asynchronous message queue implementation"""
    
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis_client = None
        self.redis_url = redis_url
        self.handlers = {}
        self.running = False
        
    async def connect(self):
        """Connect to Redis"""
        self.redis_client = await redis.from_url(self.redis_url)
        
    async def disconnect(self):
        """Disconnect from Redis"""
        if self.redis_client:
            await self.redis_client.close()
    
    async def publish(
        self,
        channel: str,
        message: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL
    ) -> str:
        """Publish message to channel"""
        message_id = str(uuid.uuid4())
        payload = {
            "id": message_id,
            "channel": channel,
            "data": message,
            "priority": priority.value,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Add to priority queue
        queue_key = f"queue:{channel}:{priority.name.lower()}"
        await self.redis_client.lpush(queue_key, json.dumps(payload))
        
        # Publish for real-time subscribers
        await self.redis_client.publish(channel, json.dumps(payload))
        
        logger.info(f"Published message {message_id} to {channel}")
        return message_id
    
    async def subscribe(self, channel: str, handler: Callable):
        """Subscribe to channel with handler"""
        self.handlers[channel] = handler
        
    async def process_messages(self, channel: str):
        """Process messages from queue"""
        priorities = [MessagePriority.CRITICAL, MessagePriority.HIGH, 
                     MessagePriority.NORMAL, MessagePriority.LOW]
        
        while self.running:
            for priority in priorities:
                queue_key = f"queue:{channel}:{priority.name.lower()}"
                
                # Get message from queue
                message = await self.redis_client.rpop(queue_key)
                if message:
                    try:
                        payload = json.loads(message)
                        handler = self.handlers.get(channel)
                        if handler:
                            await handler(payload["data"])
                        logger.info(f"Processed message {payload['id']}")
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        # Add to dead letter queue
                        await self.redis_client.lpush(
                            f"dlq:{channel}", message
                        )
            
            await asyncio.sleep(0.1)
    
    async def start_consumer(self, channels: list):
        """Start consuming messages"""
        self.running = True
        tasks = [
            asyncio.create_task(self.process_messages(channel))
            for channel in channels
        ]
        await asyncio.gather(*tasks)
    
    async def stop_consumer(self):
        """Stop consuming messages"""
        self.running = False

class EventBus:
    """Event-driven messaging system"""
    
    def __init__(self, message_queue: MessageQueue):
        self.mq = message_queue
        self.event_handlers = {}
    
    async def emit(self, event: str, data: Dict[str, Any]):
        """Emit an event"""
        await self.mq.publish(f"event:{event}", data)
    
    def on(self, event: str):
        """Decorator for event handlers"""
        def decorator(func):
            async def wrapper(data):
                await func(data)
            self.event_handlers[event] = wrapper
            return wrapper
        return decorator
    
    async def start(self):
        """Start event bus"""
        for event, handler in self.event_handlers.items():
            await self.mq.subscribe(f"event:{event}", handler)

class TaskQueue:
    """Background task queue"""
    
    def __init__(self, message_queue: MessageQueue):
        self.mq = message_queue
        self.task_handlers = {}
    
    async def enqueue(
        self,
        task_name: str,
        params: Dict[str, Any],
        priority: MessagePriority = MessagePriority.NORMAL,
        delay: Optional[int] = None
    ) -> str:
        """Enqueue a background task"""
        task_data = {
            "task": task_name,
            "params": params,
            "enqueued_at": datetime.utcnow().isoformat()
        }
        
        if delay:
            # Schedule for later execution
            task_data["execute_at"] = (
                datetime.utcnow().timestamp() + delay
            )
        
        return await self.mq.publish(
            f"task:{task_name}",
            task_data,
            priority
        )
    
    def task(self, name: str):
        """Decorator for task handlers"""
        def decorator(func):
            async def wrapper(data):
                params = data.get("params", {})
                await func(**params)
            self.task_handlers[name] = wrapper
            return wrapper
        return decorator
    
    async def process_tasks(self):
        """Start processing tasks"""
        for task_name, handler in self.task_handlers.items():
            await self.mq.subscribe(f"task:{task_name}", handler)

# Global instances
message_queue = MessageQueue()
event_bus = EventBus(message_queue)
task_queue = TaskQueue(message_queue)

# Common event types
class SystemEvents:
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"
    USER_LOGIN = "user.login"
    USER_LOGOUT = "user.logout"
    
    CONFIG_UPDATED = "config.updated"
    FEATURE_FLAG_CHANGED = "feature_flag.changed"
    
    ASSESSMENT_CREATED = "assessment.created"
    ASSESSMENT_COMPLETED = "assessment.completed"
    
    SECURITY_ALERT = "security.alert"
    SYSTEM_ERROR = "system.error"

# Example task handlers
@task_queue.task("send_email")
async def send_email_task(to: str, subject: str, body: str):
    """Background task for sending emails"""
    logger.info(f"Sending email to {to}: {subject}")
    # Email sending logic here

@task_queue.task("generate_report")
async def generate_report_task(report_type: str, params: dict):
    """Background task for report generation"""
    logger.info(f"Generating {report_type} report")
    # Report generation logic here

@event_bus.on(SystemEvents.USER_CREATED)
async def handle_user_created(data: dict):
    """Handle user created event"""
    logger.info(f"New user created: {data.get('email')}")
    # Send welcome email
    await task_queue.enqueue(
        "send_email",
        {
            "to": data.get("email"),
            "subject": "Welcome to Aurex Platform",
            "body": "Welcome! Your account has been created."
        }
    )

__all__ = [
    "MessageQueue",
    "EventBus",
    "TaskQueue",
    "MessagePriority",
    "SystemEvents",
    "message_queue",
    "event_bus",
    "task_queue"
]