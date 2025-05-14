import { Types } from 'mongoose';

export interface PopulatedInterview {
  _id: Types.ObjectId;
  applicationId: {
    candidat: {
      firstName: string;
      lastName: string;
      email: string;
      _id: Types.ObjectId;
    };
    poste: {
      title: string;
      _id: Types.ObjectId;
    };
    _id: Types.ObjectId;
  };
  status: string;
  date?: Date;
  time?: string;
}