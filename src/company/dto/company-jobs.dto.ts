import { IsOptional, IsNumber, IsString, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCompanyJobsDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of jobs per page', default: 20 })
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of jobs to skip', default: 0 })
  skip?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by job title' })
  search?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Include only active jobs', default: false })
  onlyActive?: boolean;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional({ description: 'Include only expired jobs', default: false })
  onlyExpired?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by contract type' })
  contractType?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: ['publishedAt', 'expiresAt', 'title', 'applicationsCount'],
    default: 'publishedAt'
  })
  sortBy?: 'publishedAt' | 'expiresAt' | 'title' | 'applicationsCount';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  sortOrder?: 'asc' | 'desc';
}

export class CompanyJobItemDto {
  id: string;
  title: string;
  description: string;
  domain?: string;
  location?: string;
  contractType?: string;
  remote?: boolean;
  salaryMin?: number;
  salaryMax?: number;
  showSalary?: boolean;
  currency?: string;
  experienceMin?: number;
  experienceMax?: number;
  educationLevel?: string;
  languages?: string[];
  skills?: string[];
  responsibilities?: string[];
  requirements?: string[];
  benefits?: string[];
  isActive: boolean;
  publishedAt: Date;
  expiresAt: Date;
  applicationsCount: number;
  viewsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export class CompanyJobsResponseDto {
  jobs: CompanyJobItemDto[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
  summary: {
    activeJobs: number;
    expiredJobs: number;
    totalApplications: number;
    totalViews: number;
  };
}