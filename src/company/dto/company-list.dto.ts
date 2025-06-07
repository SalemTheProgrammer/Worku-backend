import { IsOptional, IsNumber, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetCompaniesDto {
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of companies per page', default: 20 })
  limit?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Number of companies to skip', default: 0 })
  skip?: number;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Search by company name' })
  search?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by business sector' })
  sector?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by company size' })
  size?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Filter by location' })
  location?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sort by field',
    enum: ['name', 'createdAt', 'jobCount', 'activeJobsCount'],
    default: 'createdAt'
  })
  sortBy?: 'name' | 'createdAt' | 'jobCount' | 'activeJobsCount';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ 
    description: 'Sort order',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  sortOrder?: 'asc' | 'desc';
}

export class CompanyListItemDto {
  id: string;
  nomEntreprise: string;
  email: string;
  secteurActivite?: string;
  tailleEntreprise?: string;
  location?: string;
  logo?: string;
  description?: string;
  siteWeb?: string;
  phone?: string;
  reseauxSociaux?: {
    linkedin?: string;
    instagram?: string;
    facebook?: string;
    x?: string;
  };
  verified: boolean;
  profileCompleted: boolean;
  activeJobsCount: number;
  totalJobsCount: number;
  createdAt: Date;
  lastLoginAt?: Date;
}

export class CompaniesListResponseDto {
  companies: CompanyListItemDto[];
  total: number;
  limit: number;
  skip: number;
  hasMore: boolean;
}