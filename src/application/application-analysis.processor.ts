import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application } from '../schemas/application.schema';
import { JobMatchAnalysisWrapperService } from './job-match-analysis-wrapper.service';
import { ConfigService } from '@nestjs/config';

@Processor('application-analysis')
export class ApplicationAnalysisProcessor {
  private readonly logger = new Logger(ApplicationAnalysisProcessor.name);

  constructor(
    @InjectModel(Application.name) 
    private readonly applicationModel: Model<Application>,
    private readonly jobMatchAnalysisService: JobMatchAnalysisWrapperService,
    private readonly configService: ConfigService
  ) {}

  @Process('analyze')
  async handleApplicationAnalysis(job: Job<{ applicationId: string }>) {
    try {
      const { applicationId } = job.data;
      this.logger.log(`Starting analysis for application ${applicationId}`);

      // Get the application
      const application = await this.applicationModel.findById(applicationId)
        .populate('candidat')
        .populate('poste');

      if (!application) {
        throw new Error(`Application ${applicationId} not found`);
      }

      this.logger.log('Starting Gemini-powered analysis...');
      
      // Perform analysis using JobMatchAnalysisService
      // Safely extract IDs from populated or non-populated fields
      const candidateId = (application.candidat && typeof application.candidat === 'object' && '_id' in application.candidat)
        ? application.candidat._id.toString()
        : (application.candidat as Types.ObjectId).toString();
      const jobId = (application.poste && typeof application.poste === 'object' && '_id' in application.poste)
        ? application.poste._id.toString()
        : (application.poste as Types.ObjectId).toString();
        
      await this.jobMatchAnalysisService.analyzeMatch(candidateId, jobId);

      this.logger.log(`Completed analysis for application ${applicationId}`);
    } catch (error) {
      this.logger.error(`Error processing application analysis job ${job.id}:`, error);
      throw error;
    }
  }
}