# Application and Interview Management API Routes Documentation

This document provides comprehensive documentation for the enhanced application and interview management system, including all new status management functionality.

## Application Status Management

### 1. Mark Application as Seen
**Endpoint:** `PUT /application-status/:applicationId/mark-seen`
**Description:** Mark an application as seen by the company
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `applicationId` (path): Application ID

**Response:**
```json
{
  "message": "Application marked as seen successfully",
  "data": {
    "_id": "application_id",
    "statut": "vu",
    "dateSeen": "2025-05-01T12:00:00.000Z",
    // ... other application fields
  }
}
```

**Status Codes:**
- 200: Application marked as seen successfully
- 404: Application not found
- 401: Unauthorized

### 2. Get Candidate Applications with Status
**Endpoint:** `GET /application-status/candidate`
**Description:** Get all applications for the authenticated candidate with detailed status information
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `limit` (query, optional): Number of applications per page (default: 10)
- `skip` (query, optional): Number of applications to skip (default: 0)

**Response:**
```json
{
  "message": "Candidate applications retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "application_id",
        "company": {
          "id": "company_id",
          "name": "Company Name"
        },
        "job": {
          "id": "job_id",
          "title": "Job Title"
        },
        "appliedAt": "2025-05-01T12:00:00.000Z",
        "status": "vu",
        "isRejected": false,
        "dateSeen": "2025-05-01T14:00:00.000Z",
        "dateInterviewScheduled": "2025-05-02T10:00:00.000Z",
        "dateConfirmed": null,
        "dateCancelled": null,
        "cancellationReason": null
      }
    ],
    "total": 5
  }
}
```

**Application Status Values:**
- `en_attente`: Application submitted, waiting for review
- `vu`: Application has been seen by company
- `analysé`: Application has been analyzed
- `entretien_programmer`: Interview has been scheduled
- `en_attente_confirmation`: Waiting for candidate to confirm interview
- `confirme`: Interview confirmed by candidate
- `annule`: Interview/application cancelled
- `présélectionné`: Candidate has been shortlisted
- `rejeté`: Application rejected

## Interview Management

### 3. Schedule Interview
**Endpoint:** `POST /interviews/schedule`
**Description:** Schedule a new interview for a candidate
**Authentication:** Required (JWT Bearer Token)

**Request Body:**
```json
{
  "applicationId": "application_id",
  "date": "2025-05-15",
  "time": "14:30",
  "type": "Video",
  "location": "Office Meeting Room 1",
  "meetingLink": "https://meet.google.com/abc-def-ghi",
  "notes": "Technical interview with senior developers"
}
```

**Response:**
```json
{
  "message": "Interview scheduled successfully",
  "data": {
    "_id": "interview_id",
    "applicationId": "application_id",
    "candidateId": "candidate_id",
    "date": "2025-05-15T00:00:00.000Z",
    "time": "14:30",
    "type": "Video",
    "status": "en_attente"
  }
}
```

### 4. Get Company Candidates for Interview Planning
**Endpoint:** `GET /interviews/company/:companyId/candidates`
**Description:** Get all candidates who applied to company jobs with recommendation status
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `companyId` (path): Company ID
- `limit` (query, optional): Number of candidates per page (default: 10)
- `skip` (query, optional): Number of candidates to skip (default: 0)

**Response:**
```json
{
  "message": "Company candidates retrieved successfully",
  "data": {
    "applications": [
      {
        "applicationId": "application_id",
        "candidate": {
          "id": "candidate_id",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phone": "+216 12 345 678"
        },
        "job": {
          "id": "job_id",
          "title": "Senior Software Engineer"
        },
        "status": "vu",
        "appliedAt": "2025-05-01T12:00:00.000Z",
        "isRecommended": true,
        "overallScore": 85,
        "dateSeen": "2025-05-01T14:00:00.000Z"
      }
    ],
    "total": 25
  }
}
```

### 5. Get Interviews by Status
**Endpoint:** `GET /interviews/by-status`
**Description:** Get interviews filtered by status and optionally by company
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `status` (query, optional): Interview status to filter by
- `companyId` (query, optional): Company ID to filter by

**Response:**
```json
{
  "message": "Interviews retrieved successfully",
  "data": {
    "interviews": [
      {
        "interviewId": "interview_id",
        "candidate": {
          "id": "candidate_id",
          "fullName": "John Doe",
          "email": "john.doe@example.com",
          "phone": "+216 12 345 678"
        },
        "job": {
          "id": "job_id",
          "title": "Senior Software Engineer"
        },
        "status": "programmer",
        "scheduledDate": "2025-05-15T00:00:00.000Z",
        "scheduledTime": "14:30",
        "type": "Video",
        "location": "https://meet.google.com/abc-def-ghi"
      }
    ],
    "total": 10
  }
}
```

**Interview Status Values:**
- `programmer`: Interview scheduled
- `en_attente`: Waiting for candidate confirmation
- `confirmed`: Interview confirmed by candidate
- `completed`: Interview completed
- `annule`: Interview cancelled

### 6. Confirm Interview
**Endpoint:** `PUT /interviews/:interviewId/confirm`
**Description:** Confirm an interview by interview ID
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `interviewId` (path): Interview ID

**Response:**
```json
{
  "message": "Interview confirmed successfully",
  "data": {
    "_id": "interview_id",
    "status": "confirmed",
    "confirmedAt": "2025-05-01T15:00:00.000Z"
  }
}
```

### 7. Complete Interview with Feedback
**Endpoint:** `PUT /interviews/:interviewId/complete`
**Description:** Mark interview as complete and add feedback
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `interviewId` (path): Interview ID

**Request Body:**
```json
{
  "feedback": {
    "overallRating": 8,
    "technicalSkills": 7,
    "communication": 9,
    "motivation": 8,
    "culturalFit": 9,
    "comments": "Great candidate with strong problem-solving skills",
    "strengths": ["Strong technical skills", "Good communication"],
    "weaknesses": ["Needs more experience with React"],
    "recommendation": "hire"
  },
  "isHired": true,
  "hiringDecisionReason": "Strong technical skills and cultural fit"
}
```

**Response:**
```json
{
  "message": "Interview completed successfully",
  "data": {
    "_id": "interview_id",
    "status": "completed",
    "completedAt": "2025-05-15T16:00:00.000Z",
    "feedback": {
      "overallRating": 8,
      "recommendation": "hire"
    },
    "isHired": true
  }
}
```

### 8. Cancel Interview
**Endpoint:** `PUT /interviews/:interviewId/cancel`
**Description:** Cancel an interview with reason
**Authentication:** Required (JWT Bearer Token)

**Parameters:**
- `interviewId` (path): Interview ID

**Request Body:**
```json
{
  "cancellationReason": "Candidate withdrew application"
}
```

**Response:**
```json
{
  "message": "Interview cancelled successfully",
  "data": {
    "_id": "interview_id",
    "status": "annule",
    "cancelledAt": "2025-05-10T12:00:00.000Z",
    "cancellationReason": "Candidate withdrew application"
  }
}
```

### 9. Confirm Interview by Token (Candidate)
**Endpoint:** `GET /interviews/confirm/:token`
**Description:** Confirm interview using confirmation token (for candidates)
**Authentication:** Not required (public endpoint)

**Parameters:**
- `token` (path): Confirmation token

**Response:**
```json
{
  "message": "Interview confirmed successfully",
  "data": {
    "_id": "interview_id",
    "status": "confirmed",
    "confirmedAt": "2025-05-01T15:00:00.000Z"
  }
}
```

## Workflow Examples

### Company Perspective - Interview Planning Process

1. **View all candidates who applied:**
   ```
   GET /interviews/company/{companyId}/candidates
   ```

2. **Mark applications as seen:**
   ```
   PUT /application-status/{applicationId}/mark-seen
   ```

3. **Schedule interviews for selected candidates:**
   ```
   POST /interviews/schedule
   ```

4. **View scheduled interviews:**
   ```
   GET /interviews/by-status?status=programmer&companyId={companyId}
   ```

5. **View interviews waiting for confirmation:**
   ```
   GET /interviews/by-status?status=en_attente&companyId={companyId}
   ```

6. **Complete interviews with feedback:**
   ```
   PUT /interviews/{interviewId}/complete
   ```

7. **Cancel interviews if needed:**
   ```
   PUT /interviews/{interviewId}/cancel
   ```

### Candidate Perspective - Application Tracking

1. **View application status:**
   ```
   GET /application-status/candidate
   ```

2. **Confirm scheduled interview:**
   ```
   GET /interviews/confirm/{token}
   ```

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**404 Not Found:**
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

**400 Bad Request:**
```json
{
  "statusCode": 400,
  "message": "Invalid input data",
  "error": "Detailed error description"
}
```

**500 Internal Server Error:**
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## Notes

- All timestamps are in ISO 8601 format
- Authentication is required for all endpoints
- Application and interview statuses are automatically updated based on actions
- Email notifications are sent when interviews are scheduled
- The system maintains a complete audit trail of all status changes
- Feedback ratings are on a scale of 1-10
- Recommendation values: "hire", "reject", "consider"