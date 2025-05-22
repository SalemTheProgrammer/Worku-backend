import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
      await this.jobMatchAnalysisService.analyzeMatch(
        application.candidat._id.toString(),
        application.poste._id.toString()
      );

      this.logger.log(`Completed analysis for application ${applicationId}`);
    } catch (error) {
      this.logger.error(`Error processing application analysis job ${job.id}:`, error);
      throw error;
    }
  }
}