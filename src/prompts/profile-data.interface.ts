/**
 * Interface for profile data used in profile suggestions
 */
export interface ProfileData {
  userId: string;
  education: any[];
  experience: any[];
  skills: any[];
  certifications: any[];
  professionalStatus: string;
  workPreferences?: string[];
  industryPreferences?: string[];
  yearsOfExperience?: number;
  country?: string;
  city?: string;
}