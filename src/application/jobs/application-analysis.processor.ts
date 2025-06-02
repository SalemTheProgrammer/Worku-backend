import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application } from '../../schemas/application.schema';
import { JobMatchAnalysisWrapperService } from '../job-match-analysis-wrapper.service';

@Processor('application-analysis')
export class ApplicationAnalysisProcessor {
  private readonly logger = new Logger(ApplicationAnalysisProcessor.name);

  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly jobMatchAnalysisService: JobMatchAnalysisWrapperService,
  ) {}

  @Process('analyze')
  async handleAnalysis(job: Job<{ applicationId: string }>) {
    try {
      const { applicationId } = job.data;
      this.logger.log(`Starting application analysis job ${job.id} for application ${applicationId}`);
      
      // Validate input data
      if (!applicationId) {
        throw new Error('Missing applicationId in job data');
      }

      // Fetch application with populated references
      const application = await this.applicationModel
        .findById(applicationId)
        .populate(['candidat', 'poste', 'companyId'])
        .exec();
        
      if (!application) {
        throw new Error(`Application not found with ID: ${applicationId}`);
      }

      // Validate required references
      if (!application.candidat) {
        throw new Error('File not accessible: Candidate reference is missing or invalid');
      }

      if (!application.poste) {
        throw new Error('File not accessible: Job position reference is missing or invalid');
      }

      this.logger.log(`Processing application for candidate ${application.candidat} and job ${application.poste}`);

      const analysisResult = await this.jobMatchAnalysisService.analyzeMatch(
        application.candidat.toString(),
        application.poste.toString()
      );

      this.logger.debug('Analysis completed successfully');

      // Update application with analysis results and status
      await this.applicationModel.findByIdAndUpdate(
        applicationId,
        {
          $set: {
            statut: 'analysé',
            dateAnalyse: new Date(),
            'analyse.scoreDAdéquation': {
              global: analysisResult.resume?.score || 0,
              compétences: analysisResult.resume?.correspondance?.competences || 0,
              expérience: analysisResult.resume?.correspondance?.experience || 0,
              formation: analysisResult.resume?.correspondance?.formation || 0,
              langues: analysisResult.resume?.correspondance?.langues || 0
            },
            'analyse.matchedKeywords': analysisResult.resume?.matchedKeywords || [],
            'analyse.highlightsToStandOut': analysisResult.resume?.highlightsToStandOut || [],
            'analyse.signauxAlerte': analysisResult.signauxAlerte || []
          }
        }
      ).exec();

      this.logger.log(`Successfully completed analysis for job ${job.id}`);
      return analysisResult;

    } catch (error) {
      const errorMessage = error.message || 'Unknown error occurred';
      this.logger.error(`Error processing application analysis job ${job.id}: ${errorMessage}`);
      
      // Update application status with specific error information
      try {
        await this.applicationModel.findByIdAndUpdate(
          job.data.applicationId,
          {
            $set: {
              statut: 'échec_analyse',
              dateAnalyse: new Date(),
              'analyse.synthèseAdéquation.raison': errorMessage,
              'analyse.errorDetails': {
                timestamp: new Date(),
                jobId: job.id,
                error: errorMessage
              }
            }
          }
        ).exec();
      } catch (updateError) {
        this.logger.error(`Failed to update application status: ${updateError.message}`);
      }
      
      throw new Error(errorMessage);
    }
  }
}