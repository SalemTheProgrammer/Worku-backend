import { Controller, Post, Get, Param, Body, UseGuards, Request, HttpStatus, HttpException, Query, Delete } from '@nestjs/common';
import { ApplicationService } from './application.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { FilterApplicationsDto } from './dto/filter-applications.dto';
import { GetApplicationsResult } from './interfaces/application.interface';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Request as ExpressRequest } from 'express';
import { ApplicationDocument } from '../schemas/application.schema';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  }
}

@ApiTags('Applications')
@ApiBearerAuth()
@Controller('applications')
@UseGuards(JwtAuthGuard)
export class ApplicationController {
  constructor(private readonly applicationService: ApplicationService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit job application',
    description: 'Submit a new job application with CV analysis'
  })
  @ApiBody({
    type: CreateApplicationDto,
    examples: {
      applicationExample: {
        summary: 'Example job application',
        description: 'A sample job application request',
        value: {
          jobId: "507f1f77bcf86cd799439011"
        }
      }
    }
  })
  @ApiResponse({
    status: 201,
    description: 'Application submitted successfully',
    schema: {
      properties: {
        id: { 
          type: 'string',
          example: '507f1f77bcf86cd799439013',
          description: 'The ID of the created application'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input or CV not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 429, description: 'Too Many Requests - Rate limit exceeded' })
  async createApplication(@Request() req: RequestWithUser, @Body() createApplicationDto: CreateApplicationDto) {
    try {
      const { jobId } = createApplicationDto;
      return await this.applicationService.createApplication(
        req.user.userId,
        jobId
      );
    } catch (error) {
      throw new HttpException(
        error.message || 'Error submitting application',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get application details',
    description: 'Get detailed information about a specific application'
  })
  @ApiParam({
    name: 'id',
    description: 'Application ID',
    example: '507f1f77bcf86cd799439011'
  })
  @ApiResponse({
    status: 200,
    description: 'Application details retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not owner of application' })
  @ApiResponse({ status: 404, description: 'Not Found - Application not found' })
  async getApplication(@Request() req: RequestWithUser, @Param('id') id: string): Promise<ApplicationDocument> {
    const application = await this.applicationService.getApplicationById(id);
    
    if (application.candidat.toString() !== req.user.userId) {
      throw new HttpException('Unauthorized access to application', HttpStatus.FORBIDDEN);
    }
    
    return application;
  }

  @Get('candidate/applications')
  @ApiOperation({
    summary: 'Get candidate applications',
    description: 'Get all applications submitted by the authenticated candidate'
  })
  @ApiResponse({
    status: 200,
    description: 'Applications retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async getMyApplications(@Request() req: RequestWithUser): Promise<ApplicationDocument[]> {
    return await this.applicationService.getApplicationsByCandidate(req.user.userId);
  }

  @Get('company/:companyId')
  @ApiOperation({
    summary: 'Get company applications',
    description: 'Get applications received by a specific company with pagination and filtering'
  })
  @ApiQuery({ name: 'jobId', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of applications per page (default: 5)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of applications to skip (default: 0)' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort by application date (default: desc)' })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '507f1f77bcf86cd799439012'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not a company user' })
  @ApiResponse({
    status: 200,
    description: 'Company applications retrieved successfully with pagination',
    schema: {
      properties: {
        applications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              _id: { type: 'string' },
              candidat: { type: 'object' },
              poste: { type: 'object' },
              datePostulation: { type: 'string', format: 'date-time' },
              statut: { type: 'string' }
            }
          }
        },
        total: { type: 'number' }
      }
    }
  })
  async getApplicationsByCompany(
    @Request() req: RequestWithUser,
    @Param('companyId') companyId: string,
    @Query() filters: FilterApplicationsDto
  ): Promise<GetApplicationsResult> {
    if (req.user.role !== 'company') {
      throw new HttpException(
        'Access restricted to company users',
        HttpStatus.FORBIDDEN
      );
    }
    return await this.applicationService.getApplicationsByCompany(companyId, filters);
  }

}