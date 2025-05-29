import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Interview, InterviewDocument } from '../schemas/interview.schema';
import { Application } from '../schemas/application.schema';
import { Candidate } from '../schemas/candidate.schema';
import { Company } from '../schemas/company.schema';
import { Job } from '../schemas/job.schema';
import { EmailService } from '../email/email.service';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { AddToInterviewsDto } from './dto/add-to-interviews.dto';
import { ConfigService } from '@nestjs/config';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { generateInterviewConfirmationEmail } from '../email-templates/interview-confirmation.template';
import { CompanyJournalService } from '../journal/services/company-journal.service';
import { CompanyActionType } from '../journal/enums/action-types.enum';

import { PopulatedApplication } from './interfaces/populated-application.interface';
import { PopulatedInterview } from './interfaces/populated-interview.interface';
import { ScheduledCandidate } from './interfaces/scheduled-candidate.interface';

@Injectable()
export class InterviewService {
  constructor(
    @InjectModel(Interview.name)
    private readonly interviewModel: Model<InterviewDocument>,
    @InjectModel(Application.name)
    private readonly applicationModel: Model<Application>,
    @InjectModel(Candidate.name)
    private readonly candidateModel: Model<Candidate>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly companyJournalService: CompanyJournalService
  ) {}

  async scheduleInterview(scheduleDto: ScheduleInterviewDto): Promise<InterviewDocument> {
    const application = await this.applicationModel
      .findById(scheduleDto.applicationId)
      .populate<{ candidat: Candidate & Document }>('candidat')
      .populate<{ poste: Job & Document }>('poste')
      .populate<{ companyId: Company & Document }>('companyId')
      .exec() as PopulatedApplication | null;

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    if (scheduleDto.type === 'Video' && !scheduleDto.meetingLink) {
      throw new BadRequestException('Meeting link is required for video interviews');
    }
    if (scheduleDto.type === 'InPerson' && !scheduleDto.location) {
      throw new BadRequestException('Location is required for in-person interviews');
    }

    const interview: InterviewDocument = await this.interviewModel.create({
      applicationId: new Types.ObjectId(scheduleDto.applicationId),
      candidateId: application.candidat._id,
      date: new Date(scheduleDto.date),
      time: scheduleDto.time,
      type: scheduleDto.type,
      location: scheduleDto.location,
      meetingLink: scheduleDto.meetingLink,
      notes: scheduleDto.notes,
      status: 'pending'
    });

    const confirmationToken = this.generateConfirmationToken(interview._id.toHexString());
    const confirmationLink = `${this.configService.get('APP_URL')}/interviews/confirm/${confirmationToken}`;

    const formattedDate = format(new Date(scheduleDto.date), 'EEEE d MMMM yyyy', { locale: fr });
    const formattedTime = scheduleDto.time;

    await this.emailService.sendInterviewConfirmation(
      application.candidat.email,
      {
        candidateName: `${application.candidat.firstName} ${application.candidat.lastName}`,
        companyName: application.companyId.nomEntreprise,
        jobTitle: application.poste.title,
        date: formattedDate,
        time: formattedTime,
        type: scheduleDto.type,
        location: scheduleDto.location,
        meetingLink: scheduleDto.meetingLink,
        notes: scheduleDto.notes,
        confirmationLink
      }
    );

    // Log interview scheduling activity
    await this.companyJournalService.logActivity(
      (application.companyId as any)._id.toString(),
      CompanyActionType.PLANIFICATION_ENTRETIEN,
      {
        candidateId: (application.candidat as any)._id.toString(),
        candidateName: `${application.candidat.firstName} ${application.candidat.lastName}`,
        jobId: (application.poste as any)._id.toString(),
        jobTitle: application.poste.title,
        interviewDate: formattedDate,
        interviewTime: formattedTime,
        interviewType: scheduleDto.type
      },
      `Entretien planifié avec ${application.candidat.firstName} ${application.candidat.lastName} pour le poste ${application.poste.title}`
    );

    return interview;
  }

  async confirmInterview(token: string): Promise<InterviewDocument> {
    const interviewId = this.verifyConfirmationToken(token);
    
    const interview = await this.interviewModel.findById(interviewId);
    if (!interview) {
      throw new NotFoundException('Interview not found');
    }

    if (interview.status !== 'pending') {
      throw new BadRequestException('Interview is no longer pending confirmation');
    }

    // Get application details for logging
    const application = await this.applicationModel
      .findById(interview.applicationId)
      .populate<{ candidat: Candidate }>('candidat')
      .populate<{ poste: Job }>('poste')
      .populate<{ companyId: Company }>('companyId')
      .exec();

    if (!application) {
      throw new NotFoundException('Application details not found');
    }

    interview.status = 'confirmed';
    interview.confirmedAt = new Date();
    await interview.save();

    // Log interview confirmation
    const formattedDate = format(interview.date, 'EEEE d MMMM yyyy', { locale: fr });
    await this.companyJournalService.logActivity(
      (application.companyId as any)._id.toString(),
      CompanyActionType.PLANIFICATION_ENTRETIEN,
      {
        candidateId: (application.candidat as any)._id.toString(),
        candidateName: `${application.candidat.firstName} ${application.candidat.lastName}`,
        jobId: (application.poste as any)._id.toString(),
        jobTitle: application.poste.title,
        interviewDate: formattedDate,
        interviewTime: interview.time,
        interviewStatus: 'confirmed'
      },
      `Entretien confirmé avec ${application.candidat.firstName} ${application.candidat.lastName} pour le poste ${application.poste.title}`
    );

    return interview;
  }

  private generateConfirmationToken(interviewId: string): string {
    return Buffer.from(interviewId).toString('base64');
  }

  private verifyConfirmationToken(token: string): string {
    try {
      return Buffer.from(token, 'base64').toString('ascii');
    } catch (error) {
      throw new BadRequestException('Invalid confirmation token');
    }
  }

  async getInterviewsByCandidate(candidateId: string): Promise<InterviewDocument[]> {
    const interviews = await this.interviewModel
      .find({ candidateId: new Types.ObjectId(candidateId) })
      .populate('applicationId')
      .sort({ date: 1, time: 1 });
    
    return interviews;
  }

  async getInterviewsByApplication(applicationId: string): Promise<InterviewDocument[]> {
    const interviews = await this.interviewModel
      .find({ applicationId: new Types.ObjectId(applicationId) })
      .sort({ date: 1, time: 1 });
    
    return interviews;
  }

  async getAllScheduledCandidates(): Promise<ScheduledCandidate[]> {
    const interviews = await this.interviewModel
      .find({
        status: { $in: ['pending', 'confirmed'] }
      })
      .populate({
        path: 'applicationId',
        populate: [
          {
            path: 'candidat',
            select: 'firstName lastName email'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ date: 1, time: 1 })
      .lean<PopulatedInterview[]>()
      .exec();

    return interviews.map((interview: PopulatedInterview): ScheduledCandidate => {
      if (!interview.applicationId) {
        return {
          interviewId: (interview as any)._id.toString(),
          candidateName: 'Unknown Candidate',
          candidateEmail: 'No email available',
          jobTitle: 'Unknown Position',
          status: interview.status,
          scheduledDate: interview.date,
          scheduledTime: interview.time
        };
      }
      
      return {
        interviewId: (interview as any)._id.toString(),
        candidateName: interview.applicationId.candidat
          ? `${interview.applicationId.candidat.firstName} ${interview.applicationId.candidat.lastName}`
          : 'Unknown Candidate',
        candidateEmail: interview.applicationId.candidat?.email || 'No email available',
        jobTitle: interview.applicationId.poste?.title || 'Unknown Position',
        status: interview.status,
        scheduledDate: interview.date,
        scheduledTime: interview.time
      };
    });
  }

  async addToFutureInterviews(addToInterviewsDto: AddToInterviewsDto): Promise<ScheduledCandidate> {
    const application = await this.applicationModel
      .findById(addToInterviewsDto.applicationId)
      .populate<{ candidat: Candidate }>('candidat')
      .populate<{ poste: Job }>('poste')
      .populate<{ companyId: Company }>('companyId')
      .exec() as PopulatedApplication | null;

    if (!application) {
      throw new NotFoundException('Application not found');
    }

    const existingInterview = await this.interviewModel.findOne({
      applicationId: new Types.ObjectId(addToInterviewsDto.applicationId),
      candidateId: application.candidat._id,
      status: 'future'
    });

    if (existingInterview) {
      throw new BadRequestException('Candidate already added to future interviews for this application');
    }

    const interview: InterviewDocument = await this.interviewModel.create({
      applicationId: new Types.ObjectId(addToInterviewsDto.applicationId),
      candidateId: application.candidat._id,
      status: 'future',
      type: undefined,
      date: undefined,
      time: undefined
    });

    await this.companyJournalService.logActivity(
      (application.companyId as any)._id.toString(),
      CompanyActionType.PLANIFICATION_ENTRETIEN,
      {
        candidateId: (application.candidat as any)._id.toString(),
        candidateName: `${application.candidat.firstName} ${application.candidat.lastName}`,
        jobId: (application.poste as any)._id.toString(),
        jobTitle: application.poste.title,
        interviewStatus: 'future'
      },
      `${application.candidat.firstName} ${application.candidat.lastName} ajouté(e) aux entretiens futurs pour le poste ${application.poste.title}`
    );

    return {
      interviewId: interview._id.toString(),
      candidateName: `${application.candidat.firstName} ${application.candidat.lastName}`,
      candidateEmail: application.candidat.email,
      jobTitle: application.poste.title,
      status: interview.status
    };
  }

  async getFutureCandidates(): Promise<ScheduledCandidate[]> {
    // Find all interviews with future status
    const futureInterviews = await this.interviewModel
      .find({
        status: 'future',
        date: { $exists: false } // Only get unscheduled future interviews
      })
      .populate<{ applicationId: PopulatedApplication }>({
        path: 'applicationId',
        populate: [
          {
            path: 'candidat',
            select: 'firstName lastName email'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ createdAt: -1 })
      .lean<PopulatedInterview[]>()
      .exec();

    // Find all scheduled interviews for future date
    const scheduledInterviews = await this.interviewModel
      .find({
        status: { $in: ['pending', 'confirmed'] },
        date: { $gt: new Date() }
      })
      .populate<{ applicationId: PopulatedApplication }>({
        path: 'applicationId',
        populate: [
          {
            path: 'candidat',
            select: 'firstName lastName email'
          },
          {
            path: 'poste',
            select: 'title'
          }
        ]
      })
      .sort({ date: 1, time: 1 })
      .lean<PopulatedInterview[]>()
      .exec();

    const allInterviews = [...futureInterviews, ...scheduledInterviews];

    return allInterviews
      .filter(interview => interview.applicationId && interview.applicationId.candidat)
      .map((interview: PopulatedInterview): ScheduledCandidate => ({
        interviewId: interview.id,
        candidateName: `${interview.applicationId.candidat.firstName} ${interview.applicationId.candidat.lastName}`,
        candidateEmail: interview.applicationId.candidat.email,
        jobTitle: interview.applicationId.poste?.title || 'Unknown Position',
        status: interview.status,
        scheduledDate: interview.date,
        scheduledTime: interview.time
      }));
  }
}
