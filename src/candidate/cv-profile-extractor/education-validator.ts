/**
 * Special validator for education entries to ensure required fields
 */
import { Logger } from '@nestjs/common';

export class EducationValidator {
  private static readonly logger = new Logger('EducationValidator');

  /**
   * Validates and corrects an education entry, ensuring all required fields are present
   * @param education The education entry to validate
   * @returns Validated and corrected education entry or null if invalid
   */
  static validateEducationEntry(education: any): any {
    if (!education || typeof education !== 'object') {
      this.logger.warn('Invalid education entry: not an object');
      return null;
    }

    // Clone the object to avoid modifying the original
    const validatedEntry = { ...education };

    // CRITICAL: Enforce fieldOfStudy (required by MongoDB schema)
    if (!validatedEntry.fieldOfStudy || typeof validatedEntry.fieldOfStudy !== 'string' || !validatedEntry.fieldOfStudy.trim()) {
      this.logger.warn('Education entry missing fieldOfStudy - applying default value');
      validatedEntry.fieldOfStudy = 'Non spécifié';
    }

    // Check and fix other required fields
    if (!validatedEntry.institution || typeof validatedEntry.institution !== 'string' || !validatedEntry.institution.trim()) {
      this.logger.warn('Education entry missing institution - applying default value');
      validatedEntry.institution = 'Non spécifié';
    }

    if (!validatedEntry.degree || typeof validatedEntry.degree !== 'string' || !validatedEntry.degree.trim()) {
      this.logger.warn('Education entry missing degree - applying default value');
      validatedEntry.degree = 'Non spécifié';
    }

    // Make sure there are no undefined or null values for required fields
    Object.keys(validatedEntry).forEach(key => {
      if (validatedEntry[key] === undefined || validatedEntry[key] === null) {
        if (['fieldOfStudy', 'institution', 'degree'].includes(key)) {
          this.logger.warn(`Education entry has null/undefined ${key} - applying default value`);
          validatedEntry[key] = 'Non spécifié';
        }
      }
    });

    return validatedEntry;
  }

  /**
   * Validates an array of education entries
   * @param educationArray Array of education entries to validate
   * @returns Array of validated education entries
   */
  static validateEducationArray(educationArray: any[]): any[] {
    if (!educationArray || !Array.isArray(educationArray)) {
      this.logger.warn('Invalid education array - not an array');
      return [];
    }

    // Validate each entry
    const validEntries = educationArray
      .map(entry => this.validateEducationEntry(entry))
      .filter(entry => entry !== null);

    this.logger.log(`Validated ${validEntries.length} of ${educationArray.length} education entries`);
    
    // If we have no valid entries, return a default entry
    if (validEntries.length === 0 && educationArray.length > 0) {
      this.logger.warn('No valid education entries - creating default entry');
      return [{
        institution: 'Non spécifié',
        degree: 'Non spécifié',
        fieldOfStudy: 'Non spécifié',
        startDate: new Date()
      }];
    }

    return validEntries;
  }
}