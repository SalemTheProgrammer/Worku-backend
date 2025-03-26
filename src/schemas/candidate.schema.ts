import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Education {
  @Prop({ required: true })
  institution: string;

  @Prop({ required: true })
  degree: string;

  @Prop({ required: true })
  fieldOfStudy: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  description?: string;
}

@Schema()
export class Experience {
  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  position: string;

  @Prop()
  location?: string;

  @Prop()
  startDate: Date;

  @Prop()
  endDate?: Date;

  @Prop()
  description?: string;

  @Prop([String])
  technologies?: string[];
}

@Schema()
export class Skill {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, min: 1, max: 5 })
  level: number;

  @Prop()
  yearsOfExperience?: number;
}

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

  // Personal Information
  @Prop()
  profilePicture?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop()
  phone?: string;

  // Professional Information
  @Prop()
  jobTitle?: string;

  @Prop()
  summary?: string;

  @Prop([String])
  desiredPositions?: string[];

  @Prop([String])
  preferredLocations?: string[];

  @Prop({ type: Number, min: 0 })
  yearsOfExperience?: number;

  @Prop({ type: Number, min: 0 })
  expectedSalary?: number;

  @Prop([String])
  workPreferences?: string[]; // remote, hybrid, onsite

  @Prop([String])
  industryPreferences?: string[];

  // Location Information
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

  // Social & Portfolio Links
  @Prop()
  linkedinUrl?: string;

  @Prop()
  githubUrl?: string;

  @Prop()
  portfolioUrl?: string;

  @Prop([String])
  otherLinks?: string[];

  // Education & Experience
  @Prop([Education])
  education?: Education[];

  @Prop([Experience])
  experience?: Experience[];

  @Prop([Skill])
  skills?: Skill[];

  @Prop([String])
  certifications?: string[];

  @Prop([String])
  languages?: string[];

  // Privacy Settings
  @Prop({ type: Boolean, default: true })
  isProfilePublic?: boolean;

  @Prop({ type: Boolean, default: true })
  isOpenToWork?: boolean;

  @Prop({ type: [String], default: [] })
  hiddenFields?: string[];

  // System Fields
  @Prop({ default: false })
  isVerified: boolean;

  @Prop({ default: false })
  profileCompleted: boolean;

  @Prop()
  lastLoginAt?: Date;

  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate);

// Add indexes for better query performance
CandidateSchema.index({ email: 1 }, { unique: true });
CandidateSchema.index({ skills: 1 });
CandidateSchema.index({ 'experience.technologies': 1 });
CandidateSchema.index({ isOpenToWork: 1 });