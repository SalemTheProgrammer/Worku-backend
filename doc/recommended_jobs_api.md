# Recommended Jobs API Documentation

## Overview
The Recommended Jobs API provides endpoints for retrieving job recommendations and bulk applying to recommended jobs for authenticated candidates. Jobs that have already been applied to are automatically excluded from recommendations.

## Authentication
All endpoints require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### Get Recommended Jobs
Retrieves a paginated list of recommended jobs for the authenticated candidate.

**GET** `/recommended-jobs`

#### Query Parameters
| Parameter | Type    | Default | Description                      |
|-----------|---------|---------|----------------------------------|
| page      | number  | 1       | Page number for pagination       |
| limit     | number  | 10      | Number of items per page (1-50)  |

#### Response
```json
{
  "data": [
    {
      "_id": "string",
      "title": "Software Engineer",
      "description": "Job description here",
      "company": "string",
      "location": "string",
      "salary": {
        "min": 50000,
        "max": 80000,
        "currency": "USD"
      },
      "status": "active",
      "createdAt": "2024-05-25T23:00:00.000Z"
    }
  ],
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "pages": 10
  }
}
```

### Apply to All Recommended Jobs
Apply to all currently recommended jobs that haven't been applied to yet.

**POST** `/recommended-jobs/apply-all`

#### Response
```json
{
  "appliedCount": 5
}
```

#### Response Description
- `appliedCount`: Number of new applications created. If 0, it means either:
  - There were no recommended jobs available
  - You've already applied to all available jobs

## Error Responses

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "JWT token is missing or invalid"
}
```

### 400 Bad Request (Invalid Pagination)
```json
{
  "statusCode": 400,
  "message": ["limit must not be greater than 50"],
  "error": "Bad Request"
}
```

## Rate Limiting
The API is subject to rate limiting:
- Window: 15 minutes
- Max requests: 100 per window

## Examples

### Get First Page of Recommended Jobs
```bash
curl -X GET 'http://localhost:3000/recommended-jobs?page=1&limit=10' \
-H 'Authorization: Bearer your_jwt_token'
```

### Apply to All Recommended Jobs
```bash
curl -X POST 'http://localhost:3000/recommended-jobs/apply-all' \
-H 'Authorization: Bearer your_jwt_token'