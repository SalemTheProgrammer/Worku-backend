# Candidate Journal API Documentation

This document provides comprehensive details on how to use the Candidate Journal API to retrieve activity logs for candidates.

## Overview

The Candidate Journal API allows authenticated candidates to view their activity history within the system. This includes profile updates, job applications, login/logout events, and other candidate-specific actions.

**Base URL:** `/candidate-journal`
**Authentication:** Required (JWT Bearer Token)
**Permissions:** Authenticated Candidate only

---

## Get Candidate Activities

Retrieves a paginated list of activities for the authenticated candidate with optional filtering capabilities.

### Endpoint
```
GET /candidate-journal
```

### Authentication
- **Type:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer <YOUR_JWT_TOKEN>`

### Query Parameters

| Parameter     | Type       | Required | Default | Validation | Description                                    | Example                        |
|---------------|------------|----------|---------|------------|------------------------------------------------|--------------------------------|
| `page`        | `number`   | No       | `1`     | Min: 1     | Page number for pagination                     | `page=2`                       |
| `limit`       | `number`   | No       | `10`    | Min: 1, Max: 100 | Number of items per page        | `limit=20`                     |
| `actionTypes` | `string[]` | No       | -       | Valid enum values | Array of action types to filter by | `actionTypes[]=connexion&actionTypes[]=mise_à_jour_profil` |
| `startDate`   | `string`   | No       | -       | ISO 8601   | Start date for filtering (inclusive)           | `startDate=2025-01-01T00:00:00Z` |
| `endDate`     | `string`   | No       | -       | ISO 8601   | End date for filtering (inclusive)             | `endDate=2025-12-31T23:59:59Z` |

### Supported Action Types

The following action types are available for filtering (from `CandidateActionType` enum):

| Action Type                    | Description                              |
|--------------------------------|------------------------------------------|
| `mise_à_jour_profil`          | Profile update                           |
| `ajout_expérience`            | Experience added                         |
| `modification_expérience`     | Experience modified                      |
| `suppression_expérience`      | Experience deleted                       |
| `ajout_formation`             | Education added                          |
| `modification_formation`      | Education modified                       |
| `suppression_formation`       | Education deleted                        |
| `ajout_certification`         | Certification added                      |
| `modification_certification`  | Certification modified                   |
| `suppression_certification`   | Certification deleted                    |
| `mise_à_jour_compétences`     | Skills updated                           |
| `envoi_candidature`           | Job application submitted                |
| `retrait_candidature`         | Job application withdrawn                |
| `notification_acceptation`    | Acceptance notification received         |
| `notification_rejet`          | Rejection notification received          |
| `téléchargement_cv`          | CV uploaded                              |
| `entretien_confirmé`         | Interview confirmed                      |
| `connexion`                   | User login                               |
| `déconnexion`                | User logout                              |

---

## Get Activity by ID

Retrieves detailed information about a specific activity by its ID.

### Endpoint
```
GET /candidate-journal/:activityId
```

### Authentication
- **Type:** Bearer Token (JWT)
- **Header:** `Authorization: Bearer <YOUR_JWT_TOKEN>`

### Path Parameters

| Parameter    | Type     | Required | Description                | Example                        |
|--------------|----------|----------|----------------------------|--------------------------------|
| `activityId` | `string` | Yes      | Unique identifier of the activity | `67891b4667d0d8992e610c88` |

### Response

#### Success (200 OK)
Returns a single activity object with detailed information.

```json
{
  "id": "67891b4667d0d8992e610c88",
  "actionType": "envoi_candidature",
  "timestamp": "2025-06-04T17:30:45.123Z",
  "message": "Candidature envoyée pour le poste Développeur Full Stack",
  "details": {
    "jobTitle": "Développeur Full Stack",
    "companyName": "TechCorp SARL",
    "jobId": "67891b4667d0d8992e610c89",
    "applicationId": "67891b4667d0d8992e610c90",
    "ipAddress": "192.168.1.100",
    "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
  },
  "isSystem": false,
  "candidateId": "67891b4667d0d8992e610c87"
}
```

#### Error Responses

- **404 Not Found:** Activity doesn't exist or invalid ID format
  ```json
  {
    "statusCode": 404,
    "message": "Activité non trouvée"
  }
  ```

- **403 Forbidden:** Activity belongs to another candidate
  ```json
  {
    "statusCode": 403,
    "message": "Accès interdit à cette activité"
  }
  ```

### Example Usage

```bash
curl -X GET "http://localhost:3000/candidate-journal/67891b4667d0d8992e610c88" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Response Format

### Success Response (200 OK)

Returns a `PaginatedJournalResponse` object containing the candidate's activity history.

```json
{
  "activities": [
    {
      "id": "67891b4667d0d8992e610c88",
      "actionType": "envoi_candidature",
      "timestamp": "2025-06-04T17:30:45.123Z",
      "message": "Candidature envoyée pour le poste Développeur Full Stack",
      "details": {
        "jobTitle": "Développeur Full Stack",
        "companyName": "TechCorp SARL",
        "jobId": "67891b4667d0d8992e610c89"
      },
      "isSystem": false,
      "candidateId": "67891b4667d0d8992e610c87"
    },
    {
      "id": "67891b4667d0d8992e610c86",
      "actionType": "mise_à_jour_profil",
      "timestamp": "2025-06-04T16:15:32.456Z",
      "message": "Profil mis à jour",
      "details": {
        "updatedFields": ["title", "skills"],
        "previousValues": {
          "title": "Développeur Junior"
        },
        "newValues": {
          "title": "Développeur Full Stack"
        }
      },
      "isSystem": false,
      "candidateId": "67891b4667d0d8992e610c87"
    },
    {
      "id": "67891b4667d0d8992e610c85",
      "actionType": "connexion",
      "timestamp": "2025-06-04T15:00:12.789Z",
      "message": "Connexion réussie",
      "details": {
        "userAgent": "Mozilla/5.0...",
        "method": "email"
      },
      "isSystem": true,
      "candidateId": "67891b4667d0d8992e610c87"
    }
  ],
  "total": 156,
  "page": 1,
  "limit": 10
}
```

### Response Field Descriptions

| Field         | Type      | Description                                    |
|---------------|-----------|------------------------------------------------|
| `activities`  | `array`   | Array of activity objects                      |
| `total`       | `number`  | Total number of activities matching filters    |
| `page`        | `number`  | Current page number                            |
| `limit`       | `number`  | Number of items per page                       |

#### Activity Object Fields

| Field         | Type      | Description                                    |
|---------------|-----------|------------------------------------------------|
| `id`          | `string`  | Unique identifier for the activity            |
| `actionType`  | `string`  | Type of action performed (see enum above)     |
| `timestamp`   | `string`  | ISO 8601 timestamp when action occurred       |
| `message`     | `string`  | Human-readable description of the action      |
| `details`     | `object`  | Additional contextual information              |
| `isSystem`    | `boolean` | Whether the action was system-generated       |
| `candidateId` | `string`  | ID of the candidate (always matches current user) |

---

## Error Responses

### 401 Unauthorized
Returned when authentication fails or token is invalid.

```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

**Common causes:**
- Missing `Authorization` header
- Invalid or expired JWT token
- Token not belonging to a candidate

### 403 Forbidden
Returned when the user doesn't have candidate access.

```json
{
  "statusCode": 403,
  "message": "Accès candidat requis"
}
```

### 400 Bad Request
Returned when query parameters are invalid.

```json
{
  "statusCode": 400,
  "message": [
    "page must not be less than 1",
    "limit must not be greater than 100"
  ],
  "error": "Bad Request"
}
```

---

## Usage Examples

### Basic Request (Get Recent Activities)

```bash
curl -X GET "http://localhost:3000/candidate-journal" \
     -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### Filtered Request (Profile Updates Only)

```bash
curl -X GET "http://localhost:3000/candidate-journal?actionTypes[]=mise_à_jour_profil&limit=20" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Date Range Filter

```bash
curl -X GET "http://localhost:3000/candidate-journal?startDate=2025-06-01T00:00:00Z&endDate=2025-06-04T23:59:59Z" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Multiple Action Types

```bash
curl -X GET "http://localhost:3000/candidate-journal?actionTypes[]=envoi_candidature&actionTypes[]=entretien_confirmé&actionTypes[]=notification_acceptation" \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### JavaScript/Fetch Example

```javascript
const response = await fetch('/candidate-journal?page=1&limit=15', {
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log('Activities:', data.activities);
console.log('Total:', data.total);
```

---

## Implementation Notes

### Automatic Activity Logging

The system automatically logs activities when candidates perform various actions:

- **Profile Updates**: Logged when profile fields are modified
- **Applications**: Logged when applying to jobs or withdrawing applications
- **Authentication**: Login/logout events are automatically tracked
- **File Operations**: CV uploads and updates are logged
- **Interview Actions**: Interview confirmations and scheduling

### Performance Considerations

- Results are paginated with a maximum of 100 items per page
- Activities are sorted by timestamp in descending order (newest first)
- Database indexes are optimized for candidate ID and timestamp queries
- Consider using date ranges for large activity histories

### Data Retention

- Activity logs are retained indefinitely
- System-generated activities (`isSystem: true`) include technical details
- User-generated activities focus on business-relevant information

---

## Related Endpoints

- **Company Journal API**: `/company-journal` (for company activity logs)
- **Candidate Profile**: `/candidate/profile` (for profile management)
- **Job Applications**: `/applications/candidate` (for application management)

For more information about the journal system architecture, see the [Journal Activity Usage Guide](journal_activity_usage_guide.md).