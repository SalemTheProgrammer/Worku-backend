import { ApiProperty } from '@nestjs/swagger';
import { CandidateProfileDto } from './job-applications.dto';

export class CompetenceAnalysisDto {
  @ApiProperty({ example: 'JavaScript' })
  nom: string;

  @ApiProperty({ example: 'Expert' })
  niveau?: string;

  @ApiProperty({ example: 0.85 })
  correspondance?: number;

  @ApiProperty({ example: 'Critique' })
  importance: string;

  @ApiProperty({ example: 'Consider getting AWS certification' })
  recommendation?: string;
}

export class ExperienceAnalysisDto {
  @ApiProperty({ example: 3 })
  annéesRelevantes: number;

  @ApiProperty({ example: 0.75 })
  alignementPoste: number;

  @ApiProperty({ example: ['Strong leadership skills', 'Project management expertise'] })
  pointsForts: string[];

  @ApiProperty({ example: ['Cloud infrastructure experience'] })
  domainesAmélioration: string[];

  @ApiProperty({ example: ['Led team of 5 developers', 'Managed $1M budget'] })
  experiencesClés: string[];
}

export class FormationAnalysisDto {
  @ApiProperty({ example: 0.9 })
  pertinence: number;

  @ApiProperty({ example: 'Bachelor degree matches job requirements' })
  détailsAlignement: string;

  @ApiProperty({ example: 0.8 })
  certificationsValeur: number;
}

export class RecommendationsDto {
  @ApiProperty({ example: ['Complete AWS certification', 'Gain cloud experience'] })
  prioritaires: string[];

  @ApiProperty({ example: ['Focus on cloud architecture', 'Develop team management skills'] })
  développementProfessionnel: string[];

  @ApiProperty({ example: 'Consider cloud architect roles' })
  prochaineMission: string;
}

export class SyntheseDto {
  @ApiProperty({ example: ['Strong technical background', 'Excellent leadership'] })
  pointsForts: string[];

  @ApiProperty({ example: ['Limited cloud experience', 'No AWS certification'] })
  pointsAmélioration: string[];

  @ApiProperty({ example: 'Strong candidate with potential for growth' })
  conclusionGénérale: string;
}

export class CorrespondanceDto {
  @ApiProperty({ example: 0.85, type: Number })
  globale: number;

  @ApiProperty({ example: 0.9, type: Number })
  competences: number;

  @ApiProperty({ example: 0.8, type: Number })
  experience: number;

  @ApiProperty({ example: 0.85, type: Number })
  education: number;
}

export class AnalyseCompetencesDto {
  @ApiProperty({ type: [CompetenceAnalysisDto] })
  competencesCorrespondantes: CompetenceAnalysisDto[];

  @ApiProperty({ type: [CompetenceAnalysisDto] })
  competencesManquantes: CompetenceAnalysisDto[];
}

export class ApplicationAnalysisDto {
  @ApiProperty({ type: CorrespondanceDto })
  correspondance: CorrespondanceDto;

  @ApiProperty({ type: AnalyseCompetencesDto })
  analyseCompetences: AnalyseCompetencesDto;

  @ApiProperty({ type: ExperienceAnalysisDto })
  analyseExperience: ExperienceAnalysisDto;

  @ApiProperty({ type: FormationAnalysisDto })
  analyseFormation: FormationAnalysisDto;

  @ApiProperty({ type: RecommendationsDto })
  recommendations: RecommendationsDto;

  @ApiProperty({ type: SyntheseDto })
  synthèse: SyntheseDto;
}

export class CandidateApplicationAnalysisDto {
  @ApiProperty({ type: CandidateProfileDto })
  candidate: CandidateProfileDto;

  @ApiProperty({ type: ApplicationAnalysisDto })
  analysis: ApplicationAnalysisDto;

  @ApiProperty({ example: '2024-04-29T14:58:00.000Z', type: Date })
  appliedAt: Date;

  @ApiProperty({ example: 'analysé', enum: ['en_attente', 'analysé', 'présélectionné', 'rejeté'] })
  status: string;
}

export class JobApplicationAnalysisResponseDto {
  @ApiProperty({ type: [CandidateApplicationAnalysisDto] })
  applications: CandidateApplicationAnalysisDto[];

  @ApiProperty({ example: 10, type: Number })
  total: number;
}