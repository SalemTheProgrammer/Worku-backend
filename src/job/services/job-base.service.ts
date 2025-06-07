import { Injectable, NotFoundException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { CreateJobDto } from '../dto/create-job.dto';
import { Job, JobDocument } from '../../schemas/job.schema';
import { Company } from '../../schemas/company.schema';
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
  private readonly logger = new Logger(JobBaseService.name);
  private readonly jobMapper: JobMapper;
  private readonly MAX_FREE_JOBS = 5;

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly jobCacheService: JobCacheService,
    private readonly jobQueryService: JobQueryService
  ) {
    this.jobMapper = new JobMapperImpl();
  }

  async createJob(companyId: string, createJobDto: CreateJobDto): Promise<{ message: string; id: string }> {
    const session: ClientSession = await this.jobModel.db.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Check company's remaining jobs
        const company = await this.companyModel.findById(companyId).session(session);
        
        if (!company) {
          throw new NotFoundException('Company not found');
        }

        if (company.remainingJobs <= 0) {
          throw new BadRequestException(
            `You have no remaining job posts available. Your current account type (${company.accountType}) allows up to 5 job postings. Please upgrade your plan to post more jobs.`
          );
        }

        // Extract compensation properties from nested structure
        const { compensation, ...restJobData } = createJobDto;
        
        // Create job with optimized structure
        const jobData = {
          ...restJobData,
          ...(compensation || {}),
          companyId: new Types.ObjectId(companyId),
          expiresAt: createJobDto.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          applications: [],
          seenBy: [],
          isActive: true,
          publishedAt: new Date()
        };

        const [savedJob] = await this.jobModel.create([jobData], { session });
        
        // Decrement the company's remaining jobs count
        await this.companyModel.findByIdAndUpdate(
          companyId,
          { $inc: { remainingJobs: -1 } },
          { session }
        );
        
        // Invalidate cache asynchronously (don't await)
        this.jobCacheService.invalidateJobListCache().catch(error =>
          this.logger.warn('Failed to invalidate job cache:', error)
        );
        
        return {
          message: 'Job offer created successfully.',
          id: (savedJob._id as Types.ObjectId).toString()
        };
      });
    } catch (error) {
      this.logger.error('Job creation error:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        'Failed to create job: ' + (error.message || 'Unknown error')
      );
    } finally {
      await session.endSession();
    }
  }

  async getJobList(filters: FilterJobsDto, useCache: boolean = false): Promise<JobListResponseDto> {
    try {
      // Check cache first if enabled
      if (useCache) {
        const cachedJobs = await this.jobCacheService.getJobListFromCache(filters);
        if (cachedJobs) {
          return cachedJobs;
        }
      }

      const query = this.jobQueryService.buildQuery(filters);
      const sortOptions = this.jobQueryService.buildSortOptions(filters.sortBy);
      
      const limit = Math.min(filters?.limit || 20, 100); // Prevent excessive data loading
      const skip = filters?.skip || 0;

      // Execute both jobs query and count in parallel using traditional populate for compatibility
      const [jobs, totalResult] = await Promise.all([
        this.jobModel.find(query)
          .sort(sortOptions)
          .skip(skip)
          .limit(limit)
          .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise numeroRNE email secteurActivite tailleEntreprise phone adresse siteWeb reseauxSociaux description activiteCles logo profileCompleted verified lastLoginAt notificationSettings')
          .lean()
          .exec(),
        this.jobModel.countDocuments(query)
      ]);

      // Map jobs efficiently
      const mappedJobs = jobs.map(job => {
        const jobWithId = {
          ...job,
          _id: job._id.toString()
        };
        return this.jobMapper.fromEntity(jobWithId as unknown as LeanJobWithCompany);
      });

      const result: JobListResponseDto = {
        jobs: mappedJobs,
        total: totalResult,
        limit,
        skip
      };

      // Cache result asynchronously if caching is enabled
      if (useCache) {
        this.jobCacheService.setJobListCache(filters, result).catch(error =>
          this.logger.warn('Failed to cache job list:', error)
        );
      }
      
      return result;
    } catch (error) {
      this.logger.error('Failed to fetch jobs:', error);
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  async getJobDetails(jobId: string): Promise<JobResponseDto> {
    try {
      // Check cache first
      const cachedJob = await this.jobCacheService.getJobDetailsFromCache(jobId);
      if (cachedJob) {
        return cachedJob;
      }

      if (!Types.ObjectId.isValid(jobId)) {
        throw new NotFoundException('Invalid job ID');
      }

      // Use traditional populate for better compatibility
      const jobData = await this.jobModel.findById(jobId)
        .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise numeroRNE email secteurActivite tailleEntreprise phone adresse siteWeb reseauxSociaux description activiteCles logo profileCompleted verified lastLoginAt notificationSettings')
        .populate<{ applications: CandidateData[] }>({
          path: 'applications',
          model: 'Candidate',
          select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience createdAt'
        })
        .lean()
        .exec();

      if (!jobData || new Date(jobData.expiresAt) < new Date()) {
        throw new NotFoundException('Job not found or has expired');
      }

      const job = {
        ...jobData,
        _id: new Types.ObjectId(jobData._id.toString())
      } as unknown as LeanJobWithPopulatedData;
      
      const jobResponse = this.jobMapper.fromEntity(job);
      
      // Cache result asynchronously
      this.jobCacheService.setJobDetailsCache(jobId, jobResponse).catch(error =>
        this.logger.warn('Failed to cache job details:', error)
      );

      return jobResponse;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error fetching job details:', error);
      throw new NotFoundException('Job not found');
    }
  }

  async deleteJob(companyId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const session: ClientSession = await this.jobModel.db.startSession();
    
    try {
      return await session.withTransaction(async () => {
        // Use findOneAndDelete for atomic operation
        const job = await this.jobModel.findOneAndDelete({
          _id: jobId,
          companyId: new Types.ObjectId(companyId)
        }).session(session);

        if (!job) {
          throw new NotFoundException('Job not found or unauthorized');
        }

        // Note: We don't increment remainingJobs when deleting a job
        // The company has used their quota slot permanently

        // Invalidate cache asynchronously
        this.jobCacheService.invalidateJobCache(jobId).catch(error =>
          this.logger.warn('Failed to invalidate job cache:', error)
        );
        
        return { message: 'Job deleted successfully' };
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error('Error deleting job:', error);
      throw new BadRequestException('Failed to delete job');
    } finally {
      await session.endSession();
    }
  }

  async getRemainingPosts(companyId: string): Promise<RemainingPostsResponseDto> {
    try {
      // Get company's remaining jobs count and current active jobs
      const [company, jobCountResult] = await Promise.all([
        this.companyModel.findById(companyId, 'remainingJobs accountType').lean(),
        this.jobModel.aggregate([
          {
            $match: {
              companyId: new Types.ObjectId(companyId),
              isActive: true
            }
          },
          {
            $count: "activeJobCount"
          }
        ])
      ]);

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      const activeJobCount = jobCountResult[0]?.activeJobCount || 0;
      const totalAllowedPosts = company.accountType === 'freemium-beta' ? 5 : this.MAX_FREE_JOBS;

      return {
        remainingPosts: Math.max(0, company.remainingJobs || 0),
        totalAllowedPosts,
        currentActivePosts: activeJobCount,
        accountType: company.accountType || 'freemium-beta'
      };
    } catch (error) {
      this.logger.error('Error fetching remaining posts:', error);
      return {
        remainingPosts: 0,
        totalAllowedPosts: this.MAX_FREE_JOBS,
        currentActivePosts: this.MAX_FREE_JOBS,
        accountType: 'freemium-beta'
      };
    }
  }
}