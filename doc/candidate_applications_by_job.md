# Candidate Applications by Job ID API Documentation

## Endpoint
`GET /jobs/:jobId/applications`

## Description
Returns a list of all candidates who have applied for a specific job posting with detailed profile information. This endpoint is restricted to company users only.

## Authentication
- Requires JWT token in Authorization header
- Only accessible by company users

## Request Parameters

### Path Parameters
| Parameter | Type   | Required | Description          |
|-----------|--------|----------|----------------------|
| jobId     | string | Yes      | The ID of the job    |

## Response

### Success Response (200)
```json
{
  "jobId": "507f1f77bcf86cd799439011",
  "applications": [
    {
      "candidateId": "507f1f77bcf86cd799439012",
      "name": "John Doe",
      "email": "john@example.com",
      "profilePicture": "https://example.com/uploads/profile.jpg",
      "lastStudied": "University of Lagos",
      "availability": "immediately",
      "applicationDate": "2025-05-05T12:00:00Z",
      "status": "pending",
      "matchScore": 85,
      "matchedKeywords": [
        "JavaScript",
        "React",
        "Node.js"
      ]
    }
  ]
}
```

### Error Responses
- **401 Unauthorized**: Invalid or missing authentication token
- **403 Forbidden**: User is not a company user
- **404 Not Found**: Job not found or doesn't belong to company

## Example Request
```bash
curl -X GET \
  http://localhost:3000/jobs/507f1f77bcf86cd799439011/applications \
  -H 'Authorization: Bearer YOUR_JWT_TOKEN'
```

## Notes
- The matchScore represents the compatibility percentage between the candidate's profile and the job requirements
- Only returns applications for jobs that belong to the authenticated company
- Availability can be: "immediately", "1_month", "3_months", or "not_available"
- Matched keywords show the top 3 skills that align with the job requirements