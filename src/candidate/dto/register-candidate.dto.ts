import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional, IsDate } from 'class-validator';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { ProfessionalStatus } from '../../job/enums/professional-status.enum';
import { IsProperName } from '../../common/validators/proper-name.validator';

export class RegisterCandidateDto {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @IsProperName()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @IsProperName()
  lastName: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    enum: EmploymentStatus,
    example: EmploymentStatus.LOOKING_FOR_JOB,
    description: 'Current employment status'
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiProperty({
    enum: ProfessionalStatus,
    example: ProfessionalStatus.ACTIVELY_SEEKING,
    description: 'Professional status indicating current career situation',
    required: false
  })
  @IsEnum(ProfessionalStatus)
  @IsOptional()
  professionalStatus?: ProfessionalStatus;

  @ApiProperty({
    example: '2024-05-01',
    description: 'Date when candidate is available to start working',
    required: false
  })
  @IsDate()
  @IsOptional()
  availabilityDate?: Date;
}