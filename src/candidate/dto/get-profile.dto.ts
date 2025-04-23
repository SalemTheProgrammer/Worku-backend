import { ApiProperty } from '@nestjs/swagger';
import { EmploymentStatus } from '../enums/employment-status.enum';

export class LocationDto {
  @ApiProperty({ example: 'Tunisia' })
  country: string;

  @ApiProperty({ example: 'Carthage' })
  city: string;
}

export class PersonalInfoDto {
  @ApiProperty({ example: 'Salem' })
  firstName: string;

  @ApiProperty({ example: 'Dahmani' })
  lastName: string;

  @ApiProperty({ example: 'salem.dahmani345@gmail.com' })
  email: string;

  @ApiProperty({ required: false })
  profilePicture?: string;

  @ApiProperty()
  location: LocationDto;

  @ApiProperty({ type: [String] })
  workPreferences: string[];

  @ApiProperty({ required: false })
  phone?: string;

  @ApiProperty({ required: false })
  availabilityDate?: Date;

  @ApiProperty({ 
    enum: EmploymentStatus,
    required: false,
    example: EmploymentStatus.LOOKING_FOR_JOB
  })
  employmentStatus?: EmploymentStatus;
}

export class StatsDto {
  @ApiProperty({ example: 0 })
  experienceCount: number;

  @ApiProperty({ example: 0 })
  educationCount: number;

  @ApiProperty({ example: 0 })
  skillsCount: number;

  @ApiProperty({ example: 0 })
  certificatesCount: number;
}

export class CvInfoDto {
  @ApiProperty({ example: true })
  exists: boolean;

  @ApiProperty({ required: false, example: 'uploads/67efaae785ddec6568a08760/cv/example.pdf' })
  filename?: string;
}

export class ProfileResponseDto {
  @ApiProperty()
  personalInfo: PersonalInfoDto;

  @ApiProperty({ type: Array })
  experiences: any[];

  @ApiProperty()
  stats: StatsDto;

  @ApiProperty({ example: 0 })
  profileCompletion: number;

  @ApiProperty()
  cvInfo: CvInfoDto;

  @ApiProperty({ example: true })
  isOpenToWork: boolean;

  @ApiProperty({ example: true })
  isProfilePublic: boolean;
}

export class GetProfileDto {
  @ApiProperty({ example: 200 })
  statusCode: number;

  @ApiProperty({ example: 'Success' })
  message: string;

  @ApiProperty()
  data: ProfileResponseDto;

  @ApiProperty({ example: '2025-04-18T17:48:07.154Z' })
  timestamp: string;
}