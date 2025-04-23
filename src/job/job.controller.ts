import { Controller, Post, Get, Body, Query, Param, UseGuards, Request, HttpStatus, HttpException, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { JobListResponseDto, JobResponseDto } from './dto/job-response.dto';
import { RemainingPostsResponseDto } from './dto/remaining-posts.dto';

@Controller('jobs')
@ApiTags('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @Post('create')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new job posting' })
  async createJob(
    @Request() req,
    @Body('job') createJobDto: CreateJobDto
  ): Promise<{ message: string; id: string }> {
    const companyId = req.user.companyId;
    if (!companyId) {
      throw new UnauthorizedException('Company access required');
    }
    return await this.jobService.createJob(companyId, createJobDto);
  }

  @Get('my-jobs')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all jobs posted by the authenticated company' })
  @ApiResponse({
    status: 200,
    description: 'List of company jobs retrieved successfully',
    type: JobListResponseDto
  })
  async getCompanyJobs(@Request() req): Promise<JobListResponseDto> {
    try {
      const companyId = req.user.companyId;
      if (!companyId) {
        throw new UnauthorizedException('Company access required');
      }
      return await this.jobService.getCompanyJobs(companyId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('remaining-posts')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get remaining available job posts for the company' })
  @ApiResponse({
    status: 200,
    description: 'Number of remaining job posts retrieved successfully',
    type: RemainingPostsResponseDto
  })
  async getRemainingPosts(@Request() req): Promise<RemainingPostsResponseDto> {
    try {
      const companyId = req.user.companyId;
      if (!companyId) {
        throw new UnauthorizedException('Company access required');
      }
      return await this.jobService.getRemainingPosts(companyId);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get remaining posts',
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('list')
  @ApiOperation({ summary: 'Get list of active job postings with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of job offers retrieved successfully',
    type: JobListResponseDto
  })
  @ApiQuery({ name: 'keyword', required: false })
  @ApiQuery({ name: 'location', required: false })
  @ApiQuery({ name: 'domain', required: false })
  @ApiQuery({ name: 'remote', required: false, type: Boolean })
  @ApiQuery({ name: 'salaryMin', required: false, type: Number })
  @ApiQuery({ name: 'salaryMax', required: false, type: Number })
  @ApiQuery({ name: 'experienceMin', required: false, type: Number })
  @ApiQuery({ name: 'experienceMax', required: false, type: Number })
  @ApiQuery({ name: 'educationLevel', required: false })
  @ApiQuery({ name: 'contractType', required: false })
  @ApiQuery({ name: 'languages', required: false, isArray: true })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['newest', 'salary', 'experience'] })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'skip', required: false, type: Number })
  async getJobList(@Query() filters: FilterJobsDto): Promise<JobListResponseDto> {
    try {
      return await this.jobService.getJobList(filters);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':jobId')
  @ApiOperation({ summary: 'Get detailed information about a specific job' })
  @ApiResponse({
    status: 200,
    description: 'Job details retrieved successfully',
    type: JobResponseDto
  })
  @ApiResponse({ status: 404, description: 'Job not found or has expired' })
  async getJobDetails(@Param('jobId') jobId: string): Promise<JobResponseDto> {
    try {
      return await this.jobService.getJobDetails(jobId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.NOT_FOUND
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/apply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Apply for a job' })
  @ApiResponse({
    status: 200,
    description: 'Application submitted successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async applyToJob(
    @Request() req,
    @Param('jobId') jobId: string
  ): Promise<{ message: string }> {
    try {
      return await this.jobService.applyToJob(req.user.userId, jobId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/withdraw')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Withdraw a job application' })
  @ApiResponse({
    status: 200,
    description: 'Application withdrawn successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  async withdrawApplication(
    @Request() req,
    @Param('jobId') jobId: string
  ): Promise<{ message: string }> {
    try {
      return await this.jobService.withdrawApplication(req.user.userId, jobId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
}