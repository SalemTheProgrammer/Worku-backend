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

  @Prop()
  date: Date;

  @Prop()
  time: string;

  @Prop({ enum: ['Video', 'InPerson', 'Phone'] })
  type: string;

  @Prop()
  location?: string;

  @Prop()
  meetingLink?: string;

  @Prop({ enum: ['pending', 'confirmed', 'declined', 'completed', 'cancelled', 'future'], default: 'future' })
  status: string;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  confirmedAt?: Date;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);