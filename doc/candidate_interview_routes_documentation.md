# Candidate Interview Routes Documentation

## Overview
This document provides comprehensive documentation for all interview-related routes available to candidates. These routes allow candidates to manage their interviews from their dashboard, including viewing, confirming, and tracking interview status.

## Base URL
All candidate interview routes are prefixed with `/candidate/interviews`

## Authentication
All routes require JWT authentication with candidate credentials.

**Header Required:**
```
Authorization: Bearer <candidate_jwt_token>
```

## Available Routes

### 1. Get All Candidate Interviews
**Endpoint:** `GET /candidate/interviews`
**Description:** Retrieve all interviews for the authenticated candidate with optional filtering
**Authentication:** Required (JWT Bearer Token)

#### Query Parameters
- `status` (optional): Filter by interview status (`en_attente`, `confirmed`, `completed`, `annule`)
- `limit` (optional): Number of interviews to return (default: 10)
- `skip` (optional): Number of interviews to skip for pagination (default: 0)

#### Success Response (200)
```json
{
  "message": "Candidate interviews retrieved successfully",
  "data": {
    "interviews": [
      {
        "interviewId": "641a5f123456789012345678",
        "applicationId": "641a5f123456789012345679",
        "company": {
          "id": "641a5f123456789012345680",
          "name": "Tech Solutions Inc",
          "logo": "https://example.com/logo.png"
        },
        "job": {
          "id": "641a5f123456789012345681",
          "title": "Senior Frontend Developer"
        },
        "status": "en_attente",
        "type": "Video",
        "scheduledDate": "2025-05-15T09:00:00.000Z",
        "scheduledTime": "14:30",
        "location": null,
        "meetingLink": "https://meet.google.com/abc-def-ghi",
        "notes": "Please prepare a brief presentation about your recent projects",
        "confirmedAt": null,
        "completedAt": null,
        "cancelledAt": null,
        "cancellationReason": null,
        "isHired": null,
        "appliedAt": "2025-04-01T10:00:00.000Z",
        "scheduledAt": "2025-04-15T16:30:00.000Z"
      }
    ],
    "total": 1,
    "pendingCount": 1,
    "upcomingCount": 0,
    "completedCount": 0
  }
}
```

#### Error Responses
- **401**: Unauthorized - Invalid or missing JWT token
- **500**: Internal server error

---

### 2. Get Pending Interviews
**Endpoint:** `GET /candidate/interviews/pending`
**Description:** Retrieve all pending interviews (status: en_attente) for the authenticated candidate
**Authentication:** Required (JWT Bearer Token)

#### Success Response (200)
```json
{
  "message": "Pending interviews retrieved successfully",
  "data": {
    "interviews": [
      {
        "interviewId": "641a5f123456789012345678",
        "applicationId": "641a5f123456789012345679",
        "company": {
          "id": "641a5f123456789012345680",
          "name": "Tech Solutions Inc",
          "logo": "https://example.com/logo.png"
        },
        "job": {
          "id": "641a5f123456789012345681",
          "title": "Senior Frontend Developer"
        },
        "status": "en_attente",
        "type": "Video",
        "scheduledDate": "2025-05-15T09:00:00.000Z",
        "scheduledTime": "14:30",
        "meetingLink": "https://meet.google.com/abc-def-ghi",
        "notes": "Please prepare a brief presentation",
        "appliedAt": "2025-04-01T10:00:00.000Z",
        "scheduledAt": "2025-04-15T16:30:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### 3. Get Upcoming Interviews
**Endpoint:** `GET /candidate/interviews/upcoming`
**Description:** Retrieve all confirmed interviews scheduled for future dates
**Authentication:** Required (JWT Bearer Token)

#### Success Response (200)
```json
{
  "message": "Upcoming interviews retrieved successfully",
  "data": {
    "interviews": [
      {
        "interviewId": "641a5f123456789012345678",
        "applicationId": "641a5f123456789012345679",
        "company": {
          "id": "641a5f123456789012345680",
          "name": "Tech Solutions Inc",
          "logo": "https://example.com/logo.png"
        },
        "job": {
          "id": "641a5f123456789012345681",
          "title": "Senior Frontend Developer"
        },
        "status": "confirmed",
        "type": "Video",
        "scheduledDate": "2025-05-15T09:00:00.000Z",
        "scheduledTime": "14:30",
        "meetingLink": "https://meet.google.com/abc-def-ghi",
        "confirmedAt": "2025-04-16T10:00:00.000Z",
        "appliedAt": "2025-04-01T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### 4. Get Interview History
**Endpoint:** `GET /candidate/interviews/history`
**Description:** Retrieve completed and cancelled interviews
**Authentication:** Required (JWT Bearer Token)

#### Query Parameters
- `limit` (optional): Number of interviews to return (default: 10)
- `skip` (optional): Number of interviews to skip for pagination (default: 0)

#### Success Response (200)
```json
{
  "message": "Interview history retrieved successfully",
  "data": {
    "interviews": [
      {
        "interviewId": "641a5f123456789012345678",
        "applicationId": "641a5f123456789012345679",
        "company": {
          "id": "641a5f123456789012345680",
          "name": "Previous Company Ltd",
          "logo": "https://example.com/logo.png"
        },
        "job": {
          "id": "641a5f123456789012345681",
          "title": "Frontend Developer"
        },
        "status": "completed",
        "type": "Video",
        "scheduledDate": "2025-03-15T09:00:00.000Z",
        "scheduledTime": "14:30",
        "completedAt": "2025-03-15T15:00:00.000Z",
        "isHired": true,
        "appliedAt": "2025-03-01T10:00:00.000Z"
      }
    ],
    "total": 1
  }
}
```

---

### 5. Confirm Interview from Dashboard
**Endpoint:** `PUT /candidate/interviews/:interviewId/confirm`
**Description:** Confirm a pending interview from the candidate dashboard (alternative to email confirmation)
**Authentication:** Required (JWT Bearer Token)

#### URL Parameters
- `interviewId`: The ID of the interview to confirm

#### Success Response (200)
```json
{
  "message": "Interview confirmed successfully",
  "data": {
    "interviewId": "641a5f123456789012345678",
    "status": "confirmed",
    "confirmedAt": "2025-04-20T14:30:00.000Z",
    "interview": {
      "date": "2025-05-15T09:00:00.000Z",
      "time": "14:30",
      "type": "Video",
      "location": null,
      "meetingLink": "https://meet.google.com/abc-def-ghi",
      "company": {
        "name": "Tech Solutions Inc"
      },
      "job": {
        "title": "Senior Frontend Developer"
      }
    }
  }
}
```

#### Error Responses
- **400**: Interview cannot be confirmed (already confirmed, cancelled, or completed)
- **403**: Interview does not belong to this candidate
- **404**: Interview not found

---

### 6. Get Interview Details
**Endpoint:** `GET /candidate/interviews/:interviewId`
**Description:** Get detailed information about a specific interview
**Authentication:** Required (JWT Bearer Token)

#### URL Parameters
- `interviewId`: The ID of the interview

#### Success Response (200)
```json
{
  "message": "Interview details retrieved successfully",
  "data": {
    "interviewId": "641a5f123456789012345678",
    "applicationId": "641a5f123456789012345679",
    "company": {
      "id": "641a5f123456789012345680",
      "name": "Tech Solutions Inc",
      "logo": "https://example.com/logo.png",
      "address": "123 Tech Street, San Francisco, CA",
      "phone": "+1-555-0123",
      "email": "hr@techsolutions.com"
    },
    "job": {
      "id": "641a5f123456789012345681",
      "title": "Senior Frontend Developer",
      "description": "We are looking for an experienced frontend developer..."
    },
    "status": "confirmed",
    "type": "Video",
    "scheduledDate": "2025-05-15T09:00:00.000Z",
    "scheduledTime": "14:30",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-def-ghi",
    "notes": "Please prepare a brief presentation about your recent projects. The interview will cover technical questions about React, TypeScript, and system design.",
    "confirmedAt": "2025-04-16T10:00:00.000Z",
    "completedAt": null,
    "cancelledAt": null,
    "cancellationReason": null,
    "isHired": null,
    "feedback": null,
    "appliedAt": "2025-04-01T10:00:00.000Z",
    "scheduledAt": "2025-04-15T16:30:00.000Z"
  }
}
```

#### Error Responses
- **403**: Interview does not belong to this candidate
- **404**: Interview not found

---

## Interview Status Values

| Status | Description |
|--------|-------------|
| `en_attente` | Interview scheduled, waiting for candidate confirmation |
| `confirmed` | Interview confirmed by candidate |
| `completed` | Interview completed |
| `annule` | Interview cancelled |

## Interview Types

| Type | Description |
|------|-------------|
| `Video` | Online video interview (requires meetingLink) |
| `InPerson` | In-person interview (requires location) |
| `Phone` | Phone interview |

## Use Cases

### 1. Dashboard Overview
```javascript
// Get all interviews with counts
GET /candidate/interviews

// Display pending interviews requiring action
GET /candidate/interviews/pending

// Show upcoming confirmed interviews
GET /candidate/interviews/upcoming
```

### 2. Interview Management
```javascript
// Confirm an interview if candidate missed email confirmation
PUT /candidate/interviews/{interviewId}/confirm

// Get detailed interview information
GET /candidate/interviews/{interviewId}
```

### 3. History Tracking
```javascript
// View past interviews
GET /candidate/interviews/history?limit=10&skip=0
```

### 4. Filtering and Pagination
```javascript
// Get only confirmed interviews
GET /candidate/interviews?status=confirmed

// Paginate through all interviews
GET /candidate/interviews?limit=5&skip=10
```

## Frontend Integration Examples

### React Hook for Interview Management
```typescript
const useCandidateInterviews = () => {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchInterviews = async (options = {}) => {
    setLoading(true);
    try {
      const response = await api.get('/candidate/interviews', { params: options });
      setInterviews(response.data.data);
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmInterview = async (interviewId) => {
    try {
      await api.put(`/candidate/interviews/${interviewId}/confirm`);
      // Refresh interviews list
      fetchInterviews();
    } catch (error) {
      console.error('Error confirming interview:', error);
      throw error;
    }
  };

  return { interviews, loading, fetchInterviews, confirmInterview };
};
```

### Vue.js Composable
```typescript
export function useCandidateInterviews() {
  const interviews = ref([]);
  const loading = ref(false);

  const fetchInterviews = async (options = {}) => {
    loading.value = true;
    try {
      const response = await $fetch('/candidate/interviews', { params: options });
      interviews.value = response.data;
    } catch (error) {
      console.error('Error fetching interviews:', error);
    } finally {
      loading.value = false;
    }
  };

  const confirmInterview = async (interviewId) => {
    try {
      await $fetch(`/candidate/interviews/${interviewId}/confirm`, {
        method: 'PUT'
      });
      await fetchInterviews();
    } catch (error) {
      console.error('Error confirming interview:', error);
      throw error;
    }
  };

  return { interviews, loading, fetchInterviews, confirmInterview };
}
```

## Error Handling

### Common Error Responses
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}

{
  "statusCode": 403,
  "message": "This interview does not belong to you",
  "error": "Forbidden"
}

{
  "statusCode": 404,
  "message": "Interview not found",
  "error": "Not Found"
}

{
  "statusCode": 400,
  "message": "Interview is no longer pending confirmation",
  "error": "Bad Request"
}
```

## Notes

1. **Security**: All routes verify that interviews belong to the authenticated candidate
2. **Real-time Updates**: Consider implementing WebSocket connections for real-time interview status updates
3. **Notifications**: Integrate with push notification service to alert candidates of interview changes
4. **Calendar Integration**: Provide calendar file downloads (.ics) for confirmed interviews
5. **Timezone Handling**: All timestamps are in UTC; handle timezone conversion on the frontend
6. **Pagination**: Use limit and skip parameters for large interview lists
7. **Caching**: Consider implementing caching for frequently accessed interview data

## Related Documentation
- [Email Interview Confirmation Route](./frontend_interview_confirmation_route.md)
- [Company Interview Management](./application_interview_routes_documentation.md)
- [Authentication Documentation](./auth_documentation.md)