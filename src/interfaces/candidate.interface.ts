import { Types } from 'mongoose';

export interface Candidate {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  location?: string;
  profileImage?: string;
  cv?: string;
  title?: string;
  skills?: string[];
  yearsOfExperience?: number;
  createdAt: Date;
}

export interface PopulatedJob {
  _id: Types.ObjectId;
  companyId: Types.ObjectId;
  applications: Candidate[];
}