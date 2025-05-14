import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GeminiClientService } from './gemini-client.service';

interface ImageAnalysisResponse {
  content: string;
  analyzedAt: string;
}

interface FitBreakdown {
  matchLevel: 'Strong' | 'Partial' | 'Weak' | 'Misaligned';
  details: string[];
}

interface FitScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
}

interface JobFitSummary {
  isRecommended: boolean;
  fitLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  fitBreakdown: {
    skillsFit: FitBreakdown;
    experienceFit: FitBreakdown;
    educationFit: FitBreakdown;
  };
}

interface RecruiterRecommendations {
  decision: 'Hire' | 'Consider' | 'Reject';
  suggestedAction: string;
  feedbackToSend: string[];
}

interface ApplicationAnalysisResponse {
  fitScore: FitScore;
  jobFitSummary: JobFitSummary;
  recruiterRecommendations: RecruiterRecommendations;
}

@Injectable()
export class ImageAnalysisService {
  private readonly logger = new Logger(ImageAnalysisService.name);

  constructor(private readonly geminiClient: GeminiClientService) {}

  private async validateFileAccess(filePath: string): Promise<void> {
    try {
      await fs.access(filePath);
      this.logger.log(`File verified at path: ${filePath}`);
    } catch (error) {
      this.logger.error(`Error accessing file: ${filePath}`);
      throw new HttpException('File not accessible', HttpStatus.NOT_FOUND);
    }
  }

  private getMimeTypeFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();
    
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.bmp': 'image/bmp',
      '.pdf': 'application/pdf'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
  }

  async analyzeImage(filePath: string, prompt: string = "Can you tell me what's in this image?"): Promise<ImageAnalysisResponse> {
    try {
      await this.validateFileAccess(filePath);
      
      const mimeType = this.getMimeTypeFromPath(filePath);
      const fileBuffer = await fs.readFile(filePath);
      
      const uploadedFile = await this.geminiClient.uploadFile(fileBuffer, mimeType);
      const result = await this.geminiClient.generateContentWithFile(uploadedFile.uri, mimeType, prompt);
      
      return {
        content: result || "No analysis was generated",
        analyzedAt: new Date().toISOString()
      };
    } catch (error) {
      this.logger.error('Error analyzing image:', error);
      throw new HttpException(
        'Failed to analyze image',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async analyzeResumeImage(filePath: string): Promise<ApplicationAnalysisResponse> {
    try {
      const analysisResult = await this.analyzeImage(filePath, 
        "Analyze this CV/resume image. Extract key information like name, " +
        "contact details, skills, experience, and education. Identify any issues " +
        "like poor readability, missing sections, or formatting problems. " +
        "Return a professional evaluation in French."
      );
      
      return {
        fitScore: {
          overall: 50,
          skills: 40,
          experience: 50,
          education: 60
        },
        jobFitSummary: {
          isRecommended: false,
          fitLevel: 'Medium',
          reason: 'Analyse basée sur une image - précision limitée',
          fitBreakdown: {
            skillsFit: {
              matchLevel: 'Partial',
              details: ['Analyse limitée par le format image']
            },
            experienceFit: {
              matchLevel: 'Partial',
              details: ['Analyse limitée par le format image']
            },
            educationFit: {
              matchLevel: 'Partial',
              details: ['Analyse limitée par le format image']
            }
          }
        },
        recruiterRecommendations: {
          decision: 'Consider',
          suggestedAction: 'Demander une version texte du CV',
          feedbackToSend: ['Pour une meilleure évaluation, merci de fournir votre CV au format texte']
        }
      };
    } catch (error) {
      this.logger.error('Error analyzing resume image:', error);
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
          reason: 'Erreur lors de l\'analyse de l\'image du CV',
          fitBreakdown: {
            skillsFit: {
              matchLevel: 'Misaligned',
              details: ['Format d\'image non supporté']
            },
            experienceFit: {
              matchLevel: 'Misaligned',
              details: ['Format d\'image non supporté']
            },
            educationFit: {
              matchLevel: 'Misaligned',
              details: ['Format d\'image non supporté']
            }
          }
        },
        recruiterRecommendations: {
          decision: 'Reject',
          suggestedAction: 'Demander un CV dans un format standard',
          feedbackToSend: [
            'L\'image de votre CV n\'a pas pu être analysée.',
            'Veuillez soumettre votre CV dans un format standard (.pdf, .doc, .docx)'
          ]
        }
      };
    }
  }
}