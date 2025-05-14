import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateJobFormDto {
  @ApiProperty({
    description: 'The job title to generate form suggestions for',
    example: 'Senior Software Engineer'
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}