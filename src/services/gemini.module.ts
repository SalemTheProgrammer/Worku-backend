import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeminiClientService } from './gemini-client.service';
import { ValidationUtilsService } from './validation-utils.service';
import { CVAnalysisService } from './cv-analysis.service';
import { ProfileSuggestionService } from './profile-suggestion.service';
import { ImageAnalysisService } from './image-analysis.service';

@Module({
  imports: [ConfigModule],
  providers: [
    GeminiClientService,
    ValidationUtilsService,
    CVAnalysisService,
    ProfileSuggestionService,
    ImageAnalysisService
  ],
  exports: [
    GeminiClientService,
    CVAnalysisService,
    ProfileSuggestionService,
    ImageAnalysisService
  ]
})
export class GeminiModule {}