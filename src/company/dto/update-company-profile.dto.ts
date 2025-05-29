import { IsString, IsOptional, IsArray, IsObject, IsUrl, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';

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
}

export class UpdateCompanyProfileDto {
  @IsString()
  @IsOptional()
  raisonSociale?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (!value) return [];
    return [value];
  })
  secteurActivite?: string[];

  @IsString()
  @IsOptional()
  tailleEntreprise?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true })
  descriptionEntreprise?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => value, { toClassOnly: true })
  description?: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (!value) return null;
    try {
      // If it's already a valid URL, return it
      new URL(value);
      return value;
    } catch {
      // If not, try prepending https://
      try {
        new URL(`https://${value}`);
        return `https://${value}`;
      } catch {
        return value; // Let validation handle invalid URLs
      }
    }
  })
  @IsUrl({ require_tld: false, require_protocol: true }, { message: 'Website URL must be valid' })
  siteWeb?: string | null;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  activiteCles?: string[];


}