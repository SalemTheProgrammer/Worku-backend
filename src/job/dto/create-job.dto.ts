import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type, Transform } from 'class-transformer';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  ValidateNested,
  IsArray,
  IsNotEmpty,
  Min
} from 'class-validator';

export class JobRequirementsDto {
  @ApiProperty({ description: 'Required education level' })
  @IsString()
  @IsNotEmpty()
  educationLevel: string;

  @ApiProperty({ description: 'Field of study required' })
  @IsString()
  @IsNotEmpty()
  fieldOfStudy: string;

  @ApiProperty({ description: 'Years of experience required' })
  @IsNumber()
  @Min(0)
  yearsExperienceRequired: number;

  @ApiProperty({ description: 'Domain of experience required' })
  @IsString()
  @IsNotEmpty()
  experienceDomain: string;

  @ApiProperty({ description: 'Required hard skills' })
  @IsString()
  @IsNotEmpty()
  hardSkills: string;

  @ApiProperty({ description: 'Required soft skills' })
  @IsString()
  @IsNotEmpty()
  softSkills: string;

  @ApiProperty({ description: 'Required languages' })
  @IsString()
  @IsNotEmpty()
  languages: string;
}

export class JobDetailsDto {
  @ApiProperty({ description: 'Number of vacant positions' })
  @IsNumber()
  @Min(1)
  vacantPosts: number;

  @ApiProperty({ description: 'Domain of activity' })
  @IsString()
  @IsNotEmpty()
  activityDomain: string;

  @ApiProperty({ description: 'Type of contract' })
  @IsString()
  @IsNotEmpty()
  contractType: string;

  @ApiProperty({ description: 'Availability requirement' })
  @IsString()
  @IsNotEmpty()
  availability: string;

  @ApiProperty({ description: 'Work location type' })
  @IsString()
  @IsNotEmpty()
  workLocation: string;

  @ApiProperty({ description: 'Job tasks and responsibilities' })
  @IsString()
  @IsNotEmpty()
  tasks: string;

  @ApiProperty({ description: 'City location' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ description: 'Country location' })
  @IsString()
  @IsNotEmpty()
  country: string;
}

export class JobBenefitsDto {
  @ApiProperty({ description: 'Description of benefits' })
  @IsString()
  @IsNotEmpty()
  benefitsDescription: string;

  @ApiProperty({ description: 'List of benefits', type: [String] })
  @IsArray()
  @IsString({ each: true })
  benefitsList: string[];
}

export class JobCompensationDto {
  @ApiPropertyOptional({ description: 'Whether to display salary information' })
  @IsBoolean()
  @IsOptional()
  showSalary?: boolean;

  @ApiPropertyOptional({ description: 'Minimum salary' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMin?: number;

  @ApiPropertyOptional({ description: 'Maximum salary' })
  @IsNumber()
  @IsOptional()
  @Min(0)
  salaryMax?: number;

  @ApiPropertyOptional({ description: 'Salary period (e.g., monthly, yearly)' })
  @IsString()
  @IsOptional()
  salaryPeriod?: string;

  @ApiPropertyOptional({ description: 'Salary currency' })
  @IsString()
  @IsOptional()
  salaryCurrency?: string;

  @ApiPropertyOptional({ description: 'Additional salary description' })
  @IsString()
  @IsOptional()
  salaryDescription?: string;
}

export class CreateJobDto {
  @ApiProperty({ description: 'Type of offer (e.g., Emploi, Stage)' })
  @IsString()
  @IsNotEmpty()
  offerType: string;

  @ApiProperty({ description: 'Job title' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ type: () => JobRequirementsDto })
  @ValidateNested()
  @Type(() => JobRequirementsDto)
  requirements: JobRequirementsDto;

  @ApiProperty({ type: () => JobDetailsDto })
  @ValidateNested()
  @Type(() => JobDetailsDto)
  jobDetails: JobDetailsDto;

  @ApiProperty({ type: () => JobBenefitsDto })
  @ValidateNested()
  @Type(() => JobBenefitsDto)
  benefits: JobBenefitsDto;

  @ApiProperty({ type: () => JobCompensationDto })
  @ValidateNested()
  @Type(() => JobCompensationDto)
  compensation: JobCompensationDto;

  @ApiPropertyOptional({ description: 'Job expiration date (defaults to 30 days from creation)' })
  @IsOptional()
  @Transform(({ value }) => value ? new Date(value) : undefined)
  expiresAt?: Date;
}
