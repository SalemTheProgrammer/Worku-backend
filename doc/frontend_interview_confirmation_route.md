# Frontend Interview Confirmation Route Documentation

## Overview
This document provides instructions for implementing the interview confirmation route in the frontend application. This route allows candidates to confirm scheduled interviews by clicking on confirmation links received via email.

## Route Implementation

### Route Configuration
Create a new route in your frontend routing system:

```typescript
// Example for Angular Router
{
  path: 'interviews/confirm/:token',
  component: InterviewConfirmationComponent,
  canActivate: [] // No authentication guard needed
}

// Example for React Router
<Route 
  path="/interviews/confirm/:token" 
  component={InterviewConfirmationComponent} 
/>

// Example for Vue Router
{
  path: '/interviews/confirm/:token',
  component: InterviewConfirmationComponent
}
```

### Component Structure

#### Required Parameters
- **Token Parameter**: Extract the confirmation token from the URL parameters
- **No Authentication Required**: This route should be publicly accessible

#### API Integration

**Backend Endpoint**: `GET /interviews/confirm/:token`
- **Method**: GET
- **Authentication**: None required
- **URL**: `http://your-backend-url/interviews/confirm/{token}`

#### Success Response
```json
{
  "message": "Interview confirmed successfully",
  "data": {
    "_id": "interview_id",
    "status": "confirmed",
    "confirmedAt": "2025-05-01T15:00:00.000Z",
    "date": "2025-05-15T00:00:00.000Z",
    "time": "14:30",
    "type": "Video",
    "location": "Office Meeting Room 1",
    "meetingLink": "https://meet.google.com/abc-def-ghi"
  }
}
```

#### Error Responses
```json
// Invalid or expired token
{
  "statusCode": 400,
  "message": "Invalid confirmation token"
}

// Interview not found
{
  "statusCode": 404,
  "message": "Interview not found"
}

// Already confirmed
{
  "statusCode": 400,
  "message": "Interview is no longer pending confirmation"
}
```

## Implementation Examples

### Angular Implementation

```typescript
// interview-confirmation.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

@Component({
  selector: 'app-interview-confirmation',
  templateUrl: './interview-confirmation.component.html',
  styleUrls: ['./interview-confirmation.component.css']
})
export class InterviewConfirmationComponent implements OnInit {
  loading = true;
  success = false;
  error: string | null = null;
  interviewDetails: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit() {
    const token = this.route.snapshot.paramMap.get('token');
    if (token) {
      this.confirmInterview(token);
    } else {
      this.error = 'Invalid confirmation link';
      this.loading = false;
    }
  }

  confirmInterview(token: string) {
    const url = `${environment.apiUrl}/interviews/confirm/${token}`;
    
    this.http.get(url).subscribe({
      next: (response: any) => {
        this.success = true;
        this.interviewDetails = response.data;
        this.loading = false;
      },
      error: (error) => {
        this.error = error.error?.message || 'Failed to confirm interview';
        this.loading = false;
      }
    });
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
```

```html
<!-- interview-confirmation.component.html -->
<div class="confirmation-container">
  <!-- Loading State -->
  <div *ngIf="loading" class="loading">
    <div class="spinner"></div>
    <p>Confirming your interview...</p>
  </div>

  <!-- Success State -->
  <div *ngIf="success && !loading" class="success">
    <div class="success-icon">✓</div>
    <h1>Interview Confirmed Successfully!</h1>
    <p>Thank you for confirming your interview. Here are the details:</p>
    
    <div class="interview-details" *ngIf="interviewDetails">
      <div class="detail-item">
        <strong>Date:</strong> {{ interviewDetails.date | date:'fullDate' }}
      </div>
      <div class="detail-item">
        <strong>Time:</strong> {{ interviewDetails.time }}
      </div>
      <div class="detail-item">
        <strong>Type:</strong> {{ interviewDetails.type }}
      </div>
      <div class="detail-item" *ngIf="interviewDetails.location">
        <strong>Location:</strong> {{ interviewDetails.location }}
      </div>
      <div class="detail-item" *ngIf="interviewDetails.meetingLink">
        <strong>Meeting Link:</strong> 
        <a [href]="interviewDetails.meetingLink" target="_blank">
          {{ interviewDetails.meetingLink }}
        </a>
      </div>
    </div>

    <div class="actions">
      <button (click)="goToHome()" class="btn btn-primary">
        Go to Homepage
      </button>
    </div>
  </div>

  <!-- Error State -->
  <div *ngIf="error && !loading" class="error">
    <div class="error-icon">❌</div>
    <h1>Confirmation Failed</h1>
    <p>{{ error }}</p>
    
    <div class="actions">
      <button (click)="goToHome()" class="btn btn-secondary">
        Go to Homepage
      </button>
    </div>
  </div>
</div>
```

### React Implementation

```typescript
// InterviewConfirmation.tsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

interface InterviewDetails {
  _id: string;
  status: string;
  confirmedAt: string;
  date: string;
  time: string;
  type: string;
  location?: string;
  meetingLink?: string;
}

const InterviewConfirmation: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [interviewDetails, setInterviewDetails] = useState<InterviewDetails | null>(null);

  useEffect(() => {
    if (token) {
      confirmInterview(token);
    } else {
      setError('Invalid confirmation link');
      setLoading(false);
    }
  }, [token]);

  const confirmInterview = async (token: string) => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/interviews/confirm/${token}`
      );
      
      setSuccess(true);
      setInterviewDetails(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to confirm interview');
    } finally {
      setLoading(false);
    }
  };

  const goToHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="confirmation-container">
        <div className="loading">
          <div className="spinner" />
          <p>Confirming your interview...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="confirmation-container">
        <div className="success">
          <div className="success-icon">✓</div>
          <h1>Interview Confirmed Successfully!</h1>
          <p>Thank you for confirming your interview. Here are the details:</p>
          
          {interviewDetails && (
            <div className="interview-details">
              <div className="detail-item">
                <strong>Date:</strong> {new Date(interviewDetails.date).toLocaleDateString()}
              </div>
              <div className="detail-item">
                <strong>Time:</strong> {interviewDetails.time}
              </div>
              <div className="detail-item">
                <strong>Type:</strong> {interviewDetails.type}
              </div>
              {interviewDetails.location && (
                <div className="detail-item">
                  <strong>Location:</strong> {interviewDetails.location}
                </div>
              )}
              {interviewDetails.meetingLink && (
                <div className="detail-item">
                  <strong>Meeting Link:</strong>{' '}
                  <a href={interviewDetails.meetingLink} target="_blank" rel="noopener noreferrer">
                    {interviewDetails.meetingLink}
                  </a>
                </div>
              )}
            </div>
          )}

          <div className="actions">
            <button onClick={goToHome} className="btn btn-primary">
              Go to Homepage
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-container">
      <div className="error">
        <div className="error-icon">❌</div>
        <h1>Confirmation Failed</h1>
        <p>{error}</p>
        
        <div className="actions">
          <button onClick={goToHome} className="btn btn-secondary">
            Go to Homepage
          </button>
        </div>
      </div>
    </div>
  );
};

export default InterviewConfirmation;
```

### Vue.js Implementation

```vue
<!-- InterviewConfirmation.vue -->
<template>
  <div class="confirmation-container">
    <!-- Loading State -->
    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Confirming your interview...</p>
    </div>

    <!-- Success State -->
    <div v-else-if="success" class="success">
      <div class="success-icon">✓</div>
      <h1>Interview Confirmed Successfully!</h1>
      <p>Thank you for confirming your interview. Here are the details:</p>
      
      <div v-if="interviewDetails" class="interview-details">
        <div class="detail-item">
          <strong>Date:</strong> {{ formatDate(interviewDetails.date) }}
        </div>
        <div class="detail-item">
          <strong>Time:</strong> {{ interviewDetails.time }}
        </div>
        <div class="detail-item">
          <strong>Type:</strong> {{ interviewDetails.type }}
        </div>
        <div v-if="interviewDetails.location" class="detail-item">
          <strong>Location:</strong> {{ interviewDetails.location }}
        </div>
        <div v-if="interviewDetails.meetingLink" class="detail-item">
          <strong>Meeting Link:</strong>
          <a :href="interviewDetails.meetingLink" target="_blank">
            {{ interviewDetails.meetingLink }}
          </a>
        </div>
      </div>

      <div class="actions">
        <button @click="goToHome" class="btn btn-primary">
          Go to Homepage
        </button>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error">
      <div class="error-icon">❌</div>
      <h1>Confirmation Failed</h1>
      <p>{{ error }}</p>
      
      <div class="actions">
        <button @click="goToHome" class="btn btn-secondary">
          Go to Homepage
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'InterviewConfirmation',
  data() {
    return {
      loading: true,
      success: false,
      error: null,
      interviewDetails: null
    };
  },
  mounted() {
    const token = this.$route.params.token;
    if (token) {
      this.confirmInterview(token);
    } else {
      this.error = 'Invalid confirmation link';
      this.loading = false;
    }
  },
  methods: {
    async confirmInterview(token) {
      try {
        const response = await axios.get(
          `${process.env.VUE_APP_API_URL}/interviews/confirm/${token}`
        );
        
        this.success = true;
        this.interviewDetails = response.data.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to confirm interview';
      } finally {
        this.loading = false;
      }
    },
    formatDate(dateString) {
      return new Date(dateString).toLocaleDateString();
    },
    goToHome() {
      this.$router.push('/');
    }
  }
};
</script>
```

## CSS Styling

```css
/* interview-confirmation.css */
.confirmation-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f5f5;
}

.loading, .success, .error {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  text-align: center;
  max-width: 500px;
  width: 100%;
}

.spinner {
  border: 4px solid #f3f3f3;
  border-top: 4px solid #007bff;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  animation: spin 1s linear infinite;
  margin: 0 auto 20px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.success-icon, .error-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.success-icon {
  color: #28a745;
}

.error-icon {
  color: #dc3545;
}

.success h1 {
  color: #28a745;
  margin-bottom: 20px;
}

.error h1 {
  color: #dc3545;
  margin-bottom: 20px;
}

.interview-details {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 20px;
  margin: 20px 0;
  text-align: left;
}

.detail-item {
  margin-bottom: 10px;
  padding: 8px 0;
  border-bottom: 1px solid #e9ecef;
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item strong {
  color: #495057;
  margin-right: 10px;
}

.detail-item a {
  color: #007bff;
  text-decoration: none;
}

.detail-item a:hover {
  text-decoration: underline;
}

.actions {
  margin-top: 30px;
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
  text-decoration: none;
  display: inline-block;
  transition: background-color 0.3s;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover {
  background-color: #545b62;
}

@media (max-width: 768px) {
  .confirmation-container {
    padding: 10px;
  }
  
  .loading, .success, .error {
    padding: 20px;
  }
  
  .success-icon, .error-icon {
    font-size: 40px;
  }
}
```

## Environment Configuration

Make sure to set up your environment variables:

### Angular (environment.ts)
```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000'
};
```

### React (.env)
```bash
REACT_APP_API_URL=http://localhost:3000
```

### Vue.js (.env)
```bash
VUE_APP_API_URL=http://localhost:3000
```

## Key Features

1. **No Authentication Required**: The route is publicly accessible
2. **Automatic Confirmation**: Makes API call immediately when component loads
3. **Three States**: Loading, Success, and Error states with appropriate UI
4. **Interview Details Display**: Shows all relevant interview information after confirmation
5. **Error Handling**: Comprehensive error handling with user-friendly messages
6. **Responsive Design**: Works on both desktop and mobile devices
7. **Meeting Link Handling**: Properly displays video call links when applicable

## Testing

Test the route with these scenarios:

1. **Valid Token**: Use a valid confirmation token from an email
2. **Invalid Token**: Test with malformed or expired tokens
3. **Already Confirmed**: Test with a token for an already confirmed interview
4. **Network Error**: Test with backend server down
5. **Missing Token**: Access the route without a token parameter

## Notes

- The confirmation token is base64 encoded interview ID
- No user authentication is required for this endpoint
- The backend automatically updates both interview and application status
- Email confirmation links expire when interview status changes
- Consider adding analytics tracking for confirmation success rates