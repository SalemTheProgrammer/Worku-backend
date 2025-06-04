import { Document, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Job } from '../../schemas/job.schema';
import { Application } from '../../schemas/application.schema';

export interface PopulatedInterview extends Document {
  applicationId: Application & {
    candidat: Candidate & Document;
    poste: Job & Document;
  };
  status: string;
  date?: Date;
  time?: string;
  type?: string;
  location?: string;
  meetingLink?: string;
  confirmedAt?: Date;
  completedAt?: Date;
  cancelledAt?: Date;
  cancellationReason?: string;
  candidateId: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}