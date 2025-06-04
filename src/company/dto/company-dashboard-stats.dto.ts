import { ApiProperty } from '@nestjs/swagger';

export class TimeBasedStatsDto {
  @ApiProperty({
    description: 'Number of job offers posted in this period',
    example: 5
  })
  offersPosted: number;

  @ApiProperty({
    description: 'Number of candidates who applied to all company offers in this period',
    example: 23
  })
  candidatesApplied: number;

  @ApiProperty({
    description: 'Number of interviews that have been completed (not just scheduled) in this period',
    example: 8
  })
  interviewsCompleted: number;
}

export class ActivityDto {
  @ApiProperty({
    description: 'Type of activity',
    example: 'JOB_CREATED'
  })
  actionType: string;

  @ApiProperty({
    description: 'Activity timestamp',
    example: '2025-01-15T10:30:00.000Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Activity message or description',
    example: 'New job offer "Software Engineer" has been created'
  })
  message: string;

  @ApiProperty({
    description: 'Additional activity details',
    example: { jobTitle: 'Software Engineer', applicationCount: 5 }
  })
  details: Record<string, any>;
}

export class CompanyDashboardStatsDto {
  @ApiProperty({
    description: 'Statistics for the current week',
    type: TimeBasedStatsDto
  })
  week: TimeBasedStatsDto;

  @ApiProperty({
    description: 'Statistics for the current month',
    type: TimeBasedStatsDto
  })
  month: TimeBasedStatsDto;

  @ApiProperty({
    description: 'Statistics for the current year',
    type: TimeBasedStatsDto
  })
  year: TimeBasedStatsDto;

  @ApiProperty({
    description: 'Last 3 company activities',
    type: [ActivityDto]
  })
  lastActivities: ActivityDto[];

  @ApiProperty({
    description: 'Number of remaining job offers the company can post',
    example: 3
  })
  remainingOffers: number;

  @ApiProperty({
    description: 'Total number of job offers allowed for authenticated company',
    example: 10
  })
  totalAllowedOffers: number;

  @ApiProperty({
    description: 'Number of currently active job offers',
    example: 7
  })
  currentActiveOffers: number;
}