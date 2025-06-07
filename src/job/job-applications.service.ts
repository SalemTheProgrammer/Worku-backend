import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../schemas/job.schema';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { JobApplicationsResponseDto } from './dto/job-applications.dto';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class JobApplicationsService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private notificationsService: NotificationsService
  ) {}

  async getJobApplications(companyId: string, jobId: string): Promise<JobApplicationsResponseDto> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (job.companyId.toString() !== companyId) {
      throw new UnauthorizedException('You are not authorized to view these applications');
    }

    // Modified to filter out rejected applications
    const applications = await this.applicationModel.find({ 
      poste: jobId,
      isRejected: { $ne: true } // Exclude rejected applications
    })
      .populate({
        path: 'candidat',
        select: 'firstName lastName email phone location profileImage cv title yearsOfExperience skills professionalStatus employmentStatus education',
        populate: [
          {
            path: 'skills',
            select: 'name'
          },
          {
            path: 'education',
            select: 'institution degree fieldOfStudy endDate'
          }
        ]
      })
      .exec();

    const formattedApplications = applications.map(app => {
      const candidate = app.candidat as any;
      
      // Get most recent education
      const lastEducation = candidate.education?.length > 0
        ? candidate.education.reduce((latest, current) =>
            (!latest || current.endDate > latest.endDate) ? current : latest
          )
        : null;

      // Get top 3 skills
      const matchedKeywords = candidate.skills?.slice(0, 3).map(skill => skill.name) || [];

      return {
        id: candidate._id.toString(),
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        email: candidate.email,
        phone: candidate.phone,
        location: candidate.location,
        profileImage: candidate.profileImage,
        cv: candidate.cv,
        title: candidate.title,
        skills: (candidate.skills || []).map(skill => skill.name),
        yearsOfExperience: candidate.yearsOfExperience,
        lastStudied: lastEducation?.institution || null,
        availability: this.getAvailabilityStatus(candidate.professionalStatus, candidate.employmentStatus),
        matchedKeywords
      };
    });

    return {
      applications: formattedApplications,
      total: formattedApplications.length
    };
  }

  private getAvailabilityStatus(professionalStatus: string, employmentStatus: string): string {
    if (professionalStatus === 'AVAILABLE_NOW') {
      return 'immediately';
    } else if (professionalStatus === 'OPEN_TO_OFFERS') {
      return employmentStatus === 'EMPLOYED' ? '3_months' : '1_month';
    }
    return 'not_available';
  }

  async applyToJob(candidateId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job or candidate ID');
    }

    const [job, candidate] = await Promise.all([
      this.jobModel.findById(jobId).exec(),
      this.candidateModel.findById(candidateId).select('firstName lastName email').exec()
    ]);

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);
    if (job.applications.some(id => id.equals(candidateObjectId))) {
      return { message: 'You have already applied to this job.' };
    }

    const updatedJob = await this.jobModel.findByIdAndUpdate(
      jobId,
      { $addToSet: { applications: candidateObjectId } },
      { new: true }
    ).exec();

    console.log('Updated job applications:', updatedJob?.applications);

    // Create a notification for the company
    try {
      const candidateName = `${candidate.firstName} ${candidate.lastName}`;
      await this.notificationsService.createApplicationNotification(
        job.companyId.toString(),
        jobId,
        candidateId,
        // For now, we'll use a generated application ID - this should be replaced with actual application creation
        new Types.ObjectId().toString(),
        candidateName,
        job.title
      );
    } catch (notificationError) {
      // Log the error but don't fail the application process
      console.error('Failed to create notification:', notificationError);
    }

    return { message: 'Job application submitted successfully.' };
  }

  async withdrawApplication(candidateId: string, jobId: string): Promise<{ message: string }> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job or candidate ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    const candidateObjectId = new Types.ObjectId(candidateId);
    if (!job.applications.some(id => id.equals(candidateObjectId))) {
      return { message: 'You have not applied to this job.' };
    }

    await this.jobModel.findByIdAndUpdate(
      jobId,
      { $pull: { applications: candidateObjectId } },
      { new: true }
    ).exec();

    return { message: 'Job application withdrawn successfully.' };
  }

}