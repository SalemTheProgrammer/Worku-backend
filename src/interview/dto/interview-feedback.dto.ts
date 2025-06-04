import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString, IsArray, IsOptional, Min, Max } from 'class-validator';

export class InterviewFeedbackDto {
  @ApiProperty({ description: 'Overall rating (1-10)', example: 8, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  overallRating: number;

  @ApiProperty({ description: 'Technical skills rating (1-10)', example: 7, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  technicalSkills: number;

  @ApiProperty({ description: 'Communication skills rating (1-10)', example: 9, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  communication: number;

  @ApiProperty({ description: 'Motivation rating (1-10)', example: 8, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  motivation: number;

  @ApiProperty({ description: 'Cultural fit rating (1-10)', example: 9, minimum: 1, maximum: 10 })
  @IsNumber()
  @Min(1)
  @Max(10)
  culturalFit: number;

  @ApiProperty({ description: 'Additional comments', example: 'Great candidate with strong problem-solving skills' })
  @IsString()
  comments: string;

  @ApiProperty({ description: 'Candidate strengths', example: ['Strong technical skills', 'Good communication'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  strengths: string[];

  @ApiProperty({ description: 'Areas for improvement', example: ['Needs more experience with React'], type: [String] })
  @IsArray()
  @IsString({ each: true })
  weaknesses: string[];

  @ApiProperty({ description: 'Hiring recommendation', example: 'hire', enum: ['hire', 'reject', 'consider'] })
  @IsString()
  recommendation: string;
}

export class CancelInterviewDto {
  @ApiProperty({ description: 'Reason for cancellation', example: 'Candidate withdrew application' })
  @IsString()
  cancellationReason: string;
}

export class MarkInterviewCompleteDto {
  @ApiProperty({ type: InterviewFeedbackDto })
  feedback: InterviewFeedbackDto;

  @ApiProperty({ description: 'Whether to hire the candidate', example: true })
  @IsOptional()
  isHired?: boolean;

  @ApiProperty({ description: 'Reason for hiring decision', example: 'Strong technical skills and cultural fit' })
  @IsOptional()
  @IsString()
  hiringDecisionReason?: string;
}