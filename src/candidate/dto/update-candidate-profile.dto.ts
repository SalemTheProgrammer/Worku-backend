import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUrl, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class LanguageDto {
  @ApiProperty({ example: 'English' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Fluent' })
  @IsString()
  level: string;
}

export class UpdateCandidateProfileDto {
  @ApiProperty({ example: 'Full-time', required: false })
  @IsString()
  @IsOptional()
  professionalStatus?: string;

  @ApiProperty({ example: 'Available', required: false })
  @IsString()
  @IsOptional()
  availability?: string;

  @ApiProperty({ example: true, required: false })
  @IsBoolean()
  @IsOptional()
  remoteWork?: boolean;

  @ApiProperty({ type: [LanguageDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  @IsOptional()
  languages?: LanguageDto[];

  @ApiProperty({ example: 'John', required: false })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiProperty({ example: 'Doe', required: false })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiProperty({ example: 'Software Engineer', required: false })
  @IsString()
  @IsOptional()
  jobTitle?: string;

  @ApiProperty({ example: '123 Main St', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'San Francisco', required: false })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiProperty({ example: 'CA', required: false })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiProperty({ example: '94107', required: false })
  @IsString()
  @IsOptional()
  zipCode?: string;

  @ApiProperty({ example: 'USA', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: '555-123-4567', required: false })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ example: 'https://www.linkedin.com/in/johndoe', required: false })
  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @ApiProperty({ example: 'https://github.com/johndoe', required: false })
  @IsUrl()
  @IsOptional()
  githubUrl?: string;
}