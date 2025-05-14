import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { ApplicationAnalysisProcessor } from './jobs/application-analysis.processor';
import { JobMatchAnalysisService } from './job-match-analysis.service';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { GeminiModule } from '../services/gemini.module';
import { EmailModule } from '../email/email.module';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'application-analysis',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 1000
        },
        removeOnComplete: false,
        timeout: 300000 // 5 minutes
      },
      limiter: {
        max: 5, // Process max 5 jobs per time window
        duration: 5000 // Time window in ms
      },
      settings: {
        stalledInterval: 10000, // How often check for stalled jobs (ms)
        maxStalledCount: 2, // Max times a job can be marked as stalled
        lockDuration: 30000, // Key expiration time for job locks (ms)
        lockRenewTime: 15000, // Interval for lock renewal (ms)
        retryProcessDelay: 5000 // Delay between attempts to process jobs
      }
    }),
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    GeminiModule,
    EmailModule,
  ],
  providers: [
    ApplicationAnalysisProcessor,
    JobMatchAnalysisService,
    ConfigService,
  ],
  exports: [BullModule],
})
export class ApplicationQueueModule implements OnModuleInit {
  private readonly logger = new Logger(ApplicationQueueModule.name);
  
  constructor(
    private readonly processor: ApplicationAnalysisProcessor,
    private readonly configService: ConfigService,
    @InjectQueue('application-analysis') private readonly analysisQueue: Queue
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('\n=== INITIALIZING ANALYSIS QUEUE ===');

      // Check processor registration
      if (!this.processor) {
        throw new Error('Analysis processor not properly injected');
      }
      this.logger.log('✅ Processor registered');

      // Check queue readiness
      const isReady = await this.analysisQueue.isReady();
      if (!isReady) {
        throw new Error('Queue is not ready');
      }
      this.logger.log('✅ Queue is ready');

      // Clean up any stalled jobs from previous runs
      await this.analysisQueue.clean(30000, 'wait');
      const stalledJobs = await this.analysisQueue.getJobs(['failed', 'completed']);
      if (stalledJobs.length > 0) {
        this.logger.warn(`⚠️ Found ${stalledJobs.length} problematic jobs`);
        for (const job of stalledJobs) {
          this.logger.warn(`- Job ${job.id}: ${job.failedReason || 'unknown error'}`);
        }
      }

      // Get current queue status
      const counts = await this.analysisQueue.getJobCounts();
      this.logger.log('\nCurrent Queue Status:');
      this.logger.log(`- Waiting: ${counts.waiting}`);
      this.logger.log(`- Active: ${counts.active}`);
      this.logger.log(`- Failed: ${counts.failed}`);
      this.logger.log(`- Completed: ${counts.completed}`);

      // Set up queue event listeners with proper typing
      this.analysisQueue
        .on('waiting', (jobId: string) => {
          this.logger.log(`⏳ Job ${jobId} is waiting`);
        })
        .on('active', (job: BullJob<any>) => {
          this.logger.log(`🔄 Job ${job.id} is being processed`);
        })
        .on('completed', (job: BullJob<any>) => {
          this.logger.log(`✅ Job ${job.id} completed successfully`);
        })
        .on('failed', (job: BullJob<any>, error: Error) => {
          this.logger.error(`❌ Job ${job.id} failed:`, error.message);
        })
        .on('progress', (job: BullJob<any>, progress: number) => {
          this.logger.log(`📊 Job ${job.id} progress: ${progress}%`);
        })
        .on('error', (error: Error) => {
          this.logger.error('❌ Queue error:', error.message);
        });

      this.logger.log('\n✅ Queue initialization completed');
      this.logger.log('==================================\n');

    } catch (error) {
      this.logger.error('\n❌ Queue initialization failed:', error);
      this.logger.error('==================================\n');
      throw error;
    }
  }
}