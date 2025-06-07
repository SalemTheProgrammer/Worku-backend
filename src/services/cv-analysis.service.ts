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
  private readonly fileCache = new Map<string, { content: string; mtime: number }>();
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly CACHE_TTL = 300000; // 5 minutes

  constructor(
    private readonly geminiClient: GeminiClientService,
    private readonly validationUtils: ValidationUtilsService
  ) {
    // Cleanup cache periodically
    setInterval(() => this.cleanupFileCache(), 600000); // 10 minutes
  }

  private cleanupFileCache(): void {
    const now = Date.now();
    for (const [key, value] of this.fileCache.entries()) {
      if (now - value.mtime > this.CACHE_TTL) {
        this.fileCache.delete(key);
      }
    }
  }

  private async validateFileAccess(filePath: string): Promise<void> {
    try {
      const stats = await fs.stat(filePath);
      
      if (stats.size > this.MAX_FILE_SIZE) {
        throw new HttpException('File too large', HttpStatus.BAD_REQUEST);
      }
      
      if (!stats.isFile()) {
        throw new HttpException('Invalid file', HttpStatus.BAD_REQUEST);
      }
      
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      this.logger.error(`Error accessing file: ${filePath}`, error);
      throw new HttpException('File not accessible', HttpStatus.NOT_FOUND);
    }
  }

  private async readFileContentCached(filePath: string): Promise<string> {
    try {
      const stats = await fs.stat(filePath);
      const cacheKey = `${filePath}:${stats.mtime.getTime()}`;
      
      // Check cache first
      const cached = this.fileCache.get(cacheKey);
      if (cached && Date.now() - cached.mtime < this.CACHE_TTL) {
        this.logger.debug(`Using cached content for: ${filePath}`);
        return cached.content;
      }

      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Cache the result
      this.fileCache.set(cacheKey, {
        content,
        mtime: Date.now()
      });

      // Clean up old cache entries for this file
      for (const key of this.fileCache.keys()) {
        if (key.startsWith(`${filePath}:`) && key !== cacheKey) {
          this.fileCache.delete(key);
        }
      }

      return content;
    } catch (error) {
      this.logger.error(`Error reading file: ${filePath}`, error);
      throw new HttpException('Error reading file', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private detectFileType(filePath: string, content: string): { isPDF: boolean; fileExt: string } {
    const fileExt = path.extname(filePath).toLowerCase();
    const isPDF = fileExt === '.pdf' || 
                  content.includes('%PDF') || 
                  /[\x00-\x08\x0E-\x1F]/.test(content);
    
    return { isPDF, fileExt };
  }

  async analyzeCV(filePath: string): Promise<ApplicationAnalysisResponse> {
    const startTime = Date.now();
    this.logger.log(`Starting CV analysis: ${filePath}`);
    
    try {
      await this.validateFileAccess(filePath);
      
      const cvContent = await this.readFileContentCached(filePath);
      
      if (!cvContent.trim()) {
        this.logger.warn(`Empty CV content: ${filePath}`);
        return this.createEmptyResponse('Le fichier CV est vide');
      }

      const { isPDF } = this.detectFileType(filePath, cvContent);
      
      const result = isPDF 
        ? await this.analyzePDFFile(filePath)
        : await this.analyzeTextFile(cvContent);

      const duration = Date.now() - startTime;
      this.logger.log(`CV analysis completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`CV analysis failed after ${duration}ms:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      return this.createEmptyResponse(`Erreur lors de l'analyse du CV: ${error.message}`);
    }
  }

  private async analyzeTextFile(cvContent: string): Promise<ApplicationAnalysisResponse> {
    try {
      const prompt = createCVAnalysisPrompt(cvContent);
      const result = await this.geminiClient.generateContent(prompt);
      
      const jsonText = this.extractJsonFromText(result);
      const parsed = JSON.parse(jsonText);

      if (this.validationUtils.isValidApplicationAnalysisResponse(parsed)) {
        return parsed;
      }
      
      throw new Error('Invalid response structure');
    } catch (error) {
      this.logger.error(`Text analysis error:`, error);
      return this.createEmptyResponse('Erreur lors de l\'analyse du CV');
    }
  }

  private async analyzePDFFile(filePath: string): Promise<ApplicationAnalysisResponse> {
    this.logger.debug(`Processing PDF: ${filePath}`);

    try {
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = 'application/pdf';
      
      // Upload and analyze in parallel where possible
      const uploadedFile = await this.geminiClient.uploadFile(fileBuffer, mimeType);
      const result = await this.geminiClient.generateContentWithFile(
        uploadedFile.uri, 
        mimeType, 
        PDF_ANALYSIS_PROMPT
      );
      
      const jsonText = this.extractJsonFromText(result);
      const parsed = JSON.parse(jsonText);

      if (this.validationUtils.isValidApplicationAnalysisResponse(parsed)) {
        return parsed;
      }

      return this.createEmptyResponse('Format de réponse invalide');
    } catch (error) {
      this.logger.error(`PDF analysis error:`, error);
      throw new HttpException(
        'Erreur lors de l\'analyse du CV PDF',
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
    } catch {
      // Second attempt: Look for JSON object pattern
      const jsonPattern = /\{[\s\S]*\}/;
      const match = text.match(jsonPattern);
      
      if (match?.[0]) {
        try {
          JSON.parse(match[0]);
          return match[0];
        } catch {
          this.logger.warn('Found JSON-like structure but invalid');
        }
      }
      
      // Fallback response
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

  async analyzeCVContent(filePath: string): Promise<CvAnalysisResponseDto> {
    const startTime = Date.now();
    this.logger.log(`Starting CV content analysis: ${filePath}`);
    
    try {
      await this.validateFileAccess(filePath);
      
      const cvContent = await this.readFileContentCached(filePath);
      
      if (!cvContent.trim()) {
        return this.createDefaultCvFeedbackResponse('Le fichier CV est vide');
      }

      const { isPDF } = this.detectFileType(filePath, cvContent);
      
      const result = isPDF 
        ? await this.analyzePDFContentFeedback(filePath)
        : await this.analyzeTextContentFeedback(cvContent);

      const duration = Date.now() - startTime;
      this.logger.log(`CV content analysis completed in ${duration}ms`);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(`CV content analysis failed after ${duration}ms:`, error);
      return this.createDefaultCvFeedbackResponse(`Erreur: ${error.message}`);
    }
  }

  private async analyzeTextContentFeedback(cvContent: string): Promise<CvAnalysisResponseDto> {
    try {
      const prompt = createCVFeedbackPrompt(cvContent);
      const result = await this.geminiClient.generateContent(prompt);
      
      const jsonText = this.extractJsonFromText(result);
      return JSON.parse(jsonText) as CvAnalysisResponseDto;
    } catch (error) {
      this.logger.error(`Text content analysis error:`, error);
      return this.createDefaultCvFeedbackResponse('Erreur lors de l\'analyse du CV');
    }
  }

  private async analyzePDFContentFeedback(filePath: string): Promise<CvAnalysisResponseDto> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const uploadedFile = await this.geminiClient.uploadFile(fileBuffer, 'application/pdf');
      
      const result = await this.geminiClient.generateContentWithFile(
        uploadedFile.uri, 
        'application/pdf', 
        PDF_CV_FEEDBACK_PROMPT
      );
      
      const jsonText = this.extractJsonFromText(result);
      return JSON.parse(jsonText) as CvAnalysisResponseDto;
    } catch (error) {
      this.logger.error(`PDF content analysis error:`, error);
      return this.createDefaultCvFeedbackResponse('Erreur lors de l\'analyse du PDF');
    }
  }
}