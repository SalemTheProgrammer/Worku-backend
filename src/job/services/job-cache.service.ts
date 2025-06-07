import { Injectable, Logger } from '@nestjs/common';
import { FilterJobsDto } from '../dto/filter-jobs.dto';
import { JobListResponseDto, JobResponseDto } from '../dto/job-response.dto';

interface CacheEntry {
  data: any;
  expiry: number;
}

@Injectable()
export class JobCacheService {
  private readonly logger = new Logger(JobCacheService.name);
  private readonly JOB_LIST_CACHE_PREFIX = 'job_list:';
  private readonly JOB_DETAILS_CACHE_PREFIX = 'job_details:';
  private readonly JOB_LIST_TTL = 300000; // 5 minutes in ms
  private readonly JOB_DETAILS_TTL = 600000; // 10 minutes in ms
  private readonly cache = new Map<string, CacheEntry>();

  constructor() {
    // Clean up expired cache entries periodically
    setInterval(() => this.cleanupCache(), 60000); // 1 minute
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now > value.expiry) {
        this.cache.delete(key);
      }
    }
  }

  private createCacheKey(filters: FilterJobsDto): string {
    // Create deterministic cache key from filters
    const keyParts = [
      filters.keyword || '',
      filters.location || '',
      filters.contractType || '',
      filters.domain || '',
      filters.salaryMin || '',
      filters.salaryMax || '',
      filters.experienceMin || '',
      filters.experienceMax || '',
      filters.educationLevel || '',
      filters.languages?.join(',') || '',
      filters.sortBy || '',
      filters.limit || 20,
      filters.skip || 0,
      filters.companyId || '',
      filters.remote || false,
      filters.onlyActive || false
    ];
    
    return this.JOB_LIST_CACHE_PREFIX + Buffer.from(keyParts.join('|')).toString('base64');
  }

  async refreshJobCache(jobs: JobListResponseDto): Promise<void> {
    try {
      const now = Date.now();
      
      // Cache individual job details
      jobs.jobs.forEach(job => {
        if (job.id) {
          const key = this.JOB_DETAILS_CACHE_PREFIX + job.id;
          this.cache.set(key, {
            data: job,
            expiry: now + this.JOB_DETAILS_TTL
          });
        }
      });
      
      this.logger.debug(`Refreshed cache for ${jobs.jobs.length} jobs`);
    } catch (error) {
      this.logger.warn('Failed to refresh job cache:', error);
    }
  }

  async getJobListFromCache(filters: FilterJobsDto): Promise<JobListResponseDto | null> {
    try {
      const cacheKey = this.createCacheKey(filters);
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        this.logger.debug(`Cache hit for job list: ${cacheKey}`);
        return cached.data;
      }
      
      // Remove expired entry
      if (cached) {
        this.cache.delete(cacheKey);
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Failed to get job list from cache:', error);
      return null;
    }
  }

  async setJobListCache(filters: FilterJobsDto, jobs: JobListResponseDto): Promise<void> {
    try {
      const cacheKey = this.createCacheKey(filters);
      this.cache.set(cacheKey, {
        data: jobs,
        expiry: Date.now() + this.JOB_LIST_TTL
      });
      this.logger.debug(`Cached job list: ${cacheKey}`);
    } catch (error) {
      this.logger.warn('Failed to cache job list:', error);
    }
  }

  async getJobDetailsFromCache(jobId: string): Promise<JobResponseDto | null> {
    try {
      const cacheKey = this.JOB_DETAILS_CACHE_PREFIX + jobId;
      const cached = this.cache.get(cacheKey);
      
      if (cached && Date.now() < cached.expiry) {
        this.logger.debug(`Cache hit for job details: ${jobId}`);
        return cached.data;
      }
      
      // Remove expired entry
      if (cached) {
        this.cache.delete(cacheKey);
      }
      
      return null;
    } catch (error) {
      this.logger.warn('Failed to get job details from cache:', error);
      return null;
    }
  }

  async setJobDetailsCache(jobId: string, job: JobResponseDto): Promise<void> {
    try {
      const cacheKey = this.JOB_DETAILS_CACHE_PREFIX + jobId;
      this.cache.set(cacheKey, {
        data: job,
        expiry: Date.now() + this.JOB_DETAILS_TTL
      });
      this.logger.debug(`Cached job details: ${jobId}`);
    } catch (error) {
      this.logger.warn('Failed to cache job details:', error);
    }
  }

  async invalidateJobCache(jobId: string): Promise<void> {
    try {
      // Remove job details cache
      const detailsKey = this.JOB_DETAILS_CACHE_PREFIX + jobId;
      this.cache.delete(detailsKey);
      
      // Remove all job list caches (they might contain this job)
      for (const key of this.cache.keys()) {
        if (key.startsWith(this.JOB_LIST_CACHE_PREFIX)) {
          this.cache.delete(key);
        }
      }
      
      this.logger.debug(`Invalidated cache for job: ${jobId}`);
    } catch (error) {
      this.logger.warn('Failed to invalidate job cache:', error);
    }
  }

  async invalidateJobListCache(): Promise<void> {
    try {
      let count = 0;
      
      for (const key of this.cache.keys()) {
        if (key.startsWith(this.JOB_LIST_CACHE_PREFIX)) {
          this.cache.delete(key);
          count++;
        }
      }
      
      if (count > 0) {
        this.logger.debug(`Invalidated ${count} job list cache entries`);
      }
    } catch (error) {
      this.logger.warn('Failed to invalidate job list cache:', error);
    }
  }

  async clearAllJobCache(): Promise<void> {
    try {
      let count = 0;
      
      for (const key of this.cache.keys()) {
        if (key.startsWith(this.JOB_LIST_CACHE_PREFIX) || key.startsWith(this.JOB_DETAILS_CACHE_PREFIX)) {
          this.cache.delete(key);
          count++;
        }
      }
      
      if (count > 0) {
        this.logger.debug(`Cleared ${count} job cache entries`);
      }
    } catch (error) {
      this.logger.warn('Failed to clear job cache:', error);
    }
  }

  async getCacheStats(): Promise<{ listCacheCount: number; detailsCacheCount: number }> {
    try {
      let listCacheCount = 0;
      let detailsCacheCount = 0;
      
      for (const key of this.cache.keys()) {
        if (key.startsWith(this.JOB_LIST_CACHE_PREFIX)) {
          listCacheCount++;
        } else if (key.startsWith(this.JOB_DETAILS_CACHE_PREFIX)) {
          detailsCacheCount++;
        }
      }
      
      return { listCacheCount, detailsCacheCount };
    } catch (error) {
      this.logger.warn('Failed to get cache stats:', error);
      return { listCacheCount: 0, detailsCacheCount: 0 };
    }
  }
}