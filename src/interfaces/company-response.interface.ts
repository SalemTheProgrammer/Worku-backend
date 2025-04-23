import { UserRole } from './user.interface';
import { Types } from 'mongoose';

export interface CompanyResponse {
  _id: string | Types.ObjectId;
  nomDeUtilisateur: string | null;
  nomUtilisateur: string | null;
  role: UserRole;
  nomEntreprise: string;
  numeroRNE: string;
  email: string;
  secteurActivite?: string[];
  tailleEntreprise?: string;
  phone?: string;
  adresse?: string;
  siteWeb: string | null;
  reseauxSociaux: {
    linkedin: string | null;
    instagram: string | null;
    facebook: string | null;
    x: string | null;
  };
  description?: string;
  activiteCles?: string[];
  logo: string | null;
  profileCompleted: boolean;
  verified: boolean;
  lastLoginAt?: Date;
  invitedUsers?: Array<{
    email: string;
    nomDeUtilisateur: string;
    isAccepted: boolean;
  }>;
  createdAt?: Date;
  updatedAt?: Date;
}