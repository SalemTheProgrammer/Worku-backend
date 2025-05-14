import { IsString, IsOptional, IsBoolean, ValidateNested, IsEnum, IsDate } from 'class-validator';
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
    description: 'Phone number of the candidate',
    example: '+21658419875'
  })
  @IsString()
  @IsOptional()
  phone?: string;

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