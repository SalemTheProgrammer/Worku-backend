# Candidate Applications API Documentation

## Get Candidate Applications

Retrieves all job applications submitted by the authenticated candidate along with their current status.

### Endpoint
`GET /auth/candidate/applications`

### Authentication
- Requires JWT token in Authorization header
- Only accessible by authenticated candidates

### Response

**Note**: Only applications with valid job references will be returned in the response.

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
          "name": "Tech Corp"
        },
        "job": {
          "id": "507f1f77bcf86cd799439013",
          "title": "Frontend Developer"
        },
        "appliedAt": "2025-05-29T12:00:00Z",
        "status": "en_attente",
        "isRejected": false
      }
    ],
    "total": 10
  },
  "timestamp": "2025-05-29T19:18:39.000Z"
}
```

### Status Values
- `en_attente`: Application is pending review
- `en_cours`: Application is being processed
- `acceptée`: Application has been accepted
- `rejetée`: Application has been rejected

### Status Codes
- 200: Success
- 401: Unauthorized (invalid or missing token)
- 500: Internal Server Error

### Example Request
```bash
curl -X GET \
  'http://localhost:3000/auth/candidate/applications' \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

### Notes
- Only applications with valid job references are returned
- Invalid or deleted job applications are automatically filtered out
- The total count reflects only the valid applications
- Each application includes complete company and job details
- The `isRejected` flag indicates if the application has been rejected
- Applications are automatically sorted by application date