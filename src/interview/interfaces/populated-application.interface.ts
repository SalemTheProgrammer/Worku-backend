import { Types, Document } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Job } from '../../schemas/job.schema';
import { Company } from '../../schemas/company.schema';

export interface PopulatedApplication extends Document {
  _id: Types.ObjectId;
  candidat: Candidate & Document;
  poste: Job & Document;
  companyId: Company & Document;
  applicationId: Types.ObjectId;
  status: string;
  datePostulation: Date;
  dateAnalyse?: Date;
}