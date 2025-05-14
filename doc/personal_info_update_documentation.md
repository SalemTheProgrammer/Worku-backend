# Candidate Personal Information Update Documentation

## API Endpoint
`PUT /auth/candidate/profile/personal-info`

## Authentication
- Requires JWT authentication token in Authorization header
- Token must have candidate role

## Request Body (UpdatePersonalInfoDto)
```typescript
{
  firstName?: string; // First name of candidate
  lastName?: string; // Last name of candidate
  employmentStatus?: EmploymentStatus; // Employment status enum
  availabilityDate?: Date; // Date when available to start work
  phone?: string; // Phone number
  remoteWork?: boolean; // Available for remote work
  location?: {
    country?: string;
    city?: string;
  }
}
```

## Employment Status Values
- `Looking for a job`
- `Open to new opportunities` 
- `Looking for an internship`
- `Exploring options`
- `Currently employed`
- `Currently unemployed`

## Example Request
```json
{
  "firstName": "Salem",
  "lastName": "Mohamdi",
  "professionalStatus": "employe",
  "employmentStatus": "Currently employed",
  "phone": "+21658419875",
  "remoteWork": true,
  "location": {
    "country": "Tunisia",
    "city": "Tunis"
  }
}
```

## Response
```json
{
  "message": "Personal information updated successfully",
  "data": {
    // Updated profile data
  }
}
```

## Error Responses
- 400 Bad Request - Invalid input data
- 401 Unauthorized - Invalid token
- 404 Not Found - Profile not found

## Notes
- All fields are optional - only provided fields will be updated
- Date format should be YYYY-MM-DD
- Phone numbers should include country code
- Location updates require both country and city if provided