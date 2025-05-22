import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { GeminiClientService } from './gemini-client.service';
import { ValidationUtilsService } from './validation-utils.service';
import { ProfileSuggestionsResponseDto } from '../candidate/dto/profile-suggestions.dto';
import { ProfileData, createProfileSuggestionsPrompt } from '../prompts';

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
      const prompt = createProfileSuggestionsPrompt(profileData);
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

  // Prompt templates have been moved to src/prompts directory
}