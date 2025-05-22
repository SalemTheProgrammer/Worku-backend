/**
 * Utility for advanced JSON parsing with multiple fallback strategies
 */
import { Logger } from '@nestjs/common';

export class JsonParser {
  private static readonly logger = new Logger('JsonParser');

  /**
   * Parses a JSON string with multiple fallback strategies for handling malformed JSON
   * @param jsonText The text that should contain JSON
   * @returns Parsed object or null if all parsing attempts fail
   */
  static parseJson(jsonText: string): any | null {
    // First clean up the text
    const cleanedText = this.cleanJsonText(jsonText);
    
    // Try regular JSON.parse first
    try {
      return JSON.parse(cleanedText);
    } catch (error) {
      this.logger.warn(`Standard JSON parsing failed: ${error.message}`);
      
      // Try with more aggressive cleaning
      try {
        const aggressivelyCleaned = this.aggressiveClean(cleanedText);
        this.logger.debug(`Attempting with aggressively cleaned JSON: ${aggressivelyCleaned.substring(0, 100)}...`);
        return JSON.parse(aggressivelyCleaned);
      } catch (error2) {
        this.logger.warn(`Aggressive JSON parsing failed: ${error2.message}`);
        
        // Try section-by-section parsing
        return this.parseJsonSections(cleanedText);
      }
    }
  }

  /**
   * Cleans JSON text by removing common issues
   */
  private static cleanJsonText(text: string): string {
    let cleaned = text.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n|\n```|```/g, '').trim();
    
    // Look for the actual JSON object
    const jsonMatch = cleaned.match(/(\{[\s\S]*\})/);
    if (jsonMatch && jsonMatch[1]) {
      cleaned = jsonMatch[1];
    }
    
    // Remove control characters
    cleaned = cleaned.replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
    
    // Replace newlines with spaces
    cleaned = cleaned.replace(/\n/g, ' ');
    
    return cleaned;
  }

  /**
   * Performs aggressive cleaning for severely malformed JSON
   */
  private static aggressiveClean(text: string): string {
    let cleaned = text;
    
    // Ensure proper property quoting
    cleaned = cleaned.replace(/([{,])\s*([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
    
    // Convert single quotes to double quotes
    cleaned = cleaned.replace(/'/g, '"');
    
    // Remove trailing commas
    cleaned = cleaned.replace(/,\s*}/g, '}');
    cleaned = cleaned.replace(/,\s*]/g, ']');
    
    // Remove backslash escapes before non-special characters
    cleaned = cleaned.replace(/\\([^"\\/bfnrtu])/g, '$1');
    
    // Replace invalid escape sequences
    cleaned = cleaned.replace(/\\x([0-9a-fA-F]{2})/g, '');
    
    return cleaned;
  }

  /**
   * Attempts to parse JSON by extracting individual sections
   */
  private static parseJsonSections(text: string): any {
    this.logger.debug('Attempting section-by-section JSON parsing');
    const result: any = {};
    
    // Try to extract education array
    this.extractSection(text, 'education', result);
    
    // Try to extract experience array
    this.extractSection(text, 'experience', result);
    
    // Try to extract certifications array
    this.extractSection(text, 'certifications', result);
    
    // Try to extract skills array
    this.extractSection(text, 'skills', result);
    
    // Only return result if we parsed at least one section
    if (Object.keys(result).length > 0) {
      this.logger.log(`Successfully parsed ${Object.keys(result).length} sections`);
      return result;
    }
    
    // Create a default empty structure if nothing could be parsed
    if (Object.keys(result).length === 0) {
      this.logger.warn('Could not parse any sections, returning empty structure');
      return {
        education: [],
        experience: [],
        certifications: [],
        skills: []
      };
    }
    
    return null;
  }

  /**
   * Extracts a section from malformed JSON text
   */
  private static extractSection(text: string, sectionName: string, result: any): void {
    try {
      // Extract the section using regex
      const sectionRegex = new RegExp(`["']${sectionName}["']\\s*:\\s*(\\[\\s*\\{[\\s\\S]*?\\}\\s*\\])`, 'i');
      const match = text.match(sectionRegex);
      
      if (match && match[1]) {
        let sectionText = match[1];
        
        // Clean up the section text
        sectionText = this.aggressiveClean(sectionText);
        
        // Parse the section
        try {
          result[sectionName] = JSON.parse(sectionText);
          this.logger.debug(`Successfully parsed ${sectionName} section`);
        } catch (e) {
          this.logger.warn(`Failed to parse ${sectionName} section: ${e.message}`);
          result[sectionName] = [];
        }
      } else {
        // If section not found, initialize with empty array
        result[sectionName] = [];
      }
    } catch (e) {
      this.logger.warn(`Error extracting ${sectionName} section: ${e.message}`);
      result[sectionName] = [];
    }
  }
}