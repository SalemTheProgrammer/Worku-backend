import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GeminiClientService } from './gemini-client.service';
import { ValidationUtilsService } from './validation-utils.service';
import { PDF_ANALYSIS_PROMPT, createCVAnalysisPrompt, createCVFeedbackPrompt, PDF_CV_FEEDBACK_PROMPT } from '../prompts';
import { CvAnalysisResponseDto } from '../candidate/dto/cv-analysis.dto';

import { FitScore, FitBreakdown, JobFitSummary, RecruiterRecommendations, ApplicationAnalysisResponse } from './validation-utils.service';

@Injectable()
export class CVAnalysisService {
  private readonly logger = new Logger(CVAnalysisService.name);

  constructor(
    private readonly geminiClient: GeminiClientService,
    private readonly validationUtils: ValidationUtilsService
  ) {}

  private async validateFileAccess(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      this.logger.log(`File verified at path: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error accessing file: ${filePath}`);
      throw new HttpException('File not accessible', HttpStatus.NOT_FOUND);
    }
  }

  private async readFileContent(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, 'utf-8');
    } catch (error) {
      this.logger.error(`Error reading file: ${filePath}`);
      throw new HttpException('Error reading file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async analyzeCV(filePath: string): Promise<ApplicationAnalysisResponse> {
    this.logger.log(`Analyzing CV file at path: ${filePath}`);
    try {
      await this.validateFileAccess(filePath);
      
      // Check file extension and size
      const fileExt = path.extname(filePath).toLowerCase();
      this.logger.debug(`File extension: ${fileExt}`);
      
      const fileStats = await fs.stat(filePath);
      this.logger.debug(`File size: ${fileStats.size} bytes`);
      
      const cvContent = await this.readFileContent(filePath);
      this.logger.debug(`Read ${cvContent.length} characters from file`);

      if (!cvContent.trim()) {
        this.logger.warn(`Empty CV content detected for file: ${filePath}`);
        return this.createEmptyResponse('Le fichier CV est vide');
      }

      // Enhanced PDF detection
      const isPDF = fileExt === '.pdf' || cvContent.includes('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(cvContent);
      this.logger.debug(`File detected as PDF: ${isPDF}`);
      
      if (isPDF) {
        this.logger.log(`Processing file as PDF: ${filePath}`);
        return this.analyzePDFFile(filePath);
      }

      this.logger.log(`Processing file as text: ${filePath}`);
      const prompt = createCVAnalysisPrompt(cvContent);
      this.logger.debug(`Created analysis prompt with ${prompt.length} characters`);

      try {
        this.logger.debug('Sending content to Gemini API...');
        const result = await this.geminiClient.generateContent(prompt);
        this.logger.debug(`Received ${result.length} characters from Gemini API`);
        
        try {
          this.logger.debug('Extracting JSON from response text...');
          const jsonText = this.extractJsonFromText(result);
          this.logger.debug(`Extracted JSON text: ${jsonText.substring(0, 100)}...`);
          
          const parsed = JSON.parse(jsonText);
          this.logger.debug('Successfully parsed JSON response');

          if (this.validationUtils.isValidApplicationAnalysisResponse(parsed)) {
            this.logger.log('Successfully validated analysis response structure');
            return parsed;
          }
          
          this.logger.warn('❌ Invalid response structure:', parsed);
          throw new Error('Invalid response structure');
        } catch (error) {
          this.logger.error(`Error parsing CV analysis response: ${error.message}`, error.stack);
          throw error;
        }
      } catch (error) {
        this.logger.error(`Error analyzing CV: ${error.message}`, error.stack);
        return this.createEmptyResponse('Erreur lors de l\'analyse du CV');
      }
    } catch (error) {
      this.logger.error(`Unexpected error during CV analysis: ${error.message}`, error.stack);
      return this.createEmptyResponse(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
  }

  private async analyzePDFFile(filePath: string): Promise<ApplicationAnalysisResponse> {
    this.logger.log('\n=== PDF ANALYSIS STARTED ===');
    this.logger.log(`File: ${filePath}`);

    try {
      this.logger.log('1. Reading PDF file...');
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = 'application/pdf';
      const fileSize = fileBuffer.length;
      this.logger.log(`File size: ${fileSize} bytes`);
      
      this.logger.log('2. Uploading file to Gemini...');
      const uploadedFile = await this.geminiClient.uploadFile(fileBuffer, mimeType);
      this.logger.log('File uploaded successfully');
      
      this.logger.log('3. Creating analysis prompt...');
      const prompt = PDF_ANALYSIS_PROMPT;
      
      this.logger.log('4. Requesting Gemini analysis...');
      const result = await this.geminiClient.generateContentWithFile(uploadedFile.uri, mimeType, prompt);
      this.logger.log('Received analysis response');
      
      try {
        this.logger.log('5. Extracting JSON from response...');
        const jsonText = this.extractJsonFromText(result);
        this.logger.debug('Extracted JSON:', jsonText);
        
        const parsed = JSON.parse(jsonText);
        this.logger.log('6. Validating response structure...');

        if (this.validationUtils.isValidApplicationAnalysisResponse(parsed)) {
          this.logger.log('✅ Analysis completed successfully');
          this.logger.debug('Final analysis result:', parsed);
          return parsed;
        }

        this.logger.warn('❌ Invalid response structure:', parsed);
        return this.createEmptyResponse('Format de réponse invalide');
      } catch (error) {
        this.logger.error('❌ Error processing response:', {
          error: error.message,
          type: error.name,
          stack: error.stack
        });
        return this.createEmptyResponse('Erreur lors du traitement');
      }
    } catch (error) {
      this.logger.error('❌ PDF Analysis failed:', {
        error: error.message,
        type: error.name,
        stack: error.stack,
        file: filePath
      });
      throw new HttpException(
        'Erreur lors de l\'analyse du CV',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  private createEmptyResponse(reason: string): ApplicationAnalysisResponse {
    return {
      fitScore: {
        overall: 0,
        skills: 0,
        experience: 0,
        education: 0,
        yearsExperience: 0,
        languages: 0
      },
      jobFitSummary: {
        isRecommended: false,
        fitLevel: 'Low',
        reason,
        fitBreakdown: {
          skillsFit: {
            matchLevel: 'Misaligned',
            details: ['CV vide - impossible d\'évaluer les compétences']
          },
          experienceFit: {
            matchLevel: 'Misaligned',
            details: ['CV vide - impossible d\'évaluer l\'expérience']
          },
          educationFit: {
            matchLevel: 'Misaligned',
            details: ['CV vide - impossible d\'évaluer la formation']
          }
        }
      },
      recruiterRecommendations: {
        decision: 'Reject',
        suggestedAction: 'Demander au candidat de soumettre un CV valide',
        feedbackToSend: ['Veuillez soumettre un CV avec du contenu valide pour permettre l\'analyse']
      }
    };
  }

  private extractJsonFromText(text: string): string {
    try {
      // First attempt: try to parse as is
      JSON.parse(text);
      return text;
    } catch (e) {
      // Second attempt: Look for JSON object pattern using regex
      const jsonPattern = /\{[\s\S]*\}/;
      const match = text.match(jsonPattern);
      
      if (match && match[0]) {
        try {
          JSON.parse(match[0]);
          this.logger.log('Successfully extracted JSON from text response');
          return match[0];
        } catch (err) {
          this.logger.warn('Found JSON-like structure but it is not valid JSON');
        }
      }
      
      this.logger.warn('Could not extract valid JSON, returning fallback response');
      return JSON.stringify({
        signauxAlerte: [{
          type: 'Erreur de format',
          probleme: 'Le modèle n\'a pas retourné un format JSON valide',
          severite: 'élevée'
        }],
        resume: 'Impossible d\'analyser la réponse du modèle'
      });
    }
  }

  // Prompt templates have been moved to src/prompts directory

  /**
   * Creates a default/fallback CV analysis response for when analysis fails
   */
  private createDefaultCvFeedbackResponse(reason: string): CvAnalysisResponseDto {
    return {
      summary: {
        overallAssessment: "Impossible d'analyser le CV",
        generalFeedback: reason,
        quality: 0
      },
      strengths: [],
      formattingFeedback: [],
      contentFeedback: [
        {
          section: "Général",
          issue: "Impossible d'analyser le contenu du CV",
          recommendation: "Veuillez soumettre un CV dans un format standard (PDF ou texte)",
          severity: "critical"
        }
      ],
      improvementSuggestions: [
        "Soumettre un CV dans un format standard",
        "Vérifier que le contenu du CV est accessible"
      ]
    };
  }

  /**
   * Analyzes the CV content for feedback on the CV itself (not job matching)
   * @param filePath Path to the CV file
   * @returns CV feedback analysis
   */
  async analyzeCVContent(filePath: string): Promise<CvAnalysisResponseDto> {
    this.logger.log(`Analyzing CV content for feedback at path: ${filePath}`);
    try {
      await this.validateFileAccess(filePath);
      
      const fileExt = path.extname(filePath).toLowerCase();
      this.logger.debug(`File extension: ${fileExt}`);
      
      const fileStats = await fs.stat(filePath);
      this.logger.debug(`File size: ${fileStats.size} bytes`);
      
      const cvContent = await this.readFileContent(filePath);
      this.logger.debug(`Read ${cvContent.length} characters from file`);

      if (!cvContent.trim()) {
        this.logger.warn(`Empty CV content detected for file: ${filePath}`);
        return this.createDefaultCvFeedbackResponse('Le fichier CV est vide');
      }

      // Enhanced PDF detection
      const isPDF = fileExt === '.pdf' || cvContent.includes('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(cvContent);
      this.logger.debug(`File detected as PDF: ${isPDF}`);
      
      if (isPDF) {
        this.logger.log(`Processing file as PDF for content feedback: ${filePath}`);
        return this.analyzePDFContentFeedback(filePath);
      }

      this.logger.log(`Processing file as text for content feedback: ${filePath}`);
      const prompt = createCVFeedbackPrompt(cvContent);
      this.logger.debug(`Created CV feedback prompt with ${prompt.length} characters`);

      try {
        this.logger.debug('Sending content to Gemini API for CV feedback...');
        const result = await this.geminiClient.generateContent(prompt);
        this.logger.debug(`Received ${result.length} characters from Gemini API`);
        
        try {
          this.logger.debug('Extracting JSON from response text...');
          const jsonText = this.extractJsonFromText(result);
          this.logger.debug(`Extracted JSON text: ${jsonText.substring(0, 100)}...`);
          
          const parsed = JSON.parse(jsonText);
          this.logger.debug('Successfully parsed JSON response for CV feedback');

          // Validation could be added here if needed
          return parsed as CvAnalysisResponseDto;
        } catch (error) {
          this.logger.error(`Error parsing CV feedback response: ${error.message}`, error.stack);
          throw error;
        }
      } catch (error) {
        this.logger.error(`Error analyzing CV content: ${error.message}`, error.stack);
        return this.createDefaultCvFeedbackResponse('Erreur lors de l\'analyse du CV');
      }
    } catch (error) {
      this.logger.error(`Unexpected error during CV content analysis: ${error.message}`, error.stack);
      return this.createDefaultCvFeedbackResponse(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
  }

  /**
   * Analyzes PDF files for CV content feedback
   */
  private async analyzePDFContentFeedback(filePath: string): Promise<CvAnalysisResponseDto> {
    this.logger.log('\n=== PDF CONTENT FEEDBACK ANALYSIS STARTED ===');
    this.logger.log(`File: ${filePath}`);

    try {
      this.logger.log('1. Reading PDF file...');
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = 'application/pdf';
      const fileSize = fileBuffer.length;
      this.logger.log(`File size: ${fileSize} bytes`);
      
      this.logger.log('2. Uploading file to Gemini...');
      const uploadedFile = await this.geminiClient.uploadFile(fileBuffer, mimeType);
      this.logger.log('File uploaded successfully');
      
      this.logger.log('3. Creating CV feedback analysis prompt...');
      const prompt = PDF_CV_FEEDBACK_PROMPT;
      
      this.logger.log('4. Requesting Gemini analysis for CV feedback...');
      const result = await this.geminiClient.generateContentWithFile(uploadedFile.uri, mimeType, prompt);
      this.logger.log('Received CV feedback analysis response');
      
      try {
        this.logger.log('5. Extracting JSON from response...');
        const jsonText = this.extractJsonFromText(result);
        this.logger.debug('Extracted JSON:', jsonText);
        
        const parsed = JSON.parse(jsonText);
        this.logger.log('6. Parsing CV feedback response...');

        // Validation could be added here if needed
        this.logger.log('✅ CV feedback analysis completed successfully');
        return parsed as CvAnalysisResponseDto;
      } catch (error) {
        this.logger.error('❌ Error processing CV feedback response:', {
          error: error.message,
          type: error.name,
          stack: error.stack
        });
        return this.createDefaultCvFeedbackResponse('Erreur lors du traitement');
      }
    } catch (error) {
      this.logger.error('❌ PDF Content Feedback Analysis failed:', {
        error: error.message,
        type: error.name,
        stack: error.stack,
        file: filePath
      });
      return this.createDefaultCvFeedbackResponse('Erreur lors de l\'analyse du PDF');
    }
  }
}