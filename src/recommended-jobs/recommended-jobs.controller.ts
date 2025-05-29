import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOkResponse, ApiUnauthorizedResponse, ApiOperation } from '@nestjs/swagger';
import { RecommendedJobsService } from './recommended-jobs.service';
import { GetRecommendedJobsDto } from './dto/get-recommended-jobs.dto';
import { RecommendedJobsResponseDto } from './dto/recommended-jobs-response.dto';
import { BulkApplyResponseDto } from './dto/bulk-apply-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../common/decorators/user.decorator';

@ApiTags('recommended-jobs')
@Controller('recommended-jobs')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class RecommendedJobsController {
  constructor(private readonly recommendedJobsService: RecommendedJobsService) {}

  @Get()
  @ApiOperation({
    summary: 'Get recommended jobs',
    description: 'Returns a list of jobs recommended for the authenticated user based on their profile and preferences',
  })
  @ApiOkResponse({
    description: 'List of recommended jobs that the user has not yet applied for, with pagination metadata',
    type: RecommendedJobsResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async getRecommendedJobs(
    @User('_id') userId: string,
    @Query() query: GetRecommendedJobsDto,
  ): Promise<RecommendedJobsResponseDto> {
    return this.recommendedJobsService.getRecommendedJobs(userId, query);
  }

  @Post('apply-all')
  @ApiOperation({
    summary: 'Apply to all recommended jobs',
    description: 'Automatically applies to all currently recommended jobs for the authenticated candidate',
  })
  @ApiOkResponse({
    description: 'Successfully applied to recommended jobs',
    type: BulkApplyResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - JWT token is missing or invalid',
  })
  async applyToAllRecommended(
    @User('_id') userId: string,
  ): Promise<BulkApplyResponseDto> {
    return this.recommendedJobsService.applyToAllRecommended(userId);
  }
}