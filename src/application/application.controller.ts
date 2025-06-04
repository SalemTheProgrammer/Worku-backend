import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  UseGuards,
  Request,
  HttpStatus,
  HttpException,
  Query,
  Delete,
  UseInterceptors,
  Logger
} from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FilterApplicationsDto } from './dto/filter-applications.dto';
import { GetApplicationsResult } from './interfaces/application.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { ApplicationDocument } from '../schemas/application.schema';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { ApiResponseData } from '../common/interfaces/api-response.interface';
import { JobApplicationsListResponseDto, JobApplicationResponseDto } from '../job/dto/job-application-response.dto';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@ApiTags('Applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('applications')
export class ApplicationController {
  private readonly logger = new Logger(ApplicationController.name);

  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit job application',
    description: 'Submit a new job application with CV analysis',
  })
  @ApiBody({ type: CreateApplicationDto })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
    schema: {
      properties: {
        id: { type: 'string', example: '507f1f77bcf86cd799439013' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 429, description: 'Too Many Requests' })
  async createApplication(
    @Request() req: RequestWithUser,
    @Body() createApplicationDto: CreateApplicationDto,
  ) {
    try {
      return await this.applicationService.createApplication(
        req.user.userId,
        createApplicationDto.jobId,
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error submitting application',
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
  @Get()
  @ApiOperation({
    summary: 'Get all applications for your company',
    description:
      'Fetch all applications belonging to the authenticated company, with optional job-filtering & pagination',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    type: String,
    description: 'Filter by a specific job ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 5)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Items to skip (default 0)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: "Sort by application date ('asc' or 'desc', default 'desc')",
  })
  @ApiResponse({ status: 200, description: 'Company applications retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden – not a company user' })
  @UseInterceptors(TransformInterceptor)
  async getCompanyApplications(
    @Request() req: RequestWithUser,
    @Query() filters: FilterApplicationsDto,
  ): Promise<ApiResponseData<JobApplicationsListResponseDto>> {
    try {
      // Add role validation
      if (!req.user || !['admin', 'company'].includes(req.user.role?.toLowerCase())) {
        this.logger.error(`Unauthorized access attempt - user role: ${req.user?.role}`);
        throw new HttpException('Unauthorized - Company access required', HttpStatus.FORBIDDEN);
      }

      const result = await this.applicationService.getApplicationsByCompany(
        req.user.userId,
        filters,
      );
      
      const validApplications = result.applications.map(app => this.mapApplicationToResponseDto(app));

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
      this.logger.error(`Failed to get applications: ${error.message}`, error);
      throw new HttpException(
        'Error retrieving applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  @Get(':id')
  @ApiOperation({
    summary: 'Get application details',
    description: 'Get detailed info about a specific application',
  })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ status: 200, description: 'Application found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not Found' })
  @UseInterceptors(TransformInterceptor)
  async getApplication(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ): Promise<ApiResponseData<JobApplicationResponseDto>> {
    try {
      const app = await this.applicationService.getApplicationById(id);
      const candidateId = (app.candidat && typeof app.candidat === 'object' && '_id' in app.candidat)
        ? app.candidat._id.toString()
        : (app.candidat as any).toString();
      if (candidateId !== req.user.userId && req.user.role !== 'company') {
        throw new HttpException('Unauthorized access', HttpStatus.FORBIDDEN);
      }
      
      const applicationDto = this.mapApplicationToResponseDto(app);
      
      return {
        statusCode: 200,
        message: 'Application retrieved successfully',
        data: applicationDto,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error(`Failed to get application ${id}: ${error.message}`, error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Error retrieving application',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }  @Get('candidate/applications')
  @ApiOperation({
    summary: 'Get your own candidate applications',
    description: 'Fetch all applications submitted by the authenticated candidate',
  })
  @ApiQuery({
    name: 'jobId',
    required: false,
    type: String,
    description: 'Filter by a specific job ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default 5)',
  })
  @ApiQuery({
    name: 'skip',
    required: false,
    type: Number,
    description: 'Items to skip (default 0)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: "Sort by application date ('asc' or 'desc', default 'desc')",
  })
  @ApiResponse({ status: 200, description: 'Applications retrieved' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @UseInterceptors(TransformInterceptor)
  async getMyApplications(
    @Request() req: RequestWithUser,
    @Query() filters: FilterApplicationsDto,
  ): Promise<ApiResponseData<JobApplicationsListResponseDto>> {
    try {
      // If jobId is specified, filter by job, else get all applications by candidate
      const result = filters.jobId 
        ? await this.applicationService.getApplicationsByJob(filters.jobId, filters)
        : await this.applicationService.getApplicationsByCandidate(req.user.userId, filters);
      
      const validApplications = result.applications.map(app => this.mapApplicationToResponseDto(app));

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
      this.logger.error(`Failed to get candidate applications: ${error.message}`, error);
      throw new HttpException(
        'Error retrieving applications',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Withdraw application' })
  @ApiParam({ name: 'id', description: 'Application ID' })
  @ApiResponse({ status: 204, description: 'Application withdrawn' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async withdrawApplication(
    @Request() req: RequestWithUser,
    @Param('id') id: string,
  ) {
    const app = await this.applicationService.getApplicationById(id);
    const candidateId = (app.candidat && typeof app.candidat === 'object' && '_id' in app.candidat)
      ? app.candidat._id.toString()
      : (app.candidat as any).toString();
    if (candidateId !== req.user.userId) {
      throw new HttpException('Unauthorized', HttpStatus.FORBIDDEN);
    }
    await this.applicationService.deleteApplication(id);
    return;
  }
  // Add a helper method to transform applications to response DTOs
  private mapApplicationToResponseDto(app: any): JobApplicationResponseDto {
    try {
      if (!app) {
        throw new Error('Application document is null or undefined');
      }

      // The application document may have populated fields
      const candidate = app.candidat ? (typeof app.candidat === 'object' ? app.candidat : { _id: app.candidat }) : { _id: null };
      const job = app.poste ? (typeof app.poste === 'object' ? app.poste : { _id: app.poste }) : { _id: null };
      const company = app.companyId ? (typeof app.companyId === 'object' ? app.companyId : { _id: app.companyId }) : { _id: null };
      
      return {
        applicationId: app._id ? app._id.toString() : '',
        candidate: {
          id: candidate._id ? candidate._id.toString() : '',
          fullName: candidate.firstName && candidate.lastName ?
                  `${candidate.firstName} ${candidate.lastName}`.trim() : '',
          email: candidate.email || '',
          phone: candidate.phone || ''
        },
        jobId: job._id ? job._id.toString() : '',
        companyId: company._id ? company._id.toString() : '',
        status: app.statut || 'en_attente',
        appliedAt: app.datePostulation || new Date(),
        matchedKeywords: app.analyse?.matchedKeywords || [],
        highlightsToStandOut: app.analyse?.highlightsToStandOut || [],
        fitScore: {
          overall: app.analyse?.scoreDAdéquation?.global || 0,
          skills: app.analyse?.scoreDAdéquation?.compétences || 0,
          experience: app.analyse?.scoreDAdéquation?.expérience ? 100 : 0,
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
              techStackMatch: [],
              domainExperience: []
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
        skills: candidate.skills?.map(skill => skill.name) || [],
        jobTitle: job.title || ''
      };
    } catch (error) {
      this.logger.error(`Error mapping application: ${error.message}`);
      throw error;
    }
  }
}
