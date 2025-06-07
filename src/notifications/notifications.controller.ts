import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';
import { TokenPayload, UserRole } from '../interfaces/user.interface';
import {
  CreateNotificationDto,
  UpdateNotificationStatusDto,
  GetNotificationsQueryDto,
  NotificationResponseDto,
  NotificationCountDto,
} from './dto/notification.dto';
import { NotificationStatus } from '../schemas/notification.schema';

@ApiTags('notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new notification',
    description: 'Create a new notification for a company (admin use)',
  })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  async createNotification(
    @Body() createNotificationDto: CreateNotificationDto,
  ): Promise<NotificationResponseDto> {
    return this.notificationsService.createNotification(createNotificationDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get notifications for company',
    description: 'Retrieve notifications for the authenticated company with pagination and filters',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page (default: 20)' })
  @ApiQuery({ name: 'status', required: false, enum: NotificationStatus, description: 'Filter by status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filter by notification type' })
  @ApiQuery({ name: 'fromDate', required: false, description: 'Filter from date (ISO string)' })
  @ApiQuery({ name: 'toDate', required: false, description: 'Filter to date (ISO string)' })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully',
    schema: {
      properties: {
        notifications: {
          type: 'array',
          items: { $ref: '#/components/schemas/NotificationResponseDto' },
        },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotifications(
    @User() user: TokenPayload,
    @Query() query: GetNotificationsQueryDto,
  ) {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can access notifications');
    }
    return this.notificationsService.getNotifications(user.userId, query);
  }

  @Get('counts')
  @ApiOperation({
    summary: 'Get notification counts',
    description: 'Get unread notification counts and counts by type for the authenticated company',
  })
  @ApiResponse({
    status: 200,
    description: 'Notification counts retrieved successfully',
    type: NotificationCountDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getNotificationCounts(@User() user: TokenPayload): Promise<NotificationCountDto> {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can access notification counts');
    }
    return this.notificationsService.getNotificationCounts(user.userId);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get notification by ID',
    description: 'Retrieve a specific notification by ID for the authenticated company',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async getNotificationById(
    @Param('id') id: string,
    @User() user: TokenPayload,
  ): Promise<NotificationResponseDto> {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can access notifications');
    }
    return this.notificationsService.getNotificationById(id, user.userId);
  }

  @Put(':id/status')
  @ApiOperation({
    summary: 'Update notification status',
    description: 'Update the status of a notification (mark as read/unread)',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification status updated successfully',
    type: NotificationResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async updateNotificationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateNotificationStatusDto,
    @User() user: TokenPayload,
  ): Promise<NotificationResponseDto> {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can update notifications');
    }
    return this.notificationsService.updateNotificationStatus(id, user.userId, updateDto);
  }

  @Put('mark-all-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all notifications as read',
    description: 'Mark all unread notifications as read for the authenticated company',
  })
  @ApiResponse({
    status: 200,
    description: 'All notifications marked as read',
    schema: {
      properties: {
        updatedCount: { type: 'number', description: 'Number of notifications updated' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async markAllAsRead(@User() user: TokenPayload): Promise<{ updatedCount: number }> {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can mark notifications as read');
    }
    return this.notificationsService.markAllAsRead(user.userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete notification',
    description: 'Delete a specific notification',
  })
  @ApiParam({ name: 'id', description: 'Notification ID' })
  @ApiResponse({ status: 204, description: 'Notification deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Notification not found' })
  async deleteNotification(
    @Param('id') id: string,
    @User() user: TokenPayload,
  ): Promise<void> {
    if (![UserRole.ADMIN, UserRole.MANAGER, UserRole.RECRUITER].includes(user.role)) {
      throw new Error('Only company users can delete notifications');
    }
    return this.notificationsService.deleteNotification(id, user.userId);
  }
}