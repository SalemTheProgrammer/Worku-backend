import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { Job, JobDocument } from '../schemas/job.schema';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Interview, InterviewDocument } from '../schemas/interview.schema';
import { CompanyJournal, CompanyJournalDocument } from '../schemas/company-journal.schema';
import { CompanyDashboardStatsDto, TimeBasedStatsDto, ActivityDto } from './dto/company-dashboard-stats.dto';

@Injectable()
export class CompanyDashboardService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<CompanyDocument>,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>,
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Interview.name) private interviewModel: Model<InterviewDocument>,
    @InjectModel(CompanyJournal.name) private companyJournalModel: Model<CompanyJournalDocument>,
  ) {}

  async getDashboardStats(companyId: string): Promise<CompanyDashboardStatsDto> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new Error('Company not found');
    }

    const now = new Date();
    const startOfWeek = this.getStartOfWeek(now);
    const startOfMonth = this.getStartOfMonth(now);
    const startOfYear = this.getStartOfYear(now);

    // Get stats for each time period
    const [weekStats, monthStats, yearStats, lastActivities, remainingOffersData] = await Promise.all([
      this.getTimeBasedStats(companyId, startOfWeek, now),
      this.getTimeBasedStats(companyId, startOfMonth, now),
      this.getTimeBasedStats(companyId, startOfYear, now),
      this.getLastActivities(companyId, 3),
      this.getRemainingOffersData(companyId, company)
    ]);

    return {
      week: weekStats,
      month: monthStats,
      year: yearStats,
      lastActivities,
      remainingOffers: remainingOffersData.remainingOffers,
      totalAllowedOffers: remainingOffersData.totalAllowedOffers,
      currentActiveOffers: remainingOffersData.currentActiveOffers,
      accountType: company.accountType || 'freemium-beta',
      profileCompleted: company.profileCompleted || false
    };
  }

  private async getTimeBasedStats(
    companyId: string, 
    startDate: Date, 
    endDate: Date
  ): Promise<TimeBasedStatsDto> {
    const companyObjectId = new Types.ObjectId(companyId);

    // Count offers posted in the period
    const offersPosted = await this.jobModel.countDocuments({
      companyId: companyObjectId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Count candidates who applied in the period
    const candidatesApplied = await this.applicationModel.countDocuments({
      companyId: companyObjectId,
      datePostulation: { $gte: startDate, $lte: endDate }
    });

    // Count completed interviews in the period
    const interviewsCompleted = await this.interviewModel.countDocuments({
      status: 'completed',
      completedAt: { $gte: startDate, $lte: endDate },
      // Get interviews for jobs belonging to this company
      applicationId: {
        $in: await this.applicationModel.distinct('_id', {
          companyId: companyObjectId
        })
      }
    });

    return {
      offersPosted,
      candidatesApplied,
      interviewsCompleted
    };
  }

  private async getLastActivities(companyId: string, limit: number): Promise<ActivityDto[]> {
    const companyObjectId = new Types.ObjectId(companyId);

    const activities = await this.companyJournalModel
      .find({ companyId: companyObjectId })
      .sort({ timestamp: -1 })
      .limit(limit)
      .lean();

    return activities.map(activity => ({
      actionType: activity.actionType,
      timestamp: activity.timestamp,
      message: activity.message || this.generateActivityMessage(activity),
      details: activity.details
    }));
  }

  private async getRemainingOffersData(companyId: string, company?: any) {
    const companyObjectId = new Types.ObjectId(companyId);

    // Count currently active offers
    const currentActiveOffers = await this.jobModel.countDocuments({
      companyId: companyObjectId,
      isActive: true,
      expiresAt: { $gt: new Date() }
    });

    // Get company data if not provided
    if (!company) {
      company = await this.companyModel.findById(companyId, 'remainingJobs accountType');
    }

    // Get total allowed offers based on account type
    const getTotalAllowedOffers = (accountType: string) => {
      switch (accountType) {
        case 'freemium-beta':
          return 5;
        case 'premium':
          return 25;
        case 'enterprise':
          return 100;
        default:
          return 5;
      }
    };

    const totalAllowedOffers = getTotalAllowedOffers(company?.accountType || 'freemium-beta');
    const remainingOffers = Math.max(0, company?.remainingJobs || 0);

    return {
      remainingOffers,
      totalAllowedOffers,
      currentActiveOffers
    };
  }

  private generateActivityMessage(activity: any): string {
    switch (activity.actionType) {
      case 'JOB_CREATED':
        return `New job offer "${activity.details?.jobTitle || 'Unknown'}" has been created`;
      case 'APPLICATION_RECEIVED':
        return `New application received for "${activity.details?.jobTitle || 'job offer'}"`;
      case 'INTERVIEW_SCHEDULED':
        return `Interview scheduled with candidate for "${activity.details?.jobTitle || 'position'}"`;
      case 'INTERVIEW_COMPLETED':
        return `Interview completed with candidate for "${activity.details?.jobTitle || 'position'}"`;
      case 'CANDIDATE_HIRED':
        return `Candidate hired for "${activity.details?.jobTitle || 'position'}"`;
      case 'PROFILE_UPDATED':
        return 'Company profile has been updated';
      case 'LOGO_UPDATED':
        return 'Company logo has been updated';
      default:
        return activity.message || `Activity: ${activity.actionType}`;
    }
  }

  private getStartOfWeek(date: Date): Date {
    const startOfWeek = new Date(date);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday as start of week
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);
    return startOfWeek;
  }

  private getStartOfMonth(date: Date): Date {
    const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    startOfMonth.setHours(0, 0, 0, 0);
    return startOfMonth;
  }

  private getStartOfYear(date: Date): Date {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    startOfYear.setHours(0, 0, 0, 0);
    return startOfYear;
  }
}