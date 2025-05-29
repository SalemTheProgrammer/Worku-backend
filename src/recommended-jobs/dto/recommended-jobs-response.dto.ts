import { ApiProperty } from '@nestjs/swagger';
import { Job } from '../../schemas/job.schema';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of items per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  pages: number;
}

export class RecommendedJobsResponseDto {
  @ApiProperty({ type: [Job], description: 'List of recommended jobs' })
  data: Job[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}