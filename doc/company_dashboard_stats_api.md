# Company Dashboard Stats API

## Overview
This API provides comprehensive dashboard statistics for authenticated companies, including job posting metrics, application counts, interview statistics, recent activities, and remaining post allowances.

## Endpoint

### GET /company/dashboard/stats

Gets dashboard statistics for the authenticated company.

**Authentication Required:** Yes (JWT Bearer Token)

#### Response Schema

```json
{
  "week": {
    "offersPosted": 2,
    "candidatesApplied": 15,
    "interviewsCompleted": 3
  },
  "month": {
    "offersPosted": 8,
    "candidatesApplied": 45,
    "interviewsCompleted": 12
  },
  "year": {
    "offersPosted": 25,
    "candidatesApplied": 180,
    "interviewsCompleted": 35
  },
  "lastActivities": [
    {
      "actionType": "JOB_CREATED",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "message": "New job offer \"Software Engineer\" has been created",
      "details": {
        "jobTitle": "Software Engineer",
        "jobId": "60f7b2c8d1e4a2b8c9d0e1f2"
      }
    },
    {
      "actionType": "APPLICATION_RECEIVED",
      "timestamp": "2025-01-14T14:20:00.000Z",
      "message": "New application received for \"Frontend Developer\"",
      "details": {
        "jobTitle": "Frontend Developer",
        "candidateName": "John Doe"
      }
    },
    {
      "actionType": "INTERVIEW_COMPLETED",
      "timestamp": "2025-01-13T09:15:00.000Z",
      "message": "Interview completed with candidate for \"Backend Developer\"",
      "details": {
        "jobTitle": "Backend Developer",
        "candidateName": "Jane Smith",
        "rating": 4.5
      }
    }
  ],
  "remainingOffers": 3,
  "totalAllowedOffers": 10,
  "currentActiveOffers": 7
}
```

#### Response Fields

##### Time-based Statistics (week, month, year)
- **offersPosted** (number): Number of job offers posted in this time period
- **candidatesApplied** (number): Number of candidates who applied to all company offers in this period
- **interviewsCompleted** (number): Number of interviews that have been completed (not just scheduled) in this period

##### Activities
- **actionType** (string): Type of activity (JOB_CREATED, APPLICATION_RECEIVED, INTERVIEW_SCHEDULED, etc.)
- **timestamp** (string): ISO 8601 datetime when the activity occurred
- **message** (string): Human-readable description of the activity
- **details** (object): Additional context and data related to the activity

##### Offer Limits
- **remainingOffers** (number): Number of job offers the company can still post
- **totalAllowedOffers** (number): Total number of job offers allowed for authenticated company
- **currentActiveOffers** (number): Number of currently active job offers

#### Response Codes

- **200 OK**: Dashboard statistics retrieved successfully
- **401 Unauthorized**: Invalid or missing authentication token
- **404 Not Found**: Company not found
- **500 Internal Server Error**: Server error occurred

#### Example Request

```bash
curl -X GET "https://api.example.com/company/dashboard/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json"
```

#### Example Response

```json
{
  "week": {
    "offersPosted": 2,
    "candidatesApplied": 15,
    "interviewsCompleted": 3
  },
  "month": {
    "offersPosted": 8,
    "candidatesApplied": 45,
    "interviewsCompleted": 12
  },
  "year": {
    "offersPosted": 25,
    "candidatesApplied": 180,
    "interviewsCompleted": 35
  },
  "lastActivities": [
    {
      "actionType": "JOB_CREATED",
      "timestamp": "2025-01-15T10:30:00.000Z",
      "message": "New job offer \"Software Engineer\" has been created",
      "details": {
        "jobTitle": "Software Engineer",
        "jobId": "60f7b2c8d1e4a2b8c9d0e1f2"
      }
    }
  ],
  "remainingOffers": 3,
  "totalAllowedOffers": 10,
  "currentActiveOffers": 7
}
```

## Activity Types

The following activity types are tracked:

- **JOB_CREATED**: New job offer has been created
- **APPLICATION_RECEIVED**: New candidate application received
- **INTERVIEW_SCHEDULED**: Interview has been scheduled with a candidate
- **INTERVIEW_COMPLETED**: Interview has been completed
- **CANDIDATE_HIRED**: Candidate has been hired
- **PROFILE_UPDATED**: Company profile has been updated
- **LOGO_UPDATED**: Company logo has been updated

## Time Period Calculations

- **Week**: Monday to current day (Monday as start of week)
- **Month**: First day of current month to current day
- **Year**: January 1st of current year to current day

## Interview Completion

Only interviews with status `'completed'` and a `completedAt` timestamp are counted as completed interviews. Scheduled but not yet conducted interviews are not included in these statistics.

## Notes

- All timestamps are in UTC format
- The total allowed offers limit (currently 10) can be configured based on company subscription tiers
- Activity details vary by activity type and may contain different fields
- Statistics are calculated in real-time when the endpoint is called