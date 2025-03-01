import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional, IsEnum } from 'class-validator';

export enum JobType {
  JOB = 'job',
  INTERNSHIP = 'internship',
}

export class CreateJobDto {
  @ApiProperty({ example: 'Software Engineer' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ example: 'We are looking for a software engineer to join our team.' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'San Francisco' })
  @IsString()
  @IsNotEmpty()
  location: string;

  @ApiProperty({ example: 'Full-time' })
  @IsString()
  @IsOptional()
  employmentType?: string;

  @ApiProperty({ example: 100000 })
  @IsString()
  @IsOptional()
  salary?: string;

  @ApiProperty({ example: '3 years of experience' })
  @IsString()
  @IsOptional()
  experience?: string;

  @ApiProperty({ enum: JobType, default: JobType.JOB })
  @IsEnum(JobType)
  @IsOptional()
  jobType?: JobType;
}