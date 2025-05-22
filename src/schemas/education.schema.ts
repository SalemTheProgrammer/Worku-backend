import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

@Schema()
export class Education {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true, default: 'Non spécifié' })
  institution: string;

  @Prop({ required: true, default: 'Non spécifié' })
  degree: string;

  @Prop({ required: false, default: 'Non spécifié' })
  fieldOfStudy: string;

  @Prop({ required: true, default: () => new Date() })
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