import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Education {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  institution: string;

  @Prop({ required: true })
  degree: string;

  @Prop({ required: true })
  fieldOfStudy: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  description?: string;

  @Prop()
  specialization?: string;

  @Prop()
  grade?: string;
}

export const EducationSchema = SchemaFactory.createForClass(Education);