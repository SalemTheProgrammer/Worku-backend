import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CandidateJournal } from '../../schemas/candidate-journal.schema';
import { CandidateActionType } from '../enums/action-types.enum';
import { PaginatedJournalResponse, CandidateJournalActivityDto } from '../dto/journal-activity.dto';

@Injectable()
export class CandidateJournalService {
  constructor(
    @InjectModel(CandidateJournal.name)
    private candidateJournalModel: Model<CandidateJournal>,
  ) {}

  async logActivity(
    candidateId: string,
    actionType: CandidateActionType,
    details: Record<string, any>,
    message?: string,
    ipAddress?: string,
    isSystem = false,
  ): Promise<void> {
    const activity = new this.candidateJournalModel({
      candidateId: new Types.ObjectId(candidateId),
      actionType,
      details,
      message,
      ipAddress,
      isSystem,
      timestamp: new Date(),
    });
    
    await activity.save();
  }
  
  async getActivities(
    candidateId: string,
    options: {
      page?: number;
      limit?: number;
      actionTypes?: CandidateActionType[];
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<PaginatedJournalResponse<CandidateJournalActivityDto>> {
    const { page = 1, limit = 20, actionTypes, startDate, endDate } = options;
    
    const query: any = { candidateId: new Types.ObjectId(candidateId) };
    
    if (actionTypes && actionTypes.length > 0) {
      query.actionType = { $in: actionTypes };
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = startDate;
      if (endDate) query.timestamp.$lte = endDate;
    }
    
    const total = await this.candidateJournalModel.countDocuments(query);
    const activities = await this.candidateJournalModel
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
        candidateId: activity.candidateId.toString(),
      })),
      total,
      page,
      limit,
    };
  }
}