# Youversity Notification System Documentation

## Overview
The Youversity notification system provides a flexible way to send various types of notifications to users, including system-wide announcements, course-related notifications, and personalized messages.

## Notification Types

### 1. System Announcements
System-wide notifications that reach all users. Categories include:
- `NEW_FEATURES`: Announce new platform features
- `TIPS`: Share tips and best practices
- `MAINTENANCE`: System maintenance notifications
- `UPDATES`: General platform updates

### 2. Course-Related Notifications
- `COURSE_CREATED`: When a new course is created
- `COURSE_UPDATED`: When a course is updated
- `COURSE_DELETED`: When a course is deleted
- `COURSE_LIKED`: When someone likes a course
- `COURSE_REVIEWED`: When someone reviews a course

### 3. User-Specific Notifications
- `PROFILE_UPDATE`: Profile-related notifications
- `PASSWORD_CHANGE`: Security-related notifications
- `GENERAL`: General user notifications (e.g., welcome messages)

## Sending Notifications

### 1. System-wide Announcements
```typescript
// Send feature announcement
await NotificationService.announceNewFeature(
  "New Features Available",
  "Explore our latest features!"
);

// Send tips
await NotificationService.sendTip(
  "Pro Tip",
  "Here's a helpful tip..."
);

// Send maintenance notice
await NotificationService.announceMaintenance(
  "Scheduled Maintenance",
  "System maintenance details..."
);

// Send general updates
await NotificationService.sendUpdate(
  "Platform Update",
  "We've made some improvements..."
);
```

### 2. Deployment Announcements
To send announcements after a new deployment:

1. Update the version in `deploymentAnnouncements.ts`:
```typescript
private static readonly CURRENT_VERSION = '1.0.1'; // Update this
```

2. Modify the announcements in `sendDeploymentAnnouncements()`:
```typescript
private static async sendDeploymentAnnouncements() {
  await NotificationService.announceNewFeature(
    'Title',
    'Your announcement message'
  );
}
```

3. Call the check function when your app initializes:
```typescript
await DeploymentAnnouncements.checkAndSendDeploymentAnnouncements();
```

### 3. Individual User Notifications
```typescript
// Send welcome notification
await NotificationService.createWelcomeNotification(userId);

// Send first course notification
await NotificationService.createFirstCourseNotification(userId);

// Send custom notification
await NotificationService.createNotification({
  userId,
  title: "Custom Notification",
  message: "Your message here",
  type: NotificationType.GENERAL,
  isRead: false,
  createdAt: new Date()
});
```

## Handling Notifications

### 1. Subscribing to Notifications
```typescript
const unsubscribe = NotificationService.subscribeToUserNotifications(
  userId,
  (notifications) => {
    // Handle updated notifications
  }
);

// Don't forget to unsubscribe when done
onDestroy(() => {
  if (unsubscribe) unsubscribe();
});
```

### 2. Marking Notifications as Read
```typescript
await NotificationService.markAsRead(notificationId);
```

### 3. Fetching User Notifications
```typescript
const notifications = await NotificationService.getUserNotifications(userId);
```

## Best Practices

1. **Version Control**: Always update the `CURRENT_VERSION` in `DeploymentAnnouncements` when sending new deployment announcements.

2. **Batch Processing**: System-wide announcements are automatically batched for performance.

3. **Error Handling**: All notification methods include error handling and logging.

4. **Cleanup**: Always unsubscribe from notification listeners when components are destroyed.

5. **Testing**: Test notifications in a development environment before sending to all users.

## Security Rules
Notifications are protected by Firestore security rules:
- Users can only read their own notifications
- System announcements require special privileges to send
- Users can mark their notifications as read
- Users cannot delete system announcements 