# Candidate Application API Documentation

## Overview
Endpoints for candidates to manage job applications and related profile data.

## Authentication
All endpoints require JWT authentication in the Authorization header.

---

## Candidate Profile Endpoints

### 1. Get Candidate Profile
`GET /auth/candidate/profile`

**Response:**
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "professionalStatus": "ACTIVELY_LOOKING"
  },
  "skills": [
    {
      "name": "JavaScript",
      "category": "TECHNICAL",
      "proficiencyLevel": "Intermédiaire"
    }
  ],
  "experience": [
    {
      "jobTitle": "Full Stack Developer",
      "company": "Tech Corp",
      "duration": "2 years"
    }
  ]
}
```

---

## Skill Management Endpoints

### 1. Add Skill
`POST /auth/candidate/skills`

**Request Body:**
```json
{
  "name": "Python",
  "category": "TECHNICAL",
  "proficiencyLevel": "Professionnel"
}
```

**Valid Proficiency Levels:**
- Natif
- Professionnel
- Intermédiaire 
- Débutant

---

## File Management Endpoints

### 1. Upload CV
`POST /auth/candidate/upload-cv`

**Parameters:**
- `file` (binary): PDF or DOCX file

**Response:**
```json
{
  "cvUrl": "/uploads/cv-123.pdf",
  "analysisResults": {
    "skillsExtracted": ["Python", "AWS"],
    "experienceSummary": "5 years backend development"
  }
}
```

---

## Error Responses

**401 Unauthorized**
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**400 Validation Error**
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [
    "skills.0.proficiencyLevel: must be one of: Natif, Professionnel, Intermédiaire, Débutant"
  ]
}