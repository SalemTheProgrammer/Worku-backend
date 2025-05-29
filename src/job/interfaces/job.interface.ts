import { Document, Types } from 'mongoose';
import { CompanyRef } from '../../interfaces/company.interface';

export interface CandidateData {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  profileImage?: string;
  cv?: string;
  title?: string;
  skills: string[];
  yearsOfExperience: number;
  createdAt: Date;
}

export interface JobEntity extends Document {
  _id: Types.ObjectId;
  offerType: string;
  title: string;
  requirements: {
    educationLevel: string;
    fieldOfStudy: string;
    yearsExperienceRequired: number;
    experienceDomain: string;
    hardSkills: string;
    softSkills: string;
    languages: string;
  };
  jobDetails: {
    vacantPosts: number;
    activityDomain?: string; // Made optional
    contractType: string;
    availability: string;
    workLocation: string;
    tasks: string;
    city: string;
    country: string;
  };
  benefits: {
    benefitsDescription: string;
    benefitsList: string[];
  };
  showSalary: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  salaryCurrency?: string;
  salaryDescription?: string;
  companyId: Types.ObjectId | CompanyRef;
  isActive: boolean;
  publishedAt: Date;
  expiresAt: Date;
  applications: Types.ObjectId[];
  seenBy: Types.ObjectId[];
  seenCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobWithCompany extends Omit<JobEntity, 'companyId'> {
  companyId: CompanyRef;
}

export interface JobWithPopulatedData extends Omit<JobWithCompany, 'applications'> {
  applications: CandidateData[];
}

// Type for lean queries
export type LeanJobDocument = Omit<JobEntity, keyof Document> & {
  _id: Types.ObjectId;
};

export type LeanJobWithCompany = Omit<JobWithCompany, keyof Document> & {
  _id: Types.ObjectId;
};

export type LeanJobWithPopulatedData = Omit<JobWithPopulatedData, keyof Document> & {
  _id: Types.ObjectId;
};