import { Injectable } from '@nestjs/common';
import { GetRecommendedJobsDto } from './dto/get-recommended-jobs.dto';
import { RecommendedJobsResponseDto } from './dto/recommended-jobs-response.dto';
import { BulkApplyResponseDto } from './dto/bulk-apply-response.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job, JobDocument } from '../schemas/job.schema';
import { Application, ApplicationDocument } from '../schemas/application.schema';

@Injectable()
export class RecommendedJobsService {
  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  async getRecommendedJobs(userId: string, dto: GetRecommendedJobsDto): Promise<RecommendedJobsResponseDto> {
    const { page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    // Find jobs the user has already applied for
    const appliedJobIds = await this.applicationModel
      .find({ candidate: userId })
      .distinct('job');

    // Query for active jobs excluding those already applied for
    const query = {
      status: 'active',
      _id: { $nin: appliedJobIds }
    };

    const jobs = await this.jobModel
      .find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await this.jobModel.countDocuments(query);

    return {
      data: jobs,
      meta: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async applyToAllRecommended(userId: string): Promise<BulkApplyResponseDto> {
    // Find jobs the user has already applied for
    const appliedJobIds = await this.applicationModel
      .find({ candidate: userId })
      .distinct('job');

    // Get all recommended jobs (without pagination)
    const recommendedJobs = await this.jobModel
      .find({
        status: 'active',
        _id: { $nin: appliedJobIds }
      });

    // Create applications for all recommended jobs
    const applications = recommendedJobs.map(job => ({
      candidate: userId,
      job: job._id,
      status: 'pending',
      submittedAt: new Date(),
    }));

    // Bulk insert the applications
    if (applications.length > 0) {
      await this.applicationModel.insertMany(applications);
    }

    return { appliedCount: applications.length };
  }
}