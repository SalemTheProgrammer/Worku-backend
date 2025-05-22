# Company Journal API

This document provides details on how to use the Company Journal API to retrieve activity logs for companies.

## Get Company Activities

Retrieves a paginated list of activities for the authenticated company. Activities can be filtered by action type and date range.

- **Endpoint:** `GET /company-journal`
- **Authentication:** Required (JWT Bearer Token)
- **Permissions:** Authenticated Company User

### Request

#### Headers

- `Authorization`: `Bearer <YOUR_JWT_TOKEN>`

#### Query Parameters

| Parameter     | Type                                    | Optional | Default | Description                                                                 | Example                                  |
|---------------|-----------------------------------------|----------|---------|-----------------------------------------------------------------------------|------------------------------------------|
| `page`        | `number`                                | Yes      | `1`     | The page number for pagination.                                             | `1`                                      |
| `limit`       | `number`                                | Yes      | `10`    | The number of items per page.                                               | `20`                                     |
| `actionTypes` | `string[]` (Enum: `CompanyActionType`)  | Yes      |         | An array of action types to filter by. See `CompanyActionType` enum below.  | `actionTypes=JOB_POST_CREATED&actionTypes=CANDIDATE_VIEWED` |
| `startDate`   | `string` (ISO 8601 Date)                | Yes      |         | The start date for filtering activities (inclusive).                        | `2023-01-01T00:00:00.000Z`               |
| `endDate`     | `string` (ISO 8601 Date)                | Yes      |         | The end date for filtering activities (inclusive).                          | `2023-01-31T23:59:59.999Z`               |

##### `CompanyActionType` Enum Values:

The `actionTypes` parameter accepts values from the `CompanyActionType` enum. Possible values include (refer to [`src/journal/enums/action-types.enum.ts`](src/journal/enums/action-types.enum.ts:1) for the complete list):
- `LOGIN`
- `LOGOUT`
- `PROFILE_UPDATE`
- `JOB_POST_CREATED`
- `JOB_POST_UPDATED`
- `JOB_POST_DELETED`
- `VIEW_APPLICATIONS`
- `CANDIDATE_PROFILE_VIEW` (Note: The controller uses `CONSULTATION_PROFIL_CANDIDAT` for logging this, but the enum might have `CANDIDATE_PROFILE_VIEW` or similar for filtering)
- `USER_INVITED`
- `USER_REMOVED`
- `ACCOUNT_DELETED`
- `PASSWORD_RESET_REQUEST`
- `PASSWORD_RESET_COMPLETED`
- `EMAIL_VERIFICATION`
- `SEARCH_CANDIDATES`
- `INTERVIEW_SCHEDULED`
- `INTERVIEW_UPDATED`
- `INTERVIEW_CANCELLED`

### Response

#### Success (200 OK)

Returns a `PaginatedJournalResponse` object containing the list of company activities.

```json
{
  "data": [
    {
      "id": "60d21b4667d0d8992e610c99",
      "timestamp": "2023-05-22T11:00:00.000Z",
      "actionType": "JOB_POST_CREATED",
      "message": "New job post 'Software Engineer' created.",
      "details": {
        "jobId": "60d21b4667d0d8992e610c98",
        "jobTitle": "Software Engineer"
      },
      "isSystem": false,
      "companyId": "60d21b4667d0d8992e610c97"
    }
    // ... more activities
  ],
  "meta": {
    "totalItems": 50,
    "itemCount": 10,
    "itemsPerPage": 10,
    "totalPages": 5,
    "currentPage": 1
  },
  "links": {
    "first": "/company-journal?limit=10",
    "previous": "",
    "next": "/company-journal?page=2&limit=10",
    "last": "/company-journal?page=5&limit=10"
  }
}
```

Refer to [`src/journal/dto/journal-activity.dto.ts`](src/journal/dto/journal-activity.dto.ts:1) for the structure of `CompanyJournalActivityDto` and `PaginatedJournalResponse`.

#### Error Responses

- **401 Unauthorized:** If the JWT token is missing, invalid, or expired, or if the user is not associated with a company.
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized" 
  }
  ```
  or
  ```json
  {
    "statusCode": 401,
    "message": "Accès entreprise requis"
  }
  ```
- **403 Forbidden:** (If specific role/permission checks fail, though the current setup primarily relies on `JwtAuthGuard` for company user identity).
  ```json
  {
    "statusCode": 403,
    "message": "Forbidden"
  }
  ```

### Example Usage (cURL)

```bash
curl -X GET "http://localhost:3000/api/company-journal?page=1&limit=5&actionTypes=JOB_POST_CREATED" \
     -H "Authorization: Bearer <YOUR_JWT_TOKEN>"