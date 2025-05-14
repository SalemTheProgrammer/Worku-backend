import { ApiProperty } from '@nestjs/swagger';

export class JobStatsDto {
  @ApiProperty()
  applicationsCount: number;

  @ApiProperty()
  seenCount: number;
}

export class CompanyResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  nomEntreprise: string;

  @ApiProperty()
  numeroRNE: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  secteurActivite: string;

  @ApiProperty()
  tailleEntreprise: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  adresse: string;

  @ApiProperty()
  siteWeb: string;

  @ApiProperty()
  reseauxSociaux: Record<string, string>;

  @ApiProperty()
  description: string;

  @ApiProperty()
  activiteCles: string[];

  @ApiProperty()
  logo: string;

  @ApiProperty()
  profileCompleted: boolean;

  @ApiProperty()
  verified: boolean;

  @ApiProperty()
  lastLoginAt: Date;

  @ApiProperty()
  notificationSettings: Record<string, boolean>;
}

export class ApplicationResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty()
  location: string;

  @ApiProperty()
  profileImage?: string;

  @ApiProperty()
  cv?: string;

  @ApiProperty()
  title?: string;

  @ApiProperty()
  skills: string[];

  @ApiProperty()
  yearsOfExperience: number;

  @ApiProperty()
  appliedAt: Date;
}

export class JobResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  offerType: string;

  @ApiProperty()
  title: string;

  @ApiProperty()
  stats: JobStatsDto;

  @ApiProperty()
  applications: ApplicationResponseDto[];

  @ApiProperty()
  requirements: {
    educationLevel: string;
    fieldOfStudy: string;
    yearsExperienceRequired: number;
    experienceDomain: string;
    hardSkills: string;
    softSkills: string;
    languages: string;
  };

  @ApiProperty()
  jobDetails: {
    vacantPosts: number;
    activityDomain: string;
    contractType: string;
    availability: string;
    workLocation: string;
    tasks: string;
    city: string;
    country: string;
  };

  @ApiProperty()
  benefits: {
    benefitsDescription: string;
    benefitsList: string[];
  };

  @ApiProperty()
  showSalary: boolean;

  @ApiProperty()
  salaryMin?: number;

  @ApiProperty()
  salaryMax?: number;

  @ApiProperty()
  salaryPeriod?: string;

  @ApiProperty()
  salaryCurrency?: string;

  @ApiProperty()
  salaryDescription?: string;

  @ApiProperty()
  company?: CompanyResponseDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  publishedAt: Date;

  @ApiProperty()
  expiresAt: Date;

  @ApiProperty()
  isActive: boolean;
}

export class JobListResponseDto {
  @ApiProperty({ type: [JobResponseDto] })
  jobs: JobResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  skip: number;
}
