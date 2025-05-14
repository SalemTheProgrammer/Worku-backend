import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application } from '../../schemas/application.schema';
import { JobMatchAnalysisService } from '../job-match-analysis.service';

@Processor('application-analysis')
export class ApplicationAnalysisProcessor {
  private readonly logger = new Logger(ApplicationAnalysisProcessor.name);

  constructor(
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly jobMatchAnalysisService: JobMatchAnalysisService,
  ) {}

  @Process('analyze')
  async handleAnalysis(job: Job<{ applicationId: string }>) {
    try {
      const { applicationId } = job.data;
      this.logger.log(`Starting application analysis job ${job.id}`);
      this.logger.debug('Application details:', await this.applicationModel.findById(applicationId).populate(['candidat', 'poste', 'companyId']).exec());

      const application = await this.applicationModel.findById(applicationId);
      if (!application) {
        throw new Error('Application not found');
      }

      const analysisResult = await this.jobMatchAnalysisService.analyzeMatch(
        application.candidat.toString(),
        application.poste.toString()
      );

      this.logger.debug('Analysis results:', analysisResult);

      // Update application with analysis results and status
      await this.applicationModel.findByIdAndUpdate(
        applicationId,
        {
          $set: {
            statut: 'analysé',
            dateAnalyse: new Date(),
            'analyse.scoreDAdéquation': {
              global: analysisResult.resume.score,
              compétences: analysisResult.resume.correspondance.competences,
              expérience: analysisResult.resume.correspondance.experience,
              formation: analysisResult.resume.correspondance.formation,
              langues: analysisResult.resume.correspondance.langues
            },
            'analyse.matchedKeywords': analysisResult.resume.matchedKeywords,
            'analyse.highlightsToStandOut': analysisResult.resume.highlightsToStandOut,
            'analyse.signauxAlerte': analysisResult.signauxAlerte
          }
        }
      ).exec();

      this.logger.debug('Analysis result:', analysisResult);
      return analysisResult;

    } catch (error) {
      this.logger.error(`Error processing application analysis job ${job.id}:`, error);
      // Maintain the 'en cours d\'analyse' status to show there was an error
      await this.applicationModel.findByIdAndUpdate(
        job.data.applicationId,
        { 
          $set: { 
            statut: 'en cours d\'analyse',
            'analyse.synthèseAdéquation.raison': 'Erreur lors de l\'analyse'
          }
        }
      ).exec();
      throw error;
    }
  }
}