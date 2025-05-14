# Interview API Routes Documentation

## Overview
All interview routes are protected with JWT authentication and require a valid bearer token.

Base URL: `/interviews`

## Available Routes

### 1. Schedule Interview
- **Method**: POST
- **Endpoint**: `/interviews/schedule`
- **Authentication**: Required (JWT)
- **Description**: Schedule a new interview for a candidate
- **Swagger**: ✅ Added
- **Request Body**: ScheduleInterviewDto
  ```typescript
  {
    applicationId: string;
    date: string;
    time: string;
    type: 'Video' | 'InPerson';
    location?: string;      // Required for InPerson interviews
    meetingLink?: string;   // Required for Video interviews
    notes?: string;
  }
  ```
- **Responses**:
  - 201: Interview scheduled successfully
  - 400: Invalid input data
  - 404: Application not found

### 2. Confirm Interview
- **Method**: GET
- **Endpoint**: `/interviews/confirm/:token`
- **Authentication**: Required (JWT)
- **Description**: Confirm a scheduled interview using the confirmation token
- **Swagger**: ✅ Added
- **Parameters**:
  - token (path parameter): Interview confirmation token
- **Responses**:
  - 200: Interview confirmed successfully
  - 400: Invalid token or interview already confirmed
  - 404: Interview not found

### 3. Get Interviews by Application
- **Method**: GET
- **Endpoint**: `/interviews/application/:applicationId`
- **Authentication**: Required (JWT)
- **Description**: Retrieve all interviews for a specific application
- **Swagger**: ✅ Added
- **Parameters**:
  - applicationId (path parameter): ID of the application
- **Responses**:
  - 200: Interviews retrieved successfully
  - 404: Application not found

### 4. Get Interviews by Candidate
- **Method**: GET
- **Endpoint**: `/interviews/candidate/:candidateId`
- **Authentication**: Required (JWT)
- **Description**: Retrieve all interviews for a specific candidate
- **Swagger**: ✅ Added
- **Parameters**:
  - candidateId (path parameter): ID of the candidate
- **Responses**:
  - 200: Interviews retrieved successfully
  - 404: Candidate not found

### 5. Get All Scheduled Candidates
- **Method**: GET
- **Endpoint**: `/interviews/scheduled`
- **Authentication**: Required (JWT)
- **Description**: Retrieve all scheduled candidates with their job details
- **Swagger**: ✅ Added
- **Response**: Array of ScheduledCandidate objects
  ```typescript
  {
    interviewId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    status: string;
    scheduledDate?: Date;
    scheduledTime?: string;
  }
  ```
- **Responses**:
  - 200: Scheduled candidates retrieved successfully

### 6. Get Future Candidates
- **Method**: GET
- **Endpoint**: `/interviews/future`
- **Authentication**: Required (JWT)
- **Description**: Retrieve all candidates that have been added to future interviews
- **Swagger**: ✅ Added
- **Response**: Array of ScheduledCandidate objects
  ```typescript
  {
    interviewId: string;
    candidateName: string;
    candidateEmail: string;
    jobTitle: string;
    status: string;
  }
  ```
- **Responses**:
  - 200: Future candidates retrieved successfully

### 7. Add to Future Interviews
- **Method**: POST
- **Endpoint**: `/interviews/add-to-future`
- **Authentication**: Required (JWT)
- **Description**: Add a candidate to future interviews without scheduling a specific date
- **Swagger**: ✅ Added
- **Request Body**: AddToInterviewsDto
  ```typescript
  {
    applicationId: string;
  }
  ```
- **Responses**:
  - 201: Candidate added to future interviews successfully
  - 400: Invalid input data
  - 404: Application not found

## Swagger Configuration
All routes are properly documented with Swagger using the following decorators:
- `@ApiTags('Interviews')`
- `@ApiOperation({ summary: '...' })`
- `@ApiResponse({ status: xxx, description: '...' })`
- `@ApiBearerAuth()`

## Authentication
All routes require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Error Handling
All routes include proper error handling for:
- Invalid input validation
- Resource not found scenarios
- Authentication/Authorization errors