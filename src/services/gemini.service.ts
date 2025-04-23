import { Injectable, Logger } from '@nestjs/common';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';
import { ProfileSuggestionsResponseDto } from '../candidate/dto/profile-suggestions.dto';
import { Education } from '../schemas/education.schema';
import { Experience } from '../schemas/experience.schema';
import { Skill } from '../schemas/skill.schema';
import { Certification } from '../schemas/certification.schema';
import { ProfessionalStatus } from '../job/enums/professional-status.enum';

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

interface AlertSignal {
  type: string;
  probleme: string;
  severite: 'élevée' | 'moyenne' | 'faible';
}

interface CVAnalysisResponse {
  signauxAlerte: Array<{
    type: string;
    probleme: string;
    severite: 'élevée' | 'moyenne' | 'faible';
  }>;
  resume: string;
}

interface ImageAnalysisResponse {
  content: string;
  analyzedAt: string;
}

@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private readonly genaiClient: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
    this.genaiClient = new GoogleGenAI({ apiKey }); // Initialize the new GenAI client for file uploads
    this.logger.log('GeminiService initialized');
  }

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

  private isValidCVAnalysisResponse(response: any): response is CVAnalysisResponse {
    return (
      response &&
      Array.isArray(response.signauxAlerte) &&
      response.signauxAlerte.every((alert): alert is AlertSignal =>
        typeof alert.type === 'string' &&
        typeof alert.probleme === 'string' &&
        ['faible', 'moyenne', 'élevée'].includes(alert.severite)
      ) &&
      typeof response.resume === 'string'
    );
  }

  async analyzeCV(filePath: string): Promise<CVAnalysisResponse> {
    await this.validateFileAccess(filePath);
    const cvContent = await this.readFileContent(filePath);

    if (!cvContent.trim()) {
      return {
        signauxAlerte: [{
          type: 'Erreur de format',
          probleme: 'Le fichier CV est vide',
          severite: 'élevée'
        }],
        resume: 'Le CV ne contient aucun contenu analysable'
      };
    }

    const isPDF = filePath.toLowerCase().endsWith('.pdf') || cvContent.includes('%PDF') || /[\x00-\x08\x0E-\x1F]/.test(cvContent);
    
    if (isPDF) {
      // For PDF files, we need to use a PDF parser
      try {
        return await this.analyzePDFFile(filePath);
      } catch (error) {
        this.logger.error('Error analyzing PDF file:', error);
        return {
          signauxAlerte: [{
            type: 'Erreur technique',
            probleme: 'Erreur lors de l\'analyse du fichier PDF',
            severite: 'élevée'
          }],
          resume: 'Une erreur est survenue lors de l\'analyse du PDF'
        };
      }
    }

    // For text-based CV files
    const prompt = this.createCVAnalysisPrompt(cvContent);

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      try {
        // Try to extract JSON if response is not already in JSON format
        const jsonText = this.extractJsonFromText(text);
        const parsed = JSON.parse(jsonText);

        if (this.isValidCVAnalysisResponse(parsed)) {
          return parsed;
        }
        
        this.logger.warn('Response structure is invalid:', parsed);
        throw new Error('Invalid response structure');
      } catch (error) {
        this.logger.error(`Error parsing CV analysis response: ${error.message}`);
        this.logger.debug('Raw response text:', text);
        throw error;
      }
    } catch (error) {
      this.logger.error('Error analyzing CV:', error);
      return {
        signauxAlerte: [{
          type: 'Erreur technique',
          probleme: 'Erreur lors de l\'analyse du CV',
          severite: 'élevée'
        }],
        resume: 'Une erreur est survenue lors de l\'analyse'
      };
    }
  }

  /**
   * Analyzes a PDF file by extracting text and metadata
   * @param filePath Path to the PDF file
   * @returns CV analysis response
   */
  private async analyzePDFFile(filePath: string): Promise<CVAnalysisResponse> {
    try {
      const fileBuffer = await fs.readFile(filePath);
      const mimeType = 'application/pdf';
      const blob = new Blob([fileBuffer], { type: mimeType });
      
      const uploadedFile = await this.genaiClient.files.upload({
        file: blob,
        config: { mimeType }
      });
      
      if (!uploadedFile?.uri) {
        throw new Error('Failed to get URI from uploaded file');
      }
      
      const { createUserContent, createPartFromUri } = await import('@google/genai');
      
      const prompt = `Tu es un expert en analyse de CV. Analyse ce CV et fournis une évaluation détaillée.

IMPORTANT: Tu dois UNIQUEMENT répondre avec un JSON valide selon le format exact ci-dessous, sans AUCUN texte avant ou après.

Analyse les aspects suivants:
1. Expérience professionnelle (pertinence, progression)
2. Formation et diplômes
3. Compétences techniques et soft skills
4. Présentation et structure du CV
5. Sections manquantes ou incomplètes

FORMAT DE RÉPONSE REQUIS:
{
  "signauxAlerte": [
    {
      "type": "Formation"|"Expérience"|"Compétences"|"Présentation"|"Structure",
      "probleme": "Description précise du problème ou de l'amélioration suggérée",
      "severite": "faible"|"moyenne"|"élevée"
    }
  ],
  "resume": "Résumé global de l'analyse du CV en une phrase concise"
}`;

      // Generate content with strict JSON prompt
      const result = await this.genaiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri, mimeType),
          "\n\n",
          prompt
        ]),
       
      });
      
      const text = result.text?.trim() || '';
      
      try {
        // Enhanced JSON extraction
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No JSON found in response');
        }
        
        const jsonText = jsonMatch[0];
        const jsonResponse = JSON.parse(jsonText);
        
        if (this.isValidCVAnalysisResponse(jsonResponse)) {
          return jsonResponse;
        }
        
        throw new Error('Invalid response structure');
      } catch (error) {
        this.logger.error('Error parsing PDF analysis response:', error);
        
        // Attempt to salvage any useful information from the text
        return {
          signauxAlerte: [
            {
              type: 'Analyse',
              probleme: 'Format de réponse non conforme - analyse manuelle requise',
              severite: 'élevée'
            }
          ],
          resume: text.length > 0 ?
            text.slice(0, 200) + '...' :
            'Impossible de générer une analyse structurée du CV'
        };
      }
    } catch (error) {
      this.logger.error('Error analyzing PDF:', error);
      throw new HttpException(
        'Erreur lors de l\'analyse du CV',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Attempts to extract JSON from text that might contain additional content
   * @param text Text that may contain JSON
   * @returns The extracted JSON string or the original text if no JSON found
   */
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
          // Validate that the extracted text is valid JSON
          JSON.parse(match[0]);
          this.logger.log('Successfully extracted JSON from text response');
          return match[0];
        } catch (err) {
          this.logger.warn('Found JSON-like structure but it is not valid JSON');
        }
      }
      
      // If all else fails, return a fallback valid JSON
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

    Note: Les valeurs acceptées pour la sévérité sont uniquement: "faible", "moyenne", ou "élevée".`;
  }

  async generateProfileSuggestions(profileData: ProfileData): Promise<ProfileSuggestionsResponseDto> {
    try {
      const prompt = this.createProfileSuggestionsPrompt(profileData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      try {
        const parsed = JSON.parse(text);
        if (this.isValidProfileSuggestions(parsed)) {
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
    ${JSON.stringify(profileData, null, 2)}`;
  }

  private isValidProfileSuggestions(response: any): response is ProfileSuggestionsResponseDto {
    return (
      response?.suggestions &&
      Array.isArray(response.suggestions.role) &&
      Array.isArray(response.suggestions.skills) &&
      Array.isArray(response.suggestions.industries) &&
      Array.isArray(response.suggestions.locations) &&
      Array.isArray(response.suggestions.certifications)
    );
  }

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

  /**
   * Analyzes an image file using Gemini 2.0 model with file upload capability
   * @param filePath Path to the image file to analyze
   * @param prompt Optional prompt to guide the image analysis, default asks for general description
   * @returns Analysis response with content and timestamp
   */
  async analyzeImage(filePath: string, prompt: string = "Can you tell me what's in this image?"): Promise<ImageAnalysisResponse> {
    try {
      await this.validateFileAccess(filePath);
      
      // Get the file's MIME type based on extension
      const mimeType = this.getMimeTypeFromPath(filePath);
      
      // Read the file as a buffer
      const fileBuffer = await fs.readFile(filePath);
      const fileName = path.basename(filePath);
      
      // Create a Blob from the buffer
      const blob = new Blob([fileBuffer], { type: mimeType });
      
      // Upload the file to Gemini
      const uploadedFile = await this.genaiClient.files.upload({
        file: blob,
        config: { mimeType }
      });
      
      if (!uploadedFile?.uri) {
        throw new Error('Failed to get URI from uploaded file');
      }
      
      this.logger.log(`File uploaded successfully to Gemini: ${uploadedFile.uri}`);
      
      // Import the necessary functions from @google/genai
      const { createUserContent, createPartFromUri } = await import('@google/genai');
      
      // Generate content with the uploaded file
      const result = await this.genaiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
          createPartFromUri(uploadedFile.uri, mimeType), // URI is now guaranteed to exist
          "\n\n",
          prompt
        ])
      });
      
      return {
        content: result.text || "No analysis was generated",
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
  
  /**
   * Determines MIME type based on file extension
   * @param filePath Path to the file
   * @returns MIME type string
   */
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
  
  /**
   * Analyzes a resume image (like a business card or CV scan)
   * @param filePath Path to the image file
   * @returns Analysis with extracted information in JSON format
   */
  async analyzeResumeImage(filePath: string): Promise<CVAnalysisResponse> {
    try {
      const analysisResult = await this.analyzeImage(filePath, 
        "Analyze this CV/resume image. Extract key information like name, " +
        "contact details, skills, experience, and education. Identify any issues " +
        "like poor readability, missing sections, or formatting problems. " +
        "Return a professional evaluation in French."
      );
      
      // Create a structured response from the free-text analysis
      return {
        signauxAlerte: [
          {
            type: 'Analyse d\'image',
            probleme: 'Cette analyse est basée sur une image et peut ne pas capturer tous les détails',
            severite: 'moyenne'
          }
        ],
        resume: analysisResult.content
      };
    } catch (error) {
      this.logger.error('Error analyzing resume image:', error);
      return {
        signauxAlerte: [{
          type: 'Erreur technique',
          probleme: 'Erreur lors de l\'analyse de l\'image du CV',
          severite: 'élevée'
        }],
        resume: 'Une erreur est survenue lors de l\'analyse de l\'image'
      };
    }
  }
}
