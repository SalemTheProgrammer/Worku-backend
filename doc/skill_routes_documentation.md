# Skills Management API Documentation

This document describes the API endpoints for managing candidate skills in the system.

## Base URL
All skills endpoints are prefixed with `/auth/candidate/skills`

## Authentication
All routes require JWT authentication. Include the JWT token in the Authorization header:
```
Authorization: Bearer your-jwt-token
```

## Routes

### 1. Get All Skills
Retrieves all skills grouped by category.

- **URL**: `/auth/candidate/skills`
- **Method**: `GET`
- **Authentication**: Required

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "skills": {
      "Compétences Techniques": [
        {
          "_id": "507f1f77bcf86cd799439011",
          "name": "Angular",
          "category": "Compétences Techniques",
          "level": 4,
          "yearsOfExperience": 2
        },
        {
          "_id": "507f1f77bcf86cd799439012",
          "name": "TypeScript",
          "category": "Compétences Techniques",
          "level": 3,
          "yearsOfExperience": 1
        }
      ],
      "Compétences Interpersonnelles": [
        {
          "_id": "507f1f77bcf86cd799439013",
          "name": "Leadership",
          "category": "Compétences Interpersonnelles",
          "level": 4
        }
      ],
      "Langues": [
        {
          "_id": "507f1f77bcf86cd799439014",
          "name": "Français",
          "category": "Langues",
          "isLanguage": true,
          "proficiencyLevel": "Natif"
        }
      ]
    }
  }
}
```

### 2. Add New Skill
Adds a new skill to the candidate's profile.

- **URL**: `/auth/candidate/skills`
- **Method**: `POST`
- **Authentication**: Required

**Request Body**:
```json
{
  "name": "Angular",
  "category": "Compétences Techniques",
  "level": 4,
  "yearsOfExperience": 2,
  "isLanguage": false
}
```

OR for language skills:
```json
{
  "name": "Français",
  "category": "Langues",
  "isLanguage": true,
  "proficiencyLevel": "Natif"
}
```

**Response Example**:
```json
{
  "statusCode": 201,
  "message": "Success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Angular",
    "category": "Compétences Techniques",
    "level": 4,
    "yearsOfExperience": 2,
    "isLanguage": false
  }
}
```

### 3. Get Specific Skill
Retrieves details of a specific skill.

- **URL**: `/auth/candidate/skills/:id`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**: `id=[string]` skill ID

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Angular",
    "category": "Compétences Techniques",
    "level": 4,
    "yearsOfExperience": 2,
    "isLanguage": false
  }
}
```

### 4. Update Skill
Updates an existing skill.

- **URL**: `/auth/candidate/skills/:id`
- **Method**: `PUT`
- **Authentication**: Required
- **URL Parameters**: `id=[string]` skill ID

**Request Body** (include only fields to update):
```json
{
  "level": 5,
  "yearsOfExperience": 3
}
```

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Success",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Angular",
    "category": "Compétences Techniques",
    "level": 5,
    "yearsOfExperience": 3,
    "isLanguage": false
  }
}
```

### 5. Delete Skill
Deletes a specific skill.

- **URL**: `/auth/candidate/skills/:id`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**: `id=[string]` skill ID

**Response Example**:
```json
{
  "statusCode": 200,
  "message": "Skill deleted successfully"
}
```

## Enums and Constants

### Skill Categories
```typescript
enum SkillCategory {
  TECHNICAL = 'Compétences Techniques',
  INTERPERSONAL = 'Compétences Interpersonnelles',
  LANGUAGE = 'Langues'
}
```

### Language Proficiency Levels
- `"Natif"`
- `"Professionnel"`
- `"Intermédiaire"`
- `"Débutant"`

### Skill Levels
For technical and interpersonal skills:
- Range: 1-5
- 1: Beginner
- 3: Intermediate
- 5: Expert