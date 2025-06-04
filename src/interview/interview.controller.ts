import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Put,
  UseGuards,
  BadRequestException,
  NotFoundException,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiExtraModels } from '@nestjs/swagger';
import { InterviewService } from './interview.service';
import { InterviewDocument } from '../schemas/interview.schema';
import { ScheduleInterviewDto } from './dto/schedule-interview.dto';
import { AddToInterviewsDto } from './dto/add-to-interviews.dto';
import { InterviewFeedbackDto, CancelInterviewDto, MarkInterviewCompleteDto } from './dto/interview-feedback.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ScheduledCandidate } from './interfaces/scheduled-candidate.interface';
import { InterviewsByStatusResponseDto } from '../job/dto/company-candidates-response.dto';

@ApiTags('interviews')
@Controller('interviews')
@ApiExtraModels(ScheduledCandidate, ScheduleInterviewDto, AddToInterviewsDto)
export class InterviewController {
  constructor(private readonly interviewService: InterviewService) {}

  @Post('schedule')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @ApiOperation({ summary: 'Confirm an interview using token (for candidates)' })
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @Get('by-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get interviews by status' })
  @ApiResponse({
    status: 200,
    description: 'Interviews retrieved successfully',
    type: InterviewsByStatusResponseDto
  })
  async getInterviewsByStatus(
    @Query('status') status?: string,
    @Query('companyId') companyId?: string
  ): Promise<{ message: string; data: InterviewsByStatusResponseDto }> {
    const result = await this.interviewService.getInterviewsByStatus(status, companyId);
    return {
      message: 'Interviews retrieved successfully',
      data: result
    };
  }

  @Get('scheduled')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
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

  @Put(':interviewId/confirm')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Confirm an interview by interview ID (for companies)' })
  @ApiResponse({ status: 200, description: 'Interview confirmed successfully' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async confirmInterviewById(@Param('interviewId') interviewId: string): Promise<{ message: string; data: InterviewDocument }> {
    try {
      const interview = await this.interviewService.confirmInterviewById(interviewId);
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

  @Put(':interviewId/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark interview as complete and add feedback' })
  @ApiResponse({ status: 200, description: 'Interview completed successfully' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async completeInterview(
    @Param('interviewId') interviewId: string,
    @Body() completeDto: MarkInterviewCompleteDto
  ): Promise<{ message: string; data: InterviewDocument }> {
    try {
      const interview = await this.interviewService.completeInterview(interviewId, completeDto);
      return {
        message: 'Interview completed successfully',
        data: interview
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Put(':interviewId/cancel')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cancel an interview' })
  @ApiResponse({ status: 200, description: 'Interview cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  async cancelInterview(
    @Param('interviewId') interviewId: string,
    @Body() cancelDto: CancelInterviewDto
  ): Promise<{ message: string; data: InterviewDocument }> {
    try {
      const interview = await this.interviewService.cancelInterview(interviewId, cancelDto.cancellationReason);
      return {
        message: 'Interview cancelled successfully',
        data: interview
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get('company/:companyId/candidates')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all candidates who applied to company jobs with interview planning capability' })
  @ApiResponse({
    status: 200,
    description: 'Company candidates retrieved successfully',
    type: InterviewsByStatusResponseDto
  })
  async getCompanyCandidates(
    @Param('companyId') companyId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ): Promise<{ message: string; data: any }> {
    const result = await this.interviewService.getCompanyCandidatesForInterview(companyId, { 
      limit: limit || 10, 
      skip: skip || 0 
    });
    return {
      message: 'Company candidates retrieved successfully',
      data: result
    };
  }
}