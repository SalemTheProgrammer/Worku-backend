import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUrl, IsOptional } from 'class-validator';

export class SocialLinksDto {
  @ApiProperty({ 
    example: 'https://linkedin.com/in/johndoe',
    description: 'LinkedIn profile URL'
  })
  @IsUrl()
  @IsOptional()
  linkedinUrl?: string;

  @ApiProperty({ 
    example: 'https://github.com/johndoe',
    description: 'GitHub profile URL'
  })
  @IsUrl()
  @IsOptional()
  githubUrl?: string;

  @ApiProperty({ 
    example: 'https://portfolio.com/johndoe',
    description: 'Personal portfolio URL'
  })
  @IsUrl()
  @IsOptional()
  portfolioUrl?: string;

  @ApiProperty({
    type: [String],
    example: ['https://medium.com/@johndoe', 'https://dev.to/johndoe'],
    description: 'Other professional links'
  })
  @IsUrl({}, { each: true })
  @IsOptional()
  otherLinks?: string[];
}

export class UpdateSocialLinksDto extends SocialLinksDto {}