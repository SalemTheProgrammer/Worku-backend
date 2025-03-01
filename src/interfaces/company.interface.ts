export enum CompanySize {
  MICRO = 'micro', // 0-9
  SMALL = 'small', // 10-49
  MEDIUM = 'medium', // 50-99
  LARGE = 'large', // 100+
}

export enum BusinessSector {
  TECHNOLOGY = 'technology',
  FINANCE = 'finance',
  HEALTHCARE = 'healthcare',
  EDUCATION = 'education',
  RETAIL = 'retail',
  MANUFACTURING = 'manufacturing',
  SERVICES = 'services',
  OTHER = 'other',
}

export interface CompanyRegistration {
  nomEntreprise: string;
  numeroRNE: string;
  email: string;
  verified: boolean;
}

export interface CompanyProfile {
  id: string;
  // Basic Info
  nomEntreprise: string;
  numeroRNE: string;
  email: string;
  // Additional Info
  secteurActivite: BusinessSector;
  tailleEntreprise: number;
  adresse: string;
  siteWeb?: string;
  reseauxSociaux?: {
    linkedin?: string;
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
  // Description
  descriptionEntreprise?: string;
  activitesClees?: string[];
  // System fields
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  // Settings
  notificationSettings: {
    candidaturesRecues: boolean;
    offresExpirees: boolean;
    candidatsRecommandes: boolean;
  };
}

export interface JobOffer {
  id: string;
  companyId: string;
  title: string;
  description: string;
  requirements: string[];
  location: string;
  type: 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';
  salary?: {
    min: number;
    max: number;
    currency: string;
  };
  status: 'DRAFT' | 'PUBLISHED' | 'CLOSED' | 'EXPIRED';
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  // Stats
  views: number;
  applications: number;
}

export interface Interview {
  id: string;
  jobOfferId: string;
  candidateId: string;
  companyId: string;
  scheduledFor: Date;
  duration: number; // in minutes
  type: 'IN_PERSON' | 'PHONE' | 'VIDEO';
  location?: string;
  meetingLink?: string;
  status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}