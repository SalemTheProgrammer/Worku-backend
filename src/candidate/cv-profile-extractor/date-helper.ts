/**
 * Helper for handling date conversions in the CV profile extractor
 */
import { Logger } from '@nestjs/common';

export class DateHelper {
  private static readonly logger = new Logger('DateHelper');

  /**
   * Safely converts a string date to a JavaScript Date object
   * with extensive error handling
   * 
   * @param dateString The date string to convert
   * @param defaultValue Optional default value to use if conversion fails
   * @returns A valid Date object
   */
  static parseDate(dateString: string, defaultValue: Date = new Date()): Date {
    if (!dateString || typeof dateString !== 'string') {
      this.logger.warn(`Invalid date provided: ${dateString}, using default date`);
      return defaultValue;
    }

    try {
      // Try to parse the date directly
      const parsedDate = new Date(dateString);
      
      // Check if the result is a valid date
      if (isNaN(parsedDate.getTime())) {
        this.logger.warn(`Invalid date format: "${dateString}", using default date`);
        return defaultValue;
      }
      
      return parsedDate;
    } catch (error) {
      this.logger.warn(`Error parsing date "${dateString}": ${error.message}`);
      return defaultValue;
    }
  }

  /**
   * Format a date as YYYY-MM-DD string
   */
  static formatDateToString(date: Date): string {
    if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
      return new Date().toISOString().split('T')[0];
    }
    return date.toISOString().split('T')[0];
  }

  /**
   * Attempts to parse a date string, with fallback for common formats
   */
  static safeParse(dateString: string): Date {
    if (!dateString) return new Date();
    
    // First try standard parsing
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) return date;
    
    // Try various date formats
    const formats = [
      // Try to extract YYYY-MM-DD or YYYY/MM/DD
      /(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/,
      // Try to extract DD-MM-YYYY or DD/MM/YYYY
      /(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/,
      // Try to extract YYYY only
      /(\d{4})/
    ];
    
    for (const format of formats) {
      const match = dateString.match(format);
      if (match) {
        if (match.length >= 4) {
          // If we have YYYY, MM, DD
          const year = parseInt(match[1]);
          const month = parseInt(match[2]) - 1; // JS months are 0-based
          const day = parseInt(match[3]);
          const candidate = new Date(year, month, day);
          if (!isNaN(candidate.getTime())) return candidate;
        } else if (match.length >= 2) {
          // If we have just a year
          const year = parseInt(match[1]);
          if (year >= 1900 && year <= 2100) {
            return new Date(year, 0, 1); // January 1st of the year
          }
        }
      }
    }
    
    // If all else fails, return current date
    return new Date();
  }
}