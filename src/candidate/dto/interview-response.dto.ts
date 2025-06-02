import { ApiProperty } from '@nestjs/swagger';

export class InterviewResponseDto {
  @ApiProperty()
  interviewId: string;

  @ApiProperty()
  date: Date;

  @ApiProperty()
  time: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  meetingLink: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  jobTitle: string;

  @ApiProperty()
  companyName: string;
}