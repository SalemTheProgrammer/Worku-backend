import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Schema as MongooseSchema, Types } from 'mongoose';
import { JournalActivity } from './journal-activity.schema';

export type CompanyJournalDocument = CompanyJournal & Document;

@Schema({ timestamps: true })
export class CompanyJournal extends JournalActivity {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: false })
  userId: Types.ObjectId;
}

export const CompanyJournalSchema = SchemaFactory.createForClass(CompanyJournal);

// Add indexes for better performance
CompanyJournalSchema.index({ companyId: 1, timestamp: -1 });
CompanyJournalSchema.index({ actionType: 1 });