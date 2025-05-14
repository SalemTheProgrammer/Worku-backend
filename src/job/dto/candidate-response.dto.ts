import { ApiProperty } from '@nestjs/swagger';
import { ProfessionalStatus } from '../../job/enums/professional-status.enum';
import { EmploymentStatus } from '../../candidate/enums/employment-status.enum';

export class EducationResponseDto {
  @ApiProperty({ description: 'Education ID' })
  _id: string;

  @ApiProperty({ description: 'Institution name' })
  institution: string;

  @ApiProperty({ description: 'Degree obtained' })
  degree: string;

  @ApiProperty({ description: 'Field of study' })
  fieldOfStudy: string;

  @ApiProperty({ description: 'Start date of education' })
  startDate: Date;

  @ApiProperty({ description: 'End date of education', required: false })
  endDate?: Date;

  @ApiProperty({ description: 'Description of education', required: false })
  description?: string;

  @ApiProperty({ description: 'Whether this is current education', default: false })
  isCurrent: boolean;
}

export class ExperienceResponseDto {
  @ApiProperty({ description: 'Experience ID' })
  _id: string;

  @ApiProperty({ description: 'Company name' })
  company: string;

  @ApiProperty({ description: 'Position title' })
  position: string;

  @ApiProperty({ description: 'Start date of experience' })
  startDate: Date;

  @ApiProperty({ description: 'End date of experience', required: false })
  endDate?: Date;

  @ApiProperty({ description: 'Location of the job', required: false })
  location?: string;

  @ApiProperty({ description: 'Description of responsibilities', required: false })
  description?: string;

  @ApiProperty({ description: 'Technologies used', type: [String], required: false })
  technologies?: string[];

  @ApiProperty({ description: 'Skills developed', type: [String], required: false })
  skills?: string[];

  @ApiProperty({ description: 'Achievements', type: [String], required: false })
  achievements?: string[];

  @ApiProperty({ description: 'Whether this is current position', default: false })
  isCurrent: boolean;
}

export class SkillResponseDto {
  @ApiProperty({ description: 'Skill ID' })
  _id: string;

  @ApiProperty({ description: 'Skill name' })
  name: string;

  @ApiProperty({ description: 'Skill category' })
  category: string;

  @ApiProperty({ description: 'Skill level (1-5)', minimum: 1, maximum: 5 })
  level: number;

  @ApiProperty({ description: 'Years of experience with this skill', required: false })
  yearsOfExperience?: number;

  @ApiProperty({ description: 'Whether this is a language skill', default: false })
  isLanguage: boolean;

  @ApiProperty({ 
    description: 'Proficiency level for languages', 
    enum: ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant'],
    required: false
  })
  proficiencyLevel?: string;
}

export class CertificationResponseDto {
  @ApiProperty({ description: 'Certification ID' })
  _id: string;

  @ApiProperty({ description: 'Certification name' })
  name: string;

  @ApiProperty({ description: 'Issuing organization' })
  issuingOrganization: string;

  @ApiProperty({ description: 'Issue date' })
  issueDate: Date;

  @ApiProperty({ description: 'Expiration date', required: false })
  expirationDate?: Date;

  @ApiProperty({ description: 'Credential ID', required: false })
  credentialId?: string;

  @ApiProperty({ description: 'Credential URL', required: false })
  credentialUrl?: string;
}

export class FieldsCompletedDto {
  @ApiProperty({ description: 'Personal information completed', default: false })
  personalInfo: boolean;

  @ApiProperty({ description: 'CV uploaded', default: false })
  cv: boolean;

  @ApiProperty({ description: 'Education information completed', default: false })
  education: boolean;

  @ApiProperty({ description: 'Experience information completed', default: false })
  experience: boolean;

  @ApiProperty({ description: 'Certifications information completed', default: false })
  certifications: boolean;

  @ApiProperty({ description: 'Social links information completed', default: false })
  links: boolean;
}

export class CandidateResponseDto {
  @ApiProperty({ description: 'Candidate ID' })
  _id: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'First name' })
  firstName: string;

  @ApiProperty({ description: 'Last name' })
  lastName: string;

  @ApiProperty({ description: 'Profile picture URL', required: false })
  profilePicture?: string;

  @ApiProperty({ description: 'CV URL', required: false })
  cvUrl?: string;

  @ApiProperty({ description: 'CV image URL for analysis', required: false })
  cvImageUrl?: string;

  @ApiProperty({ description: 'Extracted CV text', required: false })
  cvText?: string;

  @ApiProperty({ description: 'Resume URL', required: false })
  resumeUrl?: string;

  @ApiProperty({ description: 'Date of birth', required: false })
  dateOfBirth?: Date;

  @ApiProperty({ description: 'Phone number', required: false })
  phone?: string;

  @ApiProperty({ description: 'Professional status', enum: ProfessionalStatus })
  professionalStatus: ProfessionalStatus;

  @ApiProperty({ description: 'Date of availability', required: false })
  availabilityDate?: Date;

  @ApiProperty({ description: 'Employment status', enum: EmploymentStatus, required: false })
  employmentStatus?: EmploymentStatus;

  @ApiProperty({ description: 'Willing to work remotely', default: false })
  remoteWork?: boolean;

  @ApiProperty({ description: 'Current job title', required: false })
  jobTitle?: string;

  @ApiProperty({ description: 'Professional summary', required: false })
  summary?: string;

  @ApiProperty({ description: 'Desired positions', type: [String], required: false })
  desiredPositions?: string[];

  @ApiProperty({ description: 'Preferred locations', type: [String], required: false })
  preferredLocations?: string[];

  @ApiProperty({ description: 'Years of experience', minimum: 0, required: false })
  yearsOfExperience?: number;

  @ApiProperty({ description: 'Expected salary', minimum: 0, required: false })
  expectedSalary?: number;

  @ApiProperty({ description: 'Work preferences (remote, hybrid, onsite)', type: [String], required: false })
  workPreferences?: string[];

  @ApiProperty({ description: 'Industry preferences', type: [String], required: false })
  industryPreferences?: string[];

  @ApiProperty({ description: 'Address', required: false })
  address?: string;

  @ApiProperty({ description: 'City', required: false })
  city?: string;

  @ApiProperty({ description: 'State/Province', required: false })
  state?: string;

  @ApiProperty({ description: 'Zip/Postal code', required: false })
  zipCode?: string;

  @ApiProperty({ description: 'Country', required: false })
  country?: string;

  @ApiProperty({ description: 'LinkedIn URL', required: false })
  linkedinUrl?: string;

  @ApiProperty({ description: 'GitHub URL', required: false })
  githubUrl?: string;

  @ApiProperty({ description: 'Portfolio URL', required: false })
  portfolioUrl?: string;

  @ApiProperty({ description: 'Other links', type: [String], required: false })
  otherLinks?: string[];

  @ApiProperty({ description: 'Education history', type: [EducationResponseDto], required: false })
  education?: EducationResponseDto[];

  @ApiProperty({ description: 'Experience history', type: [ExperienceResponseDto], required: false })
  experience?: ExperienceResponseDto[];

  @ApiProperty({ description: 'Skills', type: [SkillResponseDto], required: false })
  skills?: SkillResponseDto[];

  @ApiProperty({ description: 'Certifications', type: [CertificationResponseDto], required: false })
  certifications?: CertificationResponseDto[];

  @ApiProperty({ description: 'Profile is public', default: true })
  isProfilePublic?: boolean;

  @ApiProperty({ description: 'Open to work', default: true })
  isOpenToWork?: boolean;

  @ApiProperty({ description: 'Hidden fields', type: [String], required: false })
  hiddenFields?: string[];

  @ApiProperty({ description: 'Profile completion score (0-100)', minimum: 0, maximum: 100 })
  profileCompletionScore: number;

  @ApiProperty({ description: 'Fields completed status' })
  fieldsCompleted: FieldsCompletedDto;

  @ApiProperty({ description: 'Email verified', default: false })
  isVerified: boolean;

  @ApiProperty({ description: 'Profile completed', default: false })
  profileCompleted: boolean;

  @ApiProperty({ description: 'Last login date', required: false })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update date' })
  updatedAt: Date;
}