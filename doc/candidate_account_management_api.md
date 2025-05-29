# Candidate Account Management API

This document describes the endpoints for managing candidate accounts, including password reset and account deletion functionality.

## Password Reset

### Request Password Reset

Sends a password reset link to the candidate's email address.

```http
POST /auth/candidate/request-password-reset
```

#### Request Body
```json
{
  "email": "string"
}
```

#### Response
- **200 OK**
```json
{
  "message": "Password reset email sent successfully"
}
```

- **400 Bad Request**
```json
{
  "message": "No account found with this email"
}
```

### Reset Password

Resets the candidate's password using the token received via email.

```http
POST /auth/candidate/reset-password
```

#### Request Body
```json
{
  "token": "string",
  "newPassword": "string"
}
```

#### Response
- **200 OK**
```json
{
  "message": "Password reset successfully"
}
```

- **401 Unauthorized**
```json
{
  "message": "Invalid or expired reset token"
}
```

## Account Deletion

Permanently deletes the candidate's account and associated data.

```http
DELETE /auth/candidate/delete-account
```

#### Headers
```
Authorization: Bearer <access_token>
```

#### Response
- **200 OK**
```json
{
  "message": "Account deleted successfully"
}
```

- **401 Unauthorized**
```json
{
  "message": "Unauthorized"
}
```

- **404 Not Found**
```json
{
  "message": "Candidate not found"
}
```

## Example Usage

### Request Password Reset

```bash
curl -X POST http://localhost:3000/auth/candidate/request-password-reset \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Reset Password

```bash
curl -X POST http://localhost:3000/auth/candidate/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "newPassword": "newSecurePassword123"
  }'
```

### Delete Account

```bash
curl -X DELETE http://localhost:3000/auth/candidate/delete-account \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

## Notes

- The password reset token expires after 1 hour
- The password reset link format: `http://localhost:4200/reset-password?token=<token>`
- Account deletion is irreversible and removes all associated data
- The reset password endpoint requires a password of at least 8 characters
- All endpoints return errors in a consistent format with appropriate HTTP status codes