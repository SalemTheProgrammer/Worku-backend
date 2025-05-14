import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsBoolean, Matches } from 'class-validator';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export class CreateCertificationDto {
  @ApiProperty({
    description: 'Name of the certification',
    example: 'CRISC - Certified in Risk and Information Systems Control'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Organization issuing the certification',
    example: 'ISACA'
  })
  @IsString()
  issuingOrganization: string;

  @ApiProperty({
    description: 'Date when the certification was issued',
    example: '2025-05-28'
  })
  @ApiProperty({
    description: 'Issue date (format: YYYY-MM-DD)',
    example: '2025-05-28'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Issue date must be in YYYY-MM-DD format (e.g., 2025-05-28)' })
  issueDate: string;

  @ApiPropertyOptional({
    description: 'Date when the certification expires',
    example: '2026-05-30'
  })
  @ApiPropertyOptional({
    description: 'Expiry date (format: YYYY-MM-DD)',
    example: '2026-05-30'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Expiry date must be in YYYY-MM-DD format (e.g., 2026-05-30)' })
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Alternative name for expiry date',
    example: '2026-05-30'
  })
  @ApiPropertyOptional({
    description: 'Alternative field for expiry date (format: YYYY-MM-DD)',
    example: '2026-05-30'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Expiration date must be in YYYY-MM-DD format (e.g., 2026-05-30)' })
  @IsOptional()
  expirationDate?: string;

  @ApiPropertyOptional({
    description: 'Unique credential ID',
    example: 'AWS-123456'
  })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiPropertyOptional({
    description: 'URL to verify the credential',
    example: 'https://www.credly.com/badges/12345678'
  })
  @IsString()
  @Matches(/^https?:\/\/.+$/i, { message: 'Credential URL must be a valid URL' })
  @IsOptional()
  credentialUrl?: string;

  @ApiPropertyOptional({
    description: 'Description of the certification',
    example: 'Advanced cloud architecture certification'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Skills associated with this certification',
    example: ['AWS', 'Cloud Architecture', 'DevOps']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

export class UpdateCertificationDto implements Partial<Omit<CreateCertificationDto, 'expirationDate'>> {
  @ApiPropertyOptional({
    description: 'Alternative name for expiry date',
    example: '2026-05-30'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Expiration date must be in YYYY-MM-DD format (e.g., 2026-05-30)' })
  @IsOptional()
  expirationDate?: string;
  @ApiPropertyOptional({
    description: 'Name of the certification',
    example: 'AWS Certified Solutions Architect'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Organization issuing the certification',
    example: 'Amazon Web Services'
  })
  @IsString()
  @IsOptional()
  issuingOrganization?: string;

  @ApiPropertyOptional({
    description: 'Date when the certification was issued',
    example: '2024-01-01'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Issue date must be in YYYY-MM-DD format (e.g., 2025-05-28)' })
  @IsOptional()
  issueDate?: string;

  @ApiPropertyOptional({
    description: 'Date when the certification expires',
    example: '2027-01-01'
  })
  @IsString()
  @Matches(DATE_REGEX, { message: 'Expiry date must be in YYYY-MM-DD format (e.g., 2026-05-30)' })
  @IsOptional()
  expiryDate?: string;

  @ApiPropertyOptional({
    description: 'Unique credential ID',
    example: 'AWS-123456'
  })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiPropertyOptional({
    description: 'URL to verify the credential',
    example: 'https://www.credly.com/badges/12345678'
  })
  @IsString()
  @Matches(/^https?:\/\/.+$/i, { message: 'Credential URL must be a valid URL' })
  @IsOptional()
  credentialUrl?: string;

  @ApiPropertyOptional({
    description: 'Description of the certification',
    example: 'Advanced cloud architecture certification'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Skills associated with this certification',
    example: ['AWS', 'Cloud Architecture', 'DevOps']
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

export class CertificationResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  issuingOrganization: string;

  @ApiProperty()
  issueDate: string;

  @ApiPropertyOptional()
  expiryDate?: string;

  @ApiPropertyOptional()
  credentialId?: string;

  @ApiPropertyOptional()
  credentialUrl?: string;

  @ApiProperty()
  isExpired: boolean;

  @ApiPropertyOptional()
  description?: string;

  @ApiPropertyOptional()
  skills?: string[];
}