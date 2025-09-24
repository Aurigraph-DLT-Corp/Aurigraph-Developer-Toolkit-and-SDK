#!/usr/bin/env python3
"""
AUREX LAUNCHPAD™ NOTIFICATIONS & COMMUNICATIONS MODELS
VIBE Framework Implementation - Velocity & Intelligence
Real-time notifications, alerts, and communication management
"""

from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum, Float, Integer, JSON, Boolean, Table
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import enum
from .base_models import BaseModel, TimestampMixin

# Association tables
notification_recipients = Table(
    'notification_recipients',
    BaseModel.metadata,
    Column('notification_id', UUID(as_uuid=True), ForeignKey('notifications.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('read_at', DateTime),
    Column('acknowledged_at', DateTime)
)

alert_subscriptions = Table(
    'alert_subscriptions',
    BaseModel.metadata,
    Column('alert_rule_id', UUID(as_uuid=True), ForeignKey('alert_rules.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True),
    Column('channel', String(50)),  # email, sms, push, in-app
    Column('subscribed_at', DateTime, default=datetime.utcnow)
)

class NotificationType(enum.Enum):
    SYSTEM = "system"
    ALERT = "alert"
    TASK = "task"
    REMINDER = "reminder"
    APPROVAL = "approval"
    MENTION = "mention"
    COMMENT = "comment"
    STATUS_CHANGE = "status_change"
    DEADLINE = "deadline"
    REPORT = "report"
    ESG_UPDATE = "esg_update"
    COMPLIANCE = "compliance"
    ACHIEVEMENT = "achievement"

class NotificationPriority(enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
    INFO = "info"

class NotificationChannel(enum.Enum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"
    IN_APP = "in_app"
    SLACK = "slack"
    TEAMS = "teams"
    WEBHOOK = "webhook"

class AlertSeverity(enum.Enum):
    CRITICAL = "critical"
    ERROR = "error"
    WARNING = "warning"
    INFO = "info"

class CommunicationStatus(enum.Enum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENDING = "sending"
    SENT = "sent"
    FAILED = "failed"
    CANCELLED = "cancelled"

class Notification(BaseModel, TimestampMixin):
    """Core notification system with VIBE velocity tracking"""
    __tablename__ = 'notifications'
    
    # Basic Information
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    notification_type = Column(Enum(NotificationType), nullable=False)
    priority = Column(Enum(NotificationPriority), default=NotificationPriority.MEDIUM)
    
    # Source & Context
    source_type = Column(String(50))  # Project, Task, Assessment, etc.
    source_id = Column(UUID(as_uuid=True))
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    
    # Sender
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    sender_name = Column(String(200))
    
    # Delivery
    channels = Column(JSON)  # List of channels to use
    scheduled_time = Column(DateTime)
    sent_time = Column(DateTime)
    expiry_time = Column(DateTime)
    
    # Content
    data_payload = Column(JSON)  # Additional structured data
    action_url = Column(String(500))  # Link to relevant page
    action_text = Column(String(100))  # Button text
    icon = Column(String(100))  # Icon identifier
    
    # Tracking
    total_recipients = Column(Integer, default=0)
    read_count = Column(Integer, default=0)
    acknowledged_count = Column(Integer, default=0)
    
    # Settings
    requires_acknowledgment = Column(Boolean, default=False)
    is_dismissible = Column(Boolean, default=True)
    persist_until_read = Column(Boolean, default=False)
    
    # VIBE Metrics
    vibe_delivery_speed = Column(Float)  # Time to delivery
    vibe_engagement_rate = Column(Float)  # Read/acknowledged rate
    
    # Relationships
    organization = relationship("Organization")
    sender = relationship("User", foreign_keys=[sender_id])
    recipients = relationship("User", secondary=notification_recipients)
    templates = relationship("NotificationTemplate", back_populates="notifications")

class AlertRule(BaseModel, TimestampMixin):
    """Configurable alert rules for automated notifications"""
    __tablename__ = 'alert_rules'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text)
    
    # Rule Configuration
    rule_type = Column(String(50))  # Threshold, Deadline, Status, Pattern
    entity_type = Column(String(50))  # Emission, Task, Assessment, etc.
    
    # Conditions
    conditions = Column(JSON, nullable=False)  # Rule conditions
    trigger_expression = Column(Text)  # Advanced expression
    
    # Alert Settings
    severity = Column(Enum(AlertSeverity), default=AlertSeverity.WARNING)
    priority = Column(Enum(NotificationPriority))
    
    # Frequency & Timing
    check_frequency = Column(String(50))  # Real-time, Hourly, Daily, Weekly
    cooldown_period = Column(Integer)  # Minutes before re-alerting
    active_hours = Column(JSON)  # Time windows when active
    
    # Notification
    notification_template_id = Column(UUID(as_uuid=True), ForeignKey('notification_templates.id'))
    channels = Column(JSON)  # Default channels
    
    # Escalation
    escalation_enabled = Column(Boolean, default=False)
    escalation_rules = Column(JSON)  # Time-based escalation
    
    # Status
    is_active = Column(Boolean, default=True)
    last_triggered = Column(DateTime)
    trigger_count = Column(Integer, default=0)
    
    # VIBE Metrics
    vibe_accuracy = Column(Float)  # False positive rate
    vibe_response_time = Column(Float)  # Avg response to alerts
    
    # Relationships
    organization = relationship("Organization")
    template = relationship("NotificationTemplate")
    subscribers = relationship("User", secondary=alert_subscriptions)
    alert_history = relationship("AlertHistory", back_populates="alert_rule")

class NotificationTemplate(BaseModel, TimestampMixin):
    """Reusable notification templates with variable substitution"""
    __tablename__ = 'notification_templates'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'))
    name = Column(String(200), nullable=False)
    template_code = Column(String(100), unique=True)
    
    # Content Templates
    subject_template = Column(String(500))
    body_template = Column(Text, nullable=False)
    html_template = Column(Text)
    sms_template = Column(String(500))
    push_template = Column(String(500))
    
    # Variables
    variables = Column(JSON)  # Available variables
    default_values = Column(JSON)  # Default variable values
    
    # Settings
    notification_type = Column(Enum(NotificationType))
    default_priority = Column(Enum(NotificationPriority))
    default_channels = Column(JSON)
    
    # Localization
    language = Column(String(10), default='en')
    translations = Column(JSON)  # Multi-language support
    
    # Styling
    brand_template = Column(Boolean, default=True)
    custom_css = Column(Text)
    
    # Usage
    is_system = Column(Boolean, default=False)
    is_active = Column(Boolean, default=True)
    usage_count = Column(Integer, default=0)
    
    # Relationships
    organization = relationship("Organization")
    notifications = relationship("Notification", back_populates="templates")

class EmailCampaign(BaseModel, TimestampMixin):
    """Email campaign management for stakeholder communications"""
    __tablename__ = 'email_campaigns'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    campaign_name = Column(String(200), nullable=False)
    
    # Campaign Details
    campaign_type = Column(String(50))  # Newsletter, Update, Report, Survey
    subject = Column(String(500), nullable=False)
    preview_text = Column(String(200))
    
    # Content
    html_content = Column(Text)
    text_content = Column(Text)
    template_id = Column(UUID(as_uuid=True), ForeignKey('notification_templates.id'))
    
    # Recipients
    recipient_list = Column(JSON)  # Email addresses or user IDs
    segment_criteria = Column(JSON)  # Dynamic segmentation
    total_recipients = Column(Integer)
    
    # Scheduling
    status = Column(Enum(CommunicationStatus), default=CommunicationStatus.DRAFT)
    scheduled_date = Column(DateTime)
    sent_date = Column(DateTime)
    
    # Tracking
    opens = Column(Integer, default=0)
    clicks = Column(Integer, default=0)
    bounces = Column(Integer, default=0)
    unsubscribes = Column(Integer, default=0)
    
    # Performance
    open_rate = Column(Float)
    click_rate = Column(Float)
    bounce_rate = Column(Float)
    
    # A/B Testing
    is_ab_test = Column(Boolean, default=False)
    variant_a = Column(JSON)
    variant_b = Column(JSON)
    winning_variant = Column(String(10))
    
    # ESG Focus
    esg_related = Column(Boolean, default=False)
    sustainability_topics = Column(JSON)
    
    # Relationships
    organization = relationship("Organization")
    template = relationship("NotificationTemplate")

class AlertHistory(BaseModel, TimestampMixin):
    """Historical record of triggered alerts"""
    __tablename__ = 'alert_history'
    
    alert_rule_id = Column(UUID(as_uuid=True), ForeignKey('alert_rules.id'), nullable=False)
    
    # Trigger Information
    triggered_at = Column(DateTime, default=datetime.utcnow)
    trigger_value = Column(JSON)  # Value that triggered alert
    condition_met = Column(JSON)  # Which conditions were met
    
    # Alert Details
    severity = Column(Enum(AlertSeverity))
    message = Column(Text)
    
    # Delivery
    notifications_sent = Column(Integer)
    channels_used = Column(JSON)
    
    # Response
    acknowledged_by = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    acknowledged_at = Column(DateTime)
    resolution_time = Column(Float)  # Hours to resolution
    
    # Actions Taken
    actions = Column(JSON)
    notes = Column(Text)
    
    # Relationships
    alert_rule = relationship("AlertRule", back_populates="alert_history")
    acknowledged_user = relationship("User")

class NotificationPreference(BaseModel, TimestampMixin):
    """User notification preferences and settings"""
    __tablename__ = 'notification_preferences'
    
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False, unique=True)
    
    # Channel Preferences
    email_enabled = Column(Boolean, default=True)
    sms_enabled = Column(Boolean, default=False)
    push_enabled = Column(Boolean, default=True)
    in_app_enabled = Column(Boolean, default=True)
    
    # Type Preferences
    notification_types = Column(JSON)  # Enabled notification types
    priority_threshold = Column(Enum(NotificationPriority), default=NotificationPriority.LOW)
    
    # Timing
    quiet_hours_start = Column(String(10))  # HH:MM format
    quiet_hours_end = Column(String(10))
    timezone = Column(String(50))
    
    # Frequency
    digest_enabled = Column(Boolean, default=False)
    digest_frequency = Column(String(20))  # Daily, Weekly, Monthly
    instant_notifications = Column(JSON)  # Types for instant notification
    
    # Contact Information
    email_address = Column(String(255))
    phone_number = Column(String(50))
    slack_user_id = Column(String(100))
    teams_user_id = Column(String(100))
    
    # ESG Preferences
    esg_alerts = Column(Boolean, default=True)
    compliance_alerts = Column(Boolean, default=True)
    sustainability_updates = Column(Boolean, default=True)
    
    # Language
    preferred_language = Column(String(10), default='en')
    
    # Relationships
    user = relationship("User")

class AnnouncementBoard(BaseModel, TimestampMixin):
    """Internal announcements and bulletin board"""
    __tablename__ = 'announcement_board'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    author_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    
    # Announcement Details
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    announcement_type = Column(String(50))  # News, Policy, Achievement, Event
    
    # Visibility
    is_pinned = Column(Boolean, default=False)
    is_public = Column(Boolean, default=True)
    target_departments = Column(JSON)
    target_roles = Column(JSON)
    
    # Timing
    publish_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)
    
    # Engagement
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Attachments
    attachments = Column(JSON)
    
    # ESG Related
    esg_category = Column(String(50))
    sustainability_goal = Column(String(200))
    
    # Relationships
    organization = relationship("Organization")
    author = relationship("User")

class CommunicationLog(BaseModel, TimestampMixin):
    """Audit log for all communications"""
    __tablename__ = 'communication_logs'
    
    # Communication Details
    communication_type = Column(String(50))  # Email, SMS, Push, etc.
    channel = Column(Enum(NotificationChannel))
    
    # Parties
    sender_id = Column(UUID(as_uuid=True), ForeignKey('users.id'))
    recipient = Column(String(255))  # Email, phone, or user ID
    
    # Content
    subject = Column(String(500))
    message = Column(Text)
    
    # Status
    status = Column(String(50))  # Sent, Delivered, Failed, Bounced
    sent_at = Column(DateTime)
    delivered_at = Column(DateTime)
    
    # Tracking
    opened_at = Column(DateTime)
    clicked_at = Column(DateTime)
    
    # Error Handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Metadata
    message_id = Column(String(200))  # External message ID
    message_metadata = Column(JSON)
    
    # Relationships
    sender = relationship("User")

class WebhookEndpoint(BaseModel, TimestampMixin):
    """Webhook configuration for external notifications"""
    __tablename__ = 'webhook_endpoints'
    
    organization_id = Column(UUID(as_uuid=True), ForeignKey('organizations.id'), nullable=False)
    name = Column(String(200), nullable=False)
    
    # Endpoint Configuration
    url = Column(String(500), nullable=False)
    method = Column(String(10), default='POST')
    headers = Column(JSON)
    
    # Authentication
    auth_type = Column(String(50))  # None, Basic, Bearer, API Key
    auth_credentials = Column(JSON)  # Encrypted
    
    # Events
    event_types = Column(JSON)  # List of events to send
    
    # Retry Configuration
    max_retries = Column(Integer, default=3)
    retry_delay = Column(Integer, default=60)  # Seconds
    
    # Status
    is_active = Column(Boolean, default=True)
    last_triggered = Column(DateTime)
    success_count = Column(Integer, default=0)
    failure_count = Column(Integer, default=0)
    
    # Payload
    payload_template = Column(JSON)
    include_full_payload = Column(Boolean, default=True)
    
    # Relationships
    organization = relationship("Organization")

class NotificationQueue(BaseModel, TimestampMixin):
    """Queue for processing notifications"""
    __tablename__ = 'notification_queue'
    
    notification_id = Column(UUID(as_uuid=True), ForeignKey('notifications.id'))
    
    # Queue Details
    channel = Column(Enum(NotificationChannel), nullable=False)
    recipient = Column(String(255), nullable=False)
    
    # Processing
    status = Column(String(50), default='pending')  # pending, processing, sent, failed
    scheduled_for = Column(DateTime)
    processed_at = Column(DateTime)
    
    # Retry
    retry_count = Column(Integer, default=0)
    next_retry = Column(DateTime)
    
    # Error
    error_message = Column(Text)
    
    # Priority
    priority = Column(Integer, default=5)  # 1-10, 1 being highest
    
    # Relationships
    notification = relationship("Notification")