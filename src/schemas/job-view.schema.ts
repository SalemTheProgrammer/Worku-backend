import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type JobViewDocument = JobView & Document;

@Schema({ timestamps: true })
export class JobView {
  @Prop({ type: String, required: true })
  jobId: string;

  @Prop({ type: String, required: true })
  ipAddress: string;

  @Prop({ type: Date, required: true, default: Date.now })
  viewedAt: Date;
}

export const JobViewSchema = SchemaFactory.createForClass(JobView);

// Create a compound index on jobId and ipAddress for efficient lookups
JobViewSchema.index({ jobId: 1, ipAddress: 1 }, { unique: true });