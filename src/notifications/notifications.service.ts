import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification, NotificationDocument, NotificationType, NotificationStatus } from '../schemas/notification.schema';
import { CreateNotificationDto, UpdateNotificationStatusDto, GetNotificationsQueryDto, NotificationResponseDto, NotificationCountDto } from './dto/notification.dto';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name) private notificationModel: Model<NotificationDocument>,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<NotificationResponseDto> {
    try {
      const notification = new this.notificationModel({
        ...createNotificationDto,
        companyId: new Types.ObjectId(createNotificationDto.companyId),
        jobId: createNotificationDto.jobId ? new Types.ObjectId(createNotificationDto.jobId) : undefined,
        candidateId: createNotificationDto.candidateId ? new Types.ObjectId(createNotificationDto.candidateId) : undefined,
        applicationId: createNotificationDto.applicationId ? new Types.ObjectId(createNotificationDto.applicationId) : undefined,
      });

      const savedNotification = await notification.save();
      
      // Populate related data for the response
      const populatedNotification = await this.notificationModel
        .findById(savedNotification._id)
        .populate('jobId', 'title location')
        .populate('candidateId', 'firstName lastName email')
        .lean();

      const responseDto = this.mapToResponseDto(populatedNotification);

      // Send real-time notification to the company
      this.notificationsGateway.sendNotificationToCompany(createNotificationDto.companyId, responseDto);

      // Update badge count
      const unreadCount = await this.getUnreadCount(createNotificationDto.companyId);
      this.notificationsGateway.sendBadgeCountUpdate(createNotificationDto.companyId, unreadCount);

      this.logger.log(`Created notification for company ${createNotificationDto.companyId}: ${createNotificationDto.type}`);

      return responseDto;
    } catch (error) {
      this.logger.error(`Failed to create notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getNotifications(companyId: string, query: GetNotificationsQueryDto): Promise<{
    notifications: NotificationResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 20, status, type, fromDate, toDate } = query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter: any = { companyId: new Types.ObjectId(companyId) };
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (fromDate || toDate) {
      filter.createdAt = {};
      if (fromDate) {
        filter.createdAt.$gte = new Date(fromDate);
      }
      if (toDate) {
        filter.createdAt.$lte = new Date(toDate);
      }
    }

    const [notifications, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .populate('jobId', 'title location')
        .populate('candidateId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.notificationModel.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      notifications: notifications.map(notification => this.mapToResponseDto(notification)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  async getNotificationById(notificationId: string, companyId: string): Promise<NotificationResponseDto> {
    const notification = await this.notificationModel
      .findOne({ 
        _id: new Types.ObjectId(notificationId), 
        companyId: new Types.ObjectId(companyId) 
      })
      .populate('jobId', 'title location')
      .populate('candidateId', 'firstName lastName email')
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    return this.mapToResponseDto(notification);
  }

  async updateNotificationStatus(notificationId: string, companyId: string, updateDto: UpdateNotificationStatusDto): Promise<NotificationResponseDto> {
    const updateData: any = { 
      status: updateDto.status,
      updatedAt: new Date()
    };

    if (updateDto.status === NotificationStatus.READ) {
      updateData.readAt = new Date();
    }

    const notification = await this.notificationModel
      .findOneAndUpdate(
        { 
          _id: new Types.ObjectId(notificationId), 
          companyId: new Types.ObjectId(companyId) 
        },
        updateData,
        { new: true }
      )
      .populate('jobId', 'title location')
      .populate('candidateId', 'firstName lastName email')
      .lean();

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    // Send real-time status update
    this.notificationsGateway.sendNotificationStatusUpdate(companyId, notificationId, updateDto.status);

    // Update badge count if marked as read
    if (updateDto.status === NotificationStatus.READ) {
      const unreadCount = await this.getUnreadCount(companyId);
      this.notificationsGateway.sendBadgeCountUpdate(companyId, unreadCount);
    }

    this.logger.log(`Updated notification ${notificationId} status to ${updateDto.status} for company ${companyId}`);

    return this.mapToResponseDto(notification);
  }

  async markAllAsRead(companyId: string): Promise<{ updatedCount: number }> {
    const result = await this.notificationModel.updateMany(
      { 
        companyId: new Types.ObjectId(companyId),
        status: NotificationStatus.UNREAD
      },
      { 
        status: NotificationStatus.READ,
        readAt: new Date(),
        updatedAt: new Date()
      }
    );

    // Send real-time badge count update
    this.notificationsGateway.sendBadgeCountUpdate(companyId, 0);

    this.logger.log(`Marked ${result.modifiedCount} notifications as read for company ${companyId}`);

    return { updatedCount: result.modifiedCount };
  }

  async getNotificationCounts(companyId: string): Promise<NotificationCountDto> {
    const [unreadCount, countsByType] = await Promise.all([
      this.notificationModel.countDocuments({
        companyId: new Types.ObjectId(companyId),
        status: NotificationStatus.UNREAD
      }),
      this.notificationModel.aggregate([
        { $match: { companyId: new Types.ObjectId(companyId), status: NotificationStatus.UNREAD } },
        { $group: { _id: '$type', count: { $sum: 1 } } }
      ])
    ]);

    const countByType: Record<NotificationType, number> = {} as any;
    
    // Initialize all types to 0
    Object.values(NotificationType).forEach(type => {
      countByType[type] = 0;
    });

    // Set actual counts
    countsByType.forEach(item => {
      countByType[item._id] = item.count;
    });

    return {
      unreadCount,
      countByType
    };
  }

  async deleteNotification(notificationId: string, companyId: string): Promise<void> {
    const result = await this.notificationModel.deleteOne({
      _id: new Types.ObjectId(notificationId),
      companyId: new Types.ObjectId(companyId)
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException('Notification not found');
    }

    // Update badge count
    const unreadCount = await this.getUnreadCount(companyId);
    this.notificationsGateway.sendBadgeCountUpdate(companyId, unreadCount);

    this.logger.log(`Deleted notification ${notificationId} for company ${companyId}`);
  }

  async getUnreadCount(companyId: string): Promise<number> {
    return this.notificationModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      status: NotificationStatus.UNREAD
    });
  }

  // Helper method to create application notification
  async createApplicationNotification(
    companyId: string,
    jobId: string,
    candidateId: string,
    applicationId: string,
    candidateName: string,
    jobTitle: string
  ): Promise<NotificationResponseDto> {
    return this.createNotification({
      companyId,
      jobId,
      candidateId,
      applicationId,
      type: NotificationType.NEW_APPLICATION,
      title: 'New Job Application',
      message: `${candidateName} has applied for the position "${jobTitle}"`,
      metadata: {
        candidateName,
        jobTitle,
        appliedAt: new Date().toISOString()
      }
    });
  }

  private mapToResponseDto(notification: any): NotificationResponseDto {
    return {
      id: notification._id.toString(),
      companyId: notification.companyId.toString(),
      jobId: notification.jobId?.toString(),
      candidateId: notification.candidateId?.toString(),
      applicationId: notification.applicationId?.toString(),
      type: notification.type,
      title: notification.title,
      message: notification.message,
      status: notification.status,
      metadata: notification.metadata || {},
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
      readAt: notification.readAt,
      job: notification.jobId ? {
        title: notification.jobId.title,
        location: notification.jobId.location
      } : undefined,
      candidate: notification.candidateId ? {
        firstName: notification.candidateId.firstName,
        lastName: notification.candidateId.lastName,
        email: notification.candidateId.email
      } : undefined
    };
  }
}