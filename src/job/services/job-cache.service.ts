import { Injectable } from '@nestjs/common';
import { CacheService } from '../../cache/cache.service';
import { JobListResponseDto, JobResponseDto } from '../dto/job-response.dto';
import { FilterJobsDto } from '../dto/filter-jobs.dto';
import { Interval } from '@nestjs/schedule';

@Injectable()
export class JobCacheService {
  private readonly JOB_LIST_CACHE_PREFIX = 'job:list';
  private readonly JOB_DETAIL_CACHE_PREFIX = 'job:detail';

  constructor(private cacheService: CacheService) {}

  @Interval(900000) // 15 minutes in milliseconds
  async refreshJobCache(jobs: JobListResponseDto): Promise<void> {
    try {
      const filters = {} as FilterJobsDto;
      const cacheKey = this.generateJobListCacheKey(filters);
      await this.cacheService.set(cacheKey, jobs);
      await this.cacheService.setTimestamp(cacheKey);
    } catch (error) {
      console.error('Failed to refresh job cache:', error);
    }
  }

  async getJobListFromCache(filters: FilterJobsDto): Promise<JobListResponseDto | null> {
    const cacheKey = this.generateJobListCacheKey(filters);
    const cachedJobs = await this.cacheService.get<JobListResponseDto>(cacheKey);
    
    if (cachedJobs && !(await this.cacheService.isStale(cacheKey))) {
      return cachedJobs;
    }
    return null;
  }

  async setJobListCache(filters: FilterJobsDto, jobs: JobListResponseDto): Promise<void> {
    const cacheKey = this.generateJobListCacheKey(filters);
    await this.cacheService.set(cacheKey, jobs);
    await this.cacheService.setTimestamp(cacheKey);
  }

  async getJobDetailsFromCache(jobId: string): Promise<JobResponseDto | null> {
    const cacheKey = this.generateJobDetailCacheKey(jobId);
    const cachedJob = await this.cacheService.get<JobResponseDto>(cacheKey);
    
    if (cachedJob && !(await this.cacheService.isStale(cacheKey))) {
      return cachedJob;
    }
    return null;
  }

  async setJobDetailsCache(jobId: string, job: JobResponseDto): Promise<void> {
    const cacheKey = this.generateJobDetailCacheKey(jobId);
    await this.cacheService.set(cacheKey, job);
    await this.cacheService.setTimestamp(cacheKey);
  }

  async invalidateJobListCache(): Promise<void> {
    await this.cacheService.del(this.JOB_LIST_CACHE_PREFIX);
  }

  async invalidateJobCache(jobId: string): Promise<void> {
    await this.cacheService.del(this.generateJobDetailCacheKey(jobId));
    await this.invalidateJobListCache();
  }

  private generateJobListCacheKey(filters: FilterJobsDto): string {
    return this.cacheService.generateCacheKey(this.JOB_LIST_CACHE_PREFIX, filters);
  }

  private generateJobDetailCacheKey(jobId: string): string {
    return `${this.JOB_DETAIL_CACHE_PREFIX}:${jobId}`;
  }
}