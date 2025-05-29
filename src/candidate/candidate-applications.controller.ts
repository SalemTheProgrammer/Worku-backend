import { Controller, Get, UseGuards, Request, HttpException, HttpStatus, Logger, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { Request as ExpressRequest } from 'express';
import { ApplicationService } from '../application/application.service';
import { CandidateApplicationsResponseDto } from './dto/candidate-applications-response.dto';
import { TransformInterceptor } from '../common/interceptors/transform.interceptor';
import { ApiResponseData } from '../common/interfaces/api-response.interface';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('auth/candidate/applications')
@ApiTags('candidate-applications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CandidateApplicationsController {
  private readonly logger = new Logger(CandidateApplicationsController.name);

  constructor(
    private readonly candidateService: CandidateService,
    private readonly applicationService: ApplicationService,
  ) {}
  @Get()
  @ApiOperation({
    summary: 'Get all applications for the authenticated candidate',
    description: 'Returns a list of all job applications submitted by the authenticated candidate'
  })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully',
    type: CandidateApplicationsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @UseInterceptors(TransformInterceptor)
  async getMyApplications(@Request() req: RequestWithUser): Promise<ApiResponseData<CandidateApplicationsResponseDto>> {
    try {
      const result = await this.applicationService.getApplicationsByCandidate(req.user.userId);
      
      // Filter and map applications
      const applications = result.applications
        .filter(app => {
          // Only include applications where the job exists and has an ID
          return app.poste &&
                 typeof app.poste === 'object' &&
                 app.poste !== null &&
                 app.poste._id;
        })
        .map(app => {
          // Handle company data
          let companyId = '';
          let companyName = 'Unknown Company';
          
          if (app.companyId && typeof app.companyId === 'object' && app.companyId !== null) {
            companyId = app.companyId._id ? app.companyId._id.toString() : '';
            companyName = (app.companyId as any).nomEntreprise || 'Unknown Company';
          }

          return {
            id: app._id.toString(),
            company: {
              id: companyId,
              name: companyName
            },
            job: {
              id: app.poste._id.toString(),
              title: (app.poste as any).title
            },
            appliedAt: app.datePostulation,
            status: app.statut || 'en_attente',
            isRejected: app.isRejected || false
          };
        });

      return {
        statusCode: 200,
        message: 'Applications retrieved successfully',
        data: {
          applications,
          total: applications.length // Update total to reflect filtered applications
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
}
