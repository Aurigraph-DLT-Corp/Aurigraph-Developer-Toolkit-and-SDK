# AUREX LAUNCHPAD API DOCUMENTATION

## Base URL
```
Production: https://api.aurex-launchpad.com
Development: http://localhost:8001
```

## Authentication

All API requests require authentication using JWT tokens, except for public endpoints.

### Headers
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

## API Endpoints

### 🔐 Authentication

#### Register User
```http
POST /auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "organization_name": "Acme Corp"
}
```

**Response (201):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "is_active": true,
  "is_verified": false,
  "created_at": "2025-01-07T10:00:00Z"
}
```

#### Login
```http
POST /auth/login
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

#### Refresh Token
```http
POST /auth/refresh
```

**Request Body:**
```json
{
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response (200):**
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "expires_in": 3600
}
```

#### Get Current User
```http
GET /auth/me
```

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "organization": {
    "id": "660e8400-e29b-41d4-a716-446655440001",
    "name": "Acme Corp",
    "role": "org_admin"
  }
}
```

### 📊 ESG Assessments

#### List Assessments
```http
GET /api/v1/assessments/?skip=0&limit=100&framework=GRI&status=draft
```

**Query Parameters:**
- `skip` (integer): Number of records to skip (default: 0)
- `limit` (integer): Maximum records to return (default: 100)
- `framework` (string): Filter by framework (GRI, SASB, TCFD, CDP, ISO14064)
- `status` (string): Filter by status (draft, in_progress, completed, approved)

**Response (200):**
```json
{
  "items": [
    {
      "id": "770e8400-e29b-41d4-a716-446655440002",
      "name": "2024 ESG Assessment",
      "description": "Annual ESG assessment for 2024",
      "framework_type": "GRI",
      "status": "in_progress",
      "overall_score": 75.5,
      "completion_percentage": 60.0,
      "created_at": "2025-01-01T10:00:00Z",
      "updated_at": "2025-01-07T10:00:00Z"
    }
  ],
  "total": 25,
  "skip": 0,
  "limit": 100
}
```

#### Create Assessment
```http
POST /api/v1/assessments/
```

**Request Body:**
```json
{
  "name": "Q1 2025 ESG Assessment",
  "description": "Quarterly ESG assessment",
  "framework_type": "GRI",
  "template_id": "880e8400-e29b-41d4-a716-446655440003",
  "target_completion_date": "2025-03-31T23:59:59Z"
}
```

**Response (201):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "name": "Q1 2025 ESG Assessment",
  "description": "Quarterly ESG assessment",
  "framework_type": "GRI",
  "status": "draft",
  "overall_score": null,
  "completion_percentage": 0.0,
  "questions_total": 150,
  "questions_answered": 0,
  "created_at": "2025-01-07T10:00:00Z"
}
```

#### Get Assessment Details
```http
GET /api/v1/assessments/{assessment_id}
```

**Response (200):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440004",
  "name": "Q1 2025 ESG Assessment",
  "description": "Quarterly ESG assessment",
  "framework_type": "GRI",
  "status": "in_progress",
  "overall_score": 72.3,
  "completion_percentage": 45.0,
  "questions_total": 150,
  "questions_answered": 68,
  "sections": [
    {
      "id": "aa0e8400-e29b-41d4-a716-446655440005",
      "name": "Environmental",
      "completion_percentage": 50.0,
      "score": 75.0
    },
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440006",
      "name": "Social",
      "completion_percentage": 40.0,
      "score": 70.0
    },
    {
      "id": "cc0e8400-e29b-41d4-a716-446655440007",
      "name": "Governance",
      "completion_percentage": 45.0,
      "score": 72.0
    }
  ]
}
```

#### Submit Assessment Response
```http
POST /api/v1/assessments/{assessment_id}/responses
```

**Request Body:**
```json
{
  "question_id": "dd0e8400-e29b-41d4-a716-446655440008",
  "response_value": "We have implemented a comprehensive recycling program",
  "evidence_text": "See attached recycling program documentation",
  "confidence_score": 0.95,
  "notes": "Program started in Q2 2024"
}
```

**Response (201):**
```json
{
  "message": "Response submitted successfully",
  "response": {
    "id": "ee0e8400-e29b-41d4-a716-446655440009",
    "question_id": "dd0e8400-e29b-41d4-a716-446655440008",
    "response_value": "We have implemented a comprehensive recycling program",
    "score": 90.0,
    "created_at": "2025-01-07T10:30:00Z"
  }
}
```

### 📈 Analytics

#### Dashboard Metrics
```http
GET /api/v1/analytics/dashboard
```

**Response (200):**
```json
{
  "overview": {
    "total_assessments": 25,
    "completed_assessments": 18,
    "in_progress_assessments": 5,
    "average_score": 73.5
  },
  "esg_scores": {
    "environmental": 75.2,
    "social": 71.8,
    "governance": 73.5,
    "overall": 73.5
  },
  "recent_activity": [
    {
      "type": "assessment_completed",
      "name": "Q4 2024 Assessment",
      "timestamp": "2025-01-05T14:30:00Z"
    }
  ],
  "trends": {
    "monthly": [
      {
        "month": "2024-10",
        "score": 71.0
      },
      {
        "month": "2024-11",
        "score": 72.5
      },
      {
        "month": "2024-12",
        "score": 73.5
      }
    ]
  }
}
```

#### ESG Scores
```http
GET /api/v1/analytics/esg-scores?period=quarterly&year=2024
```

**Query Parameters:**
- `period` (string): Time period (monthly, quarterly, yearly)
- `year` (integer): Year for analysis
- `framework` (string): Specific framework scores

**Response (200):**
```json
{
  "period": "quarterly",
  "year": 2024,
  "scores": [
    {
      "quarter": "Q1",
      "environmental": 70.5,
      "social": 68.2,
      "governance": 71.0,
      "overall": 69.9
    },
    {
      "quarter": "Q2",
      "environmental": 72.0,
      "social": 70.5,
      "governance": 72.5,
      "overall": 71.7
    },
    {
      "quarter": "Q3",
      "environmental": 74.5,
      "social": 71.0,
      "governance": 73.0,
      "overall": 72.8
    },
    {
      "quarter": "Q4",
      "environmental": 75.2,
      "social": 71.8,
      "governance": 73.5,
      "overall": 73.5
    }
  ]
}
```

#### Industry Benchmarks
```http
GET /api/v1/analytics/benchmarks?industry=technology
```

**Response (200):**
```json
{
  "industry": "technology",
  "your_scores": {
    "environmental": 75.2,
    "social": 71.8,
    "governance": 73.5,
    "overall": 73.5
  },
  "industry_average": {
    "environmental": 68.5,
    "social": 70.2,
    "governance": 72.0,
    "overall": 70.2
  },
  "top_performers": {
    "environmental": 85.0,
    "social": 82.5,
    "governance": 84.0,
    "overall": 83.8
  },
  "percentile": 72,
  "rank": "Above Average"
}
```

### 📄 Reports

#### Generate Report
```http
POST /api/v1/reports/generate
```

**Request Body:**
```json
{
  "assessment_id": "990e8400-e29b-41d4-a716-446655440004",
  "report_type": "comprehensive",
  "format": "pdf",
  "include_sections": [
    "executive_summary",
    "detailed_scores",
    "benchmarks",
    "recommendations"
  ]
}
```

**Response (202):**
```json
{
  "report_id": "ff0e8400-e29b-41d4-a716-446655440010",
  "status": "generating",
  "estimated_time": 30,
  "message": "Report generation started"
}
```

#### Download Report
```http
GET /api/v1/reports/{report_id}/download
```

**Response (200):**
- Content-Type: application/pdf
- Content-Disposition: attachment; filename="ESG_Report_2025Q1.pdf"
- Binary PDF data

### 🏗️ Frameworks

#### List Framework Templates
```http
GET /api/v1/frameworks/templates
```

**Response (200):**
```json
{
  "templates": [
    {
      "id": "110e8400-e29b-41d4-a716-446655440011",
      "framework_type": "GRI",
      "name": "GRI Standards 2021",
      "version": "2021",
      "description": "Global Reporting Initiative Standards",
      "questions_count": 150,
      "scoring_method": "weighted_average"
    },
    {
      "id": "220e8400-e29b-41d4-a716-446655440012",
      "framework_type": "SASB",
      "name": "SASB Standards",
      "version": "2023",
      "description": "Sustainability Accounting Standards Board",
      "questions_count": 120,
      "scoring_method": "weighted_average"
    }
  ]
}
```

### 🏢 Organizations

#### Get Organization Details
```http
GET /api/v1/organizations/{organization_id}
```

**Response (200):**
```json
{
  "id": "660e8400-e29b-41d4-a716-446655440001",
  "name": "Acme Corp",
  "industry": "technology",
  "employee_count_range": "1000-5000",
  "headquarters_country": "United States",
  "headquarters_city": "San Francisco",
  "subscription_tier": "enterprise",
  "members_count": 45,
  "assessments_count": 25
}
```

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameters",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "detail": "Authentication required",
  "message": "Please provide valid authentication credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Permission denied",
  "message": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found",
  "message": "The requested resource does not exist"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error",
  "message": "An unexpected error occurred. Please try again later."
}
```

## Rate Limiting

API requests are rate limited to ensure fair usage:

- **Authentication endpoints**: 5 requests per minute
- **Public endpoints**: 100 requests per minute
- **Authenticated endpoints**: 1000 requests per hour

Rate limit headers:
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 950
X-RateLimit-Reset: 1704628800
```

## Pagination

List endpoints support pagination using `skip` and `limit` parameters:

```http
GET /api/v1/assessments/?skip=20&limit=10
```

Response includes pagination metadata:
```json
{
  "items": [...],
  "total": 100,
  "skip": 20,
  "limit": 10,
  "has_more": true
}
```

## Webhooks

Configure webhooks to receive real-time notifications:

### Events
- `assessment.created`
- `assessment.completed`
- `assessment.approved`
- `report.generated`
- `user.registered`

### Webhook Payload
```json
{
  "event": "assessment.completed",
  "timestamp": "2025-01-07T10:00:00Z",
  "data": {
    "assessment_id": "990e8400-e29b-41d4-a716-446655440004",
    "name": "Q1 2025 ESG Assessment",
    "score": 73.5
  }
}
```

## SDK Examples

### Python
```python
import requests

class AurexLaunchpadAPI:
    def __init__(self, base_url, api_key):
        self.base_url = base_url
        self.headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        }
    
    def get_assessments(self):
        response = requests.get(
            f"{self.base_url}/api/v1/assessments/",
            headers=self.headers
        )
        return response.json()
```

### JavaScript
```javascript
class AurexLaunchpadAPI {
  constructor(baseUrl, apiKey) {
    this.baseUrl = baseUrl;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }
  
  async getAssessments() {
    const response = await fetch(`${this.baseUrl}/api/v1/assessments/`, {
      headers: this.headers
    });
    return response.json();
  }
}
```

## Support

For API support, please contact:
- Email: api-support@aurex.com
- Documentation: https://docs.aurex.com/api
- Status Page: https://status.aurex.com

---

**API Version**: v1  
**Last Updated**: January 2025