import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsUrl, Min, Max, IsArray, ArrayMinSize } from 'class-validator';
import { BusinessSector } from '../../interfaces/company.interface';

export class SocialMediaLinksDto {
  @ApiProperty({
    description: 'Lien LinkedIn de l\'entreprise',
    example: 'https://linkedin.com/company/acme-corp',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Le lien LinkedIn doit être une URL valide' })
  readonly linkedin?: string;

  @ApiProperty({
    description: 'Lien Twitter de l\'entreprise',
    example: 'https://twitter.com/acmecorp',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Le lien Twitter doit être une URL valide' })
  readonly twitter?: string;

  @ApiProperty({
    description: 'Lien Facebook de l\'entreprise',
    example: 'https://facebook.com/acmecorp',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Le lien Facebook doit être une URL valide' })
  readonly facebook?: string;

  @ApiProperty({
    description: 'Lien Instagram de l\'entreprise',
    example: 'https://instagram.com/acmecorp',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Le lien Instagram doit être une URL valide' })
  readonly instagram?: string;
}

export class CompleteCompanyProfileDto {
  @ApiProperty({
    description: 'Secteur d\'activité de l\'entreprise',
    enum: BusinessSector,
    example: BusinessSector.TECHNOLOGY
  })
  @IsEnum(BusinessSector, { message: 'Le secteur d\'activité n\'est pas valide' })
  readonly secteurActivite: BusinessSector;

  @ApiProperty({
    description: 'Taille de l\'entreprise (nombre d\'employés)',
    example: 50,
    minimum: 0,
    maximum: 100
  })
  @IsNumber({}, { message: 'La taille de l\'entreprise doit être un nombre' })
  @Min(0, { message: 'La taille de l\'entreprise ne peut pas être négative' })
  @Max(100, { message: 'La taille de l\'entreprise ne peut pas dépasser 100' })
  readonly tailleEntreprise: number;

  @ApiProperty({
    description: 'Adresse complète de l\'entreprise',
    example: '123 Rue de la Paix, 75000 Paris'
  })
  @IsString({ message: 'L\'adresse doit être une chaîne de caractères' })
  readonly adresse: string;

  @ApiProperty({
    description: 'Site web de l\'entreprise',
    example: 'https://www.acmecorp.com',
    required: false
  })
  @IsOptional()
  @IsUrl({}, { message: 'Le site web doit être une URL valide' })
  readonly siteWeb?: string;

  @ApiProperty({
    description: 'Liens vers les réseaux sociaux',
    type: SocialMediaLinksDto,
    required: false
  })
  @IsOptional()
  readonly reseauxSociaux?: SocialMediaLinksDto;

  @ApiProperty({
    description: 'Description brève de l\'entreprise',
    example: 'Leader dans le développement de solutions innovantes...'
  })
  @IsString({ message: 'La description doit être une chaîne de caractères' })
  readonly descriptionEntreprise: string;

  @ApiProperty({
    description: 'Activités clés de l\'entreprise',
    example: ['Développement logiciel', 'Conseil en IT', 'Formation']
  })
  @IsArray({ message: 'Les activités clés doivent être une liste' })
  @ArrayMinSize(1, { message: 'Au moins une activité clé doit être spécifiée' })
  @IsString({ each: true, message: 'Chaque activité doit être une chaîne de caractères' })
  readonly activitesClees: string[];
}