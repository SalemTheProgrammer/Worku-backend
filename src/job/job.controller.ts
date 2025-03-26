import { Controller, Post, Get, Put, Body, Param, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';

@Controller('auth/job')
@ApiTags('Job')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create')
  @ApiBearerAuth()
  @ApiCreatedResponse({ description: 'Job offer created successfully.' })
  async createJob(@Request() req, @Body() createJobDto: CreateJobDto) {
    try {
      // Assuming only companies can create jobs
      return await this.jobService.createJob(req.user.userId, createJobDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('list')
  @ApiOkResponse({ description: 'List of job offers retrieved successfully.' })
  async getJobList() {
    try {
      return await this.jobService.getJobList();
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get(':jobId')
  @ApiOkResponse({ description: 'Job offer details retrieved successfully.' })
  async getJobDetails(@Param('jobId') jobId: string) {
    try {
      return await this.jobService.getJobDetails(jobId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/apply')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Job application submitted successfully.' })
  async applyToJob(@Request() req, @Param('jobId') jobId: string) {
    try {
      // Assuming only candidates can apply to jobs
      return await this.jobService.applyToJob(req.user.userId, jobId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post(':jobId/withdraw')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Job application withdrawn successfully.' })
  async withdrawApplication(@Request() req, @Param('jobId') jobId: string) {
    try {
      // Assuming only candidates can withdraw their application
      return await this.jobService.withdrawApplication(req.user.userId, jobId);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}