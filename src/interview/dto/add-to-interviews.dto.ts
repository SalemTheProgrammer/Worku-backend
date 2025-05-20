import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty, ApiTags } from '@nestjs/swagger';

@ApiTags('interviews')
export class AddToInterviewsDto {
  @ApiProperty({
    description: 'ID of the application to add to future interviews',
    example: '507f1f77bcf86cd799439011',
    required: true
  })
  @IsNotEmpty()
  @IsString()
  applicationId: string;
}