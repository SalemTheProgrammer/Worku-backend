import { Injectable } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { JobListResponseDto, JobResponseDto } from './dto/job-response.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { RemainingPostsResponseDto } from './dto/remaining-posts.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';
import { JobBaseService } from './services/job-base.service';
import { JobViewService } from './services/job-view.service';
import { JobCandidateService } from './services/job-candidate.service';
import { CompanyJournalService } from '../journal/services/company-journal.service';
import { CompanyActionType } from '../journal/enums/action-types.enum';

@Injectable()
export class JobService {
  constructor(
    private jobBaseService: JobBaseService,
    private jobViewService: JobViewService,
    private jobCandidateService: JobCandidateService,
    private companyJournalService: CompanyJournalService
  ) {}

  async createJob(companyId: string, createJobDto: CreateJobDto): Promise<{ message: string; id: string }> {
    const result = await this.jobBaseService.createJob(companyId, createJobDto);
    
    // Log job creation activity
    await this.companyJournalService.logActivity(
      companyId,
      CompanyActionType.CREATION_OFFRE_EMPLOI,
      {
        jobId: result.id,
        jobTitle: createJobDto.title
      },
      `Création d'offre d'emploi: ${createJobDto.title}`
    );
    
    return result;
  }

  async getCompanyJobs(companyId: string): Promise<JobListResponseDto> {
    return this.jobBaseService.getJobList({
      companyId,
      onlyActive: true
    } as FilterJobsDto);
  }

  async getRemainingPosts(companyId: string): Promise<RemainingPostsResponseDto> {
    return this.jobBaseService.getRemainingPosts(companyId);
  }

  async getJobList(filters?: FilterJobsDto, useCache: boolean = false): Promise<JobListResponseDto> {
    return this.jobBaseService.getJobList(filters || {}, useCache);
  }

  async getJobListDirect(filters?: FilterJobsDto): Promise<JobListResponseDto> {
    return this.jobBaseService.getJobList(filters || {}, false);
  }

  async getJobListCached(filters?: FilterJobsDto): Promise<JobListResponseDto> {
    return this.jobBaseService.getJobList(filters || {}, true);
  }

  async getJobDetails(jobId: string): Promise<JobResponseDto> {
    return this.jobBaseService.getJobDetails(jobId);
  }

  async deleteJob(companyId: string, jobId: string): Promise<{ message: string }> {
    // Get job details before deletion to use in the activity log
    const jobDetails = await this.jobBaseService.getJobDetails(jobId);
    const result = await this.jobBaseService.deleteJob(companyId, jobId);
    
    // Log job deletion activity
    await this.companyJournalService.logActivity(
      companyId,
      CompanyActionType.SUPPRESSION_OFFRE_EMPLOI,
      {
        jobId,
        jobTitle: jobDetails.title
      },
      `Suppression d'offre d'emploi: ${jobDetails.title}`
    );
    
    return result;
  }

  async getCandidateByJobId(jobId: string, candidateId: string): Promise<CandidateResponseDto> {
    return this.jobCandidateService.getCandidateByJobId(jobId, candidateId);
  }

  async recordJobView(jobId: string, ipAddress: string): Promise<{ message: string }> {
    return this.jobViewService.recordJobView(jobId, ipAddress);
  }
}
