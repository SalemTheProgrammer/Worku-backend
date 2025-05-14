import { Types } from 'mongoose';

export interface PopulatedApplication {
  _id: Types.ObjectId;
  candidat: {
    _id: Types.ObjectId;
    firstName: string;
    lastName: string;
    email: string;
  };
  poste: {
    _id: Types.ObjectId;
    title: string;
  };
  companyId: {
    _id: Types.ObjectId;
    nomEntreprise: string;
  };
}