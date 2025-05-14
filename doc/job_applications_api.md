# Job Applications API Documentation

## Get Applications for a Job

Get all applications submitted for a specific job with pagination support.

### Endpoint

```
GET /jobs/{jobId}/applications
```

### Authentication

- Required: Yes
- Type: Bearer Token

### Path Parameters

| Parameter | Type   | Required | Description |
|-----------|--------|----------|-------------|
| jobId     | string | Yes      | ID of job   |

### Query Parameters

| Parameter  | Type    | Required | Default | Description                                     |
|-----------|---------|----------|---------|-------------------------------------------------|
| limit     | number  | No       | 5       | Number of applications per page                 |
| skip      | number  | No       | 0       | Number of applications to skip (for pagination) |
| sortOrder | string  | No       | 'desc'  | Sort order for application date (asc or desc)  |

### Response

```typescript
{
  "applications": [
    {
      "_id": "string",
      "candidat": {
        "firstName": "string",
        "lastName": "string",
        "email": "string",
        "phone": "string",
        "location": "string",
        "profileImage": "string",
        "cv": "string",
        "title": "string",
        "skills": ["string"],
        "yearsOfExperience": number
      },
      "datePostulation": "2025-05-09T15:00:00.000Z",
      "statut": "string"
    }
  ],
  "total": number  // Total number of applications for pagination
}
```

### Response Codes

| Code | Description                                |
|------|--------------------------------------------|
| 200  | Success - Returns list of applications     |
| 401  | Unauthorized - Invalid or missing token    |
| 404  | Not Found - Job doesn't exist             |

### Example Request

```bash
curl -X GET \
  'http://api.example.com/jobs/507f1f77bcf86cd799439011/applications?limit=5&skip=0&sortOrder=desc' \
  -H 'Authorization: Bearer <token>'
```

### Example Response

```json
{
  "applications": [
    {
      "_id": "507f1f77bcf86cd799439013",
      "candidat": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john@example.com",
        "phone": "+1234567890",
        "location": "New York",
        "profileImage": "/uploads/profile.jpg",
        "cv": "/uploads/cv.pdf",
        "title": "Software Engineer",
        "skills": ["JavaScript", "Node.js", "MongoDB"],
        "yearsOfExperience": 5
      },
      "datePostulation": "2025-05-09T15:00:00.000Z",
      "statut": "en_attente"
    }
  ],
  "total": 42
}
```

### Notes

- Results are paginated with a default limit of 5 applications per page
- Use the `skip` parameter with the `total` count to implement pagination
- Applications are sorted by submission date (datePostulation)
- The response includes basic candidate information for each application
- Additional candidate details may require separate API calls