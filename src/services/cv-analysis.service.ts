import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs/promises';
import { GeminiClientService } from './gemini-client.service';
import { ValidationUtilsService } from './validation-utils.service';

interface ApplicationAnalysisResponse {
  fitScore: {
    overall: number;
    skills: number;
    experience: number;
    education: number;
  };
  jobFitSummary: {
    isRecommended: boolean;
    fitLevel: 'High' | 'Medium' | 'Low';
    reason: string;
    fitBreakdown: {
      skillsFit: {
        matchLevel: 'Strong' | 'Partial' | 'Weak' | 'Misaligned';
        details: string[];
      };
      experienceFit: {
        matchLevel: 'Strong' | 'Partial' | 'Weak' | 'Misaligned';
        details: string[];
      };
      educationFit: {
        matchLevel: 'Strong' | 'Partial' | 'Weak' | 'Misaligned';
        details: string[];
      };
    };
  };
  recruiterRecommendations: {
    decision: 'Hire' | 'Consider' | 'Reject';
    suggestedAction: string;
    feedbackToSend: string[];
  };
}

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
    await this.validateFileAccess(filePath);
    const cvContent = await this.readFileContent(filePath);

    if (!cvContent.trim()) {
      return this.createEmptyResponse('Le fichier CV est vide');
    }

    const isPDF = filePath.toLowerCase().endsWith('.pdf') || cvContent.includes('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(cvContent);
    
    if (isPDF) {
      return this.analyzePDFFile(filePath);
    }

    const prompt = this.createCVAnalysisPrompt(cvContent);

    try {
      const result = await this.geminiClient.generateContent(prompt);
      try {
        const jsonText = this.extractJsonFromText(result);
        const parsed = JSON.parse(jsonText);

        if (this.validationUtils.isValidApplicationAnalysisResponse(parsed)) {
          return parsed;
        }
        
        this.logger.warn('Response structure is invalid:', parsed);
        throw new Error('Invalid response structure');
      } catch (error) {
        this.logger.error(`Error parsing CV analysis response: ${error.message}`);
        throw error;
      }
    } catch (error) {
      this.logger.error('Error analyzing CV:', error);
      return this.createEmptyResponse('Erreur lors de l\'analyse du CV');
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
      const prompt = this.createPDFAnalysisPrompt();
      
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
        education: 0
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

  private createPDFAnalysisPrompt(): string {
    return `
    Analyse les métadonnées et le format de ce CV PDF.
    
    IMPORTANT: Tu dois UNIQUEMENT répondre avec un JSON valide, rien d'autre.
    
    Identifie :
    - Le logiciel utilisé pour la création (si détectable)
    - La structure générale du document
    - La lisibilité et la qualité du formatage

    RÉPONDS STRICTEMENT AVEC CE FORMAT JSON SANS AUCUN TEXTE AVANT OU APRÈS:
    {
      "signauxAlerte": [
        {
          "type": "Metadonnées",
          "probleme": "Description du problème lié au format",
          "severite": "faible"
        }
      ],
      "resume": "Résumé de l'analyse du format"
    }`;
  }

  private createCVAnalysisPrompt(cvContent: string): string {
    return `
    Analyse le contenu de ce CV.
    
    IMPORTANT: Tu dois UNIQUEMENT répondre avec un JSON valide, rien d'autre. Pas d'introduction, pas d'explication, seulement le JSON.
    
    CV à analyser:
    ${cvContent}

    RÉPONDS STRICTEMENT AVEC CE FORMAT JSON SANS AUCUN TEXTE AVANT OU APRÈS:
    {
      "signauxAlerte": [
        {
          "type": "Type d'alerte",
          "probleme": "Description du problème",
          "severite": "faible"
        }
      ],
      "resume": "Résumé global de l'analyse"
    }

    Note: Les valeurs acceptées pour la sévérité sont uniquement: "faible", "moyenne", ou "élevée".
    `;
  }
}