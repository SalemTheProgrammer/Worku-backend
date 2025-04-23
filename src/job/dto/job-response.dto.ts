import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nomEntreprise: string;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  profilePicture?: string;
}

export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  offerType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  educationLevel: string;

  @ApiProperty()
  fieldOfStudy: string;

  @ApiProperty()
  yearsExperienceRequired: number;

  @ApiProperty()
  experienceDomain: string;

  @ApiProperty()
  hardSkills: string;

  @ApiProperty()
  softSkills: string;

  @ApiProperty()
  languages: string;

  @ApiProperty()
  vacantPosts: number;

  @ApiProperty()
  activityDomain: string;

  @ApiProperty()
  contractType: string;

  @ApiProperty()
  availability: string;

  @ApiProperty()
  workLocation: string;

  @ApiProperty()
  tasks: string;

  @ApiProperty()
  city: string;

  @ApiProperty()
  country: string;

  @ApiProperty()
  benefitsDescription: string;

  @ApiProperty()
  benefitsList: string[];

  @ApiPropertyOptional()
  showSalary?: boolean;

  @ApiPropertyOptional()
  salaryMin?: number;

  @ApiPropertyOptional()
  salaryMax?: number;

  @ApiPropertyOptional()
  salaryPeriod?: string;

  @ApiPropertyOptional()
  salaryCurrency?: string;

  @ApiPropertyOptional()
  salaryDescription?: string;

  @ApiProperty()
  @Type(() => CompanyResponseDto)
  company: CompanyResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  applications: number;

  @ApiProperty()
  requirements: any;

  @ApiProperty()
  jobDetails: any;

  @ApiProperty()
  benefits: any;
}

export class JobListResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  jobs: JobResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  skip: number;
}
