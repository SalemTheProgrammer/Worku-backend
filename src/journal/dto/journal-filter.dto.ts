import { IsOptional, IsDateString, IsString, IsNumber, IsArray, Min, Max, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { CompanyActionType, CandidateActionType } from '../enums/action-types.enum';

/**
 * DTO for filtering journal activity entries
 */
export class JournalFilterDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: 'Number of records per page',
    example: 10,
    required: false,
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'Filter by action types',
    example: ['connexion', 'mise_à_jour_profil'],
    required: false,
    isArray: true,
    enum: [...Object.values(CompanyActionType), ...Object.values(CandidateActionType)],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  actionTypes?: string[];

  @ApiProperty({
    description: 'Filter activities from this date (ISO format)',
    example: '2025-01-01T00:00:00Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({
    description: 'Filter activities until this date (ISO format)',
    example: '2025-12-31T23:59:59Z',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}