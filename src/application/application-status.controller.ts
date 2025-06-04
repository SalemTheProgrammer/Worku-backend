import {
  Controller,
  Put,
  Param,
  UseGuards,
  NotFoundException,
  BadRequestException,
  HttpStatus,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApplicationDocument } from '../schemas/application.schema';
import { CandidateApplicationsResponseDto } from '../candidate/dto/candidate-applications-response.dto';
import { ApplicationStatusService } from './application-status.service';
import { User } from '../common/decorators/user.decorator';

@ApiTags('Application Status Management')
@Controller('application-status')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ApplicationStatusController {
  constructor(private readonly applicationStatusService: ApplicationStatusService) {}

  @Put(':applicationId/mark-seen')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark application as seen by company' })
  @ApiResponse({ status: 200, description: 'Application marked as seen successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  async markApplicationAsSeen(@Param('applicationId') applicationId: string): Promise<{ message: string; data: ApplicationDocument }> {
    try {
      const application = await this.applicationStatusService.markAsSeen(applicationId);
      return {
        message: 'Application marked as seen successfully',
        data: application
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException(error.message);
      }
      throw error;
    }
  }

  @Get('candidate')
  @ApiOperation({ summary: 'Get authenticated candidate applications with status details' })
  @ApiResponse({ status: 200, description: 'Candidate applications retrieved successfully' })
  async getCandidateApplicationsWithStatus(
    @User() user: any,
    @Query('limit') limit?: number,
    @Query('skip') skip?: number
  ): Promise<{ message: string; data: CandidateApplicationsResponseDto }> {
    try {
      const candidateId = user.userId;
      if (!candidateId) {
        throw new BadRequestException('User ID not found in authentication token');
      }
      
      const result = await this.applicationStatusService.getCandidateApplicationsWithStatus(candidateId.toString(), {
        limit: limit || 10,
        skip: skip || 0
      });
      return {
        message: 'Candidate applications retrieved successfully',
        data: result
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
}