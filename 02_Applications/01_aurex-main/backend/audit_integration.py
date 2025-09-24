
from aurex_platform.core.audit import audit_logger

async def log_user_action(user_id: str, action: str, resource: dict):
    await audit_logger.log_event(
        user_id=user_id,
        action=action,
        resource_type=resource.get("type"),
        resource_id=resource.get("id"),
        metadata=resource
    )
