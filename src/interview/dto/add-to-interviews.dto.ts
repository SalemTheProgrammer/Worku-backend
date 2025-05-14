import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AddToInterviewsDto {
  @ApiProperty({
    description: 'ID of the application',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsString()
  applicationId: string;

}