import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Application } from './application.schema';
import { Candidate } from './candidate.schema';

export type InterviewDocument = Interview & Document & { _id: Types.ObjectId };

@Schema({ timestamps: true })
export class Interview {
  @Prop({ type: Types.ObjectId, ref: 'Application', required: true })
  applicationId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  time: string;

  @Prop({ required: true, enum: ['Video', 'InPerson', 'Phone'] })
  type: string;

  @Prop()
  location?: string;

  @Prop()
  meetingLink?: string;

  @Prop({ default: 'pending', enum: ['pending', 'confirmed', 'declined', 'completed', 'cancelled'] })
  status: string;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  confirmedAt?: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);