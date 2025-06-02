# Candidate Interviews API Documentation

## Get Scheduled Interviews for Candidate

This endpoint retrieves all scheduled interviews for an authenticated candidate.

### Endpoint

`GET /auth/candidate/interviews`

### Authentication

-   Required: Yes
-   Type: Bearer Token
### Response

```json
[
  {
    "interviewId": "64f3e4a0b9a7c8a2b3c1d4e5",
    "date": "2025-09-15T00:00:00.000Z",
    "time": "10:00 AM",
    "type": "Video",
    "location": null,
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "pending",
    "jobTitle": "Software Engineer",
    "companyName": "Tech Innovations Inc."
  },
  {
    "interviewId": "64f3e4a0b9a7c8a2b3c1d4e6",
### Response Codes

| Code | Description                                |
|------|--------------------------------------------|
| 200  | Success - Returns list of interviews     |
### Example Request

```bash
curl -X GET \
  'http://api.example.com/auth/candidate/interviews' \
  -H 'Authorization: Bearer <token>'
```

### Notes

-   This endpoint retrieves all scheduled interviews for the authenticated candidate.
-   The response includes the interview date, time, type, location (if applicable), meeting link (if applicable), status, job title, and company name.
| 401  | Unauthorized - Invalid or missing token    |
    "date": "2025-09-16T00:00:00.000Z",
    "time": "02:00 PM",
    "type": "InPerson",
    "location": "123 Main Street, Anytown",
    "meetingLink": null,
    "status": "confirmed",
    "jobTitle": "Data Scientist",
    "companyName": "Data Solutions Ltd."
  }
]
```

### Request Parameters

-------
None
 
## Schedule Interview for Candidate
 
This endpoint allows scheduling a new interview for a candidate.
 
### Endpoint
 
`POST /interviews/schedule`
 
### Authentication
 
-   Required: Yes
-   Type: Bearer Token
 
### Request Body
 
```json
{
    "applicationId": "507f1f77bcf86cd799439011",
    "date": "2025-05-20",
    "time": "14:30",
    "type": "Video",
    "location": "123 Business Street, Floor 5",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "notes": "Please bring your portfolio"
}
```
 
### Response
 
```json
{
    "message": "Interview scheduled successfully",
    "data": {
        "interviewId": "64f3e4a0b9a7c8a2b3c1d4e7",
        "date": "2025-05-20T00:00:00.000Z",
        "time": "14:30",
        "type": "Video",
        "location": "123 Business Street, Floor 5",
        "meetingLink": "https://meet.google.com/abc-defg-hij",
        "status": "pending",
        "applicationId": "507f1f77bcf86cd799439011"
    }
}
```
 
### Response Codes
 
| Code  | Description                                  |
| ----- | -------------------------------------------- |
| 201   | Success - Interview scheduled successfully   |
| 400   | Bad Request - Invalid input data             |
| 401   | Unauthorized - Invalid or missing token      |
| 404   | Not Found - Application not found            |
 
### Example Request
 
```bash
curl -X POST \
  'http://api.example.com/interviews/schedule' \
  -H 'Authorization: Bearer <token>' \
  -H 'Content-Type: application/json' \
  -d '{
    "applicationId": "507f1f77bcf86cd799439011",
    "date": "2025-05-20",
    "time": "14:30",
    "type": "Video",
    "location": "123 Business Street, Floor 5",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "notes": "Please bring your portfolio"
}'
```
 
### Notes
 
-   This endpoint allows scheduling a new interview for a candidate.
-   The response includes the interview details.
 
## Confirm Interview
 
This endpoint allows confirming an interview using a token.
 
### Endpoint
 
`GET /interviews/confirm/:token`
 
### Authentication
 
-   Required: No
-   Type: Token in URL
 
### Response
 
```json
{
    "message": "Interview confirmed successfully",
    "data": {
        "interviewId": "64f3e4a0b9a7c8a2b3c1d4e7",
        "date": "2025-05-20T00:00:00.000Z",
        "time": "14:30",
        "type": "Video",
        "location": "123 Business Street, Floor 5",
        "meetingLink": "https://meet.google.com/abc-defg-hij",
        "status": "confirmed",
        "applicationId": "507f1f77bcf86cd799439011"
    }
}
```
 
### Response Codes
 
| Code  | Description                                  |
| ----- | -------------------------------------------- |
| 200   | Success - Interview confirmed successfully   |
| 400   | Bad Request - Invalid token or interview already confirmed |
| 404   | Not Found - Interview not found              |
 
### Example Request
 
```bash
curl -X GET \
  'http://api.example.com/interviews/confirm/your_confirmation_token'
```
 
### Notes
 
-   This endpoint allows confirming an interview using a token.
-   The response includes the updated interview details.