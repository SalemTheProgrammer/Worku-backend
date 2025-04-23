import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDate } from 'class-validator';
import { EmploymentStatus } from '../enums/employment-status.enum';

export class RegisterCandidateDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({ example: '+1234567890', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({
    enum: EmploymentStatus,
    example: EmploymentStatus.LOOKING_FOR_JOB,
    description: 'Current employment status'
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiProperty({
    example: '2024-05-01',
    description: 'Date when candidate is available to start working',
    required: false
  })
  @IsDate()
  @IsOptional()
  availabilityDate?: Date;
}