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

  @Prop({ enum: ['pending', 'confirmed', 'declined', 'completed', 'cancelled', 'future', 'programmer', 'en_attente', 'annule'], default: 'future' })
  status: string;

  @Prop()
  notes?: string;

  @Prop({ type: Date })
  confirmedAt?: Date;

  @Prop({ type: Date })
  completedAt?: Date;

  @Prop({ type: Date })
  cancelledAt?: Date;

  @Prop()
  cancellationReason?: string;

  @Prop({
    type: {
      overallRating: Number,
      technicalSkills: Number,
      communication: Number,
      motivation: Number,
      culturalFit: Number,
      comments: String,
      strengths: [String],
      weaknesses: [String],
      recommendation: String
    }
  })
  feedback?: {
    overallRating: number;
    technicalSkills: number;
    communication: number;
    motivation: number;
    culturalFit: number;
    comments: string;
    strengths: string[];
    weaknesses: string[];
    recommendation: string;
  };

  @Prop({ type: Boolean, default: false })
  isHired: boolean;

  @Prop({ type: Date })
  hiringDecisionDate?: Date;

  @Prop()
  hiringDecisionReason?: string;
}

export const InterviewSchema = SchemaFactory.createForClass(Interview);