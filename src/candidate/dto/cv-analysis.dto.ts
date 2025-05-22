import { ApiProperty } from '@nestjs/swagger';

export class CvFormattingFeedbackDto {
  @ApiProperty({ example: 'Dates' })
  section: string;

  @ApiProperty({ example: 'Date format is inconsistent' })
  issue: string;

  @ApiProperty({ example: 'Use consistent date format throughout your CV (MM/YYYY)' })
  recommendation: string;

  @ApiProperty({ example: 'medium', enum: ['critical', 'high', 'medium', 'low'] })
  severity: string;
}

export class CvContentFeedbackDto {
  @ApiProperty({ example: 'Experience professionnelle' })
  section: string;

  @ApiProperty({ example: 'Les dates de votre stage chez XYZ sont incorrectes (2027-2028)' })
  issue: string;

  @ApiProperty({ example: 'Vérifiez et corrigez les dates de votre expérience chez XYZ' })
  recommendation: string;

  @ApiProperty({ example: 'high', enum: ['critical', 'high', 'medium', 'low'] })
  severity: string;
}

export class CvStrengthDto {
  @ApiProperty({ example: 'Présentation des compétences techniques' })
  aspect: string;

  @ApiProperty({ example: 'Bonne organisation et catégorisation de vos compétences techniques' })
  details: string;
}

export class CvSummaryDto {
  @ApiProperty({ example: 'Bon CV avec quelques points à améliorer' })
  overallAssessment: string;

  @ApiProperty({ example: 'Votre CV est bien structuré et présente clairement vos compétences et expériences.' })
  generalFeedback: string;

  @ApiProperty({ example: 85, description: 'Overall CV quality score (0-100)' })
  quality: number;
}

export class CvAnalysisResponseDto {
  @ApiProperty({ type: CvSummaryDto })
  summary: CvSummaryDto;

  @ApiProperty({ type: [CvStrengthDto] })
  strengths: CvStrengthDto[];

  @ApiProperty({ type: [CvFormattingFeedbackDto] })
  formattingFeedback: CvFormattingFeedbackDto[];

  @ApiProperty({ type: [CvContentFeedbackDto] })
  contentFeedback: CvContentFeedbackDto[];

  @ApiProperty({ example: ['Ajouter des résultats quantifiables pour chaque expérience', 'Inclure des liens vers vos projets GitHub'] })
  improvementSuggestions: string[];

  @ApiProperty({ example: 'https://example.com/cv-advice' })
  resourcesLink?: string;
}