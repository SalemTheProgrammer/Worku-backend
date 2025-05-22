import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompanyJournal } from '../../schemas/company-journal.schema';
import { CompanyActionType } from '../enums/action-types.enum';
import { PaginatedJournalResponse, CompanyJournalActivityDto } from '../dto/journal-activity.dto';

@Injectable()
export class CompanyJournalService {
  constructor(
    @InjectModel(CompanyJournal.name)
    private companyJournalModel: Model<CompanyJournal>,
  ) {}

  async logActivity(
    companyId: string,
    actionType: CompanyActionType,
    details: Record<string, any>,
    message?: string,
    ipAddress?: string,
    userId?: string,
    isSystem = false,
  ): Promise<void> {
    const activity = new this.companyJournalModel({
      companyId: new Types.ObjectId(companyId),
      actionType,
      details,
      message,
      ipAddress,
      userId: userId ? new Types.ObjectId(userId) : undefined,
      isSystem,
      timestamp: new Date(),
    });
    
    await activity.save();
  }
  
  async getActivities(
    companyId: string,
    options: {
      page?: number;
      limit?: number;
      actionTypes?: CompanyActionType[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PaginatedJournalResponse<CompanyJournalActivityDto>> {
    const { page = 1, limit = 20, actionTypes, startDate, endDate } = options;
    
    const query: any = { companyId: new Types.ObjectId(companyId) };
    
    if (actionTypes && actionTypes.length > 0) {
      query.actionType = { $in: actionTypes };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    const total = await this.companyJournalModel.countDocuments(query);
    const activities = await this.companyJournalModel
      .find(query)
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()
      .exec();
    
    return {
      activities: activities.map(activity => ({
        id: activity._id.toString(),
        actionType: activity.actionType,
        timestamp: activity.timestamp,
        message: activity.message,
        details: activity.details,
        isSystem: activity.isSystem,
        companyId: activity.companyId.toString(),
        userId: activity.userId?.toString(),
      })),
      total,
      page,
      limit,
    };
  }
}