import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GoogleGenAI } from '@google/genai';

@Injectable()
export class GeminiClientService {
  private readonly logger = new Logger(GeminiClientService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: ReturnType<GoogleGenerativeAI['getGenerativeModel']>;
  private readonly genaiClient: GoogleGenAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-001' });
    this.genaiClient = new GoogleGenAI({ apiKey });
    this.logger.log('GeminiClientService initialized');
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      this.logger.log('Sending prompt to Gemini...');
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text().trim();
      
      if (!text) {
        this.logger.error('Received empty response from Gemini');
        throw new Error('Empty response from Gemini');
      }

      this.logger.log('Received response from Gemini:', { length: text.length });
      return text;
    } catch (error) {
      this.logger.error('Error generating content:', {
        error: error.message,
        stack: error.stack,
        prompt: prompt.substring(0, 100) + '...'
      });
      throw error;
    }
  }

  async uploadFile(fileBuffer: Buffer, mimeType: string): Promise<{ uri: string }> {
    try {
      const blob = new Blob([fileBuffer], { type: mimeType });
      const uploadedFile = await this.genaiClient.files.upload({
        file: blob,
        config: { mimeType }
      });

      const uri = uploadedFile?.uri;
      if (!uri) {
        throw new Error('Failed to get URI from uploaded file');
      }

      return { uri };
    } catch (error) {
      this.logger.error('Error uploading file:', error);
      throw error;
    }
  }

  async generateContentWithFile(fileUri: string, mimeType: string, prompt: string): Promise<string> {
    try {
      const { createUserContent, createPartFromUri } = await import('@google/genai');
      
      const result = await this.genaiClient.models.generateContent({
        model: "gemini-2.0-flash",
        contents: createUserContent([
          createPartFromUri(fileUri, mimeType),
          "\n\n",
          prompt
        ])
      });

      if (!result || !result.text) {
        throw new Error('No response received from Gemini');
      }

      return result.text.trim();
    } catch (error) {
      this.logger.error('Error generating content with file:', error);
      throw error;
    }
  }
}