# Aurex Platform Marketing API Endpoints

## Base URL
- Development: `http://localhost:8000/api/v1`
- Production: `https://dev.aurigraph.io/api/v1`

## Endpoints

### 1. Contact Form Submission
**POST** `/contact`

Submit contact form from landing page.

**Rate Limit:** 10 requests per 5 minutes per IP/email

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@company.com", 
  "company": "Green Tech Corp",
  "role": "Sustainability Director",
  "message": "Interested in your ESG platform...",
  "interests": ["carbon-tracking", "reporting"],
  "consent": true,
  "source": "landing_page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Contact form submitted successfully. We'll get back to you soon!",
  "data": {
    "submission_id": "contact_1691234567"
  }
}
```

### 2. Demo Request Submission  
**POST** `/demo-request`

Submit demo scheduling request.

**Rate Limit:** 10 requests per 5 minutes per IP/email

**Request Body:**
```json
{
  "name": "Jane Smith",
  "email": "jane@company.com",
  "company": "Eco Solutions Ltd",
  "role": "Environmental Manager", 
  "phone": "+1-555-0123",
  "employees": "50-200",
  "timeline": "Next 3 months",
  "interests": ["esg-assessment", "water-management"],
  "message": "Looking for comprehensive ESG solution",
  "source": "landing_page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Demo request submitted successfully. We'll schedule your demo soon!",
  "data": {
    "submission_id": "demo_1691234567"
  }
}
```

### 3. Newsletter Subscription
**POST** `/newsletter/subscribe`

Subscribe to newsletter.

**Rate Limit:** 10 requests per 5 minutes per IP/email

**Request Body:**
```json
{
  "email": "subscriber@company.com",
  "interests": ["sustainability", "carbon-tracking"],
  "source": "landing_page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Successfully subscribed to newsletter!",
  "data": {
    "subscription_id": "newsletter_1691234567"
  }
}
```

### 4. Resource Download Request
**POST** `/resources/download`

Request download of resources (whitepapers, guides, etc.).

**Request Body:**
```json
{
  "resource_id": "esg-guide-2024",
  "email": "user@company.com",
  "source": "landing_page"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Resource download request processed. Check your email!",
  "data": {
    "download_id": "resource_1691234567"
  }
}
```

### 5. Analytics Event Tracking
**POST** `/analytics/track`

Track user behavior events.

**Request Body:**
```json
{
  "event": "page_view",
  "properties": {
    "page": "/pricing",
    "plan_viewed": "professional"
  },
  "user_id": "user123",
  "session_id": "session456",
  "url": "/pricing",
  "user_agent": "Mozilla/5.0..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Analytics event tracked successfully",
  "data": {
    "event_id": "event_1691234567"
  }
}
```

### 6. Platform Features
**GET** `/features`

Get list of platform features for marketing pages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "esg-assessment",
      "name": "ESG Assessment",
      "description": "Comprehensive ESG maturity evaluation and reporting",
      "category": "assessment",
      "status": "active",
      "icon": "assessment"
    }
  ],
  "count": 6
}
```

### 7. Pricing Plans
**GET** `/pricing`

Get pricing plans for marketing pages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "professional",
      "name": "Professional",
      "price": 799,
      "currency": "USD",
      "billing_period": "monthly",
      "features": ["Advanced ESG Assessment", "API Access"],
      "popular": true,
      "enterprise": false
    }
  ],
  "count": 3
}
```

### 8. Customer Testimonials
**GET** `/testimonials`

Get customer testimonials for marketing pages.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "testimonial-1",
      "name": "Sarah Chen",
      "role": "Sustainability Director",
      "company": "Green Tech Solutions", 
      "content": "Aurex Platform has revolutionized...",
      "rating": 5,
      "featured": true
    }
  ],
  "count": 3
}
```

### 9. Blog Posts
**GET** `/blog?limit=10&featured=true`

Get blog posts for marketing pages.

**Query Parameters:**
- `limit` (int): Number of posts to return (default: 10)
- `featured` (bool): Filter by featured posts (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "esg-trends-2024",
      "title": "Top ESG Trends Shaping 2024",
      "slug": "esg-trends-2024",
      "summary": "Explore the key environmental...",
      "author": "Aurex Research Team",
      "category": "insights",
      "tags": ["ESG", "trends", "2024"],
      "published_at": "2024-01-15T10:00:00Z",
      "featured": true,
      "image_url": "/blog/images/esg-trends-2024.jpg"
    }
  ],
  "count": 3,
  "total": 3
}
```

### 10. Health Check
**GET** `/health`

Marketing API health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "marketing_api",
  "timestamp": "2024-08-09T15:30:00.000Z",
  "endpoints": ["/contact", "/demo-request", "/features", "..."]
}
```

## Error Responses

### Validation Error (400)
```json
{
  "detail": "Field contains invalid characters"
}
```

### Rate Limit Exceeded (429)
```json
{
  "detail": "Rate limit exceeded. Please try again later."
}
```

### Server Error (500)
```json
{
  "detail": "Failed to process request"
}
```

## Security Features

- **Rate Limiting**: 10 requests per 5 minutes per IP/email for form submissions
- **Input Validation**: Pydantic models with custom validators
- **Sanitization**: Text field cleaning and spam detection
- **CORS**: Configured for frontend domains
- **Background Processing**: Non-blocking form processing
- **Error Logging**: Comprehensive error tracking

## Notes

- All POST endpoints use background task processing for email notifications
- Static data is currently used for features, pricing, testimonials, and blog posts
- In production, implement Redis for rate limiting storage
- Consider adding database persistence for lead tracking