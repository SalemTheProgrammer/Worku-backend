import { Injectable, NotFoundException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job, JobDocument } from '../../schemas/job.schema';
import { JobListResponseDto, JobResponseDto } from '../dto/job-response.dto';
import { FilterJobsDto } from '../dto/filter-jobs.dto';
import { RemainingPostsResponseDto } from '../dto/remaining-posts.dto';
import { CompanyRef } from '../../interfaces/company.interface';
import { JobCacheService } from './job-cache.service';
import { JobQueryService } from './job-query.service';
import { JobMapper, JobMapperImpl } from '../interfaces/job-mapper.interface';
import { LeanJobWithPopulatedData, LeanJobWithCompany, CandidateData } from '../interfaces/job.interface';

@Injectable()
export class JobBaseService {
  private jobMapper: JobMapper;

  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private jobCacheService: JobCacheService,
    private jobQueryService: JobQueryService
  ) {
    this.jobMapper = new JobMapperImpl();
  }

  async createJob(companyId: string, createJobDto: CreateJobDto): Promise<{ message: string; id: string }> {
    try {
      const jobCount = await this.jobModel.countDocuments({
        companyId: new Types.ObjectId(companyId),
        isActive: true
      });

      if (jobCount >= 5) {
        throw new BadRequestException(
          'You have reached the maximum limit of 5 free job postings. Please upgrade your plan to post more jobs.'
        );
      }

      const job = new this.jobModel({
        ...createJobDto,
        companyId: new Types.ObjectId(companyId),
        expiresAt: createJobDto.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applications: [],
        seenBy: [],
        isActive: true,
        publishedAt: new Date()
      });

      const savedJob = await job.save() as JobDocument & { _id: Types.ObjectId };
      
      await this.jobCacheService.invalidateJobListCache();
      
      return {
        message: 'Job offer created successfully.',
        id: savedJob._id.toString()
      };
    } catch (error) {
      console.error('Job creation error:', error);
      throw new BadRequestException(
        'Failed to create job: ' + (error.message || 'Unknown error')
      );
    }
  }

  async getJobList(filters: FilterJobsDto, useCache: boolean = false): Promise<JobListResponseDto> {
    let result: JobListResponseDto;
    try {
      if (useCache) {
        const cachedJobs = await this.jobCacheService.getJobListFromCache(filters);
        if (cachedJobs) {
          return cachedJobs;
        }
      }

      const query = this.jobQueryService.buildQuery(filters);
      const sortOptions = this.jobQueryService.buildSortOptions(filters.sortBy);
      
      const limit = filters?.limit || 20;
      const skip = filters?.skip || 0;

      console.log('MongoDB Query:', {
        query,
        sortOptions,
        limit,
        skip,
        filters
      });

      const jobs = await this.jobModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise numeroRNE email secteurActivite tailleEntreprise phone adresse siteWeb reseauxSociaux description activiteCles logo profileCompleted verified lastLoginAt notificationSettings')
        .lean()
        .exec();

      const total = await this.jobModel.countDocuments(query);

      console.log('Query Results:', {
        totalDocuments: total,
        returnedJobs: jobs.length,
        sampleJob: jobs[0] ? {
          id: jobs[0]._id,
          title: jobs[0].title,
          isActive: jobs[0].isActive,
          expiresAt: jobs[0].expiresAt
        } : null
      });
      
      const mappedJobs = jobs.map(job => {
        const jobWithId = {
          ...job,
          _id: job._id.toString(),
          showSalary: job.showSalary ?? true
        };
        return this.jobMapper.fromEntity(jobWithId as unknown as LeanJobWithCompany);
      });

      const result: JobListResponseDto = {
        jobs: mappedJobs,
        total,
        limit,
        skip
      };

      console.log('Query Result:', {
        filters,
        total,
        jobCount: mappedJobs.length,
        firstJobTitle: mappedJobs[0]?.title
      });

      if (useCache) {
        await this.jobCacheService.setJobListCache(filters, result);
      }
      
      return result;
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
    return result;
  }

  async getJobDetails(jobId: string): Promise<JobResponseDto> {
    try {
      const cachedJob = await this.jobCacheService.getJobDetailsFromCache(jobId);
      if (cachedJob) {
        return cachedJob;
      }

      if (!Types.ObjectId.isValid(jobId)) {
        throw new NotFoundException('Invalid job ID');
      }

      const jobData = await this.jobModel.findById(jobId)
        .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise numeroRNE email secteurActivite tailleEntreprise phone adresse siteWeb reseauxSociaux description activiteCles logo profileCompleted verified lastLoginAt notificationSettings')
        .populate<{ applications: CandidateData[] }>({
          path: 'applications',
          model: 'Candidate',
          select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience createdAt'
        })
        .lean()
        .exec();

      if (!jobData || jobData.expiresAt < new Date()) {
        throw new NotFoundException('Job not found or has expired');
      }

      const job = {
        ...jobData,
        _id: new Types.ObjectId((jobData._id as Types.ObjectId).toString()),
        showSalary: jobData.showSalary ?? true
      } as unknown as LeanJobWithPopulatedData;
      
      const jobResponse = this.jobMapper.fromEntity(job);
      await this.jobCacheService.setJobDetailsCache(jobId, jobResponse);

      return jobResponse;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async deleteJob(companyId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.companyId.toString() !== companyId) {
      throw new UnauthorizedException('You are not authorized to delete this job');
    }

    await this.jobModel.findByIdAndDelete(jobId).exec();
    await this.jobCacheService.invalidateJobCache(jobId);
    
    return { message: 'Job deleted successfully' };
  }

  async getRemainingPosts(companyId: string): Promise<RemainingPostsResponseDto> {
    const activeJobCount = await this.jobModel.countDocuments({
      companyId: new Types.ObjectId(companyId),
      isActive: true
    });

    const maxFreeJobs = 5;
    const remainingPosts = Math.max(0, maxFreeJobs - activeJobCount);

    return {
      remainingPosts,
      totalAllowedPosts: maxFreeJobs,
      currentActivePosts: activeJobCount
    };
  }
}