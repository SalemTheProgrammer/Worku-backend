import { Schema, Prop, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose'; // Import Types
import { ProfessionalStatus } from '../job/enums/professional-status.enum';
import { EmploymentStatus } from '../candidate/enums/employment-status.enum';
import { Education, EducationSchema } from './education.schema';
import { Experience, ExperienceSchema } from './experience.schema';
import { Certification, CertificationSchema } from './certification.schema';
import { Skill, SkillSchema } from './skill.schema';

export type CandidateDocument = Candidate & Document; // Export CandidateDocument

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
  cvUrl?: string;

  @Prop()
  cvImageUrl?: string; // Added for storing CV images for analysis
  @Prop()
  cvText?: string;


  @Prop()
  resumeUrl?: string;

  @Prop()
  dateOfBirth?: Date;

  @Prop({
    type: String,
    default: undefined,
    set: v => v === null ? undefined : v
  })
  phone?: string;

  @Prop({ type: String, enum: ProfessionalStatus })
  professionalStatus?: ProfessionalStatus;

  @Prop({ type: Date })
  availabilityDate?: Date;

  @Prop({ type: String, enum: EmploymentStatus })
  employmentStatus?: EmploymentStatus;

  @Prop({ type: Boolean, default: false })
  remoteWork?: boolean;

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
  @Prop({ type: String, default: null })
  linkedinUrl: string | null;

  @Prop({ type: String, default: null })
  githubUrl: string | null;

  @Prop({ type: String, default: null })
  portfolioUrl: string | null;

  @Prop({ type: [String], default: [] })
  otherLinks: string[];

  // Education & Experience
  @Prop({ type: [EducationSchema], default: [] })
  education: Education[];

  @Prop({ type: [ExperienceSchema], default: [] })
  experience: Experience[];

  @Prop({
    type: [
      {
        name: { type: String, required: true },
        category: { type: String, required: true },
        level: { type: Number, required: true, min: 1, max: 5 },
        yearsOfExperience: { type: Number },
        isLanguage: { type: Boolean, default: false },
        proficiencyLevel: {
          type: String,
          enum: ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant'],
          required: true
        }
      }
    ],
    default: []
  })
  skills: Skill[];

  @Prop({ type: [CertificationSchema], default: [] })
  certifications: Certification[];

  // Rejected Applications
  @Prop({ 
    type: [{ type: Types.ObjectId, ref: 'Application' }], 
    default: [] 
  })
  rejectedApplications: Types.ObjectId[];

  // Privacy Settings
  @Prop({ type: Boolean, default: true })
  isProfilePublic?: boolean;

  @Prop({ type: Boolean, default: true })
  isOpenToWork?: boolean;

  @Prop({ type: [String], default: [] })
  hiddenFields?: string[];

  // Profile Completion Tracking
  @Prop({ type: Number, default: 0, min: 0, max: 100 })
  profileCompletionScore: number;

  @Prop({
    type: {
      personalInfo: { type: Boolean, default: false },
      cv: { type: Boolean, default: false },
      education: { type: Boolean, default: false },
      experience: { type: Boolean, default: false },
      certifications: { type: Boolean, default: false },
      links: { type: Boolean, default: false }
    },
    default: {
      personalInfo: false,
      cv: false,
      education: false,
      experience: false,
      certifications: false,
      links: false
    }
  })
  fieldsCompleted: {
    personalInfo: boolean;
    cv: boolean;
    education: boolean;
    experience: boolean;
    certifications: boolean;
    links: boolean;
  };

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
CandidateSchema.index({ rejectedApplications: 1 });

// Add pre-save middleware to handle phone field
CandidateSchema.pre('save', function(next) {
  // If phone is null, set it to undefined to prevent indexing
  if (this.phone === null) {
    this.phone = undefined;
  }
  next();
});
