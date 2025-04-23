import { IsString, IsOptional, IsBoolean, ValidateNested, IsEnum, IsDate } from 'class-validator';
import { ProfessionalStatus } from '../../job/enums/professional-status.enum';
import { EmploymentStatus } from '../enums/employment-status.enum';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class LocationDto {
  @ApiPropertyOptional({
    description: 'Country of residence',
    example: 'France'
  })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  city?: string;
}

export class UpdatePersonalInfoDto {
  @ApiPropertyOptional({
    description: 'First name of the candidate',
    example: 'Salem'
  })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({
    description: 'Last name of the candidate',
    example: 'Mohamdi'
  })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({
    description: 'Professional status of the candidate',
    example: ProfessionalStatus.EMPLOYED_OPEN_TO_WORK,
    enum: ProfessionalStatus,
    enumName: 'ProfessionalStatus',
    examples: {
      JOB_SEEKER: { value: 'a la recherche emploi', description: 'Looking for a job' },
      EMPLOYED_OPEN_TO_WORK: { value: 'employe', description: 'Currently employed' },
      INTERNSHIP_SEEKER: { value: 'a la recherche d\'un stage', description: 'Looking for internship' },
      STUDENT: { value: 'en cours d\'etudes', description: 'Student' }
    }
  })
  @IsEnum(ProfessionalStatus)
  @IsOptional()
  professionalStatus?: string;

  @ApiPropertyOptional({
    description: 'Employment status',
    example: EmploymentStatus.LOOKING_FOR_JOB,
    enum: EmploymentStatus
  })
  @IsEnum(EmploymentStatus)
  @IsOptional()
  employmentStatus?: EmploymentStatus;

  @ApiPropertyOptional({
    description: 'Date when available to start work',
    example: '2024-05-01'
  })
  @IsDate()
  @IsOptional()
  availabilityDate?: Date;

  @ApiPropertyOptional({
    description: 'Whether the candidate is available for remote work',
    example: true
  })
  @IsBoolean()
  @IsOptional()
  remoteWork?: boolean;

  @ApiPropertyOptional({
    description: 'Location information',
    type: LocationDto
  })
  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

}