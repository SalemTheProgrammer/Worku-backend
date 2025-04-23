import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDate } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateEducationDto {
  @ApiProperty({ 
    example: 'Stanford University',
    description: 'Name of the educational institution'
  })
  @IsString()
  institution: string;

  @ApiProperty({ 
    example: "Bachelor's Degree",
    description: 'Type of degree received'
  })
  @IsString()
  degree: string;

  @ApiProperty({ 
    example: 'Computer Science',
    description: 'Field of study'
  })
  @IsString()
  fieldOfStudy: string;

  @ApiProperty({ 
    example: '2019-09-01',
    description: 'Start date of education'
  })
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  @ApiProperty({ 
    example: '2023-06-30',
    description: 'End date of education (optional for current education)'
  })
  @Type(() => Date)
  @IsDate()
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ 
    example: 'Graduated with honors, GPA: 3.8',
    description: 'Additional description or achievements'
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ 
    example: 'Machine Learning, Artificial Intelligence, Data Structures',
    description: 'Key courses or specializations'
  })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiProperty({ 
    example: '3.8',
    description: 'Grade Point Average or final grade'
  })
  @IsString()
  @IsOptional()
  grade?: string;
}

export class UpdateEducationDto extends CreateEducationDto {}