import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { BusinessSector } from '../interfaces/company.interface';

export type CompanyDocument = Company & Document;

class InvitedUser {
  @Prop({ type: String, required: true })
  email: string;

  @Prop({ type: String, required: true })
  nomDeUtilisateur: string;

  @Prop({ type: Boolean, default: false })
  isAccepted: boolean;
}

@Schema({ timestamps: true })
export class Company {
  @Prop({ type: String, required: true })
  nomEntreprise: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true, unique: true })
  numeroRNE: string;

  @Prop({ type: [String] })
  secteurActivite: string[];

  @Prop({ type: String })
  tailleEntreprise: string;

  @Prop({ type: String, required: false })
  phone: string;

  @Prop({ type: String, default: '' })
  adresse: string;

  @Prop({ type: String, default: null })
  siteWeb: string | null;

  @Prop({
    type: {
      linkedin: { type: String, default: null },
      instagram: { type: String, default: null },
      facebook: { type: String, default: null },
      x: { type: String, default: null }
    }
  })
  reseauxSociaux: {
    linkedin?: string | null;
    instagram?: string | null;
    facebook?: string | null;
    x?: string | null;
  };

  @Prop({ type: String })
  description: string;

  @Prop({ type: [String] })
  activiteCles: string[];

  @Prop({ type: String, default: null })
  logo: string | null;

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

  @Prop({ type: [{ type: Object }] })
  invitedUsers: InvitedUser[];

  @Prop({ type: Number, default: 5 })
  remainingJobs: number;

  @Prop({ type: String, enum: ['freemium-beta', 'premium', 'enterprise'], default: 'freemium-beta' })
  accountType: string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.virtual('name').get(function(this: CompanyDocument) {
  return this.nomEntreprise;
});

CompanySchema.virtual('legalName').get(function(this: CompanyDocument) {
  return this.nomEntreprise;
});
