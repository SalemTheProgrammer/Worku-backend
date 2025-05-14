import { IsOptional, IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class FilterApplicationsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  jobId?: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ minimum: 1, default: 5 })
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ minimum: 0, default: 0 })
  skip?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  sortOrder?: 'asc' | 'desc' = 'desc';
}