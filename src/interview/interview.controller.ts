import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  UseGuards,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { InterviewDocument } from '../schemas/interview.schema';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { AddToInterviewsDto } from './dto/add-to-interviews.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScheduledCandidate } from './interfaces/scheduled-candidate.interface';

@ApiTags('interviews')
@Controller('interviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiExtraModels(ScheduledCandidate, ScheduleInterviewDto, AddToInterviewsDto)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('schedule')
  @ApiOperation({ summary: 'Schedule a new interview' })
  @ApiResponse({
    status: 201,
    description: 'Interview scheduled successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Interview scheduled successfully' },
        data: { $ref: '#/components/schemas/InterviewDocument' }
      }
    }
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
    schema: {
      properties: {
        message: { type: 'string', example: 'Invalid input data' },
        error: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async scheduleInterview(@Body() scheduleDto: ScheduleInterviewDto): Promise<{ message: string; data: InterviewDocument }> {
    try {
      const interview = await this.interviewService.scheduleInterview(scheduleDto);
      return {
        message: 'Interview scheduled successfully',
        data: interview
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('confirm/:token')
  @ApiOperation({ summary: 'Confirm an interview' })
  @ApiResponse({ status: 200, description: 'Interview confirmed successfully' })
  @ApiResponse({ status: 400, description: 'Invalid token or interview already confirmed' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async confirmInterview(@Param('token') token: string): Promise<{ message: string; data: InterviewDocument }> {
    try {
      const interview = await this.interviewService.confirmInterview(token);
      return {
        message: 'Interview confirmed successfully',
        data: interview
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      if (error instanceof BadRequestException) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  @Get('application/:applicationId')
  @ApiOperation({ summary: 'Get interviews for an application' })
  @ApiResponse({ status: 200, description: 'Interviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async getInterviewsByApplication(@Param('applicationId') applicationId: string): Promise<{ message: string; data: InterviewDocument[] }> {
    const interviews = await this.interviewService.getInterviewsByApplication(applicationId);
    return {
      message: 'Interviews retrieved successfully',
      data: interviews
    };
  }

  @Get('candidate/:candidateId')
  @ApiOperation({ summary: 'Get interviews for a candidate' })
  @ApiResponse({ status: 200, description: 'Interviews retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Candidate not found' })
  async getInterviewsByCandidate(@Param('candidateId') candidateId: string): Promise<{ message: string; data: InterviewDocument[] }> {
    const interviews = await this.interviewService.getInterviewsByCandidate(candidateId);
    return {
      message: 'Interviews retrieved successfully',
      data: interviews
    };
  }

  @Get('scheduled')
  @ApiOperation({ summary: 'Get all scheduled candidates with job details' })
  @ApiResponse({
    status: 200,
    description: 'Scheduled candidates retrieved successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Scheduled candidates retrieved successfully' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ScheduledCandidate' }
        }
      }
    }
  })
  async getAllScheduledCandidates(): Promise<{ message: string; data: ScheduledCandidate[] }> {
    const scheduled = await this.interviewService.getAllScheduledCandidates();
    return {
      message: 'Scheduled candidates retrieved successfully',
      data: scheduled
    };
  }

  @Get('future')
  @ApiOperation({ summary: 'Get all candidates added to future interviews' })
  @ApiResponse({
    status: 200,
    description: 'Future candidates retrieved successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Future candidates retrieved successfully' },
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/ScheduledCandidate' }
        }
      }
    }
  })
  async getFutureCandidates(): Promise<{ message: string; data: ScheduledCandidate[] }> {
    const future = await this.interviewService.getFutureCandidates();
    return {
      message: 'Future candidates retrieved successfully',
      data: future
    };
  }

  @Post('add-to-future')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add candidate to future interviews without scheduling' })
  @ApiResponse({
    status: 201,
    description: 'Candidate added to future interviews successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Candidate added to future interviews successfully' },
        data: { $ref: '#/components/schemas/ScheduledCandidate' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async addToFutureInterviews(@Body() addToInterviewsDto: AddToInterviewsDto): Promise<{ message: string; data: ScheduledCandidate }> {
    try {
      const result = await this.interviewService.addToFutureInterviews(addToInterviewsDto);
      return {
        message: 'Candidate added to future interviews successfully',
        data: result
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }
}