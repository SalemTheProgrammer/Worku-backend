import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class SocialLinks extends Document {
  @Prop({ type: String })
  linkedinUrl?: string;

  @Prop({ type: String })
  githubUrl?: string;

  @Prop({ type: String })
  portfolioUrl?: string;

  @Prop({ type: [String], default: [] })
  otherLinks: string[];
}

export const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);