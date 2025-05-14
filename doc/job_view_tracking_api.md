# Job View Tracking API

This API endpoint allows tracking job views based on IP addresses with a rate limit to prevent duplicate counts.

## Record Job View

Records a view for a specific job. The same IP address can only register a view once every 7 hours.

### Endpoint

```
POST /jobs/{jobId}/seen
```

### Path Parameters

| Parameter | Type   | Description                    |
|-----------|--------|--------------------------------|
| jobId     | string | The ID of the job being viewed |

### Request

No request body is required. The IP address is automatically captured from the request.

### Response

#### Success Response (200 OK)

```json
{
  "message": "Job view recorded successfully"
}
```

#### Already Viewed Response (200 OK)

If the same IP has viewed this job within the last 7 hours:

```json
{
  "message": "View already recorded for this IP within the last 7 hours"
}
```

#### Error Responses

**404 Not Found**

```json
{
  "message": "Job not found"
}
```

**400 Bad Request**

```json
{
  "message": "Invalid job ID"
}
```

## Implementation Details

- Each view is tracked by IP address with a timestamp
- The same IP address can only register a new view after 7 hours
- The job's `seenCount` is incremented for each unique view
- View history is stored in a separate collection for analytics