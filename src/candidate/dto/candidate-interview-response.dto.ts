import { ApiProperty } from '@nestjs/swagger';

export class CandidateInterviewDto {
  @ApiProperty({ description: 'Interview ID' })
  interviewId: string;

  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Company information' })
  company: {
    id: string;
    name: string;
    logo?: string;
  };

  @ApiProperty({ description: 'Job information' })
  job: {
    id: string;
    title: string;
  };

  @ApiProperty({ description: 'Interview status', enum: ['en_attente', 'confirmed', 'completed', 'annule'] })
  status: string;

  @ApiProperty({ description: 'Interview type', enum: ['Video', 'InPerson', 'Phone'] })
  type?: string;

  @ApiProperty({ description: 'Scheduled date', type: 'string', format: 'date-time' })
  scheduledDate?: Date;

  @ApiProperty({ description: 'Scheduled time', example: '14:30' })
  scheduledTime?: string;

  @ApiProperty({ description: 'Interview location (for in-person interviews)' })
  location?: string;

  @ApiProperty({ description: 'Meeting link (for video interviews)' })
  meetingLink?: string;

  @ApiProperty({ description: 'Additional notes from company' })
  notes?: string;

  @ApiProperty({ description: 'Date when interview was confirmed', type: 'string', format: 'date-time' })
  confirmedAt?: Date;

  @ApiProperty({ description: 'Date when interview was completed', type: 'string', format: 'date-time' })
  completedAt?: Date;

  @ApiProperty({ description: 'Date when interview was cancelled', type: 'string', format: 'date-time' })
  cancelledAt?: Date;

  @ApiProperty({ description: 'Cancellation reason' })
  cancellationReason?: string;

  @ApiProperty({ description: 'Whether candidate was hired after interview' })
  isHired?: boolean;

  @ApiProperty({ description: 'Date when application was submitted', type: 'string', format: 'date-time' })
  appliedAt: Date;

  @ApiProperty({ description: 'Date when interview was scheduled', type: 'string', format: 'date-time' })
  scheduledAt?: Date;
}

export class CandidateInterviewResponseDto {
  @ApiProperty({ description: 'List of interviews', type: [CandidateInterviewDto] })
  interviews: CandidateInterviewDto[];

  @ApiProperty({ description: 'Total number of interviews' })
  total: number;

  @ApiProperty({ description: 'Number of pending interviews' })
  pendingCount?: number;

  @ApiProperty({ description: 'Number of upcoming interviews' })
  upcomingCount?: number;

  @ApiProperty({ description: 'Number of completed interviews' })
  completedCount?: number;
}

export class InterviewConfirmationResponseDto {
  @ApiProperty({ description: 'Interview ID' })
  interviewId: string;

  @ApiProperty({ description: 'New status after confirmation' })
  status: string;

  @ApiProperty({ description: 'Confirmation timestamp', type: 'string', format: 'date-time' })
  confirmedAt: Date;

  @ApiProperty({ description: 'Interview details' })
  interview: {
    date: Date;
    time: string;
    type: string;
    location?: string;
    meetingLink?: string;
    company: {
      name: string;
    };
    job: {
      title: string;
    };
  };
}