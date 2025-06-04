import { ApiProperty } from '@nestjs/swagger';

export class CandidateBasicInfoDto {
  @ApiProperty({ description: 'Candidate ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Candidate full name', example: 'John Doe' })
  fullName: string;

  @ApiProperty({ description: 'Candidate email', example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ description: 'Candidate phone', example: '+216 12 345 678' })
  phone: string;
}

export class JobBasicInfoDto {
  @ApiProperty({ description: 'Job ID', example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ description: 'Job title', example: 'Senior Software Engineer' })
  title: string;
}

export class CompanyCandidateApplicationDto {
  @ApiProperty({ description: 'Application ID', example: '507f1f77bcf86cd799439011' })
  applicationId: string;

  @ApiProperty({ type: CandidateBasicInfoDto })
  candidate: CandidateBasicInfoDto;

  @ApiProperty({ type: JobBasicInfoDto })
  job: JobBasicInfoDto;

  @ApiProperty({ 
    description: 'Application status', 
    example: 'en_attente', 
    enum: ['en_attente', 'analysé', 'présélectionné', 'rejeté', 'vu', 'entretien_programmer', 'en_attente_confirmation', 'confirme', 'annule'] 
  })
  status: string;

  @ApiProperty({ description: 'Date when candidate applied', example: '2025-05-01T12:00:00.000Z' })
  appliedAt: Date;

  @ApiProperty({ description: 'Whether candidate is recommended', example: true })
  isRecommended: boolean;

  @ApiProperty({ description: 'Overall fit score', example: 85 })
  overallScore: number;

  @ApiProperty({ description: 'Date when application was seen by company', example: '2025-05-01T12:00:00.000Z', required: false })
  dateSeen?: Date;

  @ApiProperty({ description: 'Date when interview was scheduled', example: '2025-05-01T12:00:00.000Z', required: false })
  dateInterviewScheduled?: Date;

  @ApiProperty({ description: 'Date when candidate confirmed interview', example: '2025-05-01T12:00:00.000Z', required: false })
  dateConfirmed?: Date;

  @ApiProperty({ description: 'Date when interview was cancelled', example: '2025-05-01T12:00:00.000Z', required: false })
  dateCancelled?: Date;

  @ApiProperty({ description: 'Reason for cancellation', example: 'Candidate not available', required: false })
  cancellationReason?: string;
}

export class CompanyCandidatesResponseDto {
  @ApiProperty({ type: [CompanyCandidateApplicationDto] })
  applications: CompanyCandidateApplicationDto[];

  @ApiProperty({ description: 'Total number of applications', example: 25 })
  total: number;
}

export class InterviewStateDto {
  @ApiProperty({ description: 'Interview ID', example: '507f1f77bcf86cd799439011' })
  interviewId: string;

  @ApiProperty({ type: CandidateBasicInfoDto })
  candidate: CandidateBasicInfoDto;

  @ApiProperty({ type: JobBasicInfoDto })
  job: JobBasicInfoDto;

  @ApiProperty({ 
    description: 'Interview status', 
    example: 'programmer', 
    enum: ['programmer', 'en_attente', 'confirmed', 'completed', 'annule'] 
  })
  status: string;

  @ApiProperty({ description: 'Scheduled date', example: '2025-05-15T10:00:00.000Z', required: false })
  scheduledDate?: Date;

  @ApiProperty({ description: 'Scheduled time', example: '14:30', required: false })
  scheduledTime?: string;

  @ApiProperty({ description: 'Interview type', example: 'Video', enum: ['Video', 'InPerson', 'Phone'], required: false })
  type?: string;

  @ApiProperty({ description: 'Meeting location or link', example: 'https://meet.google.com/abc-def-ghi', required: false })
  location?: string;

  @ApiProperty({ description: 'Date when interview was confirmed', example: '2025-05-01T12:00:00.000Z', required: false })
  confirmedAt?: Date;

  @ApiProperty({ description: 'Date when interview was completed', example: '2025-05-01T12:00:00.000Z', required: false })
  completedAt?: Date;

  @ApiProperty({ description: 'Date when interview was cancelled', example: '2025-05-01T12:00:00.000Z', required: false })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Reason for cancellation', example: 'Candidate not available', required: false })
  cancellationReason?: string;

  @ApiProperty({ description: 'Whether candidate was hired', example: false, required: false })
  isHired?: boolean;
}

export class InterviewsByStatusResponseDto {
  @ApiProperty({ type: [InterviewStateDto] })
  interviews: InterviewStateDto[];

  @ApiProperty({ description: 'Total number of interviews', example: 10 })
  total: number;
}