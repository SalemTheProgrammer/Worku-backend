import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional, IsBoolean, IsEnum } from 'class-validator';

export enum ProficiencyLevel {
  NATIF = 'Natif',
  PROFESSIONNEL = 'Professionnel',
  INTERMEDIAIRE = 'Intermédiaire',
  DEBUTANT = 'Débutant',
  NATIVE = 'Native',
  ADVANCED = 'Advanced',
  INTERMEDIATE = 'Intermediate',
  BEGINNER = 'Beginner'
}

export class CreateSkillDto {
  @ApiProperty({
    description: 'Name of the skill',
    example: 'Angular'
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Category of the skill',
    example: 'Compétences Techniques'
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'Skill level (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    minimum: 0,
    example: 2
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a language skill',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isLanguage?: boolean;

  @ApiPropertyOptional({
    description: 'Language proficiency level',
    enum: ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant'],
    example: 'Professionnel'
  })
  @IsEnum(ProficiencyLevel, {
    message: 'proficiencyLevel must be one of: Natif, Professionnel, Intermédiaire, Débutant, Native, Advanced, Intermediate, Beginner'
  })
  @IsOptional()
  proficiencyLevel?: ProficiencyLevel;
}

export class UpdateSkillDto implements Partial<CreateSkillDto> {
  @ApiPropertyOptional({
    description: 'Name of the skill',
    example: 'Angular'
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Category of the skill',
    example: 'Compétences Techniques'
  })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Skill level (1-5)',
    minimum: 1,
    maximum: 5,
    example: 4
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  @IsOptional()
  level?: number;

  @ApiPropertyOptional({
    description: 'Years of experience with this skill',
    minimum: 0,
    example: 2
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional({
    description: 'Whether this is a language skill',
    example: false
  })
  @IsBoolean()
  @IsOptional()
  isLanguage?: boolean;

  @ApiPropertyOptional({
    description: 'Language proficiency level',
    enum: ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant'],
    example: 'Professionnel'
  })
  @IsEnum(ProficiencyLevel, {
    message: 'proficiencyLevel must be one of: Natif, Professionnel, Intermédiaire, Débutant, Native, Advanced, Intermediate, Beginner'
  })
  @IsOptional()
  proficiencyLevel?: ProficiencyLevel;
}

export class SkillResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({
    description: 'Category of the skill',
    example: 'Compétences Techniques'
  })
  category: string;

  @ApiProperty()
  level: number;

  @ApiPropertyOptional()
  yearsOfExperience?: number;

  @ApiPropertyOptional()
  isLanguage?: boolean;

  @ApiPropertyOptional()
  proficiencyLevel?: ProficiencyLevel;
}