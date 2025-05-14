import { Controller, Post, Get, Delete, Body, Query, Param, UseGuards, Request, HttpStatus, HttpException, UnauthorizedException, Ip, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Job, JobDocument } from '../schemas/job.schema';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { FilterJobsDto } from './dto/filter-jobs.dto';
import { JobListResponseDto, JobResponseDto } from './dto/job-response.dto';
import { RemainingPostsResponseDto } from './dto/remaining-posts.dto';
import { CandidateResponseDto } from './dto/candidate-response.dto';

@Controller('jobs')
@ApiTags('job')
export class JobController {
  constructor(
    private readonly jobService: JobService,
    @InjectModel(Job.name) private jobModel: Model<JobDocument>
  ) {}

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
      return await this.jobService.getJobListDirect(filters);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for jobs with filters (alias for list endpoint)' })
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
  async searchJobs(@Query() filters: FilterJobsDto): Promise<JobListResponseDto> {
    try {
      return await this.jobService.getJobListDirect(filters);
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

  @Delete(':jobId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a job posting' })
  @ApiResponse({
    status: 200,
    description: 'Job deleted successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized to delete this job' })
  async deleteJob(
    @Request() req,
    @Param('jobId') jobId: string
  ): Promise<{ message: string }> {
    try {
      const companyId = req.user.companyId;
      if (!companyId) {
        throw new UnauthorizedException('Company access required');
      }
      return await this.jobService.deleteJob(companyId, jobId);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':jobId/candidate/:candidateId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get complete candidate profile by job ID' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiParam({ name: 'candidateId', description: 'Candidate ID' })
  @ApiResponse({
    status: 200,
    description: 'Candidate profile retrieved successfully',
    type: CandidateResponseDto
  })
  @ApiResponse({ status: 404, description: 'Job or candidate not found' })
  @ApiResponse({ status: 403, description: 'Unauthorized access' })
  async getCandidateByJobId(
    @Request() req,
    @Param('jobId') jobId: string,
    @Param('candidateId') candidateId: string
  ): Promise<any> {
    try {
      console.log('Auth Debug:', {
        userRole: req.user.role,
        userId: req.user.userId,
        companyId: req.user.companyId,
        requestedJobId: jobId,
        requestedCandidateId: candidateId,
        companyIdType: typeof req.user.companyId
      });

      // Check if user is the candidate themselves
      if (req.user.userId === candidateId) {
        console.log('Access granted: User is the candidate');
        return await this.jobService.getCandidateByJobId(jobId, candidateId);
      }

      // Check if user is admin
      if (req.user.role === 'admin') {
        console.log('Access granted: User is admin');
        return await this.jobService.getCandidateByJobId(jobId, candidateId);
      }

      // Check if user has company access (either as company or invited user)
      if ((req.user.role === 'company' || req.user.role === 'user') && req.user.companyId) {
        console.log('User is a company representative');
        
        // Convert string IDs to ObjectId for comparison
        const jobObjectId = new Types.ObjectId(jobId);
        const companyObjectId = new Types.ObjectId(req.user.companyId);
        
        // Verify job belongs to the company
        const job = await this.jobModel.findOne({
          _id: jobObjectId,
          companyId: companyObjectId
        })
        .select('_id')
        .lean()
        .exec();

        if (!job) {
          console.log('Job not found or does not belong to company:', {
            jobId,
            companyId: req.user.companyId
          });
          throw new UnauthorizedException('Company is not authorized to access this job\'s candidates');
        }

        console.log('Access granted: Company owns the job');
        return await this.jobService.getCandidateByJobId(jobId, candidateId);
      }

      throw new UnauthorizedException('Unauthorized access to candidate profile');
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get('v1/cached')
  @ApiOperation({ summary: 'Get list of active job postings with caching enabled' })
  @ApiResponse({
    status: 200,
    description: 'List of job offers retrieved successfully with caching',
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
  async getJobListCached(@Query() filters: FilterJobsDto): Promise<JobListResponseDto> {
    try {
      return await this.jobService.getJobListCached(filters);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }

  @Post(':jobId/seen')
  @ApiOperation({ summary: 'Record a job view' })
  @ApiParam({ name: 'jobId', description: 'Job ID' })
  @ApiResponse({
    status: 200,
    description: 'Job view recorded successfully',
    schema: {
      properties: {
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Job not found' })
  async recordJobView(
    @Param('jobId') jobId: string,
    @Ip() ipAddress: string
  ): Promise<{ message: string }> {
    try {
      return await this.jobService.recordJobView(jobId, ipAddress);
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST
      );
    }
  }
}