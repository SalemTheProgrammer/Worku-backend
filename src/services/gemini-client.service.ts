import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

@Injectable()
export class GeminiClientService {
  private readonly logger = new Logger(GeminiClientService.name);
  private readonly genAI: GoogleGenerativeAI;
  private readonly model: GenerativeModel;
  private readonly fileModel: GenerativeModel;
  private readonly requestCache = new Map<string, { response: string; timestamp: number }>();
  private readonly CACHE_TTL = 3600000; // 1 hour
  private readonly MAX_RETRIES = 3;
  private readonly RETRY_DELAY = 1000; // 1 second

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    this.fileModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Cleanup cache periodically
    setInterval(() => this.cleanupCache(), 900000); // 15 minutes
  }

  private cleanupCache(): void {
    const now = Date.now();
    for (const [key, value] of this.requestCache.entries()) {
      if (now - value.timestamp > this.CACHE_TTL) {
        this.requestCache.delete(key);
      }
    }
  }

  private createCacheKey(content: string): string {
    // Create a simple hash of the content for caching
    return Buffer.from(content.substring(0, 100)).toString('base64');
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateContent(prompt: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Check cache first
      const cacheKey = this.createCacheKey(prompt);
      const cached = this.requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.debug('Using cached response');
        return cached.response;
      }

      // Generate content with retry logic
      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          this.logger.debug(`Gemini API attempt ${attempt}/${this.MAX_RETRIES}`);
          
          const result = await this.model.generateContent(prompt);
          const response = result.response;
          const text = response.text();

          if (!text) {
            throw new Error('Empty response from Gemini');
          }

          // Cache the successful response
          this.requestCache.set(cacheKey, {
            response: text,
            timestamp: Date.now()
          });

          const duration = Date.now() - startTime;
          this.logger.debug(`Gemini API success in ${duration}ms (attempt ${attempt})`);
          
          return text;
        } catch (error) {
          lastError = error;
          this.logger.warn(`Gemini API attempt ${attempt} failed:`, error.message);
          
          // Don't retry on the last attempt
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
          }
        }
      }

      // All retries failed
      const duration = Date.now() - startTime;
      this.logger.error(`Gemini API failed after ${this.MAX_RETRIES} attempts in ${duration}ms`);
      
      throw new HttpException(
        `Failed to generate content: ${lastError?.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Unexpected error in generateContent:', error);
      throw new HttpException(
        'Internal error during content generation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async uploadFile(fileBuffer: Buffer, mimeType: string): Promise<{ uri: string }> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Uploading file: ${fileBuffer.length} bytes, type: ${mimeType}`);
      
      // Validate file size (max 20MB for Gemini)
      const maxSize = 20 * 1024 * 1024;
      if (fileBuffer.length > maxSize) {
        throw new HttpException(
          'File too large for upload',
          HttpStatus.BAD_REQUEST
        );
      }

      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          this.logger.debug(`File upload attempt ${attempt}/${this.MAX_RETRIES}`);
          
          // Store file data for later use with inline data
          const fileData = {
            data: fileBuffer.toString('base64'),
            mimeType
          };

          // Return a mock URI that contains the encoded data
          const mockUri = `inline:${Buffer.from(JSON.stringify(fileData)).toString('base64')}`;

          const duration = Date.now() - startTime;
          this.logger.debug(`File prepared successfully in ${duration}ms (attempt ${attempt})`);
          
          return { uri: mockUri };
        } catch (error) {
          lastError = error;
          this.logger.warn(`File upload attempt ${attempt} failed:`, error.message);
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.error(`File upload failed after ${this.MAX_RETRIES} attempts in ${duration}ms`);
      
      throw new HttpException(
        `Failed to upload file: ${lastError?.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Unexpected error in uploadFile:', error);
      throw new HttpException(
        'Internal error during file upload',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async generateContentWithFile(fileUri: string, mimeType: string, prompt: string): Promise<string> {
    const startTime = Date.now();
    
    try {
      // Create cache key that includes file URI
      const cacheKey = this.createCacheKey(`${fileUri}:${prompt}`);
      const cached = this.requestCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
        this.logger.debug('Using cached file analysis response');
        return cached.response;
      }

      let lastError: Error | null = null;
      
      for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
        try {
          this.logger.debug(`File content generation attempt ${attempt}/${this.MAX_RETRIES}`);
          
          // Extract file data from the mock URI
          let fileData: any;
          if (fileUri.startsWith('inline:')) {
            const encodedData = fileUri.substring(7); // Remove 'inline:' prefix
            fileData = JSON.parse(Buffer.from(encodedData, 'base64').toString());
          } else {
            throw new Error('Invalid file URI format');
          }
          
          const result = await this.fileModel.generateContent([
            {
              inlineData: {
                data: fileData.data,
                mimeType: fileData.mimeType
              }
            },
            { text: prompt }
          ]);

          const response = result.response;
          const text = response.text();

          if (!text) {
            throw new Error('Empty response from Gemini');
          }

          // Cache the successful response
          this.requestCache.set(cacheKey, {
            response: text,
            timestamp: Date.now()
          });

          const duration = Date.now() - startTime;
          this.logger.debug(`File content generation success in ${duration}ms (attempt ${attempt})`);
          
          return text;
        } catch (error) {
          lastError = error;
          this.logger.warn(`File content generation attempt ${attempt} failed:`, error.message);
          
          if (attempt < this.MAX_RETRIES) {
            await this.sleep(this.RETRY_DELAY * attempt);
          }
        }
      }

      const duration = Date.now() - startTime;
      this.logger.error(`File content generation failed after ${this.MAX_RETRIES} attempts in ${duration}ms`);
      
      throw new HttpException(
        `Failed to generate content with file: ${lastError?.message}`,
        HttpStatus.SERVICE_UNAVAILABLE
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error('Unexpected error in generateContentWithFile:', error);
      throw new HttpException(
        'Internal error during file content generation',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // Utility method to clear cache manually if needed
  clearCache(): void {
    this.requestCache.clear();
    this.logger.debug('Gemini client cache cleared');
  }

  // Get cache statistics
  getCacheStats(): { size: number; oldestEntry: number | null } {
    const size = this.requestCache.size;
    let oldestEntry: number | null = null;
    
    if (size > 0) {
      const timestamps = Array.from(this.requestCache.values()).map(v => v.timestamp);
      oldestEntry = Math.min(...timestamps);
    }
    
    return { size, oldestEntry };
  }
}