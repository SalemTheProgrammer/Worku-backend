import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document, Types } from 'mongoose';
import { Application } from '../schemas/application.schema';
import { Job } from '../schemas/job.schema';
import { Candidate } from '../schemas/candidate.schema';
import { Company } from '../schemas/company.schema';
import { JobMatchAnalysisService } from './job-match-analysis.service';
import { OnQueueActive, OnQueueCompleted, OnQueueFailed, OnQueueStalled, Process, Processor } from '@nestjs/bull';
import { Job as BullJob } from 'bull';
import { EmailService } from '../email/email.service';

// Define types for populated documents
type PopulatedCandidate = Document<unknown, any, Candidate> & Candidate;
type PopulatedJob = Document<unknown, any, Job> & Job;
type PopulatedCompany = Document<unknown, any, Company> & Company;

// Analysis response types
interface AnalysisCorrespondance {
  competences: number;
  experience: number;
  formation: number;
}

interface AnalysisSignal {
  type: string;
  probleme: string;
  severite: 'faible' | 'moyenne' | 'élevée';
  score?: number;
}

interface AnalysisResume {
  score: number;
  correspondance: AnalysisCorrespondance;
  suggestions: string[];
}

interface AnalysisResponse {
  resume: AnalysisResume;
  signauxAlerte: AnalysisSignal[];
}

interface PopulatedApplication {
  _id: Types.ObjectId;
  candidat: PopulatedCandidate & { _id: Types.ObjectId };
  poste: PopulatedJob & { _id: Types.ObjectId };
  companyId: PopulatedCompany & { _id: Types.ObjectId };
  datePostulation: Date;
  dateAnalyse?: Date;
  statut: string;
  analyse?: {
    correspondance: {
      globale: number;
      competences: number;
      experience: number;
      education: number;
    };
    analyseCompetences: {
      competencesCorrespondantes: Array<{
        nom: string;
        niveau: string;
        correspondance: number;
        importance: string;
      }>;
      competencesManquantes: Array<{
        nom: string;
        importance: string;
        recommendation: string;
      }>;
    };
    analyseExperience: {
      annéesRelevantes: number;
      alignementPoste: number;
      pointsForts: string[];
      domainesAmélioration: string[];
      experiencesClés: string[];
    };
    analyseFormation: {
      pertinence: number;
      détailsAlignement: string;
      certificationsValeur: number;
    };
    recommendations: {
      prioritaires: string[];
      développementProfessionnel: string[];
      prochaineMission: string;
    };
    synthèse: {
      pointsForts: string[];
      pointsAmélioration: string[];
      conclusionGénérale: string;
    };
  };
}

@Processor('application-analysis')
@Injectable()
export class ApplicationAnalysisWorker {
  private readonly logger = new Logger(ApplicationAnalysisWorker.name);

  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    private readonly jobMatchAnalysisService: JobMatchAnalysisService,
    private readonly emailService: EmailService
  ) {
    this.logger.log('Analysis worker initialized');
  }

  @OnQueueActive()
  onActive(job: BullJob) {
    this.logger.log(`🚀 Starting job ${job.id} for application: ${job.data.applicationId}`);
  }

  @OnQueueCompleted()
  onCompleted(job: BullJob, result: any) {
    this.logger.log(`✅ Job ${job.id} completed successfully`);
    this.logger.debug('Analysis result:', result);
  }

  @OnQueueFailed()
  onFailed(job: BullJob, error: Error) {
    this.logger.error(`❌ Job ${job.id} failed:`, error);
    this.logger.error('Job data:', job.data);
    this.logger.error('Stack:', error.stack);
  }

  @OnQueueStalled()
  onStalled(job: BullJob) {
    this.logger.warn(`⚠️ Job ${job.id} has stalled and will be retried`);
  }

  @Process('analyze')
  async processAnalysis(job: BullJob<{ applicationId: string }>): Promise<void> {
    const { applicationId } = job.data;
    const startTime = new Date();
    this.logger.log('=== ANALYSIS JOB STARTED ===');
    this.logger.log(`Application: ${applicationId}`);
    this.logger.log(`Started at: ${startTime.toISOString()}`);
    this.logger.log('===========================');

    try {
      this.logger.log('🔍 Fetching application data...');
      const application = await this.applicationModel
        .findById(applicationId)
        .populate<{ candidat: PopulatedCandidate }>('candidat')
        .populate<{ poste: PopulatedJob }>('poste')
        .populate<{ companyId: PopulatedCompany }>('companyId')
        .lean<PopulatedApplication>()
        .exec();

      if (!application) {
        this.logger.error(`❌ Application ${applicationId} not found`);
        throw new Error(`Application ${applicationId} not found`);
      }

      this.logger.log('📄 Application data fetched successfully');
      this.logger.debug('Application details:', application);

      this.logger.log('🧠 Starting job-candidate match analysis...');
      const analysis = await this.jobMatchAnalysisService.analyzeMatch(
        application.candidat._id.toString(),
        application.poste._id.toString()
      );
      this.logger.log('✅ Analysis completed');
      this.logger.debug('Analysis results:', analysis);

      const competencesCorrespondantes = analysis.signauxAlerte
        .filter(alert => alert.type === 'Compétence' && alert.severite !== 'élevée')
        .map(alert => ({
          nom: alert.probleme,
          niveau: 'Démontré',
          correspondance: alert.score || 0,
          importance: alert.severite === 'faible' ? 'souhaitable' : 'préféré'
        }));

      const competencesManquantes = analysis.signauxAlerte
        .filter(alert => alert.type === 'Compétence' && alert.severite === 'élevée')
        .map(alert => ({
          nom: alert.probleme,
          importance: 'critique',
          recommendation: 'Formation recommandée'
        }));

      const pointsFortsExperience = analysis.signauxAlerte
        .filter(alert => alert.type === 'Expérience' && alert.severite === 'faible')
        .map(alert => alert.probleme);

      const domainesAméliorationExperience = analysis.signauxAlerte
        .filter(alert => alert.type === 'Expérience' && alert.severite === 'élevée')
        .map(alert => alert.probleme);

      const pointsFortsGénéraux = analysis.signauxAlerte
        .filter(alert => alert.severite === 'faible')
        .map(alert => alert.probleme);

      const pointsAméliorationGénéraux = analysis.signauxAlerte
        .filter(alert => alert.severite === 'élevée')
        .map(alert => alert.probleme);

      this.logger.log('📝 Saving analysis results to database...');

      await this.applicationModel.findByIdAndUpdate(applicationId, {
        dateAnalyse: new Date(),
        statut: 'analysé',
        analyse: {
          correspondance: {
            globale: analysis.resume?.score || 0,
            competences: analysis.resume?.correspondance?.competences || 0,
            experience: analysis.resume?.correspondance?.experience || 0,
            education: analysis.resume?.correspondance?.formation || 0
          },
          analyseCompetences: {
            competencesCorrespondantes,
            competencesManquantes
          },
          analyseExperience: {
            annéesRelevantes: application.poste.requirements?.yearsExperienceRequired,
            alignementPoste: analysis.resume?.correspondance?.experience || 0,
            pointsForts: pointsFortsExperience,
            domainesAmélioration: domainesAméliorationExperience,
            experiencesClés: []
          },
          analyseFormation: {
            pertinence: analysis.resume?.correspondance?.formation || 0,
            détailsAlignement: analysis.signauxAlerte.find(alert => alert.type === 'Formation')?.probleme || '',
            certificationsValeur: 0
          },
          recommendations: {
            prioritaires: analysis.resume?.suggestions?.slice(0, 3) || [],
            développementProfessionnel: analysis.resume?.suggestions?.slice(3) || [],
            prochaineMission: ''
          },
          synthèse: {
            pointsForts: pointsFortsGénéraux,
            pointsAmélioration: pointsAméliorationGénéraux,
            conclusionGénérale:
              (analysis.resume?.score || 0) >= 70
                ? `Score global: ${analysis.resume?.score || 0}%. Profil bien adapté au poste.`
                : `Score global: ${analysis.resume?.score || 0}%. Des améliorations sont nécessaires.`
          }
        }
      });

      this.logger.log('📩 Sending analysis results by email...');
      await this.emailService.sendAnalysisResults(application.candidat.email, {
        jobTitle: application.poste.title,
        companyName: application.companyId.nomEntreprise,
        score: analysis.resume?.score || 0,
        pointsForts: pointsFortsGénéraux,
        pointsAmélioration: pointsAméliorationGénéraux
      });

      const endTime = new Date();
      const duration = (endTime.getTime() - startTime.getTime()) / 1000;
      
      this.logger.log('=== ANALYSIS COMPLETED ===');
      this.logger.log(`✅ Application: ${applicationId}`);
      this.logger.log(`⏱️ Duration: ${duration.toFixed(2)}s`);
      this.logger.log(`🕒 Finished: ${endTime.toISOString()}`);
      this.logger.log('=========================');
    } catch (error) {
      this.logger.error('=== ANALYSIS FAILED ===');
      this.logger.error(`❌ Application: ${applicationId}`);
      this.logger.error(`❌ Error: ${error.message}`);
      this.logger.error(`❌ Stack: ${error.stack}`);
      this.logger.error('=======================');

      try {
        await this.applicationModel.findByIdAndUpdate(applicationId, { statut: 'erreur_analyse' });
        this.logger.warn(`⚠️ Application ${applicationId} marked as failed`);
      } catch (updateError) {
        this.logger.error(`❌ Failed to update application status: ${updateError.message}`);
      }

      throw error; // Let Bull know the job failed
    }
  }
}
