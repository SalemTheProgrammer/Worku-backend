import { Prop, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true, discriminatorKey: 'journalType' })
export class JournalActivity extends Document {
  @Prop({ type: String, required: true })
  actionType: string;

  @Prop({ type: Date, default: Date.now, required: true })
  timestamp: Date;

  @Prop({ type: Object, required: true })
  details: Record<string, any>;

  @Prop({ type: String, required: false })
  message: string;

  @Prop({ type: String, required: false })
  ipAddress: string;

  @Prop({ type: Boolean, default: false })
  isSystem: boolean;
}