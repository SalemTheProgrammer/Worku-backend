import { ApplicationDocument } from '../../schemas/application.schema';
import { FilterApplicationsDto } from '../dto/filter-applications.dto';

export interface ApplicationResponse {
  id: string;
}

export interface CreateApplicationResult {
  id: string;
}

export interface GetApplicationsResult {
  applications: ApplicationDocument[];
  total: number;
}

export interface IApplicationService {
  createApplication(candidateId: string, jobId: string): Promise<ApplicationResponse>;
  getApplicationById(id: string): Promise<ApplicationDocument>;
  getApplicationsByCandidate(candidateId: string): Promise<ApplicationDocument[]>;
  getApplicationsByCompany(companyId: string, filters?: FilterApplicationsDto): Promise<GetApplicationsResult>;
  getApplicationsByJob(jobId: string, filters?: FilterApplicationsDto): Promise<GetApplicationsResult>;
}