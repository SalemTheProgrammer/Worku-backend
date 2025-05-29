import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import {
  ContractType,
  EducationLevel,
  Language,
  LanguageLevel,
  Industry,
  SkillKeyword,
  Benefit,
  Gender
} from '../job/types/job.types';

export type JobDocument = Job & Document & {
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Job {
  @Prop({ type: String, required: true })
  offerType: string;

  @Prop({ type: String, required: true })
  title: string;

  @Prop({
    type: {
      educationLevel: { type: String, required: true },
      fieldOfStudy: { type: String, required: true },
      yearsExperienceRequired: { type: Number, required: true },
      experienceDomain: { type: String, required: true },
      hardSkills: { type: String, required: true },
      softSkills: { type: String, required: true },
      languages: { type: String, required: true }
    },
    required: true
  })
  requirements: {
    educationLevel: string;
    fieldOfStudy: string;
    yearsExperienceRequired: number;
    experienceDomain: string;
    hardSkills: string;
    softSkills: string;
    languages: string;
  };

  @Prop({
    type: {
      vacantPosts: { type: Number, required: true },
      activityDomain: { type: String, required: false }, // Made optional
      contractType: { type: String, required: true },
      availability: { type: String, required: true },
      workLocation: { type: String, required: true },
      tasks: { type: String, required: true },
      city: { type: String, required: true },
      country: { type: String, required: true }
    },
    required: true
  })
  jobDetails: {
    vacantPosts: number;
    activityDomain: string;
    contractType: string;
    availability: string;
    workLocation: string;
    tasks: string;
    city: string;
    country: string;
  };

  @Prop({
    type: {
      benefitsDescription: { type: String, required: true },
      benefitsList: { type: [String], default: [] }
    },
    required: true
  })
  benefits: {
    benefitsDescription: string;
    benefitsList: string[];
  };

  @Prop({ type: Boolean, default: true })
  showSalary?: boolean;

  @Prop({ type: Number })
  salaryMin?: number;

  @Prop({ type: Number })
  salaryMax?: number;

  @Prop({ type: String })
  salaryPeriod?: string;

  @Prop({ type: String })
  salaryCurrency?: string;

  @Prop({ type: String })
  salaryDescription?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Date })
  publishedAt: Date;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Candidate' }], default: [] })
  applications: Types.ObjectId[];

  @Prop({ type: [{ type: MongooseSchema.Types.ObjectId, ref: 'Candidate' }], default: [] })
  seenBy: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  seenCount: number;
}

export const JobSchema = SchemaFactory.createForClass(Job);

// Add indexes for better search performance
JobSchema.index({
  title: 'text',
  'jobDetails.tasks': 'text',
  'jobDetails.activityDomain': 'text',
  'jobDetails.city': 'text',
  'jobDetails.country': 'text',
  'requirements.hardSkills': 'text',
  'requirements.softSkills': 'text'
});

// Add compound indexes for common queries
JobSchema.index({ expiresAt: 1, isActive: 1 });
JobSchema.index({ 'jobDetails.activityDomain': 1 });
JobSchema.index({ 'requirements.educationLevel': 1 });
JobSchema.index({ 'requirements.yearsExperienceRequired': 1 });
JobSchema.index({ salaryMin: 1, salaryMax: 1 });
JobSchema.index({ 'jobDetails.contractType': 1 });
JobSchema.index({ createdAt: -1 });
JobSchema.index({ publishedAt: -1 });
JobSchema.index({ companyId: 1 });

// Add weighted text search index
JobSchema.index({
  title: 'text',
  'jobDetails.tasks': 'text',
  'jobDetails.activityDomain': 'text',
  'jobDetails.city': 'text',
  'jobDetails.country': 'text',
  'requirements.hardSkills': 'text',
  'requirements.softSkills': 'text',
  'requirements.fieldOfStudy': 'text'
}, {
  weights: {
    title: 10,
    'requirements.hardSkills': 8,
    'jobDetails.activityDomain': 7,
    'requirements.softSkills': 6,
    'jobDetails.city': 5,
    'jobDetails.country': 4,
    'jobDetails.tasks': 3,
    'requirements.fieldOfStudy': 2
  },
  name: 'job_search_index'
});
