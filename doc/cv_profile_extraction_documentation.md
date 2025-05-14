# CV Profile Extraction API Documentation

## Overview
These API endpoints use Gemini AI to extract structured profile data from a candidate's CV and automatically update their profile with education, experience, certifications, and skills information.

## Endpoints

### 1. Extract from Existing CV
`POST /candidate/cv-profile/extract-existing`

### 2. Upload and Extract from New CV
`POST /candidate/cv-profile/extract`

## Authentication
- Requires JWT authentication token in Authorization header
- Token must have candidate role

## Authentication for Both Endpoints
- Requires JWT authentication token in Authorization header
- Token must have candidate role

## 1. Extract from Existing CV

### Request
No request body is required. The system will use the CV file that was previously uploaded by the candidate.

### Response
```json
{
  "success": true,
  "message": "Profile data extracted from existing CV successfully"
}
```

## 2. Upload and Extract from New CV

### Request
Multipart form data with:
- `file`: PDF file (required if no existing CV, max 5MB)

### Response
```json
{
  "success": true,
  "message": "CV uploaded and profile data extracted successfully",
  "cvUrl": "/uploads/user123/cv/filename.pdf"
}
```

If no file is uploaded but an existing CV is found:
```json
{
  "success": true,
  "message": "Profile data extracted from existing CV successfully",
  "cvUrl": "/uploads/user123/cv/existing-filename.pdf"
}
```


## Error Responses
- 400 Bad Request - CV not found or invalid
  ```json
  {
    "statusCode": 400,
    "message": "No CV file uploaded and no existing CV found"
  }
  ```

- 400 Bad Request - Invalid file format
  ```json
  {
    "statusCode": 400,
    "message": "Only PDF files are allowed"
  }
  ```

- 401 Unauthorized - Invalid token
  ```json
  {
    "statusCode": 401,
    "message": "Unauthorized"
  }
  ```

- 500 Internal Server Error - Failed to extract profile data
  ```json
  {
    "statusCode": 500,
    "message": "Failed to extract profile data from CV"
  }
  ```

## Data Extraction Details

The system extracts and updates the following profile sections:

### Education
- Institution name
- Degree
- Field of study
- Start and end dates
- Description
- Specialization
- Grade

### Experience
- Company name
- Position/job title
- Location
- Start and end dates
- Current position flag
- Job description
- Skills used
- Achievements

### Certifications
- Certification name
- Issuing organization
- Issue date
- Expiry date
- Credential ID
- Credential URL
- Description
- Related skills

### Skills
- Skill name
- Category (Technical, Interpersonal, Language)
- Proficiency level (1-5)
- Years of experience
- Language proficiency (for language skills)

## Notes
- The candidate must have uploaded a CV file before using this endpoint
- The system will completely replace existing education, experience, certifications, and skills data
- The profile completion score will be automatically recalculated after extraction
- Processing may take a few seconds as it involves AI analysis of the CV