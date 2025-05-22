/**
 * Interface for extracted profile data from CV
 */
export interface ExtractedProfile {
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    description?: string;
    specialization?: string;
    grade?: string;
  }>;
  
  experience?: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    skills?: string[];
    achievements?: string[];
  }>;
  
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
    skills?: string[];
  }>;
  
  skills?: Array<{
    name: string;
    category: string;
    level: number;
    yearsOfExperience?: number;
    isLanguage?: boolean;
    proficiencyLevel?: string;
  }>;
  
  cvUrl?: string;
}