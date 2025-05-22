# Candidate Journal API

This document provides details on how to use the Candidate Journal API to retrieve activity logs for candidates.

## Get Candidate Activities

Retrieves a paginated list of activities for the authenticated candidate. Activities can be filtered by action type and date range.

- **Endpoint:** `GET /candidate-journal`
- **Authentication:** Required (JWT Bearer Token)
- **Permissions:** Authenticated Candidate

### Request

#### Headers

- `Authorization`: `Bearer <YOUR_JWT_TOKEN>`

#### Query Parameters

| Parameter     | Type                                      | Optional | Default | Description                                                                 | Example                                  |
|---------------|-------------------------------------------|----------|---------|-----------------------------------------------------------------------------|------------------------------------------|
| `page`        | `number`                                  | Yes      | `1`     | The page number for pagination.                                             | `1`                                      |
| `limit`       | `number`                                  | Yes      | `10`    | The number of items per page.                                               | `20`                                     |
| `actionTypes` | `string[]` (Enum: `CandidateActionType`)  | Yes      |         | An array of action types to filter by. See `CandidateActionType` enum below. | `actionTypes=PROFILE_UPDATE&actionTypes=CV_UPLOAD` |
| `startDate`   | `string` (ISO 8601 Date)                  | Yes      |         | The start date for filtering activities (inclusive).                        | `2023-01-01T00:00:00.000Z`               |
| `endDate`     | `string` (ISO 8601 Date)                  | Yes      |         | The end date for filtering activities (inclusive).                          | `2023-01-31T23:59:59.999Z`               |

##### `CandidateActionType` Enum Values:

The `actionTypes` parameter accepts values from the `CandidateActionType` enum. Possible values include (refer to [`src/journal/enums/action-types.enum.ts`](src/journal/enums/action-types.enum.ts:1) for the complete list):
- `LOGIN`
- `LOGOUT`
- `PROFILE_UPDATE`
- `CV_UPLOAD`
- `CV_DELETE`
- `APPLICATION_SUBMITTED`
- `APPLICATION_WITHDRAWN`
- `JOB_SEARCH`
- `VIEW_JOB_OFFER`
- `ACCOUNT_DELETED`
- `PASSWORD_RESET_REQUEST`
- `PASSWORD_RESET_COMPLETED`
- `EMAIL_VERIFICATION`
- `SKILL_ADD`
- `SKILL_UPDATE`
- `SKILL_DELETE`
- `EXPERIENCE_ADD`
- `EXPERIENCE_UPDATE`
- `EXPERIENCE_DELETE`
- `EDUCATION_ADD`
- `EDUCATION_UPDATE`
- `EDUCATION_DELETE`
- `CERTIFICATION_ADD`
- `CERTIFICATION_UPDATE`
- `CERTIFICATION_DELETE`
- `SOCIAL_LINKS_UPDATE`

### Response

#### Success (200 OK)

Returns a `PaginatedJournalResponse` object containing the list of candidate activities.

```json
{
  "data": [
    {
      "id": "60d21b4667d0d8992e610c88",
      "timestamp": "2023-05-22T10:30:00.000Z",
      "actionType": "PROFILE_UPDATE",
      "message": "Profile updated successfully",
      "details": {
        "updatedFields": ["firstName", "lastName"]
      },
      "isSystem": false,
      "candidateId": "60d21b4667d0d8992e610c87"
    }
    // ... more activities
  ],
  "meta": {
    "totalItems": 100,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 10,
    "currentPage": 1
  },
  "links": {
    "first": "/candidate-journal?limit=10",
    "previous": "",
    "next": "/candidate-journal?page=2&limit=10",
    "last": "/candidate-journal?page=10&limit=10"
  }
}
```

Refer to [`src/journal/dto/journal-activity.dto.ts`](src/journal/dto/journal-activity.dto.ts:1) for the structure of `CandidateJournalActivityDto` and `PaginatedJournalResponse`.

#### Error Responses

- **401 Unauthorized:** If the JWT token is missing, invalid, or expired.
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```
- **403 Forbidden:** (If specific role/permission checks fail, though the current setup primarily relies on `JwtAuthGuard` for candidate identity).
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden"
  }
  ```

### Example Usage (cURL)

```bash
curl -X GET "http://localhost:3000/api/candidate-journal?page=1&limit=5&actionTypes=PROFILE_UPDATE" \
     -H "Authorization: Bearer <YOUR_JWT_TOKEN>"