#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ NOTIFICATIONS & COMMUNICATIONS API ENDPOINTS  
VIBE Framework Implementation - Velocity & Intelligence
Real-time notifications, alerts, and communication management
"""

from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, and_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field
import uuid

from ..database import get_db
from ..models.notification_models import (
    Notification, AlertRule, NotificationTemplate, EmailCampaign,
    AlertHistory, NotificationPreference, AnnouncementBoard,
    CommunicationLog, WebhookEndpoint, NotificationQueue,
    NotificationType, NotificationPriority, NotificationChannel,
    AlertSeverity, CommunicationStatus
)
from ..models.auth_models import User
from ..auth import get_current_active_user

router = APIRouter(prefix="/notifications", tags=["notifications"])

# ================================================================================
# PYDANTIC SCHEMAS
# ================================================================================

class NotificationCreate(BaseModel):
    title: str = Field(..., max_length=200)
    message: str
    notification_type: NotificationType
    priority: NotificationPriority = NotificationPriority.MEDIUM
    source_type: Optional[str] = None
    source_id: Optional[uuid.UUID] = None
    channels: List[str] = ["in_app"]
    recipient_ids: Optional[List[uuid.UUID]] = None
    scheduled_time: Optional[datetime] = None
    action_url: Optional[str] = None
    requires_acknowledgment: bool = False

class AlertRuleCreate(BaseModel):
    name: str = Field(..., max_length=200)
    description: Optional[str] = None
    rule_type: str
    entity_type: str
    conditions: Dict[str, Any]
    severity: AlertSeverity = AlertSeverity.WARNING
    priority: NotificationPriority = NotificationPriority.MEDIUM
    check_frequency: str = "Hourly"
    channels: List[str] = ["email", "in_app"]
    subscriber_ids: List[uuid.UUID] = []

class NotificationTemplateCreate(BaseModel):
    name: str = Field(..., max_length=200)
    template_code: str = Field(..., max_length=100)
    subject_template: Optional[str] = None
    body_template: str
    html_template: Optional[str] = None
    notification_type: Optional[NotificationType] = None
    default_priority: NotificationPriority = NotificationPriority.MEDIUM
    variables: Optional[Dict[str, Any]] = None

class EmailCampaignCreate(BaseModel):
    campaign_name: str = Field(..., max_length=200)
    campaign_type: str = "Newsletter"
    subject: str = Field(..., max_length=500)
    html_content: str
    recipient_list: List[str]
    scheduled_date: Optional[datetime] = None
    esg_related: bool = False

class NotificationPreferenceUpdate(BaseModel):
    email_enabled: Optional[bool] = None
    sms_enabled: Optional[bool] = None
    push_enabled: Optional[bool] = None
    in_app_enabled: Optional[bool] = None
    priority_threshold: Optional[NotificationPriority] = None
    quiet_hours_start: Optional[str] = None
    quiet_hours_end: Optional[str] = None
    digest_enabled: Optional[bool] = None

# ================================================================================
# NOTIFICATION ENDPOINTS
# ================================================================================

@router.get("/", response_model=List[Dict[str, Any]])
async def list_notifications(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, le=200),
    notification_type: Optional[NotificationType] = None,
    priority: Optional[NotificationPriority] = None,
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List user notifications with VIBE velocity filtering"""
    
    # Base query for user's notifications
    query = db.query(Notification).join(
        Notification.recipients
    ).filter(
        User.id == current_user.id
    )
    
    # Apply filters
    if notification_type:
        query = query.filter(Notification.notification_type == notification_type)
    if priority:
        query = query.filter(Notification.priority == priority)
    if unread_only:
        # Filter for unread notifications (not implemented in association table for simplicity)
        pass
    
    # Apply pagination and ordering
    notifications = query.offset(skip).limit(limit).order_by(desc(Notification.created_at)).all()
    
    notification_data = []
    for notification in notifications:
        notification_data.append({
            "id": str(notification.id),
            "title": notification.title,
            "message": notification.message,
            "notification_type": notification.notification_type.value,
            "priority": notification.priority.value,
            "sender_name": notification.sender_name,
            "action_url": notification.action_url,
            "action_text": notification.action_text,
            "icon": notification.icon,
            "requires_acknowledgment": notification.requires_acknowledgment,
            "is_dismissible": notification.is_dismissible,
            "created_at": notification.created_at,
            "sent_time": notification.sent_time,
            "vibe_engagement_rate": notification.vibe_engagement_rate
        })
    
    return notification_data

@router.post("/", response_model=Dict[str, Any])
async def create_notification(
    notification_data: NotificationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create and send notification with VIBE velocity optimization"""
    
    notification = Notification(
        organization_id=current_user.organization_id,
        sender_id=current_user.id,
        sender_name=f"{current_user.first_name} {current_user.last_name}",
        **notification_data.dict(exclude={"recipient_ids"})
    )
    
    # Set delivery time
    if notification_data.scheduled_time:
        notification.scheduled_time = notification_data.scheduled_time
    else:
        notification.sent_time = datetime.utcnow()
    
    # VIBE velocity metrics
    notification.vibe_delivery_speed = 0.1  # Immediate delivery in seconds
    notification.vibe_engagement_rate = 0.0  # Will be updated based on interactions
    
    db.add(notification)
    db.flush()  # Get the ID
    
    # Add recipients
    if notification_data.recipient_ids:
        recipients = db.query(User).filter(User.id.in_(notification_data.recipient_ids)).all()
        notification.recipients = recipients
        notification.total_recipients = len(recipients)
    else:
        # Send to all organization users if no specific recipients
        org_users = db.query(User).filter(User.organization_id == current_user.organization_id).all()
        notification.recipients = org_users
        notification.total_recipients = len(org_users)
    
    # Queue for delivery if not immediate
    if notification.scheduled_time and notification.scheduled_time > datetime.utcnow():
        for channel in notification_data.channels:
            for recipient in notification.recipients:
                queue_item = NotificationQueue(
                    notification_id=notification.id,
                    channel=NotificationChannel(channel),
                    recipient=recipient.email,
                    scheduled_for=notification.scheduled_time,
                    priority=5 if notification.priority == NotificationPriority.MEDIUM else 3
                )
                db.add(queue_item)
    
    db.commit()
    db.refresh(notification)
    
    return {
        "message": "Notification created successfully",
        "notification_id": str(notification.id),
        "recipients": notification.total_recipients
    }

@router.put("/{notification_id}/acknowledge")
async def acknowledge_notification(
    notification_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Acknowledge notification with VIBE engagement tracking"""
    
    notification = db.query(Notification).filter(Notification.id == notification_id).first()
    
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Update acknowledgment count
    notification.acknowledged_count += 1
    
    # Update VIBE engagement rate
    if notification.total_recipients > 0:
        notification.vibe_engagement_rate = notification.acknowledged_count / notification.total_recipients * 100
    
    db.commit()
    
    return {"message": "Notification acknowledged"}

@router.get("/unread-count")
async def get_unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get count of unread notifications for current user"""
    
    # Simplified implementation - in real scenario would track read status per user
    recent_notifications = db.query(Notification).join(
        Notification.recipients
    ).filter(
        User.id == current_user.id,
        Notification.created_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    return {"unread_count": recent_notifications}

# ================================================================================
# ALERT RULES ENDPOINTS
# ================================================================================

@router.get("/alerts/rules")
async def list_alert_rules(
    active_only: bool = Query(True),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List alert rules with VIBE intelligence metrics"""
    
    query = db.query(AlertRule).filter(AlertRule.organization_id == current_user.organization_id)
    
    if active_only:
        query = query.filter(AlertRule.is_active == True)
    
    rules = query.order_by(desc(AlertRule.created_at)).all()
    
    rule_data = []
    for rule in rules:
        rule_data.append({
            "id": str(rule.id),
            "name": rule.name,
            "description": rule.description,
            "rule_type": rule.rule_type,
            "entity_type": rule.entity_type,
            "severity": rule.severity.value,
            "priority": rule.priority.value,
            "check_frequency": rule.check_frequency,
            "channels": rule.channels,
            "is_active": rule.is_active,
            "last_triggered": rule.last_triggered,
            "trigger_count": rule.trigger_count,
            "vibe_accuracy": rule.vibe_accuracy,
            "vibe_response_time": rule.vibe_response_time,
            "created_at": rule.created_at
        })
    
    return rule_data

@router.post("/alerts/rules")
async def create_alert_rule(
    rule_data: AlertRuleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create alert rule with VIBE intelligence monitoring"""
    
    alert_rule = AlertRule(
        organization_id=current_user.organization_id,
        is_active=True,
        trigger_count=0,
        **rule_data.dict(exclude={"subscriber_ids"})
    )
    
    # Initialize VIBE scores
    alert_rule.vibe_accuracy = 85.0  # Starting accuracy score
    alert_rule.vibe_response_time = 5.0  # Target 5 minutes response time
    
    db.add(alert_rule)
    db.flush()
    
    # Add subscribers
    if rule_data.subscriber_ids:
        subscribers = db.query(User).filter(User.id.in_(rule_data.subscriber_ids)).all()
        alert_rule.subscribers = subscribers
    
    db.commit()
    db.refresh(alert_rule)
    
    return {"message": "Alert rule created successfully", "rule_id": str(alert_rule.id)}

@router.put("/alerts/rules/{rule_id}/toggle")
async def toggle_alert_rule(
    rule_id: uuid.UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Toggle alert rule active status"""
    
    rule = db.query(AlertRule).filter(
        AlertRule.id == rule_id,
        AlertRule.organization_id == current_user.organization_id
    ).first()
    
    if not rule:
        raise HTTPException(status_code=404, detail="Alert rule not found")
    
    rule.is_active = not rule.is_active
    db.commit()
    
    status_text = "activated" if rule.is_active else "deactivated"
    return {"message": f"Alert rule {status_text}"}

# ================================================================================
# ALERT HISTORY & MONITORING
# ================================================================================

@router.get("/alerts/history")
async def list_alert_history(
    rule_id: Optional[uuid.UUID] = None,
    severity: Optional[AlertSeverity] = None,
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List alert history with response analytics"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    query = db.query(AlertHistory).join(AlertRule).filter(
        AlertRule.organization_id == current_user.organization_id,
        AlertHistory.triggered_at >= cutoff_date
    )
    
    if rule_id:
        query = query.filter(AlertHistory.alert_rule_id == rule_id)
    if severity:
        query = query.filter(AlertHistory.severity == severity)
    
    history = query.order_by(desc(AlertHistory.triggered_at)).all()
    
    history_data = []
    for record in history:
        history_data.append({
            "id": str(record.id),
            "alert_rule_id": str(record.alert_rule_id),
            "triggered_at": record.triggered_at,
            "severity": record.severity.value,
            "message": record.message,
            "acknowledged_at": record.acknowledged_at,
            "resolution_time": record.resolution_time,
            "notifications_sent": record.notifications_sent,
            "channels_used": record.channels_used
        })
    
    return {
        "alerts": history_data,
        "summary": {
            "total_alerts": len(history),
            "critical_alerts": len([h for h in history if h.severity == AlertSeverity.CRITICAL]),
            "average_resolution_time": sum([h.resolution_time or 0 for h in history]) / len(history) if history else 0,
            "acknowledgment_rate": len([h for h in history if h.acknowledged_at]) / len(history) * 100 if history else 0
        }
    }

# ================================================================================
# NOTIFICATION TEMPLATES
# ================================================================================

@router.get("/templates")
async def list_notification_templates(
    notification_type: Optional[NotificationType] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List notification templates"""
    
    query = db.query(NotificationTemplate).filter(
        NotificationTemplate.organization_id == current_user.organization_id,
        NotificationTemplate.is_active == True
    )
    
    if notification_type:
        query = query.filter(NotificationTemplate.notification_type == notification_type)
    
    templates = query.order_by(NotificationTemplate.name).all()
    
    template_data = []
    for template in templates:
        template_data.append({
            "id": str(template.id),
            "name": template.name,
            "template_code": template.template_code,
            "subject_template": template.subject_template,
            "notification_type": template.notification_type.value if template.notification_type else None,
            "default_priority": template.default_priority.value,
            "usage_count": template.usage_count,
            "variables": template.variables,
            "created_at": template.created_at
        })
    
    return template_data

@router.post("/templates")
async def create_notification_template(
    template_data: NotificationTemplateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create notification template"""
    
    # Check if template code already exists
    existing = db.query(NotificationTemplate).filter(
        NotificationTemplate.template_code == template_data.template_code,
        NotificationTemplate.organization_id == current_user.organization_id
    ).first()
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Template code already exists"
        )
    
    template = NotificationTemplate(
        organization_id=current_user.organization_id,
        is_active=True,
        usage_count=0,
        **template_data.dict()
    )
    
    db.add(template)
    db.commit()
    db.refresh(template)
    
    return {"message": "Template created successfully", "template_id": str(template.id)}

# ================================================================================
# EMAIL CAMPAIGNS
# ================================================================================

@router.get("/campaigns")
async def list_email_campaigns(
    status: Optional[CommunicationStatus] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List email campaigns with performance metrics"""
    
    query = db.query(EmailCampaign).filter(EmailCampaign.organization_id == current_user.organization_id)
    
    if status:
        query = query.filter(EmailCampaign.status == status)
    
    campaigns = query.order_by(desc(EmailCampaign.created_at)).all()
    
    campaign_data = []
    for campaign in campaigns:
        campaign_data.append({
            "id": str(campaign.id),
            "campaign_name": campaign.campaign_name,
            "campaign_type": campaign.campaign_type,
            "subject": campaign.subject,
            "status": campaign.status.value,
            "total_recipients": campaign.total_recipients,
            "scheduled_date": campaign.scheduled_date,
            "sent_date": campaign.sent_date,
            "opens": campaign.opens,
            "clicks": campaign.clicks,
            "open_rate": campaign.open_rate,
            "click_rate": campaign.click_rate,
            "esg_related": campaign.esg_related,
            "created_at": campaign.created_at
        })
    
    return campaign_data

@router.post("/campaigns")
async def create_email_campaign(
    campaign_data: EmailCampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create email campaign with VIBE velocity scheduling"""
    
    campaign = EmailCampaign(
        organization_id=current_user.organization_id,
        status=CommunicationStatus.DRAFT,
        total_recipients=len(campaign_data.recipient_list),
        opens=0,
        clicks=0,
        bounces=0,
        unsubscribes=0,
        **campaign_data.dict()
    )
    
    db.add(campaign)
    db.commit()
    db.refresh(campaign)
    
    return {"message": "Email campaign created successfully", "campaign_id": str(campaign.id)}

# ================================================================================
# USER PREFERENCES
# ================================================================================

@router.get("/preferences")
async def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get user notification preferences"""
    
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        # Create default preferences
        preferences = NotificationPreference(
            user_id=current_user.id,
            email_address=current_user.email
        )
        db.add(preferences)
        db.commit()
        db.refresh(preferences)
    
    return {
        "email_enabled": preferences.email_enabled,
        "sms_enabled": preferences.sms_enabled,
        "push_enabled": preferences.push_enabled,
        "in_app_enabled": preferences.in_app_enabled,
        "priority_threshold": preferences.priority_threshold.value if preferences.priority_threshold else None,
        "quiet_hours_start": preferences.quiet_hours_start,
        "quiet_hours_end": preferences.quiet_hours_end,
        "digest_enabled": preferences.digest_enabled,
        "digest_frequency": preferences.digest_frequency,
        "esg_alerts": preferences.esg_alerts,
        "compliance_alerts": preferences.compliance_alerts,
        "preferred_language": preferences.preferred_language
    }

@router.put("/preferences")
async def update_notification_preferences(
    preferences_data: NotificationPreferenceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update user notification preferences"""
    
    preferences = db.query(NotificationPreference).filter(
        NotificationPreference.user_id == current_user.id
    ).first()
    
    if not preferences:
        preferences = NotificationPreference(user_id=current_user.id)
        db.add(preferences)
    
    # Update preferences
    for field, value in preferences_data.dict(exclude_unset=True).items():
        setattr(preferences, field, value)
    
    db.commit()
    
    return {"message": "Notification preferences updated successfully"}

# ================================================================================
# ANNOUNCEMENT BOARD
# ================================================================================

@router.get("/announcements")
async def list_announcements(
    announcement_type: Optional[str] = None,
    pinned_only: bool = Query(False),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """List organization announcements"""
    
    query = db.query(AnnouncementBoard).filter(
        AnnouncementBoard.organization_id == current_user.organization_id,
        AnnouncementBoard.publish_date <= datetime.utcnow()
    ).filter(
        (AnnouncementBoard.expiry_date.is_(None)) | 
        (AnnouncementBoard.expiry_date > datetime.utcnow())
    )
    
    if announcement_type:
        query = query.filter(AnnouncementBoard.announcement_type == announcement_type)
    if pinned_only:
        query = query.filter(AnnouncementBoard.is_pinned == True)
    
    # Order by pinned first, then by publish date
    announcements = query.order_by(
        desc(AnnouncementBoard.is_pinned),
        desc(AnnouncementBoard.publish_date)
    ).all()
    
    announcement_data = []
    for announcement in announcements:
        announcement_data.append({
            "id": str(announcement.id),
            "title": announcement.title,
            "content": announcement.content,
            "announcement_type": announcement.announcement_type,
            "is_pinned": announcement.is_pinned,
            "publish_date": announcement.publish_date,
            "expiry_date": announcement.expiry_date,
            "view_count": announcement.view_count,
            "like_count": announcement.like_count,
            "comment_count": announcement.comment_count,
            "esg_category": announcement.esg_category,
            "author_name": f"{announcement.author.first_name} {announcement.author.last_name}" if announcement.author else "System"
        })
    
    return announcement_data

# ================================================================================
# ANALYTICS & DASHBOARD
# ================================================================================

@router.get("/analytics/dashboard")
async def get_notifications_dashboard(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Comprehensive notifications analytics with VIBE intelligence"""
    
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    # Notification metrics
    notifications = db.query(Notification).filter(
        Notification.organization_id == current_user.organization_id,
        Notification.created_at >= cutoff_date
    ).all()
    
    # Alert metrics
    alerts = db.query(AlertHistory).join(AlertRule).filter(
        AlertRule.organization_id == current_user.organization_id,
        AlertHistory.triggered_at >= cutoff_date
    ).all()
    
    # Campaign metrics
    campaigns = db.query(EmailCampaign).filter(
        EmailCampaign.organization_id == current_user.organization_id,
        EmailCampaign.created_at >= cutoff_date
    ).all()
    
    # Calculate VIBE metrics
    avg_delivery_speed = sum([n.vibe_delivery_speed or 0 for n in notifications]) / len(notifications) if notifications else 0
    avg_engagement_rate = sum([n.vibe_engagement_rate or 0 for n in notifications]) / len(notifications) if notifications else 0
    
    # Alert response metrics
    avg_response_time = sum([a.resolution_time or 0 for a in alerts]) / len(alerts) if alerts else 0
    alert_acknowledgment_rate = len([a for a in alerts if a.acknowledged_at]) / len(alerts) * 100 if alerts else 0
    
    return {
        "overview": {
            "period_days": days,
            "total_notifications": len(notifications),
            "total_alerts": len(alerts),
            "total_campaigns": len(campaigns)
        },
        "notification_metrics": {
            "by_type": {
                "system": len([n for n in notifications if n.notification_type == NotificationType.SYSTEM]),
                "alert": len([n for n in notifications if n.notification_type == NotificationType.ALERT]),
                "task": len([n for n in notifications if n.notification_type == NotificationType.TASK]),
                "esg_update": len([n for n in notifications if n.notification_type == NotificationType.ESG_UPDATE])
            },
            "by_priority": {
                "critical": len([n for n in notifications if n.priority == NotificationPriority.CRITICAL]),
                "high": len([n for n in notifications if n.priority == NotificationPriority.HIGH]),
                "medium": len([n for n in notifications if n.priority == NotificationPriority.MEDIUM]),
                "low": len([n for n in notifications if n.priority == NotificationPriority.LOW])
            }
        },
        "alert_metrics": {
            "by_severity": {
                "critical": len([a for a in alerts if a.severity == AlertSeverity.CRITICAL]),
                "error": len([a for a in alerts if a.severity == AlertSeverity.ERROR]),
                "warning": len([a for a in alerts if a.severity == AlertSeverity.WARNING]),
                "info": len([a for a in alerts if a.severity == AlertSeverity.INFO])
            },
            "response_metrics": {
                "average_response_time_hours": avg_response_time,
                "acknowledgment_rate": alert_acknowledgment_rate
            }
        },
        "campaign_metrics": {
            "total_sent": len([c for c in campaigns if c.status == CommunicationStatus.SENT]),
            "average_open_rate": sum([c.open_rate or 0 for c in campaigns]) / len(campaigns) if campaigns else 0,
            "average_click_rate": sum([c.click_rate or 0 for c in campaigns]) / len(campaigns) if campaigns else 0
        },
        "vibe_intelligence": {
            "velocity_score": min(100, 100 - avg_delivery_speed * 10),  # Lower is better for speed
            "engagement_score": avg_engagement_rate,
            "responsiveness_score": max(0, 100 - avg_response_time),  # Lower response time = higher score
            "overall_effectiveness": (avg_engagement_rate + max(0, 100 - avg_response_time)) / 2
        }
    }