import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateJobDto } from './dto/create-job.dto';
import { Job, JobDocument } from '../schemas/job.schema';
import { JobListResponseDto, JobResponseDto } from './dto/job-response.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { RemainingPostsResponseDto } from './dto/remaining-posts.dto';
import { Language, LanguageLevel, LanguageRequirement } from './types/job.types';

interface CompanyRef {
  _id: Types.ObjectId;
  nomEntreprise: string;
  description?: string;
  profilePicture?: string;
}

interface PopulatedJobDocument extends Omit<JobDocument, 'companyId'> {
  companyId: CompanyRef;
  _id: Types.ObjectId;
  offerType: string;
  title: string;
  educationLevel: string;
  fieldOfStudy: string;
  yearsExperienceRequired: number;
  experienceDomain: string;
  hardSkills: string;
  softSkills: string;
  languages: string;
  vacantPosts: number;
  activityDomain: string;
  contractType: string;
  availability: string;
  workLocation: string;
  tasks: string;
  city: string;
  country: string;
  benefitsDescription: string;
  benefitsList: string[];
  showSalary?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryPeriod?: string;
  salaryCurrency?: string;
  salaryDescription?: string;
  createdAt: Date;
  updatedAt: Date;
  expiresAt: Date;
  publishedAt: Date;
  isActive: boolean;
  applications: Types.ObjectId[];
}

@Injectable()
export class JobService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>
  ) {}

  async createJob(companyId: string, createJobDto: CreateJobDto): Promise<{ message: string; id: string }> {
    try {
      // Check if company has reached the free limit of 5 jobs
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
        title: createJobDto.title,
        offerType: createJobDto.offerType,
        requirements: createJobDto.requirements,
        jobDetails: createJobDto.jobDetails,
        benefits: createJobDto.benefits,
        compensation: createJobDto.compensation,
        companyId: new Types.ObjectId(companyId),
        expiresAt: createJobDto.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        applications: [],
        isActive: true,
        publishedAt: new Date()
      });
      
      

      const savedJob = await job.save() as JobDocument & { _id: Types.ObjectId };
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

  private toJobResponse(job: PopulatedJobDocument): JobResponseDto {
    return {
      id: job._id.toString(),
      offerType: job.offerType,
      title: job.title,
      educationLevel: job.educationLevel,
      fieldOfStudy: job.fieldOfStudy,
      yearsExperienceRequired: job.yearsExperienceRequired,
      experienceDomain: job.experienceDomain,
      hardSkills: job.hardSkills,
      softSkills: job.softSkills,
      languages: job.languages,
      vacantPosts: job.vacantPosts,
      activityDomain: job.activityDomain,
      contractType: job.contractType,
      availability: job.availability,
      workLocation: job.workLocation,
      tasks: job.tasks,
      city: job.city,
      country: job.country,
      benefitsDescription: job.benefitsDescription,
      benefitsList: job.benefitsList,
      showSalary: job.showSalary,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryPeriod: job.salaryPeriod,
      salaryCurrency: job.salaryCurrency,
      salaryDescription: job.salaryDescription,
      company: {
        id: (job.companyId._id as Types.ObjectId).toString(),
        nomEntreprise: job.companyId.nomEntreprise,
        description: job.companyId.description,
        profilePicture: job.companyId.profilePicture
      },
      createdAt: job.createdAt,
      publishedAt: job.publishedAt,
      expiresAt: job.expiresAt,
      isActive: job.isActive,
      applications: job.applications.length,
      requirements: job.requirements,
      jobDetails: job.jobDetails,
      benefits: job.benefits
    };
  }

  async getJobList(filters?: FilterJobsDto): Promise<JobListResponseDto> {
    const query: Record<string, any> = {};

    // Always filter out expired and inactive jobs unless explicitly requested
    if (!filters || filters?.onlyActive !== false) {
      query.$and = [
        { expiresAt: { $gt: new Date() } },
        { isActive: true }
      ];
    }

    if (filters) {
      // Text search for location, domain, or keyword
      if (filters.keyword) {
        query.$text = { $search: filters.keyword };
      } else {
        if (filters.location) {
          query['jobDetails.city'] = new RegExp(filters.location, 'i');
        }
        if (filters.domain) {
          query['jobDetails.activityDomain'] = new RegExp(filters.domain, 'i');
        }
      }

      // Salary range
      if (filters.salaryMin || filters.salaryMax) {
        if (filters.salaryMin) {
          query['compensation.salaryMin'] = { $gte: filters.salaryMin };
        }
        if (filters.salaryMax) {
          query['compensation.salaryMax'] = { $lte: filters.salaryMax };
        }
      }

      // Experience filter
      if (filters.experienceMin || filters.experienceMax) {
        if (filters.experienceMin) {
          query['requirements.yearsExperienceRequired'] = { $gte: filters.experienceMin };
        }
        if (filters.experienceMax) {
          query['requirements.yearsExperienceRequired'] = {
            ...(query['requirements.yearsExperienceRequired'] || {}),
            $lte: filters.experienceMax
          };
        }
      }

      // Other filters - only add if they have values
      if (filters.contractType) {
        query['jobDetails.contractType'] = filters.contractType;
      }
      if (filters.educationLevel) {
        query['requirements.educationLevel'] = filters.educationLevel;
      }
      if (filters.languages && filters.languages.length > 0) {
        query['requirements.languages'] = {
          $regex: new RegExp(filters.languages.join('|'), 'i')
        };
      }
    }

    // Build sort options
    let sortOptions: Record<string, any> = {};
    switch (filters?.sortBy) {
      case 'salary':
        sortOptions = {
          'compensation.salaryMax': -1,
          'compensation.salaryMin': -1
        };
        break;
      case 'experience':
        sortOptions = {
          'requirements.yearsExperienceRequired': -1
        };
        break;
      case 'newest':
      default:
        sortOptions = { createdAt: -1 };
    }

    // Add pagination with defaults
    const limit = filters?.limit || 20;
    const skip = filters?.skip || 0;

    try {
      // Execute query with count
      const jobs = await this.jobModel.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise description profilePicture')
        .lean()
        .exec();

      const total = await this.jobModel.countDocuments(query);

      const jobResponses = jobs.map(job => this.toJobResponse(job as unknown as PopulatedJobDocument));

      return {
        jobs: jobResponses,
        total,
        limit,
        skip
      };
    } catch (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }
  }

  async getCompanyJobs(companyId: string): Promise<JobListResponseDto> {
    try {
      const query = {
        companyId: new Types.ObjectId(companyId),
        isActive: true,
        expiresAt: { $gt: new Date() }
      };

      const jobs = await this.jobModel.find(query)
        .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise description profilePicture')
        .sort({ createdAt: -1 })
        .lean()
        .exec();

      const total = await this.jobModel.countDocuments(query);

      const jobResponses = jobs.map(job => this.toJobResponse(job as unknown as PopulatedJobDocument));

      return {
        jobs: jobResponses,
        total,
        limit: total,
        skip: 0
      };
    } catch (error) {
      throw new Error(`Failed to fetch company jobs: ${error.message}`);
    }
  }

  async getJobDetails(jobId: string): Promise<JobResponseDto> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId)
      .populate<{ companyId: CompanyRef }>('companyId', 'nomEntreprise description profilePicture')
      .exec();
    
    if (!job || job.expiresAt < new Date()) {
      throw new NotFoundException('Job not found or has expired');
    }

    return this.toJobResponse(job as unknown as PopulatedJobDocument);
  }

  async applyToJob(candidateId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job or candidate ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);
    if (job.applications.some(id => id.equals(candidateObjectId))) {
      return { message: 'You have already applied to this job.' };
    }

    await this.jobModel.findByIdAndUpdate(
      jobId,
      { $push: { applications: candidateObjectId } },
      { new: true }
    ).exec();

    return { message: 'Job application submitted successfully.' };
  }

  async getCompanyActiveJobCount(companyId: string): Promise<number> {
    try {
      return await this.jobModel.countDocuments({
        companyId: new Types.ObjectId(companyId),
        isActive: true
      });
    } catch (error) {
      return 0;
    }
  }

  async withdrawApplication(candidateId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job or candidate ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);
    if (!job.applications.some(id => id.equals(candidateObjectId))) {
      return { message: 'You have not applied to this job.' };
    }

    await this.jobModel.findByIdAndUpdate(
      jobId,
      { $pull: { applications: candidateObjectId } },
      { new: true }
    ).exec();

    return { message: 'Job application withdrawn successfully.' };
  }

  async getRemainingPosts(companyId: string): Promise<RemainingPostsResponseDto> {

    const activeJobCount = await this.getCompanyActiveJobCount(companyId);
    const maxFreeJobs = 5;
    const remainingPosts = Math.max(0, maxFreeJobs - activeJobCount);

    return {
      remainingPosts,
      totalAllowedPosts: maxFreeJobs,
      currentActivePosts: activeJobCount
    };
  }
}
