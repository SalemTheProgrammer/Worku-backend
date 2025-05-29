import { ApiProperty } from '@nestjs/swagger';

export class CompanyInfoDto {
  @ApiProperty({ description: 'Company ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Company name', example: 'Tech Solutions Inc.' })
  name: string;
}

export class JobInfoDto {
  @ApiProperty({ description: 'Job ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  title: string;
}

export class CandidateApplicationDto {
  @ApiProperty({ description: 'Application ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ type: CompanyInfoDto })
  company: CompanyInfoDto;

  @ApiProperty({ type: JobInfoDto })
  job: JobInfoDto;

  @ApiProperty({ description: 'When the candidate applied for the job', example: '2025-05-01T12:00:00.000Z' })
  appliedAt: Date;

  @ApiProperty({ description: 'Application status', example: 'en_attente', enum: ['en_attente', 'analysé', 'présélectionné', 'rejeté'] })
  status: string;

  @ApiProperty({ description: 'Whether the application was rejected', example: false })
  isRejected: boolean;
}

export class CandidateApplicationsResponseDto {
  @ApiProperty({ type: [CandidateApplicationDto] })
  applications: CandidateApplicationDto[];

  @ApiProperty({ description: 'Total number of applications', example: 5 })
  total: number;
}
