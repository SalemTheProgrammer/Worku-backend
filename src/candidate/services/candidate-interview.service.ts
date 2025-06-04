import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from '../../schemas/interview.schema';
import { Application } from '../../schemas/application.schema';
import { Company } from '../../schemas/company.schema';
import { Job } from '../../schemas/job.schema';
import { Candidate } from '../../schemas/candidate.schema';
import { CandidateInterviewResponseDto, CandidateInterviewDto, InterviewConfirmationResponseDto } from '../dto/candidate-interview-response.dto';
import { CandidateJournalService } from '../../journal/services/candidate-journal.service';
import { CandidateActionType } from '../../journal/enums/action-types.enum';

interface CandidateInterviewOptions {
  status?: string;
  limit?: number;
  skip?: number;
}

@Injectable()
export class CandidateInterviewService {
  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    @InjectModel(Company.name)
    private readonly companyModel: Model<Company>,
    @InjectModel(Job.name)
    private readonly jobModel: Model<Job>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    private readonly candidateJournalService: CandidateJournalService
  ) {}

  async getCandidateInterviews(
    candidateId: string,
    options: CandidateInterviewOptions = {}
  ): Promise<CandidateInterviewResponseDto> {
    const query: any = { candidateId: new Types.ObjectId(candidateId) };
    
    if (options.status) {
      query.status = options.status;
    }

    const interviews = await this.interviewModel
      .find(query)
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'companyId',
            select: 'nomEntreprise logo'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ date: -1, createdAt: -1 })
      .limit(options.limit || 0)
      .skip(options.skip || 0)
      .lean()
      .exec();

    const total = await this.interviewModel.countDocuments(query);

    // Get counts for different statuses
    const [pendingCount, upcomingCount, completedCount] = await Promise.all([
      this.interviewModel.countDocuments({ 
        candidateId: new Types.ObjectId(candidateId), 
        status: 'en_attente' 
      }),
      this.interviewModel.countDocuments({ 
        candidateId: new Types.ObjectId(candidateId), 
        status: 'confirmed',
        date: { $gte: new Date() }
      }),
      this.interviewModel.countDocuments({ 
        candidateId: new Types.ObjectId(candidateId), 
        status: 'completed' 
      })
    ]);

    const mappedInterviews: CandidateInterviewDto[] = interviews
      .filter(interview =>
        interview.applicationId &&
        (interview.applicationId as any).companyId &&
        (interview.applicationId as any).poste
      )
      .map((interview: any): CandidateInterviewDto => ({
        interviewId: interview._id.toString(),
        applicationId: interview.applicationId._id.toString(),
        company: {
          id: interview.applicationId.companyId._id.toString(),
          name: interview.applicationId.companyId.nomEntreprise,
          logo: interview.applicationId.companyId.logo
        },
        job: {
          id: interview.applicationId.poste._id.toString(),
          title: interview.applicationId.poste.title
        },
        status: interview.status,
        type: interview.type,
        scheduledDate: interview.date,
        scheduledTime: interview.time,
        location: interview.location,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        confirmedAt: interview.confirmedAt,
        completedAt: interview.completedAt,
        cancelledAt: interview.cancelledAt,
        cancellationReason: interview.cancellationReason,
        isHired: interview.isHired,
        appliedAt: interview.applicationId.datePostulation,
        scheduledAt: (interview as any).createdAt
      }));

    return {
      interviews: mappedInterviews,
      total,
      pendingCount,
      upcomingCount,
      completedCount
    };
  }

  async getUpcomingInterviews(candidateId: string): Promise<CandidateInterviewResponseDto> {
    const now = new Date();
    const query = {
      candidateId: new Types.ObjectId(candidateId),
      status: 'confirmed',
      date: { $gte: now }
    };

    const interviews = await this.interviewModel
      .find(query)
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'companyId',
            select: 'nomEntreprise logo'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ date: 1, time: 1 })
      .lean()
      .exec();

    const total = await this.interviewModel.countDocuments(query);

    const mappedInterviews: CandidateInterviewDto[] = interviews
      .filter(interview =>
        interview.applicationId &&
        (interview.applicationId as any).companyId &&
        (interview.applicationId as any).poste
      )
      .map((interview: any): CandidateInterviewDto => ({
        interviewId: interview._id.toString(),
        applicationId: interview.applicationId._id.toString(),
        company: {
          id: interview.applicationId.companyId._id.toString(),
          name: interview.applicationId.companyId.nomEntreprise,
          logo: interview.applicationId.companyId.logo
        },
        job: {
          id: interview.applicationId.poste._id.toString(),
          title: interview.applicationId.poste.title
        },
        status: interview.status,
        type: interview.type,
        scheduledDate: interview.date,
        scheduledTime: interview.time,
        location: interview.location,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        confirmedAt: interview.confirmedAt,
        completedAt: interview.completedAt,
        cancelledAt: interview.cancelledAt,
        cancellationReason: interview.cancellationReason,
        isHired: interview.isHired,
        appliedAt: interview.applicationId.datePostulation,
        scheduledAt: (interview as any).createdAt
      }));

    return {
      interviews: mappedInterviews,
      total
    };
  }

  async getInterviewHistory(
    candidateId: string,
    options: { limit?: number; skip?: number } = {}
  ): Promise<CandidateInterviewResponseDto> {
    const query = {
      candidateId: new Types.ObjectId(candidateId),
      status: { $in: ['completed', 'annule'] }
    };

    const interviews = await this.interviewModel
      .find(query)
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'companyId',
            select: 'nomEntreprise logo'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ date: -1, completedAt: -1, cancelledAt: -1 })
      .limit(options.limit || 0)
      .skip(options.skip || 0)
      .lean()
      .exec();

    const total = await this.interviewModel.countDocuments(query);

    const mappedInterviews: CandidateInterviewDto[] = interviews
      .filter(interview =>
        interview.applicationId &&
        (interview.applicationId as any).companyId &&
        (interview.applicationId as any).poste
      )
      .map((interview: any): CandidateInterviewDto => ({
        interviewId: interview._id.toString(),
        applicationId: interview.applicationId._id.toString(),
        company: {
          id: interview.applicationId.companyId._id.toString(),
          name: interview.applicationId.companyId.nomEntreprise,
          logo: interview.applicationId.companyId.logo
        },
        job: {
          id: interview.applicationId.poste._id.toString(),
          title: interview.applicationId.poste.title
        },
        status: interview.status,
        type: interview.type,
        scheduledDate: interview.date,
        scheduledTime: interview.time,
        location: interview.location,
        meetingLink: interview.meetingLink,
        notes: interview.notes,
        confirmedAt: interview.confirmedAt,
        completedAt: interview.completedAt,
        cancelledAt: interview.cancelledAt,
        cancellationReason: interview.cancellationReason,
        isHired: interview.isHired,
        appliedAt: interview.applicationId.datePostulation,
        scheduledAt: (interview as any).createdAt
      }));

    return {
      interviews: mappedInterviews,
      total
    };
  }

  async confirmInterviewFromDashboard(
    candidateId: string,
    interviewId: string
  ): Promise<InterviewConfirmationResponseDto> {
    const interview = await this.interviewModel
      .findById(interviewId)
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'companyId',
            select: 'nomEntreprise'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .exec();

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Check if required populated data exists
    if (!interview.applicationId || !(interview.applicationId as any).companyId || !(interview.applicationId as any).poste) {
      throw new NotFoundException('Interview data is incomplete - associated job or company may have been deleted');
    }

    // Verify the interview belongs to this candidate
    if (interview.candidateId.toString() !== candidateId) {
      throw new ForbiddenException('This interview does not belong to you');
    }

    // Check if interview can be confirmed
    if (interview.status !== 'en_attente' && interview.status !== 'pending') {
      throw new BadRequestException('Interview is no longer pending confirmation');
    }

    // Update interview status
    interview.status = 'confirmed';
    interview.confirmedAt = new Date();
    await interview.save();

    // Update application status
    await this.applicationModel.findByIdAndUpdate(
      interview.applicationId,
      {
        statut: 'confirme',
        dateConfirmed: new Date()
      }
    );

    // Log activity in candidate journal
    await this.candidateJournalService.logActivity(
      candidateId,
      CandidateActionType.ENTRETIEN_CONFIRME,
      {
        interviewId: interview._id.toString(),
        companyId: (interview.applicationId as any).companyId._id.toString(),
        companyName: (interview.applicationId as any).companyId.nomEntreprise,
        jobId: (interview.applicationId as any).poste._id.toString(),
        jobTitle: (interview.applicationId as any).poste.title,
        interviewDate: interview.date,
        interviewTime: interview.time
      },
      `Entretien confirmé pour le poste ${(interview.applicationId as any).poste.title} chez ${(interview.applicationId as any).companyId.nomEntreprise}`
    );

    return {
      interviewId: interview._id.toString(),
      status: interview.status,
      confirmedAt: interview.confirmedAt,
      interview: {
        date: interview.date,
        time: interview.time,
        type: interview.type,
        location: interview.location,
        meetingLink: interview.meetingLink,
        company: {
          name: (interview.applicationId as any).companyId.nomEntreprise
        },
        job: {
          title: (interview.applicationId as any).poste.title
        }
      }
    };
  }

  async getInterviewDetails(candidateId: string, interviewId: string): Promise<any> {
    const interview = await this.interviewModel
      .findById(interviewId)
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'companyId',
            select: 'nomEntreprise logo adresse telephone email'
          },
          {
            path: 'poste',
            select: 'title description'
          }
        ]
      })
      .lean()
      .exec();

    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    // Check if required populated data exists
    if (!interview.applicationId || !(interview.applicationId as any).companyId || !(interview.applicationId as any).poste) {
      throw new NotFoundException('Interview data is incomplete - associated job or company may have been deleted');
    }

    // Verify the interview belongs to this candidate
    if (interview.candidateId.toString() !== candidateId) {
      throw new ForbiddenException('This interview does not belong to you');
    }

    return {
      interviewId: interview._id.toString(),
      applicationId: interview.applicationId._id.toString(),
      company: {
        id: (interview.applicationId as any).companyId._id.toString(),
        name: (interview.applicationId as any).companyId.nomEntreprise,
        logo: (interview.applicationId as any).companyId.logo,
        address: (interview.applicationId as any).companyId.adresse,
        phone: (interview.applicationId as any).companyId.telephone,
        email: (interview.applicationId as any).companyId.email
      },
      job: {
        id: (interview.applicationId as any).poste._id.toString(),
        title: (interview.applicationId as any).poste.title,
        description: (interview.applicationId as any).poste.description
      },
      status: interview.status,
      type: interview.type,
      scheduledDate: interview.date,
      scheduledTime: interview.time,
      location: interview.location,
      meetingLink: interview.meetingLink,
      notes: interview.notes,
      confirmedAt: interview.confirmedAt,
      completedAt: interview.completedAt,
      cancelledAt: interview.cancelledAt,
      cancellationReason: interview.cancellationReason,
      isHired: interview.isHired,
      feedback: interview.feedback,
      appliedAt: (interview.applicationId as any).datePostulation,
      scheduledAt: (interview as any).createdAt
    };
  }
}