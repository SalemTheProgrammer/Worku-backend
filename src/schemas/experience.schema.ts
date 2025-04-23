import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Experience {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  position: string;

  @Prop()
  location?: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop({ type: Boolean, default: false })
  isCurrent?: boolean;

  @Prop()
  description?: string;

  @Prop([String])
  skills?: string[];

  @Prop([String])
  achievements?: string[];
}

export const ExperienceSchema = SchemaFactory.createForClass(Experience);
