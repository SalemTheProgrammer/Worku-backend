import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JobView, JobViewDocument } from '../../schemas/job-view.schema';
import { Job, JobDocument } from '../../schemas/job.schema';
import { CacheService } from '../../cache/cache.service';

@Injectable()
export class JobViewService {
  private readonly RATE_LIMIT_PREFIX = 'ratelimit:job';
  private readonly RATE_LIMIT_WINDOW = 900; // 15 minutes in seconds
  private readonly RATE_LIMIT_MAX_REQUESTS = 100;

  constructor(
    @InjectModel(JobView.name) private jobViewModel: Model<JobViewDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    private cacheService: CacheService
  ) {}

  async recordJobView(jobId: string, ipAddress: string): Promise<{ message: string }> {
    const canProceed = await this.checkRateLimit(ipAddress);
    if (!canProceed) {
      throw new BadRequestException('Rate limit exceeded. Please try again later.');
    }

    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const sevenHoursAgo = new Date(Date.now() - 7 * 60 * 60 * 1000);
    
    const existingView = await this.jobViewModel.findOne({
      jobId,
      ipAddress,
      viewedAt: { $gt: sevenHoursAgo }
    }).exec();

    if (existingView) {
      return { message: 'View already recorded for this IP within the last 7 hours' };
    }

    await this.jobViewModel.findOneAndUpdate(
      { jobId, ipAddress },
      { viewedAt: new Date() },
      { upsert: true, new: true }
    );

    await this.jobModel.findByIdAndUpdate(
      jobId,
      { $inc: { seenCount: 1 } }
    );

    return { message: 'Job view recorded successfully' };
  }

  private async checkRateLimit(ip: string): Promise<boolean> {
    const key = `${this.RATE_LIMIT_PREFIX}:${ip}`;
    const count = await this.cacheService.get<number>(key) || 0;
    
    if (count >= this.RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    await this.cacheService.set(key, count + 1, this.RATE_LIMIT_WINDOW);
    return true;
  }

  async getJobViewCount(jobId: string): Promise<number> {
    return await this.jobViewModel.countDocuments({ jobId }).exec();
  }
}