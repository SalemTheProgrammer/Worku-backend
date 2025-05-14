import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiClientService } from './gemini-client.service';
import { ValidationUtilsService } from './validation-utils.service';
import { Education } from '../schemas/education.schema';
import { Experience } from '../schemas/experience.schema';
import { Skill } from '../schemas/skill.schema';
import { Certification } from '../schemas/certification.schema';
import { ProfessionalStatus } from '../job/enums/professional-status.enum';
import { ProfileSuggestionsResponseDto } from '../candidate/dto/profile-suggestions.dto';

interface ProfileData {
  userId: string;
  education: Education[];
  experience: Experience[];
  skills: Skill[];
  certifications: Certification[];
  professionalStatus: ProfessionalStatus;
  workPreferences?: string[];
  industryPreferences?: string[];
  yearsOfExperience?: number;
  country?: string;
  city?: string;
}

@Injectable()
export class ProfileSuggestionService {
  private readonly logger = new Logger(ProfileSuggestionService.name);

  constructor(
    private readonly geminiClient: GeminiClientService,
    private readonly validationUtils: ValidationUtilsService
  ) {}

  private createFallbackSuggestions(): ProfileSuggestionsResponseDto {
    return {
      suggestions: {
        role: ['Error: Could not generate suggestions'],
        skills: ['Error: Could not generate suggestions'],
        industries: ['Error: Could not generate suggestions'],
        locations: ['Error: Could not generate suggestions'],
        certifications: ['Error: Could not generate suggestions']
      }
    };
  }

  async generateProfileSuggestions(profileData: ProfileData): Promise<ProfileSuggestionsResponseDto> {
    try {
      const prompt = this.createProfileSuggestionsPrompt(profileData);
      const result = await this.geminiClient.generateContent(prompt);
      
      try {
        const parsed = JSON.parse(result);
        if (this.validationUtils.isValidProfileSuggestions(parsed)) {
          return parsed;
        }
        throw new Error('Invalid response structure');
      } catch (error) {
        this.logger.error('Error parsing profile suggestions:', error);
        return this.createFallbackSuggestions();
      }
    } catch (error) {
      this.logger.error('Error generating profile suggestions:', error);
      throw new HttpException(
        'Failed to generate profile suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private createProfileSuggestionsPrompt(profileData: ProfileData): string {
    return `
    Tu es un assistant RH spécialisé dans l'optimisation de profils professionnels.
    Analyse les données du profil ci-dessous et suggère des améliorations pertinentes.
    
    Basé sur l'expérience, les compétences et les préférences du candidat, propose :
    - Des rôles professionnels adaptés
    - Des compétences à développer pour progresser
    - Des industries prometteuses selon son profil
    - Des localisations stratégiques pour sa carrière
    - Des certifications pertinentes à obtenir
    
    Répond uniquement avec un JSON structuré comme ceci :
    {
      "suggestions": {
        "role": ["Liste de rôles recommandés"],
        "skills": ["Liste de compétences à acquérir"],
        "industries": ["Liste d'industries prometteuses"],
        "locations": ["Liste de lieux stratégiques"],
        "certifications": ["Liste de certifications recommandées"]
      }
    }
    
    Profil du candidat :
    ${JSON.stringify(profileData, null, 2)}
    `;
  }
}