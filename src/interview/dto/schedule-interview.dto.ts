import { IsNotEmpty, IsString, IsEnum, IsOptional, IsDateString, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ScheduleInterviewDto {
  @ApiProperty({
    description: 'ID of the application',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty()
  @IsString()
  applicationId: string;

  @ApiProperty({
    description: 'Date of the interview',
    example: '2025-05-20'
  })
  @IsNotEmpty()
  @IsDateString()
  date: string;

  @ApiProperty({
    description: 'Time of the interview (24h format)',
    example: '14:30'
  })
  @IsNotEmpty()
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be in 24h format (HH:mm)'
  })
  time: string;

  @ApiProperty({
    description: 'Type of interview',
    enum: ['Video', 'InPerson', 'Phone'],
    example: 'Video'
  })
  @IsNotEmpty()
  @IsEnum(['Video', 'InPerson', 'Phone'])
  type: string;

  @ApiProperty({
    description: 'Location for in-person interview',
    required: false,
    example: '123 Business Street, Floor 5'
  })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiProperty({
    description: 'Meeting link for video interview',
    required: false,
    example: 'https://meet.google.com/abc-defg-hij'
  })
  @IsOptional()
  @IsString()
  meetingLink?: string;

  @ApiProperty({
    description: 'Additional notes about the interview',
    required: false,
    example: 'Please bring your portfolio'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}