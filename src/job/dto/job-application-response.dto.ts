import { ApiProperty } from '@nestjs/swagger';
import { CandidateInfoDto } from './candidate-info.dto';

export class FitScoreDto {
  @ApiProperty({ description: 'Overall fit score', minimum: 0, maximum: 100 })
  overall: number;

  @ApiProperty({ description: 'Skills match score', minimum: 0, maximum: 100 })
  skills: number;

  @ApiProperty({ description: 'Experience match score', minimum: 0, maximum: 100 })
  experience: number;

  @ApiProperty({ description: 'Education match score', minimum: 0, maximum: 100 })
  education: number;

  @ApiProperty({ description: 'Language match score', minimum: 0, maximum: 100 })
  languages: number;
}

export class FitDetailsDto {
  @ApiProperty({ description: 'Match level (Strong/Partial/Weak/Misaligned)' })
  matchLevel: string;

  @ApiProperty({ description: 'Detailed analysis points', type: [String] })
  details: string[];

  @ApiProperty({ description: 'Matching technologies', type: [String] })
  techStackMatch: string[];

  @ApiProperty({ description: 'Relevant domain experience', type: [String] })
  domainExperience: string[];
}

export class JobFitBreakdownDto {
  @ApiProperty()
  skillsFit: FitDetailsDto;

  @ApiProperty()
  experienceFit: FitDetailsDto & {
    techStackMatch: string[];
    domainExperience: string[];
  };

  @ApiProperty()
  educationFit: FitDetailsDto;
}

export class JobFitSummaryDto {
  @ApiProperty({ description: 'Whether the candidate is recommended' })
  isRecommended: boolean;

  @ApiProperty({ description: 'Overall fit level (High/Medium/Low)' })
  fitLevel: string;

  @ApiProperty({ description: 'Summary of fit analysis' })
  reason: string;

  @ApiProperty()
  fitBreakdown: JobFitBreakdownDto;
}

export class RecruiterRecommendationsDto {
  @ApiProperty({ description: 'Suggested decision (Accept/Reject/Further Review)' })
  decision: string;

  @ApiProperty({ description: 'Specific action recommended' })
  suggestedAction: string;

  @ApiProperty({ description: 'Feedback points for the candidate', type: [String] })
  feedbackToSend: string[];
}

export class JobApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ type: CandidateInfoDto })
  candidate: CandidateInfoDto;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Application status' })
  status: string;

  @ApiProperty({ description: 'Application submission date' })
  appliedAt: Date;

  @ApiProperty()
  fitScore: FitScoreDto;

  @ApiProperty({ description: 'Matched keywords from job requirements', type: [String] })
  matchedKeywords: string[];

  @ApiProperty({ description: 'Key highlights from candidate profile', type: [String] })
  highlightsToStandOut: string[];

  @ApiProperty()
  jobFitSummary: JobFitSummaryDto;

  @ApiProperty()
  recruiterRecommendations: RecruiterRecommendationsDto;

  @ApiProperty({ description: 'Last analysis update time' })
  lastUpdated: Date;
}

export class JobApplicationsListResponseDto {
  @ApiProperty({ type: [JobApplicationResponseDto] })
  applications: JobApplicationResponseDto[];

  @ApiProperty({ description: 'Total number of applications' })
  total: number;
}