import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { JobResponseDto } from '../dto/job-response.dto';
import { LeanJobDocument, LeanJobWithCompany, LeanJobWithPopulatedData } from './job.interface';
import { CompanyRef } from '../../interfaces/company.interface';

export interface JobMapper {
  fromEntity(job: LeanJobWithPopulatedData | LeanJobWithCompany | LeanJobDocument): JobResponseDto;
  toEntity(dto: Partial<JobResponseDto>): Partial<LeanJobDocument>;
}

function isCompanyRef(value: any): value is CompanyRef {
  return value 
    && typeof value === 'object'
    && '_id' in value
    && 'nomEntreprise' in value
    && 'email' in value;
}

export class JobMapperImpl implements JobMapper {
  fromEntity(job: LeanJobWithPopulatedData | LeanJobWithCompany | LeanJobDocument): JobResponseDto {
    if (!job) {
      throw new NotFoundException('Job data is missing');
    }
    
    const applications = 'applications' in job && Array.isArray(job.applications) 
      ? job.applications.map(app => ({
          id: app._id.toString(),
          firstName: app.firstName,
          lastName: app.lastName,
          email: app.email,
          phone: app.phone,
          location: app.location,
          profileImage: app.profileImage,
          cv: app.cv,
          title: app.title,
          skills: app.skills,
          yearsOfExperience: app.yearsOfExperience,
          appliedAt: app.createdAt
        }))
      : [];

    const response: JobResponseDto = {
      id: job._id.toString(),
      offerType: job.offerType,
      title: job.title,
      stats: {
        applicationsCount: applications.length,
        seenCount: job.seenCount || 0,
      },
      applications,
      requirements: job.requirements,
      jobDetails: {
        ...job.jobDetails,
        activityDomain: job.jobDetails.activityDomain ?? ''
      },
      benefits: job.benefits,
      showSalary: job.showSalary ?? true,
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryPeriod: job.salaryPeriod,
      salaryCurrency: job.salaryCurrency,
      salaryDescription: job.salaryDescription,
      createdAt: job.createdAt,
      publishedAt: job.publishedAt,
      expiresAt: job.expiresAt,
      isActive: job.isActive
    };

    if (job.companyId && isCompanyRef(job.companyId)) {
      response.company = {
        id: job.companyId._id.toString(),
        nomEntreprise: job.companyId.nomEntreprise,
        numeroRNE: job.companyId.numeroRNE,
        email: job.companyId.email,
        secteurActivite: job.companyId.secteurActivite,
        tailleEntreprise: job.companyId.tailleEntreprise,
        phone: job.companyId.phone,
        adresse: job.companyId.adresse,
        siteWeb: job.companyId.siteWeb,
        reseauxSociaux: job.companyId.reseauxSociaux,
        description: job.companyId.description,
        activiteCles: job.companyId.activiteCles,
        logo: job.companyId.logo,
        profileCompleted: job.companyId.profileCompleted ?? false,
        verified: job.companyId.verified ?? false,
        lastLoginAt: job.companyId.lastLoginAt,
        notificationSettings: job.companyId.notificationSettings
      };
    }

    return response;
  }

  toEntity(dto: Partial<JobResponseDto>): Partial<LeanJobDocument> {
    if (!dto) {
      return {};
    }

    return {
      offerType: dto.offerType,
      title: dto.title,
      requirements: dto.requirements,
      jobDetails: dto.jobDetails,
      benefits: dto.benefits,
      showSalary: dto.showSalary,
      salaryMin: dto.salaryMin,
      salaryMax: dto.salaryMax,
      salaryPeriod: dto.salaryPeriod,
      salaryCurrency: dto.salaryCurrency,
      salaryDescription: dto.salaryDescription,
      isActive: dto.isActive
    };
  }
}