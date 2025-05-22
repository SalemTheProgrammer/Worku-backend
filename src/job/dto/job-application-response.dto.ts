import { ApiProperty } from '@nestjs/swagger';

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

export class TunisianMarketDto {
  @ApiProperty({ description: 'Salary range based on Tunisian market' })
  salaryRange: {
    min: number;
    max: number;
    currency: string;
  };

  @ApiProperty({ description: 'Hiring potential in Tunisian market' })
  hiringPotential: string;

  @ApiProperty({ description: 'In-demand skills for Tunisian market', type: [String] })
  inDemandSkills: string[];

  @ApiProperty({ description: 'Estimated hiring timeframe' })
  estimatedRecruitmentTime: string;
}

export class FitDetailDto {
  @ApiProperty({ description: 'Match level (Excellent, Bon, À améliorer, etc.)' })
  matchLevel: string;

  @ApiProperty({ description: 'Detailed analysis points', type: [String] })
  details: string[];

  @ApiProperty({ description: 'Technology stack matches', type: [String], required: false })
  techStackMatch?: string[];

  @ApiProperty({ description: 'Domain experience matches', type: [String], required: false })
  domainExperience?: string[];
}

export class JobFitSummaryDto {
  @ApiProperty({ description: 'Whether the candidate is recommended' })
  isRecommended: boolean;

  @ApiProperty({ description: 'Overall fit level (Excellent, Bon, Moyen, Faible)' })
  fitLevel: string;

  @ApiProperty({ description: 'Summary of fit analysis' })
  reason: string;

  @ApiProperty({ description: 'Detailed fit breakdown by category' })
  fitBreakdown: {
    skillsFit: FitDetailDto;
    experienceFit: FitDetailDto;
    educationFit: FitDetailDto;
  };
}

export class RecruiterRecommendationsDto {
  @ApiProperty({ description: 'Overall decision recommendation' })
  decision: string;

  @ApiProperty({ description: 'Suggested next action' })
  suggestedAction: string;

  @ApiProperty({ description: 'Feedback points to communicate to candidate', type: [String] })
  feedbackToSend: string[];
}

export class CandidateInfoDto {
  @ApiProperty({ description: 'Candidate ID' })
  id: string;

  @ApiProperty({ description: 'Candidate full name' })
  fullName: string;

  @ApiProperty({ description: 'Candidate email address' })
  email: string;

  @ApiProperty({ description: 'Candidate phone number' })
  phone: string;
}

export class JobApplicationResponseDto {
  @ApiProperty({ description: 'Application ID' })
  applicationId: string;

  @ApiProperty({ description: 'Candidate basic information' })
  candidate: CandidateInfoDto;

  @ApiProperty({ description: 'Job ID' })
  jobId: string;

  @ApiProperty({ description: 'Company ID' })
  companyId: string;

  @ApiProperty({ description: 'Application status' })
  status: string;

  @ApiProperty({ description: 'Application submission date' })
  appliedAt: Date;

  @ApiProperty({ description: 'Matched keywords from CV and job description', type: [String] })
  matchedKeywords: string[];

  @ApiProperty({ description: 'Candidate highlights to stand out', type: [String] })
  highlightsToStandOut: string[];

  @ApiProperty({ description: 'Tunisian market specific analysis' })
  tunisianMarket?: TunisianMarketDto;

  @ApiProperty({ description: 'Fit score assessment' })
  fitScore: FitScoreDto;

  @ApiProperty({ description: 'Job fit summary assessment' })
  jobFitSummary: JobFitSummaryDto;

  @ApiProperty({ description: 'Last analysis update time' })
  lastUpdated: Date;

  @ApiProperty({ description: 'Recruiter recommendations' })
  recruiterRecommendations: RecruiterRecommendationsDto;

  @ApiProperty({ description: 'Candidate skills', type: [String] })
  skills: string[];

  @ApiProperty({ description: 'Job title' })
  jobTitle: string;
}

export class JobApplicationsListResponseDto {
  @ApiProperty({ description: 'List of job applications', type: [JobApplicationResponseDto] })
  applications: JobApplicationResponseDto[];

  @ApiProperty({ description: 'Total number of applications matching the criteria' })
  total: number;
}