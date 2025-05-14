import { IsOptional, IsString, IsNumber, IsBoolean, IsArray, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Types } from 'mongoose';

export class FilterJobsDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  keyword?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  location?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  domain?: string;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional()
  remote?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional()
  salaryMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional()
  salaryMax?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional()
  experienceMin?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional()
  experienceMax?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  educationLevel?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  contractType?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ type: [String] })
  languages?: string[];

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ enum: ['newest', 'salary', 'experience'] })
  sortBy?: 'newest' | 'salary' | 'experience';

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional()
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional()
  skip?: number;

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  @ApiPropertyOptional()
  onlyActive?: boolean;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  companyId?: string | Types.ObjectId;
}
