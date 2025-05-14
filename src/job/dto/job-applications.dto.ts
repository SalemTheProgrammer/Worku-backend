import { ApiProperty } from '@nestjs/swagger';

export class CandidateProfileDto {
  @ApiProperty({ example: '507f1f77bcf86cd799439011' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@example.com' })
  email: string;

  @ApiProperty({ example: '+1234567890' })
  phone?: string;

  @ApiProperty({ example: 'San Francisco, CA' })
  location?: string;

  @ApiProperty({ example: 'path/to/profile/image.jpg' })
  profileImage?: string;

  @ApiProperty({ example: 'path/to/cv.pdf' })
  cv?: string;

  @ApiProperty({ example: 'Software Engineer' })
  title?: string;

  @ApiProperty({ example: ['JavaScript', 'Python'] })
  skills?: string[];

  @ApiProperty({ example: 5 })
  yearsOfExperience?: number;
}

export class JobApplicationsResponseDto {
  @ApiProperty({ type: [CandidateProfileDto] })
  applications: CandidateProfileDto[];

  @ApiProperty({ example: 10 })
  total: number;
}