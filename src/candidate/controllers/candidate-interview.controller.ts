import {
  Controller,
  Get,
  Put,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { CandidateInterviewService } from '../services/candidate-interview.service';
import { CandidateInterviewResponseDto } from '../dto/candidate-interview-response.dto';

@ApiTags('candidate-interviews')
@Controller('candidate/interviews')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CandidateInterviewController {
  constructor(
    private readonly candidateInterviewService: CandidateInterviewService
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all interviews for authenticated candidate' })
  @ApiResponse({
    status: 200,
    description: 'Candidate interviews retrieved successfully',
    type: CandidateInterviewResponseDto
  })
  async getCandidateInterviews(
    @User('userId') candidateId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ): Promise<{ message: string; data: CandidateInterviewResponseDto }> {
    const result = await this.candidateInterviewService.getCandidateInterviews(candidateId, {
      status,
      limit: limit || 10,
      skip: skip || 0
    });

    return {
      message: 'Candidate interviews retrieved successfully',
      data: result
    };
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending interviews for authenticated candidate' })
  @ApiResponse({
    status: 200,
    description: 'Pending interviews retrieved successfully',
    type: CandidateInterviewResponseDto
  })
  async getPendingInterviews(
    @User('userId') candidateId: string
  ): Promise<{ message: string; data: CandidateInterviewResponseDto }> {
    const result = await this.candidateInterviewService.getCandidateInterviews(candidateId, {
      status: 'en_attente'
    });

    return {
      message: 'Pending interviews retrieved successfully',
      data: result
    };
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Get upcoming confirmed interviews for authenticated candidate' })
  @ApiResponse({
    status: 200,
    description: 'Upcoming interviews retrieved successfully',
    type: CandidateInterviewResponseDto
  })
  async getUpcomingInterviews(
    @User('userId') candidateId: string
  ): Promise<{ message: string; data: CandidateInterviewResponseDto }> {
    const result = await this.candidateInterviewService.getUpcomingInterviews(candidateId);

    return {
      message: 'Upcoming interviews retrieved successfully',
      data: result
    };
  }

  @Get('history')
  @ApiOperation({ summary: 'Get interview history for authenticated candidate' })
  @ApiResponse({
    status: 200,
    description: 'Interview history retrieved successfully',
    type: CandidateInterviewResponseDto
  })
  async getInterviewHistory(
    @User('userId') candidateId: string,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ): Promise<{ message: string; data: CandidateInterviewResponseDto }> {
    const result = await this.candidateInterviewService.getInterviewHistory(candidateId, {
      limit: limit || 10,
      skip: skip || 0
    });

    return {
      message: 'Interview history retrieved successfully',
      data: result
    };
  }

  @Put(':interviewId/confirm')
  @ApiOperation({ summary: 'Confirm an interview from candidate dashboard' })
  @ApiResponse({
    status: 200,
    description: 'Interview confirmed successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Interview confirmed successfully' },
        data: {
          type: 'object',
          properties: {
            interviewId: { type: 'string' },
            status: { type: 'string', example: 'confirmed' },
            confirmedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  @ApiResponse({ status: 400, description: 'Interview cannot be confirmed' })
  @ApiResponse({ status: 403, description: 'Interview does not belong to this candidate' })
  async confirmInterviewFromDashboard(
    @User('userId') candidateId: string,
    @Param('interviewId') interviewId: string
  ): Promise<{ message: string; data: any }> {
    const result = await this.candidateInterviewService.confirmInterviewFromDashboard(
      candidateId,
      interviewId
    );

    return {
      message: 'Interview confirmed successfully',
      data: result
    };
  }

  @Get(':interviewId')
  @ApiOperation({ summary: 'Get interview details for authenticated candidate' })
  @ApiResponse({
    status: 200,
    description: 'Interview details retrieved successfully'
  })
  @ApiResponse({ status: 404, description: 'Interview not found' })
  @ApiResponse({ status: 403, description: 'Interview does not belong to this candidate' })
  async getInterviewDetails(
    @User('userId') candidateId: string,
    @Param('interviewId') interviewId: string
  ): Promise<{ message: string; data: any }> {
    const result = await this.candidateInterviewService.getInterviewDetails(candidateId, interviewId);

    return {
      message: 'Interview details retrieved successfully',
      data: result
    };
  }
}