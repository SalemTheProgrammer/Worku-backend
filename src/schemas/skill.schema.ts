import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SkillCategory } from '../candidate/enums/skill-category.enum';

@Schema()
export class Skill {
  @Prop({ type: String })
  _id?: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: String })
  category: string;

  @Prop({ required: true, min: 1, max: 5 })
  level: number;

  @Prop()
  yearsOfExperience?: number;

  // Language-specific properties
  @Prop({ type: Boolean, default: false })
  isLanguage?: boolean;

  @Prop({
    type: String,
    enum: ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant', 'Native', 'Advanced', 'Intermediate', 'Beginner'],
    required: false
  })
  proficiencyLevel?: string;
}

export const SkillSchema = SchemaFactory.createForClass(Skill);