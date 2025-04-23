import { IsOptional, IsObject, IsUrl, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class SocialLinks {
  @IsOptional()
  @IsUrl({}, { message: 'LinkedIn URL must be valid' })
  linkedin?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Instagram URL must be valid' })
  instagram?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Facebook URL must be valid' })
  facebook?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'X (Twitter) URL must be valid' })
  x?: string | null;

  @IsOptional()
  @IsUrl({}, { message: 'Website URL must be valid' })
  siteWeb?: string | null;
}

export class UpdateCompanySocialsDto {
  @IsObject()
  @ValidateNested()
  @Type(() => SocialLinks)
  @IsOptional()
  reseauxSociaux?: SocialLinks;
}