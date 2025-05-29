import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../../schemas/job.schema';
import { Candidate, CandidateDocument } from '../../schemas/candidate.schema';
import { Application, ApplicationDocument } from '../../schemas/application.schema';
import { CandidateResponseDto } from '../dto/candidate-response.dto';
import { calculateTotalExperience } from '../utils/experience-calculator';

@Injectable()
export class JobCandidateService {
  constructor(
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>
  ) {}

  async getCandidateByJobId(jobId: string, candidateId: string): Promise<CandidateResponseDto> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job ID or candidate ID');
    }

    // First check if the application exists
    const application = await this.applicationModel.findOne({
      poste: new Types.ObjectId(jobId),
      candidat: new Types.ObjectId(candidateId)
    }).exec();

    if (!application) {
      throw new NotFoundException('Candidate has not applied for this job');
    }

    // Then get the job to verify it exists
    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    // Finally get the candidate details
    const candidate = await this.candidateModel.findById(candidateId)
      .select('-password')
      .populate('education')
      .populate('experience')
      .populate('skills')
      .populate('certifications')
      .exec();

    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const candidateData = candidate.toObject();
    return this.transformCandidateData(candidateData);
  }

  private transformCandidateData(candidateData: any): CandidateResponseDto {
    // Convert ObjectId to string for the main candidate ID
    candidateData._id = candidateData._id.toString();

    // Transform related arrays (education, experience, skills, certifications)
    ['education', 'experience', 'skills', 'certifications'].forEach(field => {
      if (candidateData[field] && Array.isArray(candidateData[field])) {
        candidateData[field] = candidateData[field].map(item => ({
          ...item,
          _id: item._id.toString()
        }));
      }
    });

    // Calculate years of experience if not provided
    if (!candidateData.yearsOfExperience && candidateData.experience && Array.isArray(candidateData.experience)) {
      candidateData.yearsOfExperience = calculateTotalExperience(candidateData.experience);
    }

    return candidateData as CandidateResponseDto;
  }

  async getJobApplications(jobId: string): Promise<CandidateResponseDto[]> {
    if (!Types.ObjectId.isValid(jobId)) {
      throw new NotFoundException('Invalid job ID');
    }

    const job = await this.jobModel.findById(jobId)
      .populate({
        path: 'applications',
        model: 'Candidate',
        select: '-password',
        populate: [
          { path: 'education' },
          { path: 'experience' },
          { path: 'skills' },
          { path: 'certifications' }
        ]
      })
      .exec();

    if (!job) {
      throw new NotFoundException('Job not found');
    }

    return (job.applications as unknown as CandidateDocument[]).map(app => 
      this.transformCandidateData(app.toObject())
    );
  }

  async addApplicationToJob(jobId: string, candidateId: string): Promise<void> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job ID or candidate ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    if (!job.applications.includes(new Types.ObjectId(candidateId))) {
      await this.jobModel.findByIdAndUpdate(
        jobId,
        { $push: { applications: candidateId } },
        { new: true }
      ).exec();
    }
  }

  async removeApplicationFromJob(jobId: string, candidateId: string): Promise<void> {
    if (!Types.ObjectId.isValid(jobId) || !Types.ObjectId.isValid(candidateId)) {
      throw new NotFoundException('Invalid job ID or candidate ID');
    }

    const job = await this.jobModel.findById(jobId).exec();
    if (!job) {
      throw new NotFoundException('Job not found');
    }

    await this.jobModel.findByIdAndUpdate(
      jobId,
      { $pull: { applications: candidateId } },
      { new: true }
    ).exec();
  }
}