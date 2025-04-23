import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, Min, Max, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateSkillDto {
  @ApiProperty({ 
    example: 'Node.js',
    description: 'Name of the skill'
  })
  @IsString()
  name: string;

  @ApiProperty({ 
    example: 4,
    description: 'Skill level (1-5)',
    minimum: 1,
    maximum: 5
  })
  @IsNumber()
  @Min(1)
  @Max(5)
  level: number;

  @ApiProperty({ 
    example: 3,
    description: 'Years of experience with this skill',
    required: false
  })
  @IsNumber()
  @IsOptional()
  yearsOfExperience?: number;
}

export class UpdateSkillDto extends CreateSkillDto {}

export class BulkUpdateSkillsDto {
  @ApiProperty({
    type: [CreateSkillDto],
    description: 'Array of skills to update'
  })
  @Type(() => CreateSkillDto)
  skills: CreateSkillDto[];
}