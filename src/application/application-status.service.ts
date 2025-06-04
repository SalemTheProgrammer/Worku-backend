import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { CandidateApplicationsResponseDto, CandidateApplicationDto } from '../candidate/dto/candidate-applications-response.dto';

@Injectable()
export class ApplicationStatusService {
  constructor(
    @InjectModel(Application.name)
    private readonly applicationModel: Model<ApplicationDocument>,
  ) {}

  async markAsSeen(applicationId: string): Promise<ApplicationDocument> {
    const application = await this.applicationModel.findById(applicationId);
    if (!application) {
      throw new NotFoundException('Application not found');
    }

    // Only update if not already seen
    if (application.statut === 'en_attente') {
      application.statut = 'vu';
      application.dateSeen = new Date();
      await application.save();
    }

    return application;
  }

  async getCandidateApplicationsWithStatus(
    candidateId: string,
    options: { limit: number; skip: number }
  ): Promise<CandidateApplicationsResponseDto> {
    // Validate candidateId
    if (!candidateId || candidateId === 'null' || candidateId === 'undefined') {
      throw new BadRequestException('Valid candidate ID is required');
    }

    // Validate ObjectId format
    if (!Types.ObjectId.isValid(candidateId)) {
      throw new BadRequestException('Invalid candidate ID format');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);

    const applications = await this.applicationModel
      .find({ candidat: candidateObjectId })
      .populate({
        path: 'companyId',
        select: 'nomEntreprise'
      })
      .populate({
        path: 'poste',
        select: 'title'
      })
      .sort({ datePostulation: -1 })
      .limit(options.limit)
      .skip(options.skip)
      .lean()
      .exec();

    const total = await this.applicationModel.countDocuments({
      candidat: candidateObjectId
    });

    const mappedApplications: CandidateApplicationDto[] = applications
      .filter(app => app.companyId && app.poste)
      .map((app: any): CandidateApplicationDto => ({
        id: app._id.toString(),
        company: {
          id: app.companyId._id.toString(),
          name: app.companyId.nomEntreprise
        },
        job: {
          id: app.poste._id.toString(),
          title: app.poste.title
        },
        appliedAt: app.datePostulation,
        status: app.statut,
        isRejected: app.isRejected,
        dateSeen: app.dateSeen,
        dateInterviewScheduled: app.dateInterviewScheduled,
        dateConfirmed: app.dateConfirmed,
        dateCancelled: app.dateCancelled,
        cancellationReason: app.cancellationReason
      }));

    return {
      applications: mappedApplications,
      total
    };
  }
}