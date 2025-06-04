import { Controller, Get, Param, Query, UseGuards, Request, HttpStatus, HttpException, UseInterceptors, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse as SwaggerApi, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FilterApplicationsDto } from '../application/dto/filter-applications.dto';
import { ApiResponseData } from '../common/interfaces/api-response.interface';
import { ApplicationService } from '../application/application.service';
import { Request as ExpressRequest } from 'express';
import { JobApplicationsListResponseDto, JobApplicationResponseDto, TunisianMarketDto } from './dto/job-application-response.dto';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { ApplicationDocument } from '../schemas/application.schema';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  }
}

@ApiTags('Applications aux Offres')
@ApiBearerAuth()
@Controller('jobs')
@UseGuards(JwtAuthGuard)
export class JobApplicationsController {
  private readonly logger = new Logger(JobApplicationsController.name);

  constructor(private readonly applicationService: ApplicationService) {}

  @Get(':jobId/applications')
  @ApiOperation({
    summary: 'Récupérer les candidatures',
    description: 'Obtenir toutes les candidatures pour une offre avec pagination'
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID de l\'offre',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Nombre de candidatures par page (défaut: 5)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Nombre de candidatures à sauter (défaut: 0)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Tri par date (défaut: desc)' })
  @SwaggerApi({
    status: 200,
    description: 'Candidatures récupérées avec succès',
    type: JobApplicationsListResponseDto
  })
  @SwaggerApi({ status: 401, description: 'Non autorisé - Token invalide' })
  @SwaggerApi({ status: 404, description: 'Offre non trouvée' })
  @UseInterceptors(TransformInterceptor)
  async getJobApplications(
    @Request() req: RequestWithUser,
    @Param('jobId') jobId: string,
    @Query() filters: FilterApplicationsDto
  ): Promise<ApiResponseData<JobApplicationsListResponseDto>> {
    try {
      const result = await this.applicationService.getApplicationsByJob(jobId, filters);
      
      const applications = await Promise.all(
        result.applications.map(async (app) => {
          try {
            return this.mapToResponseDto(app);
          } catch (error) {
            this.logger.error(`Error mapping application ${app._id}: ${error.message}`, {
              jobId,
              applicationId: app._id,
              error: error.stack
            });
            return null;
          }
        })
      );

      const validApplications = applications.filter(Boolean) as JobApplicationResponseDto[];

      return {
        statusCode: 200,
        message: 'Applications retrieved successfully',
        data: {
          applications: validApplications,
          total: result.total
        },
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get applications for job ${jobId}: ${error.message}`, error);
      throw new HttpException(
        'Erreur lors de la récupération des candidature',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  
  }

  private getDecision(score: number): string {
    score = score || 0;
    if (score >= 85) return 'Recommandé fortement';
    if (score >= 70) return 'Recommandé';
    if (score >= 50) return 'À considérer';
    return 'Non recommandé';
  }

  private getSuggestedAction(alerts: any[]): string {
    const highPriorityAlert = alerts.find(a => a.severite === 'élevée');
    if (highPriorityAlert) {
      return `Action prioritaire: ${highPriorityAlert.probleme}`;
    }
    const mediumPriorityAlert = alerts.find(a => a.severite === 'moyenne');
    if (mediumPriorityAlert) {
      return mediumPriorityAlert.probleme;
    }
    return 'Procéder à l\'évaluation standard';
  }

  private getFeedback(alerts: any[]): string[] {
    return alerts
      .sort((a, b) => {
        const severityOrder = { 'élevée': 3, 'moyenne': 2, 'faible': 1 };
        return severityOrder[b.severite] - severityOrder[a.severite];
      })
      .map(alert => alert.probleme)
      .filter(Boolean);
  }

  private calculateSkillScore(pointsForts: string[]): number {
    const skillRelatedStrengths = pointsForts.filter(point =>
      point.toLowerCase().includes('compétence') ||
      point.toLowerCase().includes('technique') ||
      point.toLowerCase().includes('skill')
    ).length;
    return Math.min(Math.round((skillRelatedStrengths / pointsForts.length) * 100), 100) || 0;
  }

  private calculateExperienceScore(
    experiences: any[],
    jobRequirements: any
  ): number {
    if (!experiences?.length || !jobRequirements) return 0;

    const requiredTechs = new Set(jobRequirements.technologies || []);
    const requiredDomains = new Set(jobRequirements.activityDomains || []);
    
    let score = 0;
    
    experiences.forEach(exp => {
      // Tech stack match
      const techMatch = (exp.technologies || [])
        .filter(t => requiredTechs.has(t))
        .length / requiredTechs.size || 0;
      
      // Domain experience
      const domainMatch = requiredDomains.has(exp.domain) ? 1 : 0;
      
      // Project complexity (duration in months)
      const durationMonths = Math.ceil(
        (exp.endDate?.getTime() || Date.now() - exp.startDate.getTime())
        / (30 * 24 * 60 * 60 * 1000)
      );
      const durationScore = Math.min(durationMonths / 24, 1); // 2 years max
      
      // Achievement impact
      const achievementScore = exp.achievements?.length ? 0.2 : 0;
      
      score += (techMatch * 40) + (domainMatch * 30) +
              (durationScore * 20) + (achievementScore * 10);
    });

    return Math.min(Math.round(score / experiences.length), 100);
  }

  private calculateEducationScore(pointsForts: string[]): number {
    const educationRelatedStrengths = pointsForts.filter(point =>
      point.toLowerCase().includes('formation') ||
      point.toLowerCase().includes('diplôme') ||
      point.toLowerCase().includes('étude')
    ).length;
    return Math.min(Math.round((educationRelatedStrengths / pointsForts.length) * 100), 100) || 0;
  }

  private getFitLevel(adequationPoste: string): string {
    const score = parseInt(adequationPoste) || 0;
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Faible';
  }

  private getMatchLevel(alerts: any[], type: string): string {
    const relevantAlert = alerts.find(alert => alert.type === type);
    if (!relevantAlert) return 'Non évalué';
    
    switch (relevantAlert.severite) {
      case 'faible': return 'Excellent';
      case 'moyenne': return 'Bon';
      case 'elevee': return 'À améliorer';
      default: return 'Non évalué';
    }
  }

  private extractDetails(alerts: any[], type: string): string[] {
    const relevantAlert = alerts.find(alert => alert.type === type);
    if (!relevantAlert) return [];
    return [relevantAlert.probleme, relevantAlert.suggestion].filter(Boolean);
  }

  private mapToResponseDto(app: ApplicationDocument & {
    candidat?: any;
    poste?: any;
    companyId?: any;
    analyse?: any;
  }): JobApplicationResponseDto {
    try {
      const defaultRecommendations = {
        decision: 'En attente',
        suggestedAction: 'Analyse en cours',
        feedbackToSend: []
      };

      const defaultFitScore = {
        overall: 0,
        skills: 0,
        experience: 0,
        education: 0,
        languages: 0
      };

      const defaultResponse = {
        ...defaultFitScore,
        matchedKeywords: [],
        highlightsToStandOut: []
      };

      const defaultFitSummary = {
        isRecommended: false,
        fitLevel: 'Non évalué',
        reason: 'Analyse en attente',
        fitBreakdown: {
          skillsFit: {
            matchLevel: 'Non évalué',
            details: [],
            techStackMatch: [],
            domainExperience: []
          },
          experienceFit: {
            matchLevel: 'Non évalué',
            details: [],
            techStackMatch: [],
            domainExperience: []
          },
          educationFit: {
            matchLevel: 'Non évalué',
            details: [],
            techStackMatch: [],
            domainExperience: []
          }
        }
      };

      // Map Tunisian market data if available
      const tunisianMarket = app.analyse?.marchéTunisien ? {
        salaryRange: {
          min: app.analyse.marchéTunisien.fourchetteSalariale?.min || 0,
          max: app.analyse.marchéTunisien.fourchetteSalariale?.max || 0,
          currency: app.analyse.marchéTunisien.fourchetteSalariale?.devise || 'TND'
        },
        hiringPotential: app.analyse.marchéTunisien.potentielDEmbauche || 'Non évalué',
        inDemandSkills: app.analyse.marchéTunisien.compétencesDemandées || [],
        estimatedRecruitmentTime: app.analyse.marchéTunisien.tempsEstiméRecrutement || 'Non évalué'
      } : undefined;

      return {
        applicationId: app._id?.toString() || '',
        candidate: app.candidat ? {
          id: app.candidat._id?.toString() || '',
          fullName: `${app.candidat.firstName || ''} ${app.candidat.lastName || ''}`.trim(),
          email: app.candidat?.email || '',
          phone: app.candidat.phone || ''
        } : {
          id: '',
          fullName: '',
          email: '',
          phone: ''
        },
        jobId: app.poste?._id?.toString() || '',
        companyId: app.companyId?._id?.toString() || '',
        status: app.statut || 'en_attente',
        appliedAt: app.datePostulation || new Date(),
        matchedKeywords: app.analyse?.matchedKeywords || [],
        highlightsToStandOut: app.analyse?.highlightsToStandOut || [],
        tunisianMarket,
        fitScore: {
          overall: app.analyse?.scoreDAdéquation?.global || 0,
          skills: app.analyse?.scoreDAdéquation?.compétences || 0,
          experience: this.calculateExperienceScore(
            app.candidat?.experience || [],
            app.poste?.requirements
          ),
          education: app.analyse?.scoreDAdéquation?.formation ? 100 : 0,
          languages: app.analyse?.scoreDAdéquation?.langues || 0
        },
        jobFitSummary: {
          isRecommended: app.analyse?.synthèseAdéquation?.recommandé || false,
          fitLevel: app.analyse?.synthèseAdéquation?.niveauAdéquation || 'Non évalué',
          reason: app.analyse?.synthèseAdéquation?.raison || 'Non évalué',
          fitBreakdown: {
            skillsFit: {
              matchLevel: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationCompétences?.niveau || 'Non évalué',
              details: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationCompétences?.détails || [],
              techStackMatch: [],
              domainExperience: []
            },
            experienceFit: {
              matchLevel: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationExpérience?.niveau || 'Non évalué',
              details: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationExpérience?.détails || [],
              techStackMatch: app.analyse?.technologiesCorrespondantes || [],
              domainExperience: app.analyse?.domainesDExpérience || []
            },
            educationFit: {
              matchLevel: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationFormation?.niveau || 'Non évalué',
              details: app.analyse?.synthèseAdéquation?.détailsAdéquation?.adéquationFormation?.détails || [],
              techStackMatch: [],
              domainExperience: []
            }
          }
        },
        lastUpdated: app.dateAnalyse || app.datePostulation,
        recruiterRecommendations: {
          decision: app.analyse?.recommandationsRecruteur?.décision || 'En attente',
          suggestedAction: app.analyse?.recommandationsRecruteur?.actionSuggérée || 'Analyse en cours',
          feedbackToSend: app.analyse?.recommandationsRecruteur?.retourCandidat || []
        },
        // Add the new fields
        skills: app.candidat?.skills?.map(skill => skill.name) || [],
        jobTitle: app.poste?.title || '',
        dateSeen: app.dateSeen,
        dateInterviewScheduled: app.dateInterviewScheduled,
        dateConfirmed: app.dateConfirmed,
        dateCancelled: app.dateCancelled,
        cancellationReason: app.cancellationReason
      };
    } catch (error) {
      this.logger.error(`Error mapping application: ${error.message}`);
      throw error;
    }
  }

  @Get(':jobId/candidate/:candidateId/application')
  @ApiOperation({
    summary: 'Get candidate application for specific job',
    description: 'Get details of a specific candidate\'s application for a job'
  })
  @ApiParam({
    name: 'jobId',
    description: 'ID of the job',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiParam({
    name: 'candidateId',
    description: 'ID of the candidate',
    example: '507f1f77bcf86cd799439012'
  })
  @SwaggerApi({
    status: 200,
    description: 'Application retrieved successfully',
    type: JobApplicationResponseDto
  })
  @SwaggerApi({ status: 401, description: 'Non autorisé - Token invalide' })
  @SwaggerApi({ status: 404, description: 'Application non trouvée' })
  @UseInterceptors(TransformInterceptor)
  async getCandidateApplicationForJob(
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string
  ): Promise<ApiResponseData<JobApplicationResponseDto>> {
    try {
      const application = await this.applicationService.getApplicationByCandidateAndJob(jobId, candidateId);
      const mappedApplication = this.mapToResponseDto(application);

      return {
        statusCode: 200,
        message: 'Application retrieved successfully',
        data: mappedApplication,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get application for job ${jobId} and candidate ${candidateId}: ${error.message}`, error);
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}