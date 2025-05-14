# Certification Management API Documentation

This document describes the API endpoints for managing candidate certifications in the system.

## Base URL
All certification endpoints are prefixed with `/auth/candidate/certifications`

## Authentication
All routes require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

## Date Format
All dates must be provided in ISO 8601 format (YYYY-MM-DD). For example:
- "2025-05-28" ✓
- "2025-05-28T00:00:00.000Z" ✓
- "28-05-2025" ✗
- "05/28/2025" ✗

## Routes

### 1. Add New Certification
Adds a new certification to the candidate's profile.

- **URL**: `/auth/candidate/certifications`
- **Method**: `POST`
- **Authentication**: Required

**Request Body Example**:
```json
{
  "name": "CRISC - Certified in Risk and Information Systems Control",
  "issuingOrganization": "ISACA",
  "issueDate": "2025-05-28",
  "expirationDate": "2026-05-30",  // Can use either expirationDate or expiryDate
  "credentialId": "ABC123D",
  "credentialUrl": "https://www.credly.com/badges/12345678",
  "description": "Risk management certification",
  "skills": ["Risk Management", "Information Systems", "Security"]
}
```

### 2. Get All Certifications
Retrieves all certifications for the candidate.

- **URL**: `/auth/candidate/certifications`
- **Method**: `GET`
- **Authentication**: Required

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "certifications": [
      {
        "_id": "507f1f77bcf86cd799439011",
        "name": "CRISC",
        "issuingOrganization": "ISACA",
        "issueDate": "2025-05-28T00:00:00.000Z",
        "expiryDate": "2026-05-30T00:00:00.000Z",
        "credentialId": "ABC123D",
        "credentialUrl": "https://www.credly.com/badges/12345678",
        "isExpired": false,
        "description": "Risk management certification",
        "skills": ["Risk Management", "Information Systems", "Security"]
      }
    ]
  }
}
```

### 3. Update Certification
Updates an existing certification.

- **URL**: `/auth/candidate/certifications/:id`
- **Method**: `PUT`
- **Authentication**: Required

**Request Body Example** (include only fields to update):
```json
{
  "expirationDate": "2026-05-30",
  "credentialUrl": "https://www.credly.com/badges/87654321",
  "description": "Updated certification description"
}
```

### 4. Delete Certification
Deletes a specific certification.

- **URL**: `/auth/candidate/certifications/:id`
- **Method**: `DELETE`
- **Authentication**: Required

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Certification deleted successfully"
}
```

## Additional Notes

### Date Fields
- `issueDate`: Required, must be in YYYY-MM-DD format
- `expiryDate`/`expirationDate`: Optional, must be in YYYY-MM-DD format
- The API accepts either `expiryDate` or `expirationDate` for expiration date

### Expiry Status
- `isExpired` is automatically calculated based on the expiration date
- A certification is considered expired if its expiration date is in the past

### Associated Skills
- `skills` array is optional
- Use it to list technologies or competencies related to the certification
- Helps in skill matching and profile completeness calculations