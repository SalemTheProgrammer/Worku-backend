import { BullModule, InjectQueue } from '@nestjs/bull';
import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { Job as BullJob } from 'bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { ApplicationAnalysisProcessor } from './jobs/application-analysis.processor';
import { JobMatchAnalysisWrapperService } from './job-match-analysis-wrapper.service';
import { JobMatchModule } from './job-match/job-match.module';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { GeminiModule } from '../services/gemini.module';
import { EmailModule } from '../email/email.module';
import { AuthModule } from '../auth/auth.module';
import { ConfigService } from '@nestjs/config';
import { Queue } from 'bull';
import { QueueManagementService } from './queue-management.service';
import { QueueManagementController } from './queue-management.controller';

@Module({
  controllers: [QueueManagementController],
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
    AuthModule,
    JobMatchModule,
  ],
  providers: [
    ApplicationAnalysisProcessor,
    JobMatchAnalysisWrapperService,
    QueueManagementService,
    ConfigService,
  ],
  exports: [BullModule, QueueManagementService],
})
export class ApplicationQueueModule implements OnModuleInit {
  private readonly logger = new Logger(ApplicationQueueModule.name);
  
  constructor(
    private readonly processor: ApplicationAnalysisProcessor,
    private readonly configService: ConfigService,
    private readonly queueManagement: QueueManagementService,
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

      // Clean up problematic jobs using the queue management service
      this.logger.log('🧹 Running queue cleanup...');
      const cleanupResult = await this.queueManagement.cleanupProblematicJobs();
      
      if (cleanupResult.cleaned > 0) {
        this.logger.log(`✅ Cleaned up ${cleanupResult.cleaned} problematic jobs`);
      }
      
      if (cleanupResult.validated > 0) {
        this.logger.log(`✅ Validated ${cleanupResult.validated} waiting jobs`);
      }
      
      if (cleanupResult.errors.length > 0) {
        this.logger.warn(`⚠️ ${cleanupResult.errors.length} cleanup errors occurred`);
        cleanupResult.errors.slice(0, 3).forEach(error => {
          this.logger.warn(`- ${error}`);
        });
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