export class ProfileSuggestionsResponseDto {
  suggestions: {
    role: string[];
    skills: string[];
    industries: string[];
    locations: string[];
    certifications: string[];
  };
}