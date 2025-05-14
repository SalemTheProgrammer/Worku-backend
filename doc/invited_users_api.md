# User Invitation System API Documentation

## Overview
The User Invitation System allows company administrators to invite users to their company's workspace. The system handles email invitations, OTP verification, and manages invited users' status.

## Base URL
`/company/invited-users`

## Authentication
All endpoints require JWT authentication:
```
Authorization: Bearer <your-jwt-token>
```

## Endpoints

### 1. Invite User
Invites a new user to join the company.

**Endpoint:** `POST /company/invited-users/invite`

**Authentication:** Required (Company Admin only)

**Request Body:**
```json
{
  "email": "user@example.com",
  "nomDeUtilisateur": "John Doe"
}
```

**Response:**
```json
{
  "message": "Utilisateur invité avec succès",
  "invitedUsers": [
    {
      "email": "user@example.com",
      "nomDeUtilisateur": "John Doe",
      "isAccepted": false
    }
  ]
}
```

### 2. Resend Invitation
Resends invitation email and generates new OTP for an invited user.

**Endpoint:** `POST /company/invited-users/resend-invitation`

**Authentication:** Required (Company Admin only)

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Invitation renvoyée avec succès"
}
```

### 3. List Invited Users
Retrieves all invited users for the company.

**Endpoint:** `GET /company/invited-users`

**Authentication:** Required

**Response:**
```json
{
  "invitedUsers": [
    {
      "email": "user@example.com",
      "nomDeUtilisateur": "John Doe",
      "isAccepted": false
    }
  ]
}
```

### 4. Revoke User Invitation
Removes an invited user's access.

**Endpoint:** `DELETE /company/invited-users/:email`

**Authentication:** Required (Company Admin only)

**Parameters:**
- `email`: Email address of the invited user (URL parameter)

**Response:**
```json
{
  "message": "Utilisateur révoqué avec succès"
}
```

## Invitation Process Flow

1. **Initial Invitation:**
   - Admin sends invitation via API
   - System validates email uniqueness
   - System creates invitation record
   - Two emails are sent:
     1. Welcome email with login instructions
     2. OTP email for verification

2. **Email Communications:**
   - **Welcome Email Contents:**
     - Company branding and logo
     - Personalized welcome message
     - Login instructions
     - Secure login link
     - Company information
   - **OTP Email Contents:**
     - Verification code
     - Security instructions
     - Validity period information

3. **User Access:**
   - User clicks login link
   - Enters email address
   - Receives/enters OTP
   - Gains access to company workspace

4. **Resend Process:**
   - Admin can resend invitation if:
     - Original email failed
     - OTP expired
     - User lost access
   - New OTP is generated
   - Fresh welcome email is sent

## Error Handling

1. **Invitation Errors:**
   - Email already in use (409 Conflict)
   - Invalid email format (400 Bad Request)
   - Permission denied (403 Forbidden)
   - System errors (500 Internal Server Error)

2. **Email Delivery:**
   - Failed deliveries are logged
   - User remains invited despite email failures
   - Admin can view invitation status
   - Resend option available

## Security Considerations

1. **Access Control:**
   - Only company admins can invite/revoke
   - OTP required for first login
   - Invitations can be revoked
   - Email verification required

2. **Rate Limiting:**
   - Invitation requests limited
   - OTP attempts restricted
   - Email resend cooldown

3. **Data Validation:**
   - Email format verification
   - Duplicate prevention
   - Role verification

## Sample Usage

### Inviting a User
```bash
curl -X POST http://localhost:3000/company/invited-users/invite \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "nomDeUtilisateur": "John Doe"
  }'
```

### Resending an Invitation
```bash
curl -X POST http://localhost:3000/company/invited-users/resend-invitation \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com"
  }'
```

### Revoking an Invitation
```bash
curl -X DELETE http://localhost:3000/company/invited-users/user@example.com \
  -H "Authorization: Bearer <your-token>"
```

## Best Practices

1. Always verify email addresses are valid
2. Implement proper error handling
3. Monitor failed email deliveries
4. Regular cleanup of expired invitations
5. Maintain audit logs of invitation actions