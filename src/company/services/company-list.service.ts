import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Company } from '../../schemas/company.schema';
import { Job } from '../../schemas/job.schema';
import { GetCompaniesDto, CompaniesListResponseDto, CompanyListItemDto } from '../dto/company-list.dto';
import { GetCompanyJobsDto, CompanyJobsResponseDto, CompanyJobItemDto } from '../dto/company-jobs.dto';

@Injectable()
export class CompanyListService {
  private readonly logger = new Logger(CompanyListService.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    @InjectModel(Job.name) private readonly jobModel: Model<Job>
  ) {}

  async getAllCompanies(filters: GetCompaniesDto): Promise<CompaniesListResponseDto> {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const skip = filters.skip || 0;
      const sortBy = filters.sortBy || 'createdAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      // Build query
      const query: any = {
        verified: true // Only show verified companies
      };

      if (filters.search) {
        query.nomEntreprise = { $regex: filters.search, $options: 'i' };
      }

      if (filters.sector) {
        query.secteurActivite = { $regex: filters.sector, $options: 'i' };
      }

      if (filters.size) {
        query.tailleEntreprise = filters.size;
      }

      if (filters.location) {
        query.$or = [
          { 'adresse.ville': { $regex: filters.location, $options: 'i' } },
          { 'adresse.pays': { $regex: filters.location, $options: 'i' } },
          { 'adresse.region': { $regex: filters.location, $options: 'i' } }
        ];
      }

      // Use aggregation for better performance and job counting
      const pipeline: any[] = [
        { $match: query },
        {
          $lookup: {
            from: 'jobs',
            localField: '_id',
            foreignField: 'companyId',
            as: 'jobs'
          }
        },
        {
          $addFields: {
            activeJobsCount: {
              $size: {
                $filter: {
                  input: '$jobs',
                  cond: { 
                    $and: [
                      { $eq: ['$$this.isActive', true] },
                      { $gt: ['$$this.expiresAt', new Date()] }
                    ]
                  }
                }
              }
            },
            totalJobsCount: { $size: '$jobs' }
          }
        },
        {
          $project: {
            nomEntreprise: 1,
            email: 1,
            secteurActivite: 1,
            tailleEntreprise: 1,
            adresse: 1,
            logo: 1,
            description: 1,
            siteWeb: 1,
            phone: 1,
            reseauxSociaux: 1,
            verified: 1,
            profileCompleted: 1,
            createdAt: 1,
            lastLoginAt: 1,
            activeJobsCount: 1,
            totalJobsCount: 1
          }
        }
      ];

      // Add sorting
      if (sortBy === 'jobCount' || sortBy === 'activeJobsCount') {
        pipeline.push({ $sort: { activeJobsCount: sortOrder, createdAt: -1 } });
      } else if (sortBy === 'name') {
        pipeline.push({ $sort: { nomEntreprise: sortOrder } });
      } else {
        pipeline.push({ $sort: { [sortBy]: sortOrder } });
      }

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute aggregation and count in parallel
      const [companies, totalCount] = await Promise.all([
        this.companyModel.aggregate(pipeline).exec(),
        this.companyModel.countDocuments(query)
      ]);

      // Transform results
      const companiesData: CompanyListItemDto[] = companies.map(company => ({
        id: company._id.toString(),
        nomEntreprise: company.nomEntreprise,
        email: company.email,
        secteurActivite: company.secteurActivite,
        tailleEntreprise: company.tailleEntreprise,
        location: this.formatLocation(company.adresse),
        logo: company.logo ? `/uploads/${company.logo}` : undefined,
        description: company.description,
        siteWeb: company.siteWeb,
        phone: company.phone,
        reseauxSociaux: company.reseauxSociaux,
        verified: company.verified,
        profileCompleted: company.profileCompleted,
        activeJobsCount: company.activeJobsCount,
        totalJobsCount: company.totalJobsCount,
        createdAt: company.createdAt,
        lastLoginAt: company.lastLoginAt
      }));

      return {
        companies: companiesData,
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount
      };
    } catch (error) {
      this.logger.error('Error fetching companies:', error);
      throw new Error('Failed to fetch companies');
    }
  }

  async getCompanyJobs(companyId: string, filters: GetCompanyJobsDto): Promise<CompanyJobsResponseDto> {
    try {
      const limit = Math.min(filters.limit || 20, 100);
      const skip = filters.skip || 0;
      const sortBy = filters.sortBy || 'publishedAt';
      const sortOrder = filters.sortOrder === 'asc' ? 1 : -1;

      // Build query
      const query: any = {
        companyId: new Types.ObjectId(companyId)
      };

      if (filters.search) {
        query.title = { $regex: filters.search, $options: 'i' };
      }

      if (filters.contractType) {
        query['jobDetails.contractType'] = filters.contractType;
      }

      // Handle active/expired filters
      if (filters.onlyActive) {
        query.isActive = true;
        query.expiresAt = { $gt: new Date() };
      } else if (filters.onlyExpired) {
        query.$or = [
          { isActive: false },
          { expiresAt: { $lte: new Date() } }
        ];
      }

      // Use aggregation for better performance
      const pipeline: any[] = [
        { $match: query },
        {
          $addFields: {
            applicationsCount: { $size: { $ifNull: ['$applications', []] } },
            viewsCount: { $size: { $ifNull: ['$seenBy', []] } }
          }
        }
      ];

      // Add sorting
      if (sortBy === 'applicationsCount') {
        pipeline.push({ $sort: { applicationsCount: sortOrder, publishedAt: -1 } });
      } else {
        pipeline.push({ $sort: { [sortBy]: sortOrder } });
      }

      // Add pagination
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      // Execute queries in parallel
      const [jobs, totalCount, summary] = await Promise.all([
        this.jobModel.aggregate(pipeline).exec(),
        this.jobModel.countDocuments(query),
        this.getJobsSummary(companyId)
      ]);

      // Transform results to match your Job schema
      const jobsData: CompanyJobItemDto[] = jobs.map(job => ({
        id: job._id.toString(),
        title: job.title,
        description: job.jobDetails?.tasks || 'No description available',
        domain: job.jobDetails?.activityDomain || job.offerType,
        location: `${job.jobDetails?.city || ''}, ${job.jobDetails?.country || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
        contractType: job.jobDetails?.contractType,
        remote: job.jobDetails?.workLocation === 'Remote' || job.jobDetails?.workLocation === 'Télétravail',
        salaryMin: job.salaryMin,
        salaryMax: job.salaryMax,
        showSalary: job.showSalary ?? true,
        currency: job.salaryCurrency || 'EUR',
        experienceMin: job.requirements?.yearsExperienceRequired || 0,
        experienceMax: job.requirements?.yearsExperienceRequired || 0,
        educationLevel: job.requirements?.educationLevel,
        languages: job.requirements?.languages ? [job.requirements.languages] : [],
        skills: job.requirements ? [
          ...(job.requirements.hardSkills ? job.requirements.hardSkills.split(',').map(s => s.trim()) : []),
          ...(job.requirements.softSkills ? job.requirements.softSkills.split(',').map(s => s.trim()) : [])
        ] : [],
        responsibilities: job.jobDetails?.tasks ? [job.jobDetails.tasks] : [],
        requirements: job.requirements ? [
          `Education: ${job.requirements.educationLevel}`,
          `Experience: ${job.requirements.yearsExperienceRequired} years in ${job.requirements.experienceDomain}`,
          `Field of Study: ${job.requirements.fieldOfStudy}`
        ] : [],
        benefits: job.benefits?.benefitsList || [],
        isActive: job.isActive,
        publishedAt: job.publishedAt || job.createdAt,
        expiresAt: job.expiresAt,
        applicationsCount: job.applicationsCount,
        viewsCount: job.viewsCount,
        createdAt: job.createdAt,
        updatedAt: job.updatedAt
      }));

      return {
        jobs: jobsData,
        total: totalCount,
        limit,
        skip,
        hasMore: skip + limit < totalCount,
        summary
      };
    } catch (error) {
      this.logger.error('Error fetching company jobs:', error);
      throw new Error('Failed to fetch company jobs');
    }
  }

  private async getJobsSummary(companyId: string) {
    try {
      const now = new Date();
      const [summaryResult] = await this.jobModel.aggregate([
        { $match: { companyId: new Types.ObjectId(companyId) } },
        {
          $group: {
            _id: null,
            totalJobs: { $sum: 1 },
            activeJobs: {
              $sum: {
                $cond: [
                  { 
                    $and: [
                      { $eq: ['$isActive', true] },
                      { $gt: ['$expiresAt', now] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            expiredJobs: {
              $sum: {
                $cond: [
                  { 
                    $or: [
                      { $eq: ['$isActive', false] },
                      { $lte: ['$expiresAt', now] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            totalApplications: {
              $sum: { $size: { $ifNull: ['$applications', []] } }
            },
            totalViews: {
              $sum: { $size: { $ifNull: ['$seenBy', []] } }
            }
          }
        }
      ]).exec();

      return summaryResult || {
        activeJobs: 0,
        expiredJobs: 0,
        totalApplications: 0,
        totalViews: 0
      };
    } catch (error) {
      this.logger.error('Error fetching jobs summary:', error);
      return {
        activeJobs: 0,
        expiredJobs: 0,
        totalApplications: 0,
        totalViews: 0
      };
    }
  }

  private formatLocation(adresse: any): string {
    if (!adresse) return '';
    
    const parts: string[] = [];
    if (adresse.ville) parts.push(adresse.ville);
    if (adresse.region) parts.push(adresse.region);
    if (adresse.pays) parts.push(adresse.pays);
    
    return parts.join(', ');
  }
}