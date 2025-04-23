import { Language, LanguageLevel } from '../enums/language.enum';
import { Industry } from '../enums/industry.enum';
import { SkillKeyword } from '../enums/keyword.enum';
import { Benefit } from '../enums/benefit.enum';
import { ContractType } from '../enums/contract.enum';
import { EducationLevel } from '../enums/education.enum';
import { Gender } from '../enums/gender.enum';

export interface LanguageRequirement {
  language: Language;
  level: LanguageLevel;
  required: boolean;
}

export interface JobRequirements {
  educationLevel: string;
  fieldOfStudy: string;
  yearsExperienceRequired: number;
  experienceDomain: string;
  hardSkills: string;
  softSkills: string;
  languages: string;
}

export interface JobDetails {
  vacantPosts: number;
  activityDomain: string;
  contractType: string;
  availability: string;
  workLocation: string;
  tasks: string;
  city: string;
  country: string;
}

export interface Benefits {
  benefitsDescription: string;
  benefitsList: string[];
}

export interface Compensation {
  showSalary: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  salaryCurrency?: string;
  salaryDescription?: string;
}

export interface JobBase {
  offerType: string;
  title: string;
  requirements: JobRequirements;
  jobDetails: JobDetails;
  benefits: Benefits;
  compensation?: Compensation;
  companyId: string;
  isActive?: boolean;
  publishedAt?: Date;
  expiresAt: Date;
  applications?: string[];
}

// Re-export enums for convenient access
export {
  Language,
  LanguageLevel,
  Industry,
  SkillKeyword,
  Benefit,
  ContractType,
  EducationLevel,
  Gender
};