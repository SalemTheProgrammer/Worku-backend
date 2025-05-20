# Job Applications API Documentation

## Get Applications for a Job

Retrieves all applications for a specific job posting with filtering and pagination support.

### Endpoint

```
GET /jobs/{jobId}/applications
```

### Authorization

- Requires a valid JWT token
- Bearer authentication

### Path Parameters

| Parameter | Type   | Description           | Example                  |
|-----------|--------|-----------------------|--------------------------|
| jobId     | string | ID of the job posting | 507f1f77bcf86cd799439011|

### Query Parameters

| Parameter  | Type    | Description                    | Default | Required |
|------------|---------|--------------------------------|---------|----------|
| limit      | number  | Number of items per page       | 5       | No       |
| skip       | number  | Number of items to skip        | 0       | No       |
| sortOrder  | string  | Sort by date (asc/desc)        | desc    | No       |

### Response Structure

```typescript
{
  statusCode: number,
  message: string,
  data: {
    applications: [{
      applicationId: string,
      candidate: {
        id: string,
        fullName: string,
        email: string,
        phone: string
      },
      jobId: string,
      companyId: string,
      status: string,
      appliedAt: Date,
      matchedKeywords: string[],
      highlightsToStandOut: string[],
      fitScore: {
        overall: number,
        skills: number,
        experience: number,
        education: number,
        languages: number
      },
      jobFitSummary: {
        isRecommended: boolean,
        fitLevel: string,
        reason: string,
        fitBreakdown: {
          skillsFit: {
            matchLevel: string,
            details: string[],
            techStackMatch: string[],
            domainExperience: string[]
          },
          experienceFit: {
            matchLevel: string,
            details: string[],
            techStackMatch: string[],
            domainExperience: string[]
          },
          educationFit: {
            matchLevel: string,
            details: string[],
            techStackMatch: string[],
            domainExperience: string[]
          }
        }
      },
      lastUpdated: Date,
      recruiterRecommendations: {
        decision: string,
        suggestedAction: string,
        feedbackToSend: string[]
      }
    }],
    total: number
  },
  timestamp: string
}
```

### Example Request

```bash
GET /jobs/507f1f77bcf86cd799439011/applications?limit=10&skip=0&sortOrder=desc
```

### Example Response

```json
{
  "statusCode": 200,
  "message": "Applications retrieved successfully",
  "data": {
    "applications": [
      {
        "applicationId": "60b8f1f77bcf86cd799439012",
        "candidate": {
          "id": "60b8f1f77bcf86cd799439013",
          "fullName": "John Doe",
          "email": "john@example.com",
          "phone": "+1234567890"
        },
        "jobId": "507f1f77bcf86cd799439011",
        "companyId": "507f1f77bcf86cd799439014",
        "status": "pending",
        "appliedAt": "2025-05-18T00:53:31.000Z",
        "matchedKeywords": ["JavaScript", "React"],
        "highlightsToStandOut": ["5 years of React experience"],
        "fitScore": {
          "overall": 85,
          "skills": 90,
          "experience": 85,
          "education": 80,
          "languages": 85
        },
        "jobFitSummary": {
          "isRecommended": true,
          "fitLevel": "Excellent",
          "reason": "Strong technical match",
          "fitBreakdown": {
            "skillsFit": {
              "matchLevel": "Excellent",
              "details": ["Strong JavaScript fundamentals"],
              "techStackMatch": ["React", "Node.js"],
              "domainExperience": ["E-commerce"]
            },
            "experienceFit": {
              "matchLevel": "Excellent",
              "details": ["Relevant industry experience"],
              "techStackMatch": ["React", "Node.js"],
              "domainExperience": ["E-commerce"]
            },
            "educationFit": {
              "matchLevel": "Good",
              "details": ["Related degree"],
              "techStackMatch": [],
              "domainExperience": []
            }
          }
        },
        "lastUpdated": "2025-05-18T00:53:31.000Z",
        "recruiterRecommendations": {
          "decision": "Strongly Recommended",
          "suggestedAction": "Schedule Interview",
          "feedbackToSend": ["Impressive technical background"]
        }
      }
    ],
    "total": 1
  },
  "timestamp": "2025-05-18T00:53:31.000Z"
}
```

### Response Codes

| Status Code | Description                   |
|-------------|-------------------------------|
| 200         | Success                      |
| 401         | Unauthorized - Invalid token  |
| 404         | Job not found                |
| 500         | Internal server error        |