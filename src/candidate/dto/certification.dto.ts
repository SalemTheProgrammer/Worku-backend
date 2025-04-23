import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional, IsDate, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateCertificationDto {
  @ApiProperty({ 
    example: 'AWS Certified Solutions Architect',
    description: 'Name of the certification'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 'Amazon Web Services',
    description: 'Organization that issued the certification'
  })
  @IsString()
  issuingOrganization: string;

  @ApiProperty({ 
    example: '2023-01-01',
    description: 'Date when the certification was issued'
  })
  @Type(() => Date)
  @IsDate()
  issueDate: Date;

  @ApiProperty({ 
    example: '2026-01-01',
    description: 'Date when the certification expires (optional)'
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  expiryDate?: Date;

  @ApiProperty({ 
    example: 'AWS-123456',
    description: 'Credential ID of the certification'
  })
  @IsString()
  @IsOptional()
  credentialId?: string;

  @ApiProperty({ 
    example: 'https://validate.cert.aws',
    description: 'URL to verify the certification'
  })
  @IsUrl()
  @IsOptional()
  credentialUrl?: string;

  @ApiProperty({ 
    example: 'Achievements and skills covered by this certification',
    description: 'Additional description or details'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: ['AWS', 'Cloud Architecture', 'DevOps'],
    description: 'Skills associated with this certification'
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  skills?: string[];
}

export class UpdateCertificationDto extends CreateCertificationDto {}