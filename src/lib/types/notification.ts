export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: Date;
  courseId?: string;
  courseTitle?: string;
  isSystemWide?: boolean;
  category?: SystemAnnouncementCategory;
}

export enum NotificationType {
  COURSE_CREATED = 'COURSE_CREATED',
  COURSE_UPDATED = 'COURSE_UPDATED',
  COURSE_DELETED = 'COURSE_DELETED',
  COURSE_LIKED = 'COURSE_LIKED',
  COURSE_REVIEWED = 'COURSE_REVIEWED',
  PROFILE_UPDATE = 'PROFILE_UPDATE',
  SYSTEM = 'SYSTEM',
  SYSTEM_ANNOUNCEMENT = 'SYSTEM_ANNOUNCEMENT',
  PASSWORD_CHANGE = 'PASSWORD_CHANGE',
  GENERAL = 'GENERAL'
}

export enum SystemAnnouncementCategory {
  NEW_FEATURES = 'NEW_FEATURES',
  TIPS = 'TIPS',
  MAINTENANCE = 'MAINTENANCE',
  UPDATES = 'UPDATES'
} 