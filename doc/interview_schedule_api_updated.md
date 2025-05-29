# Interview Schedule API Documentation

## Overview

The Interview Schedule API provides endpoints for scheduling, confirming, and managing candidate interviews in the Lintern platform. It allows recruiters and hiring managers to efficiently manage interview processes.

## Base URL

- **Base URL**: `/interviews`

## Authentication

All routes require JWT authentication. Include a valid bearer token in the Authorization header.

```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Schedule Interview

#### Request Details

- **Endpoint**: `/interviews/schedule`
- **Method**: POST
- **Authentication**: Required (JWT)
- **Description**: Schedule a new interview for a job application candidate
- **Swagger Documentation**: ✅ Available

#### Request Body

The request body should follow the `ScheduleInterviewDto` schema:

```typescript
{
  applicationId: string;    // ID of the application to schedule an interview for
  date: string;             // Date of the interview (format: YYYY-MM-DD)
  time: string;             // Time of the interview in 24h format (HH:mm)
  type: 'Video' | 'InPerson' | 'Phone';  // Type of interview
  location?: string;        // Required for InPerson interviews
  meetingLink?: string;     // Required for Video interviews
  notes?: string;           // Optional additional notes about the interview
}
```

#### Validation Rules

- `applicationId`: Must be a valid application ID
- `date`: Must be a valid date string in ISO format (YYYY-MM-DD)
- `time`: Must be in 24-hour format (HH:mm)
- `type`: Must be one of: "Video", "InPerson", or "Phone"
- `location`: Required if type is "InPerson"
- `meetingLink`: Required if type is "Video"

#### Response

##### Success Response (201 Created)

```json
{
  "message": "Interview scheduled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "applicationId": "507f1f77bcf86cd799439012",
    "candidateId": "507f1f77bcf86cd799439013",
    "date": "2025-05-23T00:00:00.000Z",
    "time": "14:30",
    "type": "Video",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "notes": "Please prepare a short presentation about your previous work",
    "status": "pending",
    "createdAt": "2025-05-15T10:23:45.678Z",
    "updatedAt": "2025-05-15T10:23:45.678Z"
  }
}
```

##### Error Responses

- **400 Bad Request**: Invalid input data
  ```json
  {
    "message": "Meeting link is required for video interviews",
    "error": "Bad Request"
  }
  ```

- **404 Not Found**: Application not found
  ```json
  {
    "message": "Application not found",
    "error": "Not Found"
  }
  ```

- **401 Unauthorized**: Invalid or missing authentication token
  ```json
  {
    "message": "Unauthorized",
    "error": "Unauthorized"
  }
  ```

### 2. Confirm Interview

#### Request Details

- **Endpoint**: `/interviews/confirm/{token}`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Confirm an interview using the token sent to the candidate's email

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interview confirmed successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "applicationId": "507f1f77bcf86cd799439012", 
    "candidateId": "507f1f77bcf86cd799439013",
    "date": "2025-05-23T00:00:00.000Z",
    "time": "14:30",
    "type": "Video",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "confirmed",
    "confirmedAt": "2025-05-16T09:15:30.123Z",
    "createdAt": "2025-05-15T10:23:45.678Z",
    "updatedAt": "2025-05-16T09:15:30.123Z"
  }
}
```

##### Error Responses

- **400 Bad Request**: Invalid token or interview already confirmed
- **404 Not Found**: Interview not found

### 3. Get Interviews for an Application

#### Request Details

- **Endpoint**: `/interviews/application/{applicationId}`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Get all interviews for a specific application

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interviews retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "applicationId": "507f1f77bcf86cd799439012",
      "candidateId": "507f1f77bcf86cd799439013",
      "date": "2025-05-23T00:00:00.000Z",
      "time": "14:30",
      "type": "Video",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "status": "confirmed",
      "createdAt": "2025-05-15T10:23:45.678Z",
      "updatedAt": "2025-05-15T10:23:45.678Z"
    }
  ]
}
```

##### Error Responses

- **404 Not Found**: Application not found

### 4. Get Interviews for a Candidate

#### Request Details

- **Endpoint**: `/interviews/candidate/{candidateId}`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Get all interviews for a specific candidate

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interviews retrieved successfully",
  "data": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "applicationId": "507f1f77bcf86cd799439012",
      "candidateId": "507f1f77bcf86cd799439013",
      "date": "2025-05-23T00:00:00.000Z",
      "time": "14:30",
      "type": "Video",
      "meetingLink": "https://meet.google.com/abc-defg-hij",
      "status": "confirmed",
      "createdAt": "2025-05-15T10:23:45.678Z",
      "updatedAt": "2025-05-15T10:23:45.678Z"
    }
  ]
}
```

##### Error Responses

- **404 Not Found**: Candidate not found

### 5. Get All Scheduled Candidates

#### Request Details

- **Endpoint**: `/interviews/scheduled`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Get all scheduled candidates with job details

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Scheduled candidates retrieved successfully",
  "data": [
    {
      "interviewId": "507f1f77bcf86cd799439011",
      "candidateName": "John Doe",
      "candidateEmail": "john.doe@example.com",
      "jobTitle": "Senior Software Engineer",
      "status": "pending",
      "scheduledDate": "2025-05-23T00:00:00.000Z",
      "scheduledTime": "14:30",
      "application": {
        "applicationId": "507f1f77bcf86cd799439012",
        "datePostulation": "2025-05-10T00:00:00.000Z",
        "statut": "présélectionné",
        "companyName": "Tech Solutions Inc"
      }
    }
  ]
}
```

### 6. Get Future Candidates

#### Request Details

- **Endpoint**: `/interviews/future`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Get all candidates added to future interviews without a scheduled date

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Future candidates retrieved successfully",
  "data": [
    {
      "interviewId": "507f1f77bcf86cd799439011",
      "candidateName": "John Doe",
      "candidateEmail": "john.doe@example.com",
      "jobTitle": "Senior Software Engineer",
      "status": "future",
      "scheduledDate": null,
      "scheduledTime": null,
      "application": {
        "applicationId": "507f1f77bcf86cd799439012",
        "datePostulation": "2025-05-10T00:00:00.000Z",
        "statut": "présélectionné",
        "companyName": "Tech Solutions Inc"
      }
    }
  ]
}
```

### 7. Add Candidate to Future Interviews

#### Request Details

- **Endpoint**: `/interviews/add-to-future`
- **Method**: POST
- **Authentication**: Required (JWT)
- **Description**: Add a candidate to future interviews without scheduling a date

#### Request Body

The request body should follow the `AddToInterviewsDto` schema:

```typescript
{
  applicationId: string;  // ID of the application to add to future interviews
}
```

#### Response

##### Success Response (201 Created)

```json
{
  "message": "Candidate added to future interviews successfully",
  "data": {
    "interviewId": "507f1f77bcf86cd799439011",
    "candidateName": "John Doe",
    "candidateEmail": "john.doe@example.com",
    "jobTitle": "Senior Software Engineer",
    "status": "future",
    "application": {
      "applicationId": "507f1f77bcf86cd799439012",
      "datePostulation": "2025-05-10T00:00:00.000Z",
      "statut": "présélectionné",
      "companyName": "Tech Solutions Inc"
    }
  }
}
```

##### Error Responses

- **400 Bad Request**: Invalid input data
- **404 Not Found**: Application not found

### 8. Cancel Interview

#### Request Details

- **Endpoint**: `/interviews/{id}/cancel`
- **Method**: PATCH
- **Authentication**: Required (JWT)
- **Description**: Cancel a scheduled interview

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interview cancelled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "applicationId": "507f1f77bcf86cd799439012",
    "candidateId": "507f1f77bcf86cd799439013",
    "date": "2025-05-23T00:00:00.000Z",
    "time": "14:30",
    "type": "Video",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "cancelled",
    "createdAt": "2025-05-15T10:23:45.678Z",
    "updatedAt": "2025-05-17T15:20:33.456Z"
  }
}
```

##### Error Responses

- **404 Not Found**: Interview not found
- **400 Bad Request**: Interview cannot be cancelled (e.g., already completed)

### 9. Reschedule Interview

#### Request Details

- **Endpoint**: `/interviews/{id}/reschedule`
- **Method**: PATCH
- **Authentication**: Required (JWT)
- **Description**: Reschedule an existing interview

#### Request Body

The request body should follow the `RescheduleInterviewDto` schema:

```typescript
{
  date: string;             // New date of the interview (format: YYYY-MM-DD)
  time: string;             // New time of the interview in 24h format (HH:mm)
  type: 'Video' | 'InPerson' | 'Phone';  // Type of interview
  location?: string;        // Required for InPerson interviews
  meetingLink?: string;     // Required for Video interviews
  notes?: string;           // Optional additional notes about the interview
}
```

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interview rescheduled successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "applicationId": "507f1f77bcf86cd799439012",
    "candidateId": "507f1f77bcf86cd799439013",
    "date": "2025-06-01T00:00:00.000Z",
    "time": "15:00",
    "type": "Video",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "pending",
    "createdAt": "2025-05-15T10:23:45.678Z",
    "updatedAt": "2025-05-18T11:42:19.234Z"
  }
}
```

##### Error Responses

- **404 Not Found**: Interview not found
- **400 Bad Request**: Invalid input data or interview cannot be rescheduled

### 10. Get Interview Details

#### Request Details

- **Endpoint**: `/interviews/{id}`
- **Method**: GET
- **Authentication**: Required (JWT)
- **Description**: Get detailed information about a specific interview, including application and candidate information

#### Response

##### Success Response (200 OK)

```json
{
  "message": "Interview details retrieved successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "applicationId": {
      "candidat": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com",
        "_id": "507f1f77bcf86cd799439013"
      },
      "poste": {
        "title": "Senior Software Engineer",
        "_id": "507f1f77bcf86cd799439014"
      },
      "companyId": {
        "nomEntreprise": "Tech Solutions Inc",
        "_id": "507f1f77bcf86cd799439015"
      },
      "_id": "507f1f77bcf86cd799439012",
      "datePostulation": "2025-05-10T00:00:00.000Z",
      "statut": "présélectionné",
      "isRejected": false,
      "dateAnalyse": "2025-05-12T00:00:00.000Z"
    },
    "status": "pending",
    "date": "2025-05-23T00:00:00.000Z",
    "time": "14:30"
  }
}
```

##### Error Responses

- **404 Not Found**: Interview not found

## Interview Status Workflow

1. **future**: Candidate is added to future interviews without a scheduled date
2. **programmed**: Future candidate gets scheduled (status changes from "future" to "programmed")
3. **pending**: New interview scheduled or waiting for candidate confirmation
4. **confirmed**: Candidate has confirmed the interview
5. **declined**: Candidate has declined the interview
6. **completed**: Interview has been completed
7. **cancelled**: Interview has been cancelled

## Automatic Actions

When an interview is scheduled:

1. A confirmation token is generated for the interview
2. An email is sent to the candidate with:
   - Interview details (date, time, company, job position)
   - Confirmation link with the token
   - Meeting link (for virtual interviews) or location details (for in-person interviews)
   - Any additional notes provided

## Implementation Notes

- The service validates the existence of the application before creating an interview
- For video interviews, a meeting link is required
- For in-person interviews, a location is required
- Confirmation emails are sent with formatted dates and times
- If there's an existing future interview for the same application, it will be updated instead of creating a new interview
- New interviews initially have a "pending" status
- After creation, the candidate needs to confirm the interview via the email link

## Sequence Diagram

```
┌─────────┐          ┌──────────────┐          ┌─────────────┐          ┌────────────┐
│ Client  │          │ API Server   │          │ Database    │          │ Email Svc  │
└────┬────┘          └──────┬───────┘          └──────┬──────┘          └─────┬──────┘
     │                      │                         │                       │
     │ POST /interviews/schedule                      │                       │
     │──────────────────────>                         │                       │
     │                      │                         │                       │
     │                      │ Find application + populate                     │
     │                      │────────────────────────>│                       │
     │                      │                         │                       │
     │                      │ Application data        │                       │
     │                      │<────────────────────────│                       │
     │                      │                         │                       │
     │                      │ Create interview record │                       │
     │                      │────────────────────────>│                       │
     │                      │                         │                       │
     │                      │ Interview record        │                       │
     │                      │<────────────────────────│                       │
     │                      │                         │                       │
     │                      │ Generate confirmation token                     │
     │                      │─────────────┐           │                       │
     │                      │<────────────┘           │                       │
     │                      │                         │                       │
     │                      │ Send email with confirmation link               │
     │                      │─────────────────────────────────────────────────>
     │                      │                         │                       │
     │                      │ Email sent status       │                       │
     │                      │<─────────────────────────────────────────────────
     │                      │                         │                       │
     │ 201 Created          │                         │                       │
     │<──────────────────────                         │                       │
     │                      │                         │                       │
```
