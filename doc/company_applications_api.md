# Company Applications API Documentation

## Get Company Applications

Retrieve applications for a specific company with pagination and filtering options.

### Endpoint

```
GET /applications/company/{companyId}
```

### Authentication

- Required: Yes
- Type: Bearer Token
- Role: Company users only

### Path Parameters

| Parameter  | Type   | Required | Description    |
|-----------|--------|----------|----------------|
| companyId | string | Yes      | ID of company |

### Query Parameters

| Parameter  | Type    | Required | Default | Description                                      |
|-----------|---------|----------|---------|--------------------------------------------------|
| jobId     | string  | No       | -       | Filter applications by specific job              |
| limit     | number  | No       | 5       | Number of applications per page (min: 1)         |
| skip      | number  | No       | 0       | Number of applications to skip (for pagination)  |
| sortOrder | string  | No       | 'desc'  | Sort order for application date ('asc' or 'desc')|

### Response

```typescript
{
  "applications": [
    {
      "_id": "string",
      "candidat": {
        "_id": "string",
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
      "poste": {
        "_id": "string",
        "title": "string",
        // other job details...
      },
      "datePostulation": "2025-05-09T15:00:00.000Z",
      "statut": "string"
    }
  ],
  "total": number  // Total number of applications (for pagination)
}
```

### Response Codes

| Code | Description                                     |
|------|-------------------------------------------------|
| 200  | Success - Returns applications list and total    |
| 401  | Unauthorized - Invalid or missing token          |
| 403  | Forbidden - User is not a company user          |
| 400  | Bad Request - Invalid parameters                |

### Example Requests

1. Get first page of applications (5 per page):
```
GET /applications/company/123456
```

2. Get second page of applications:
```
GET /applications/company/123456?skip=5&limit=5
```

3. Filter applications for a specific job:
```
GET /applications/company/123456?jobId=789012
```

4. Combined filtering and pagination:
```
GET /applications/company/123456?jobId=789012&skip=5&limit=5&sortOrder=asc
```

### Example Response

```json
{
  "applications": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "candidat": {
        "_id": "507f1f77bcf86cd799439012",
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
      "poste": {
        "_id": "507f1f77bcf86cd799439013",
        "title": "Senior Developer"
      },
      "datePostulation": "2025-05-09T15:00:00.000Z",
      "statut": "en_attente"
    }
  ],
  "total": 42
}
```

### Notes

- The endpoint supports pagination to efficiently handle large numbers of applications
- Results are sorted by application date
- All dates are returned in ISO 8601 format
- The total count helps in implementing proper pagination UI
- When filtering by jobId, ensure the job belongs to the specified company