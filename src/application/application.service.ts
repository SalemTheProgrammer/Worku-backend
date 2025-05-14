import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Job, JobDocument } from '../schemas/job.schema';
import { Candidate } from '../schemas/candidate.schema';
import { Company } from '../schemas/company.schema';
import {
  ApplicationResponse,
  IApplicationService,
  GetApplicationsResult
} from './interfaces/application.interface';
import { FilterApplicationsDto } from './dto/filter-applications.dto';
import { EmailService } from '../email/email.service';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
@Injectable()
export class ApplicationService implements IApplicationService {
  private readonly logger = new Logger(ApplicationService.name);

  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<JobDocument>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    private readonly emailService: EmailService,
    @InjectQueue('application-analysis')
    private readonly analysisQueue: Queue
  ) { }

  async deleteAllApplications(): Promise<{ deletedCount: number }> {
    try {
      const result = await this.applicationModel.deleteMany({}).exec();
      this.logger.log(`Successfully deleted ${result.deletedCount} applications`);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.logger.error('Error deleting applications:', error);
      throw new HttpException(
        'Error deleting applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createApplication(candidateId: string, jobId: string): Promise<ApplicationResponse> {
    console.log('\n=== NEW APPLICATION SUBMISSION ===');
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Candidate: ${candidateId}`);
    console.log(`Job: ${jobId}`);
    console.log('================================\n');

    const session = await this.applicationModel.startSession();
    session.startTransaction();

    try {
      const existingApplication = await this.applicationModel.findOne({
        candidat: new Types.ObjectId(candidateId),
        poste: new Types.ObjectId(jobId)
      }).session(session);

      if (existingApplication) {
        throw new HttpException(
          'You have already applied for this position',
          HttpStatus.BAD_REQUEST
        );
      }

      const [job, candidate] = await Promise.all([
        this.jobModel.findById(jobId).session(session),
        this.candidateModel.findById(candidateId).session(session)
      ]);

      if (!job) {
        throw new HttpException('Job posting not found', HttpStatus.NOT_FOUND);
      }
      if (!candidate) {
        throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
      }

      const company = await this.companyModel.findById(job.companyId).session(session);
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      // Initialize with analysis pending status
      const applicationData = {
        candidat: new Types.ObjectId(candidateId),
        poste: new Types.ObjectId(jobId),
        companyId: job.companyId,
        datePostulation: new Date(),
        statut: 'en_attente',
        analyse: {
          scoreDAdéquation: {
            global: 0,
            compétences: 0,
            expérience: false,
            formation: false,
            langues: 0
          },
          matchedKeywords: [],
          highlightsToStandOut: [],
          signauxAlerte: [],
          synthèseAdéquation: {
            recommandé: false,
            niveauAdéquation: 'Non évalué',
            raison: 'En attente d\'analyse',
            détailsAdéquation: {
              adéquationCompétences: { niveau: 'Non évalué', détails: [] },
              adéquationExpérience: { niveau: 'Non évalué', détails: [] },
              adéquationFormation: { niveau: 'Non évalué', détails: [] }
            }
          },
          recommandationsRecruteur: {
            décision: 'En attente',
            actionSuggérée: 'En attente d\'analyse',
            retourCandidat: []
          }
        }
      };

      const newApplication = await this.applicationModel.create([applicationData], { session });
      const createdApp = newApplication[0];

      await this.jobModel.findByIdAndUpdate(
        jobId,
        { $addToSet: { applications: new Types.ObjectId(candidateId) } },
        { session }
      );

      await session.commitTransaction();
      console.log('\n✅ Application saved successfully');
      console.log(`Application ID: ${createdApp._id}`);
      console.log('Starting background tasks...\n');

      // Queue background tasks
      setImmediate(async () => {
        // console.log('📧 Sending confirmation email...');
        try {
          // await this.emailService.sendApplicationConfirmation(candidate.email, {
          //   jobTitle: job.title,
          //   companyName: company.nomEntreprise
          // });

          // console.log('✉️ Confirmation email sent');
          console.log('\n🔄 Checking Redis connection...');
          const queueHealth = await this.analysisQueue.isReady();
          if (!queueHealth) {
            throw new Error('Analysis queue is not ready');
          }
          console.log('✅ Queue is ready');

          // console.log('🔄 Queueing analysis job...');
          // const jobCounts = await this.analysisQueue.getJobCounts();
          // console.log('Current Queue Status:', {
          //   waiting: jobCounts.waiting,
          //   active: jobCounts.active,
          //   completed: jobCounts.completed,
          //   failed: jobCounts.failed
          // });

          // const analysisJob = await this.analysisQueue.add(
          //   'analyze',
          //   {
          //     applicationId: createdApp._id.toString()
          //   },
          //   {
          //     attempts: 3,
          //     backoff: {
          //       type: 'exponential',
          //       delay: 1000
          //     },
          //     timeout: 300000 // 5 minutes
          //   }
          // );
          
          // console.log(`✅ Analysis job queued with ID: ${analysisJob.id}`);
        } catch (error) {
          console.error('\n❌ Error in background tasks:', error);
          console.error('========================\n');
        }
      });

      return { id: createdApp._id.toString() };

    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      console.error('\n❌ Error creating application:');
      console.error(error);
      console.error('========================\n');
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getApplicationById(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(id)
      .populate('candidat')
      .populate('poste')
      .populate('companyId')
      .exec();

    if (!application) {
      throw new NotFoundException(`Application with ID ${id} not found`);
    }

    return application;
  }

  async getApplicationsByCandidate(candidateId: string): Promise<ApplicationDocument[]> {
    return await this.applicationModel.find({ 
      candidat: new Types.ObjectId(candidateId) 
    })
      .populate('poste')
      .populate('companyId')
      .sort({ datePostulation: -1 })
      .exec();
  }

  async getApplicationsByCompany(
    companyId: string,
    filters?: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    try {
      const query: any = { companyId: new Types.ObjectId(companyId) };
      
      if (filters?.jobId) {
        query.poste = new Types.ObjectId(filters.jobId);
      }

      const limit = filters?.limit || 5;
      const skip = filters?.skip || 0;
      const sortDirection = filters?.sortOrder === 'asc' ? 1 : -1;

      const [applications, total] = await Promise.all([
        this.applicationModel.find(query)
          .populate('candidat')
          .populate('poste')
          .sort({ datePostulation: sortDirection })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.applicationModel.countDocuments(query)
      ]);

      return {
        applications,
        total
      };
    } catch (error) {
      this.logger.error(`Error getting applications for company ${companyId}:`, error);
      throw new HttpException(
        'Error retrieving company applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getApplicationsByJob(
    jobId: string,
    filters?: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    try {
      const job = await this.jobModel.findById(jobId).exec();
      if (!job) {
        throw new NotFoundException(`Job with ID ${jobId} not found`);
      }

      const query = { poste: new Types.ObjectId(jobId) };
      const limit = filters?.limit || 5;
      const skip = filters?.skip || 0;
      const sortDirection = filters?.sortOrder === 'asc' ? 1 : -1;

      const [applications, total] = await Promise.all([
        this.applicationModel.find(query)
          .populate({
            path: 'candidat',
            select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience'
          })
          .populate('poste')
          .populate('companyId')
          .sort({ datePostulation: sortDirection })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.applicationModel.countDocuments(query)
      ]);

      return {
        applications,
        total
      };
    } catch (error) {
      this.logger.error(`Error getting applications for job ${jobId}:`, error);
      throw new HttpException(
        'Error retrieving job applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}