import { ApiProperty, ApiPropertyOptional, ApiTags } from '@nestjs/swagger';

@ApiTags('interviews')
export class ScheduledCandidate {
  @ApiProperty({
    description: 'Interview ID',
    example: '507f1f77bcf86cd799439011'
  })
  interviewId: string;

  @ApiProperty({
    description: 'Full name of the candidate',
    example: 'John Doe'
  })
  candidateName: string;

  @ApiProperty({
    description: 'Email address of the candidate',
    example: 'john.doe@example.com'
  })
  candidateEmail: string;

  @ApiProperty({
    description: 'Title of the job position',
    example: 'Senior Software Engineer'
  })
  jobTitle: string;

  @ApiProperty({
    description: 'Current status of the interview',
    example: 'future',
    enum: ['pending', 'confirmed', 'future']
  })
  status: string;

  @ApiPropertyOptional({
    description: 'Scheduled date of the interview',
    example: '2025-05-14T00:00:00.000Z'
  })
  scheduledDate?: Date;

  @ApiPropertyOptional({
    description: 'Scheduled time of the interview',
    example: '14:00'
  })
  scheduledTime?: string;
}