# Real-Time Notification System with WebSockets

## Overview

This document describes the comprehensive real-time notification system built with WebSockets for the Worku hiring platform. The system provides instant notifications to companies when candidates apply to their jobs, with seen/unseen functionality and notification badges.

## Features

- ✅ Real-time notifications via WebSockets
- ✅ Notification badges with unread counts
- ✅ Mark as read/unread functionality  
- ✅ Persistent notification storage in MongoDB
- ✅ REST API endpoints for notification management
- ✅ Authentication and authorization
- ✅ CORS support for multiple frontends
- ✅ Automatic notification on job applications

## Architecture

### Components

1. **NotificationsGateway** - WebSocket server for real-time communication
2. **NotificationsService** - Business logic for notification management
3. **NotificationsController** - REST API endpoints
4. **Notification Schema** - MongoDB document structure
5. **DTOs** - Data transfer objects for type safety

### Database Schema

```typescript
interface Notification {
  companyId: ObjectId;           // Company receiving the notification
  jobId?: ObjectId;              // Related job (optional)
  candidateId?: ObjectId;        // Related candidate (optional)  
  applicationId?: ObjectId;      // Related application (optional)
  type: NotificationType;        // Type of notification
  title: string;                 // Notification title
  message: string;               // Notification message
  status: NotificationStatus;    // READ/UNREAD
  metadata: Record<string, any>; // Additional data
  createdAt: Date;
  updatedAt: Date;
  readAt?: Date;                 // When marked as read
}
```

## Configuration

### Environment Variables

Add these to your `.env` file:

```env
# CORS Configuration - includes SSR Frontend
CORS_ALLOWED_ORIGINS=http://localhost:4200,http://localhost:4000
SSR_FRONTEND_URL=http://localhost:4000
```

### CORS Support

The system supports:
- **http://localhost:4200** - Angular Frontend
- **http://localhost:4000** - SSR Frontend
- Production domains (configurable)

## WebSocket Usage

### Client Connection

```typescript
import { io, Socket } from 'socket.io-client';

// Connect to notifications namespace
const socket: Socket = io('http://localhost:3000/notifications', {
  auth: {
    token: 'Bearer your-jwt-token' // Company JWT token
  }
});

// Connection events
socket.on('connected', (data) => {
  console.log('Connected to notifications:', data.message);
});

socket.on('error', (error) => {
  console.error('WebSocket error:', error);
});
```

### Real-time Events

#### Receiving New Notifications

```typescript
socket.on('newNotification', (notification) => {
  console.log('New notification received:', notification);
  
  // Update UI - show notification
  showNotificationToast(notification);
  
  // Update badge count
  updateNotificationBadge();
});
```

#### Badge Count Updates

```typescript
socket.on('badgeCountUpdated', (data) => {
  console.log('Unread count:', data.unreadCount);
  
  // Update badge in UI
  document.getElementById('notification-badge').textContent = data.unreadCount;
});
```

#### Notification Status Changes

```typescript
socket.on('notificationStatusChanged', (data) => {
  console.log('Notification status changed:', data);
  
  // Update specific notification in UI
  updateNotificationStatus(data.notificationId, data.status);
});
```

### Client Actions

#### Mark Notification as Read

```typescript
socket.emit('markAsRead', { 
  notificationId: 'notification-id' 
});

socket.on('notificationRead', (data) => {
  console.log('Notification marked as read:', data.notificationId);
});
```

#### Join Company Room

```typescript
socket.emit('joinCompanyRoom', { 
  companyId: 'company-id' 
});

socket.on('joinedRoom', (data) => {
  console.log('Joined room:', data.room);
});
```

#### Get Online Status

```typescript
socket.emit('getOnlineStatus');

socket.on('onlineStatus', (data) => {
  console.log('Online status:', data);
});
```

## REST API Endpoints

### Base URL: `/notifications`

All endpoints require JWT authentication with company role (ADMIN, MANAGER, or RECRUITER).

### GET /notifications

Get paginated notifications for the authenticated company.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (READ/UNREAD)
- `type` (optional): Filter by notification type
- `fromDate` (optional): Filter from date (ISO string)
- `toDate` (optional): Filter to date (ISO string)

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "companyId": "company-id",
      "jobId": "job-id",
      "candidateId": "candidate-id",
      "type": "NEW_APPLICATION",
      "title": "New Job Application",
      "message": "John Doe has applied for the position Software Developer",
      "status": "UNREAD",
      "metadata": {
        "candidateName": "John Doe",
        "jobTitle": "Software Developer"
      },
      "createdAt": "2025-01-07T10:30:00Z",
      "job": {
        "title": "Software Developer",
        "location": "Paris, France"
      },
      "candidate": {
        "firstName": "John",
        "lastName": "Doe",
        "email": "john.doe@example.com"
      }
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 20,
  "totalPages": 3
}
```

### GET /notifications/counts

Get notification counts and badge data.

**Response:**
```json
{
  "unreadCount": 5,
  "countByType": {
    "NEW_APPLICATION": 3,
    "APPLICATION_STATUS_CHANGE": 1,
    "INTERVIEW_SCHEDULED": 1,
    "INTERVIEW_CONFIRMED": 0,
    "INTERVIEW_CANCELLED": 0,
    "MESSAGE_RECEIVED": 0
  }
}
```

### GET /notifications/:id

Get a specific notification by ID.

**Response:**
```json
{
  "id": "notification-id",
  "companyId": "company-id",
  "type": "NEW_APPLICATION",
  "title": "New Job Application",
  "message": "John Doe has applied for the position Software Developer",
  "status": "UNREAD",
  "createdAt": "2025-01-07T10:30:00Z"
}
```

### PUT /notifications/:id/status

Update notification status (mark as read/unread).

**Request Body:**
```json
{
  "status": "READ"
}
```

**Response:**
```json
{
  "id": "notification-id",
  "status": "READ",
  "readAt": "2025-01-07T10:35:00Z"
}
```

### PUT /notifications/mark-all-read

Mark all notifications as read for the authenticated company.

**Response:**
```json
{
  "updatedCount": 5
}
```

### DELETE /notifications/:id

Delete a specific notification.

**Response:** 204 No Content

## Notification Types

```typescript
enum NotificationType {
  NEW_APPLICATION = 'NEW_APPLICATION',
  APPLICATION_STATUS_CHANGE = 'APPLICATION_STATUS_CHANGE', 
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED'
}
```

## Frontend Integration Example

### React/Next.js Component

```typescript
import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  title: string;
  message: string;
  status: 'READ' | 'UNREAD';
  createdAt: string;
}

export function NotificationSystem() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io('http://localhost:3000/notifications', {
      auth: {
        token: `Bearer ${getAuthToken()}`
      }
    });

    // Event listeners
    newSocket.on('connected', (data) => {
      console.log('Connected:', data.message);
    });

    newSocket.on('newNotification', (notification) => {
      setNotifications(prev => [notification, ...prev]);
      setUnreadCount(prev => prev + 1);
      
      // Show toast notification
      showToast(notification.title, notification.message);
    });

    newSocket.on('badgeCountUpdated', (data) => {
      setUnreadCount(data.unreadCount);
    });

    setSocket(newSocket);

    // Cleanup
    return () => {
      newSocket.close();
    };
  }, []);

  const markAsRead = (notificationId: string) => {
    if (socket) {
      socket.emit('markAsRead', { notificationId });
    }
    
    // Also update via REST API
    fetch(`/api/notifications/${notificationId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${getAuthToken()}`
      },
      body: JSON.stringify({ status: 'READ' })
    });
  };

  return (
    <div className="notification-system">
      <div className="notification-bell">
        🔔
        {unreadCount > 0 && (
          <span className="badge">{unreadCount}</span>
        )}
      </div>
      
      <div className="notification-list">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`notification ${notification.status.toLowerCase()}`}
            onClick={() => markAsRead(notification.id)}
          >
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <small>{new Date(notification.createdAt).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Vue.js Component

```vue
<template>
  <div class="notification-system">
    <div class="notification-bell" @click="toggleNotifications">
      🔔
      <span v-if="unreadCount > 0" class="badge">{{ unreadCount }}</span>
    </div>
    
    <div v-if="showNotifications" class="notification-dropdown">
      <div v-for="notification in notifications" :key="notification.id" 
           :class="['notification', notification.status.toLowerCase()]"
           @click="markAsRead(notification.id)">
        <h4>{{ notification.title }}</h4>
        <p>{{ notification.message }}</p>
        <small>{{ formatDate(notification.createdAt) }}</small>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { io } from 'socket.io-client';

const socket = ref(null);
const notifications = ref([]);
const unreadCount = ref(0);
const showNotifications = ref(false);

onMounted(() => {
  // Initialize WebSocket
  socket.value = io('http://localhost:3000/notifications', {
    auth: {
      token: `Bearer ${getAuthToken()}`
    }
  });

  socket.value.on('newNotification', (notification) => {
    notifications.value.unshift(notification);
    unreadCount.value++;
  });

  socket.value.on('badgeCountUpdated', (data) => {
    unreadCount.value = data.unreadCount;
  });
});

onUnmounted(() => {
  if (socket.value) {
    socket.value.close();
  }
});

const markAsRead = (notificationId) => {
  socket.value.emit('markAsRead', { notificationId });
};

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
};
</script>
```

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Authorization**: Only company users (ADMIN, MANAGER, RECRUITER) can access notifications
3. **CORS**: Properly configured for specific frontend origins
4. **Rate Limiting**: Applied to REST API endpoints
5. **Input Validation**: All DTOs validated with class-validator

## Performance Optimizations

1. **MongoDB Indexing**: Optimized queries with compound indexes
2. **Pagination**: Large notification lists are paginated
3. **Real-time Updates**: Only connected clients receive notifications
4. **Efficient Queries**: Populate only necessary fields

## Testing

### Unit Tests

Run the notification system tests:

```bash
npm test -- --testPathPattern=notifications
```

### Integration Testing

Test WebSocket connections:

```bash
npm run test:e2e -- --testPathPattern=notifications
```

### Manual Testing

Use the provided test files:

```bash
node test/candidate-registration.test.js
```

## Troubleshooting

### Common Issues

1. **WebSocket Connection Failed**
   - Check JWT token validity
   - Verify CORS configuration
   - Ensure user has company role

2. **Notifications Not Received**
   - Check if client is connected to correct namespace
   - Verify company ID matches
   - Check server logs for errors

3. **Badge Count Incorrect**
   - Refresh notification counts via REST API
   - Check for race conditions in client code

### Debug Mode

Enable debug logging:

```env
LOG_LEVEL=debug
```

## Deployment

### Production Configuration

Update environment variables for production:

```env
CORS_ALLOWED_ORIGINS=https://your-frontend.com,https://your-ssr.com
SSR_FRONTEND_URL=https://your-ssr.com
```

### Docker Support

The notification system works with the existing Docker configuration.

## Contributing

When adding new notification types:

1. Update `NotificationType` enum
2. Add corresponding business logic in services
3. Update frontend components
4. Add tests
5. Update documentation

## API Documentation

Full API documentation is available at `/api` when running in development mode.