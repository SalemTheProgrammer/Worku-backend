import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application } from '../schemas/application.schema';
import { Candidate } from '../schemas/candidate.schema';
import { Job } from '../schemas/job.schema';

@Injectable()
export class QueueManagementService {
  private readonly logger = new Logger(QueueManagementService.name);

  constructor(
    @InjectQueue('application-analysis') private readonly analysisQueue: Queue,
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>,
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
  ) {}

  /**
   * Clean up all failed jobs and validate remaining jobs
   */
  async cleanupProblematicJobs(): Promise<{
    cleaned: number;
    validated: number;
    errors: string[];
  }> {
    const errors: string[] = [];
    let cleanedCount = 0;
    let validatedCount = 0;

    try {
      this.logger.log('🧹 Starting queue cleanup...');

      // 1. Remove all failed jobs
      const failedJobs = await this.analysisQueue.getJobs(['failed']);
      if (failedJobs.length > 0) {
        this.logger.log(`Found ${failedJobs.length} failed jobs to clean up`);
        
        for (const job of failedJobs) {
          try {
            await job.remove();
            cleanedCount++;
          } catch (error) {
            errors.push(`Failed to remove job ${job.id}: ${error.message}`);
          }
        }
      }

      // 2. Clean up old completed jobs (older than 24 hours)
      await this.analysisQueue.clean(24 * 60 * 60 * 1000, 'completed');

      // 3. Validate waiting jobs
      const waitingJobs = await this.analysisQueue.getJobs(['waiting', 'delayed']);
      this.logger.log(`Validating ${waitingJobs.length} waiting/delayed jobs...`);

      for (const job of waitingJobs) {
        try {
          const isValid = await this.validateJobData(job.data);
          if (!isValid) {
            await job.remove();
            cleanedCount++;
            this.logger.warn(`Removed invalid job ${job.id}`);
          } else {
            validatedCount++;
          }
        } catch (error) {
          errors.push(`Failed to validate job ${job.id}: ${error.message}`);
        }
      }

      // 4. Reset stuck applications
      await this.resetStuckApplications();

      this.logger.log(`✅ Cleanup completed: ${cleanedCount} cleaned, ${validatedCount} validated`);
      
      return {
        cleaned: cleanedCount,
        validated: validatedCount,
        errors
      };

    } catch (error) {
      this.logger.error(`Queue cleanup failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Validate job data integrity
   */
  private async validateJobData(jobData: any): Promise<boolean> {
    try {
      if (!jobData || !jobData.applicationId) {
        return false;
      }

      // Check if application exists
      const application = await this.applicationModel.findById(jobData.applicationId).exec();
      if (!application) {
        this.logger.warn(`Application ${jobData.applicationId} not found`);
        return false;
      }

      // Check if candidate exists
      const candidate = await this.candidateModel.findById(application.candidat).exec();
      if (!candidate) {
        this.logger.warn(`Candidate ${application.candidat} not found for application ${jobData.applicationId}`);
        return false;
      }

      // Check if job exists
      const job = await this.jobModel.findById(application.poste).exec();
      if (!job) {
        this.logger.warn(`Job ${application.poste} not found for application ${jobData.applicationId}`);
        return false;
      }

      return true;
    } catch (error) {
      this.logger.error(`Error validating job data: ${error.message}`);
      return false;
    }
  }

  /**
   * Reset applications that are stuck in 'en cours d\'analyse' status
   */
  private async resetStuckApplications(): Promise<void> {
    try {
      // Find applications stuck in analysis for more than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      
      const stuckApplications = await this.applicationModel.find({
        statut: 'en cours d\'analyse',
        updatedAt: { $lt: oneHourAgo }
      }).exec();

      if (stuckApplications.length > 0) {
        this.logger.log(`Found ${stuckApplications.length} stuck applications, resetting...`);
        
        await this.applicationModel.updateMany(
          {
            statut: 'en cours d\'analyse',
            updatedAt: { $lt: oneHourAgo }
          },
          {
            $set: {
              statut: 'en attente',
              'analyse.synthèseAdéquation.raison': 'Reset due to stuck analysis'
            }
          }
        ).exec();

        this.logger.log(`✅ Reset ${stuckApplications.length} stuck applications`);
      }
    } catch (error) {
      this.logger.error(`Failed to reset stuck applications: ${error.message}`);
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    return await this.analysisQueue.getJobCounts();
  }

  /**
   * Pause the queue
   */
  async pauseQueue(): Promise<void> {
    await this.analysisQueue.pause();
    this.logger.log('🚫 Queue paused');
  }

  /**
   * Resume the queue
   */
  async resumeQueue(): Promise<void> {
    await this.analysisQueue.resume();
    this.logger.log('▶️ Queue resumed');
  }
}