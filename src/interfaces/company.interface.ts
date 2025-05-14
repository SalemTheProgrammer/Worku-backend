import { Document, Types } from 'mongoose';

export enum BusinessSector {
  TECHNOLOGY = 'Technology',
  HEALTHCARE = 'Healthcare',
  FINANCE = 'Finance',
  EDUCATION = 'Education',
  RETAIL = 'Retail',
  MANUFACTURING = 'Manufacturing',
  SERVICES = 'Services',
  OTHER = 'Other'
}

export interface CompanyRef {
  _id: Types.ObjectId;
  nomEntreprise: string;
  numeroRNE: string;
  email: string;
  secteurActivite: string;
  tailleEntreprise: string;
  phone: string;
  adresse: string;
  siteWeb: string;
  reseauxSociaux: Record<string, string>;
  description: string;
  activiteCles: string[];
  logo: string;
  profileCompleted: boolean;
  verified: boolean;
  lastLoginAt: Date;
  notificationSettings: Record<string, boolean>;
}

export interface Company extends Document, Omit<CompanyRef, '_id'> {
  _id: Types.ObjectId;
}

export type LeanCompany = Omit<Company, keyof Document>;