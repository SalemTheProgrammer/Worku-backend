# Candidate Applications API Documentation

## Get All Applications for Authenticated Candidate

Returns a list of all job applications submitted by the currently authenticated candidate.

### Endpoint
`GET /auth/candidate/applications`

### Description
This endpoint retrieves all job applications that have been submitted by the currently authenticated candidate. It provides details about each application including the job information, company information, application date, and status.

### Authentication
- Requires JWT token in Authorization header
- Only accessible by authenticated candidates

### Response

#### Success Response (200)
```json
{
  "statusCode": 200,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "company": {
          "id": "507f1f77bcf86cd799439012",
          "name": "Tech Solutions Inc."
        },
        "job": {
          "id": "507f1f77bcf86cd799439013",
          "title": "Senior Software Engineer"
        },
        "appliedAt": "2025-05-01T12:00:00.000Z",
        "status": "en_attente",
        "isRejected": false
      }
    ],
    "total": 1
  },
  "timestamp": "2025-05-25T14:35:22.000Z"
}
```

#### Error Responses
- **401 Unauthorized**: Invalid or missing authentication token
- **500 Internal Server Error**: Server error during processing

### Application Status Values
- `en_attente`: Application is pending review
- `analysé`: Application has been analyzed
- `présélectionné`: Application has been shortlisted
- `rejeté`: Application has been rejected

### Example Request
```bash
curl -X GET \
  http://localhost:3000/auth/candidate/applications \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Notes
- Results are sorted by application date (most recent first)
- The `isRejected` field provides a quick way to see if an application was rejected
- The application status gives more granular information about the current stage
