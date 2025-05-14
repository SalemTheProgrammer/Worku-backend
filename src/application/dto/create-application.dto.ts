import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateApplicationDto {
  @ApiProperty({
    description: 'ID of the job posting',
    example: '507f1f77bcf86cd799439011'
  })
  @IsString()
  @IsNotEmpty()
  jobId: string;
}