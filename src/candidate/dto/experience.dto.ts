import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate, IsArray, IsBoolean, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateExperienceDto {
  @ApiProperty({
    example: 'Software Engineer',
    description: 'Job title/position'
  })
  @IsString()
  @IsNotEmpty()
  position: string;

  @ApiProperty({
    example: 'Company XYZ',
    description: 'Company name'
  })
  @IsString()
  @IsNotEmpty()
  company: string;

  @ApiProperty({
    example: 'New York, USA',
    description: 'Job location'
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    example: '2022-01-01',
    description: 'Start date of the experience'
  })
  @IsString()
  @IsNotEmpty()
  startDate: string;

  @ApiProperty({
    example: '2023-01-01',
    description: 'End date of the experience (optional for current positions)'
  })
  @IsString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({
    example: 'Led development of microservices architecture',
    description: 'Job description and responsibilities'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: ['Node.js', 'React', 'AWS'],
    description: 'Skills used in this role'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];

  @ApiProperty({ 
    example: ['Increased team productivity by 40%', 'Reduced deployment time by 60%'],
    description: 'Key achievements and metrics'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  achievements?: string[];
}

export class UpdateExperienceDto extends CreateExperienceDto {}
