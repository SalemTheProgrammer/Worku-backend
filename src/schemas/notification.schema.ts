import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type NotificationDocument = Notification & Document;

export enum NotificationType {
  NEW_APPLICATION = 'NEW_APPLICATION',
  APPLICATION_STATUS_CHANGE = 'APPLICATION_STATUS_CHANGE',
  INTERVIEW_SCHEDULED = 'INTERVIEW_SCHEDULED',
  INTERVIEW_CONFIRMED = 'INTERVIEW_CONFIRMED',
  INTERVIEW_CANCELLED = 'INTERVIEW_CANCELLED',
  MESSAGE_RECEIVED = 'MESSAGE_RECEIVED'
}

export enum NotificationStatus {
  UNREAD = 'UNREAD',
  READ = 'READ'
}

@Schema({
  timestamps: true,
  collection: 'notifications'
})
export class Notification {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Job', required: false })
  jobId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: false })
  candidateId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Application', required: false })
  applicationId?: Types.ObjectId;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationType), 
    required: true 
  })
  type: NotificationType;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({ 
    type: String, 
    enum: Object.values(NotificationStatus), 
    default: NotificationStatus.UNREAD 
  })
  status: NotificationStatus;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;

  @Prop({ default: Date.now })
  createdAt: Date;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  readAt?: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

// Index for efficient queries
NotificationSchema.index({ companyId: 1, createdAt: -1 });
NotificationSchema.index({ companyId: 1, status: 1 });
NotificationSchema.index({ companyId: 1, type: 1 });