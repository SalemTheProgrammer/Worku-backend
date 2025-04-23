import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Skill {
  @Prop({ type: String })
  _id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1, max: 5 })
  level: number;

  @Prop()
  yearsOfExperience?: number;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);