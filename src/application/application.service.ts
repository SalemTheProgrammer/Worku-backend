import {
  Injectable,
  NotFoundException,
  HttpException,
  HttpStatus,
  Logger
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, FilterQuery, PopulateOptions } from 'mongoose';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Job, JobDocument } from '../schemas/job.schema';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { Company, CompanyDocument } from '../schemas/company.schema';
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
    private readonly candidateModel: Model<CandidateDocument>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    private readonly emailService: EmailService,
    @InjectQueue('application-analysis')
    private readonly analysisQueue: Queue
  ) {}

  /**
   * Delete a single application and remove its reference from the related job
   */
  async deleteApplication(id: string): Promise<void> {
    const session = await this.applicationModel.startSession();
    session.startTransaction();

    try {
      const application = await this.applicationModel
        .findById(id)
        .session(session);
      if (!application) {
        throw new NotFoundException(`Application ${id} not found`);
      }

      // Pull this application out of the job's applications array
      await this.jobModel.findByIdAndUpdate(
        application.poste,
        { $pull: { applications: application._id } },
        { session }
      );

      // Delete the application document
      await this.applicationModel.findByIdAndDelete(id).session(session);

      await session.commitTransaction();
      this.logger.log(`Deleted application ${id}`);
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      this.logger.error(`Failed to delete application ${id}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error deleting application',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    } finally {
      session.endSession();
    }
  }

  async deleteAllApplications(): Promise<{ deletedCount: number }> {
    try {
      const result = await this.applicationModel.deleteMany({}).exec();
      this.logger.log(`Deleted ${result.deletedCount} applications`);
      return { deletedCount: result.deletedCount };
    } catch (error) {
      this.logger.error('Error deleting applications', error);
      throw new HttpException(
        'Error deleting applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async createApplication(
    candidateId: string,
    jobId: string
  ): Promise<ApplicationResponse> {
    const session = await this.applicationModel.startSession();
    session.startTransaction();

    try {
      this.logger.debug(`Creating application: candidate=${candidateId}, job=${jobId}`);

      // Prevent duplicates
      const exists = await this.applicationModel
        .findOne({ candidat: candidateId, poste: jobId })
        .session(session);
      if (exists) {
        throw new HttpException(
          'You have already applied for this position',
          HttpStatus.BAD_REQUEST
        );
      }

      // Validate job & candidate
      const [job, candidate] = await Promise.all([
        this.jobModel.findById(jobId).session(session),
        this.candidateModel.findById(candidateId).session(session)
      ]);
      if (!job) throw new NotFoundException('Job posting not found');
      if (!candidate) throw new NotFoundException('Candidate not found');

      // Validate company
      const company = await this.companyModel
        .findById(job.companyId)
        .session(session);
      if (!company) throw new NotFoundException('Company not found');

      // Build the application record
      const applicationData: Partial<ApplicationDocument> = {
        candidat: new Types.ObjectId(candidateId),
        poste: new Types.ObjectId(jobId),
        companyId: job.companyId,
        datePostulation: new Date(),
        statut: 'en_attente',
        isRejected: false, // Initialize the isRejected flag to false
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

      // Persist it
      const [created] = await this.applicationModel.create(
        [applicationData],
        { session }
      );

      // Link candidate on the job document
      await this.jobModel.findByIdAndUpdate(
        jobId,
        { $addToSet: { applications: created._id } },
        { session }
      );

      await session.commitTransaction();
      this.logger.log(`Application ${created._id} saved`);

      // Enqueue analysis job
      await this.analysisQueue.add('analyze', {
        applicationId: created._id.toString()
      });

      return { id: created._id.toString() };
    } catch (error) {
      if (session.inTransaction()) {
        await session.abortTransaction();
      }
      this.logger.error('Failed to create application', error);
      throw error;
    } finally {
      session.endSession();
    }
  }

  async getApplicationById(id: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel
      .findById(id)
      .populate('candidat')
      .populate('poste')
      .populate('companyId')
      .lean()
      .exec();

    if (!application) {
      throw new NotFoundException(`Application ${id} not found`);
    }
    return application as any;
  }  
  
  async getApplicationsByCandidate(
    candidateId: string,
    filters?: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    return this.findWithFilters(
      { candidat: new Types.ObjectId(candidateId) },
      filters || { sortOrder: 'desc' },
      [
        { path: 'candidat', select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience' },
        { path: 'poste', select: 'title _id' },
        { path: 'companyId', select: '_id' }
      ]
    );
  }

  private async findWithFilters(
    baseQuery: FilterQuery<ApplicationDocument>,
    filters: FilterApplicationsDto,
    populateOpts: (string | PopulateOptions)[]
  ): Promise<GetApplicationsResult> {
    const limitVal: number = filters.limit ?? 5;
    const skipVal: number = filters.skip ?? 0;
    const sortDir: 1 | -1 = filters.sortOrder === 'asc' ? 1 : -1;

    try {
      // Always exclude rejected applications
      const finalQuery = {
        ...baseQuery,
        isRejected: { $ne: true }
      };

      const [applications, total] = await Promise.all([
        this.applicationModel
          .find(finalQuery)
          .populate(populateOpts)
          .sort({ datePostulation: sortDir })
          .skip(skipVal)
          .limit(limitVal)
          .lean()
          .exec(),
        this.applicationModel.countDocuments(finalQuery)
      ]);

      return { applications, total };
    } catch (err) {
      this.logger.error('Error in findWithFilters', err);
      throw new HttpException(
        'Error retrieving applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  async getApplicationsByCompany(
    companyId: string,
    filters: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    const query: any = { companyId: new Types.ObjectId(companyId) };
    if (filters.jobId) {
      query.poste = new Types.ObjectId(filters.jobId);
    }
    return this.findWithFilters(query, filters, [
      { path: 'candidat', select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience' },
      { path: 'poste', select: 'title _id' },
      { path: 'companyId', select: '_id' }
    ]);
  }

  async getApplicationsByJob(
    jobId: string,
    filters: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    const exists = await this.jobModel.exists({ _id: jobId });
    if (!exists) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }
    return this.findWithFilters(
      { poste: new Types.ObjectId(jobId) },
      filters,
      [
        { path: 'candidat', select: 'firstName lastName email phone location profileImage cv title skills yearsOfExperience' },
        { path: 'poste', select: 'title _id' },
        { path: 'companyId', select: '_id' }
      ]
    );
  }
}
