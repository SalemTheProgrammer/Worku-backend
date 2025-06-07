import { Injectable } from '@nestjs/common';
import { FilterJobsDto } from '../dto/filter-jobs.dto';
import { SortOrder } from 'mongoose';
import { Types } from 'mongoose';

@Injectable()
export class JobQueryService {
  buildQuery(filters: FilterJobsDto): Record<string, any> {
    const query: Record<string, any> = {};

    // Only add active and expiry conditions if not explicitly disabled
    if (!filters || filters?.onlyActive !== false) {
      query.isActive = true;
      query.expiresAt = { $gt: new Date() };
    }

    if (filters.keyword) {
      query.$text = { $search: filters.keyword };
    } else {
      if (filters.location) {
        query['jobDetails.city'] = new RegExp(filters.location, 'i');
      }
      if (filters.domain) {
        query['jobDetails.activityDomain'] = new RegExp(filters.domain, 'i');
      }
    }

    if (filters.remote === true) {
      query['jobDetails.workLocation'] = { $regex: /remote|télétravail|à distance|hybride/i };
    } else if (filters.remote === false) {
      query['jobDetails.workLocation'] = { $regex: /^((?!remote|télétravail|à distance|hybride).)*$/i };
    }

    if (filters.salaryMin || filters.salaryMax) {
      if (filters.salaryMin) {
        query['salaryMin'] = { $gte: filters.salaryMin };
      }
      if (filters.salaryMax) {
        query['salaryMax'] = { $lte: filters.salaryMax };
      }
    }

    if (filters.experienceMin || filters.experienceMax) {
      query['requirements.yearsExperienceRequired'] = {};
      if (filters.experienceMin) {
        query['requirements.yearsExperienceRequired'].$gte = filters.experienceMin;
      }
      if (filters.experienceMax) {
        query['requirements.yearsExperienceRequired'].$lte = filters.experienceMax;
      }
    }

    if (filters.contractType) {
      query['jobDetails.contractType'] = filters.contractType;
    }

    if (filters.educationLevel) {
      query['requirements.educationLevel'] = filters.educationLevel;
    }
    
    if (filters.languages && filters.languages.length > 0) {
      query['requirements.languages'] = {
        $regex: new RegExp(filters.languages.join('|'), 'i')
      };
    }

    if (filters.companyId) {
      query.companyId = new Types.ObjectId(filters.companyId);
    }

    return query;
  }

  buildSortOptions(sortBy?: string): { [key: string]: SortOrder } {
    switch (sortBy) {
      case 'salary':
        return {
          'salaryMax': -1,
          'salaryMin': -1
        };
      case 'experience':
        return {
          'requirements.yearsExperienceRequired': -1
        };
      case 'newest':
      default:
        return { createdAt: -1 };
    }
  }
}