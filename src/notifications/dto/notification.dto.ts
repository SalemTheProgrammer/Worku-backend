import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsMongoId, IsString, IsObject, IsDateString } from 'class-validator';
import { NotificationType, NotificationStatus } from '../../schemas/notification.schema';

export class CreateNotificationDto {
  @ApiProperty({ description: 'Company ID that will receive the notification' })
  @IsMongoId()
  companyId: string;

  @ApiProperty({ description: 'Job ID (optional)', required: false })
  @IsOptional()
  @IsMongoId()
  jobId?: string;

  @ApiProperty({ description: 'Candidate ID (optional)', required: false })
  @IsOptional()
  @IsMongoId()
  candidateId?: string;

  @ApiProperty({ description: 'Application ID (optional)', required: false })
  @IsOptional()
  @IsMongoId()
  applicationId?: string;

  @ApiProperty({ enum: NotificationType, description: 'Type of notification' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  @IsString()
  title: string;

  @ApiProperty({ description: 'Notification message' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Additional metadata', required: false })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class UpdateNotificationStatusDto {
  @ApiProperty({ enum: NotificationStatus, description: 'New notification status' })
  @IsEnum(NotificationStatus)
  status: NotificationStatus;
}

export class GetNotificationsQueryDto {
  @ApiProperty({ description: 'Page number', required: false, default: 1 })
  @IsOptional()
  page?: number = 1;

  @ApiProperty({ description: 'Items per page', required: false, default: 20 })
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ enum: NotificationStatus, description: 'Filter by status', required: false })
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;

  @ApiProperty({ enum: NotificationType, description: 'Filter by type', required: false })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @ApiProperty({ description: 'Filter from date', required: false })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiProperty({ description: 'Filter to date', required: false })
  @IsOptional()
  @IsDateString()
  toDate?: string;
}

export class NotificationResponseDto {
  @ApiProperty({ description: 'Notification ID' })
  id: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Job ID', required: false })
  jobId?: string;

  @ApiProperty({ description: 'Candidate ID', required: false })
  candidateId?: string;

  @ApiProperty({ description: 'Application ID', required: false })
  applicationId?: string;

  @ApiProperty({ enum: NotificationType, description: 'Notification type' })
  type: NotificationType;

  @ApiProperty({ description: 'Notification title' })
  title: string;

  @ApiProperty({ description: 'Notification message' })
  message: string;

  @ApiProperty({ enum: NotificationStatus, description: 'Notification status' })
  status: NotificationStatus;

  @ApiProperty({ description: 'Additional metadata' })
  metadata: Record<string, any>;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Update date' })
  updatedAt: Date;

  @ApiProperty({ description: 'Read date', required: false })
  readAt?: Date;

  // Populated fields
  @ApiProperty({ description: 'Job details', required: false })
  job?: {
    title: string;
    location: string;
  };

  @ApiProperty({ description: 'Candidate details', required: false })
  candidate?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export class NotificationCountDto {
  @ApiProperty({ description: 'Total unread notifications count' })
  unreadCount: number;

  @ApiProperty({ description: 'Count by notification type' })
  countByType: Record<NotificationType, number>;
}