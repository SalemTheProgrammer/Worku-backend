import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { JournalActivity } from './journal-activity.schema';

export type CandidateJournalDocument = CandidateJournal & Document;

@Schema({ timestamps: true })
export class CandidateJournal extends JournalActivity {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', required: true })
  candidateId: Types.ObjectId;
}

export const CandidateJournalSchema = SchemaFactory.createForClass(CandidateJournal);

// Add indexes for better performance
CandidateJournalSchema.index({ candidateId: 1, timestamp: -1 });
CandidateJournalSchema.index({ actionType: 1 });