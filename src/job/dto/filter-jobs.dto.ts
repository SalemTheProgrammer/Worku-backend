import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsBoolean, IsNumber, IsEnum, IsArray, Min, Max } from 'class-validator';
import { ContractType, EducationLevel, Language } from '../types/job.types';
import { Transform, Type } from 'class-transformer';

export class FilterJobsDto {
  @ApiProperty({ required: false, example: 'Tunis' })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false, example: 'QHSE' })
  @IsString()
  @IsOptional()
  domain?: string;

  @ApiProperty({ required: false, example: 3000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  salaryMin?: number;

  @ApiProperty({ required: false, example: 4000 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  salaryMax?: number;

  @ApiProperty({ required: false, example: true })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  remote?: boolean;

  @ApiProperty({ required: false, enum: ContractType })
  @IsEnum(ContractType)
  @IsOptional()
  contractType?: ContractType;

  @ApiProperty({ required: false, example: 3 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  experienceMin?: number;

  @ApiProperty({ required: false, example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Max(50)
  @IsOptional()
  experienceMax?: number;

  @ApiProperty({ required: false, enum: EducationLevel })
  @IsEnum(EducationLevel)
  @IsOptional()
  educationLevel?: EducationLevel;

  @ApiProperty({ 
    required: false, 
    enum: Language,
    isArray: true,
    example: [Language.FRENCH, Language.ARABIC] 
  })
  @IsArray()
  @IsEnum(Language, { each: true })
  @IsOptional()
  languages?: Language[];

  @ApiProperty({ required: false, example: 'QHSE' })
  @IsString()
  @IsOptional()
  keyword?: string;

  @ApiProperty({ required: false, example: true })
  @Transform(({ value }) => value === 'true')
  @IsBoolean()
  @IsOptional()
  onlyActive?: boolean = true;

  @ApiProperty({ required: false, example: 'newest' })
  @IsString()
  @IsOptional()
  sortBy?: 'newest' | 'salary' | 'experience' = 'newest';

  @ApiProperty({ required: false, example: 10 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  limit?: number = 20;

  @ApiProperty({ required: false, example: 0 })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  skip?: number = 0;
}
