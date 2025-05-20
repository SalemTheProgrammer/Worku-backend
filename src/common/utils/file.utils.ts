import { ConfigService } from '@nestjs/config';
import { access, constants } from 'fs/promises';
import { Logger } from '@nestjs/common';

export class FileUtils {
  private static readonly logger = new Logger('FileUtils');

  private static configService: ConfigService;

  static init(configService: ConfigService) {
    this.configService = configService;
  }

  /**
   * Generates a complete URL for an uploaded file
   * @param filePath - The relative path of the file in the uploads directory
   * @returns The complete URL to access the file
   */
  static getFileUrl(filePath: string): string {
    const port = this.configService.get('port');
    return `http://localhost:${port}/uploads/${filePath}`;
  }

  /**
   * Generates a complete URL for a user's uploaded file
   * @param userId - The ID of the user who owns the file
   * @param fileName - The name of the file
   * @param type - The type of file (e.g., 'images', 'documents')
   * @returns The complete URL to access the file
   */
  static getUserFileUrl(userId: string, fileName: string, type: string = 'images'): string {
    return this.getFileUrl(`${userId}/${type}/${fileName}`);
  }

  /**
   * Extracts the file path from a complete URL
   * @param url - The complete URL of the file
   * @returns The relative path of the file in the uploads directory
   */
  static getFilePathFromUrl(url: string): string | null {
    try {
      const fileUrl = new URL(url);
      const path = fileUrl.pathname;
      return path.startsWith('/uploads/') ? path.substring(9) : null;
    } catch {
      return null;
    }
  }

  /**
   * Checks if a file exists and is accessible
   * @param filePath - The path of the file to check
   * @returns Promise<boolean> - True if file is accessible, false otherwise
   */
  static async checkFileAccess(filePath: string): Promise<boolean> {
    try {
      await access(filePath, constants.F_OK | constants.R_OK);
      return true;
    } catch (error) {
      this.logger.warn(`File access check failed for ${filePath}: ${error.message}`);
      return false;
    }
  }
}