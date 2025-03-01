import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BusinessSector } from '../interfaces/company.interface';

@Schema({ timestamps: true })
export class Company extends Document {
  @Prop({ type: String, required: true })
  nomEntreprise: string;

  @Prop({ type: String, required: true, unique: true })
  numeroRNE: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, enum: BusinessSector, default: BusinessSector.OTHER })
  secteurActivite: BusinessSector;

  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  tailleEntreprise: number;

  @Prop({ type: String, required: false })
  phone: string;

  @Prop({ type: String, default: '' })
  adresse: string;

  @Prop({ type: String })
  siteWeb: string;

  @Prop({
    type: {
      linkedin: { type: String },
      twitter: { type: String },
      facebook: { type: String }
    }
  })
  reseauxSociaux: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
  };

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String] })
  activiteCles: string[];

  @Prop({ type: Boolean, default: false })
  profileCompleted: boolean;

  @Prop({ type: Boolean, default: true })
  verified: boolean;

  @Prop({ type: Date })
  lastLoginAt: Date;

  @Prop({
    type: {
      candidaturesRecues: { type: Boolean, default: true },
      offresExpirees: { type: Boolean, default: true },
      candidatsRecommandes: { type: Boolean, default: true },
    }
  })
  notificationSettings: {
    candidaturesRecues: boolean;
    offresExpirees: boolean;
    candidatsRecommandes: boolean;
  };
}

export const CompanySchema = SchemaFactory.createForClass(Company);
