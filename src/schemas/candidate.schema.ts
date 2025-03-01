import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Candidate extends Document {
  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true })
  password: string;

  @Prop()
  jobTitle?: string;

  @Prop()
  address?: string;

  @Prop()
  city?: string;

  @Prop()
  state?: string;

  @Prop()
  zipCode?: string;

  @Prop()
  country?: string;

  @Prop()
  phone?: string;

  @Prop()
  linkedinUrl?: string;

  @Prop()
  githubUrl?: string;

  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  profileCompleted: boolean;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);