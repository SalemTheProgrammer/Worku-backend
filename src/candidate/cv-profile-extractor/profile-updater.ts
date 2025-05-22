/**
 * Helper for updating candidate profiles with extracted data
 */
import { Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { ExtractedProfile } from './interfaces/extracted-profile.interface';
import { DateHelper } from './date-helper';
import { EducationValidator } from './education-validator';

export class ProfileUpdater {
  private static readonly logger = new Logger('ProfileUpdater');

  /**
   * Prepares education entries for database update
   * @param education Education entries from extracted profile
   * @returns Properly formatted education entries with IDs and date objects
   */
  static prepareEducationEntries(education: any[]): any[] {
    if (!education || !Array.isArray(education) || education.length === 0) {
      return [];
    }

    // Use the specialized education validator to ensure all required fields are present
    const validatedEducation = EducationValidator.validateEducationArray(education);
    
    // Map each education entry to the format expected by MongoDB
    return validatedEducation.map(edu => {
      // Create a new entry with all the required fields guaranteed to be present
      const processedEntry = {
        _id: new mongoose.Types.ObjectId().toString(),
        institution: edu.institution,
        degree: edu.degree,
        fieldOfStudy: edu.fieldOfStudy,
        startDate: DateHelper.safeParse(edu.startDate),
        description: edu.description || '',
        specialization: edu.specialization || '',
        grade: edu.grade || ''
      };

      // Only add endDate if it exists to avoid date validation errors
      if (edu.endDate) {
        processedEntry['endDate'] = DateHelper.safeParse(edu.endDate);
      }

      return processedEntry;
    });
  }

  /**
   * Prepares experience entries for database update
   * @param experience Experience entries from extracted profile
   * @returns Properly formatted experience entries with IDs and date objects
   */
  static prepareExperienceEntries(experience: any[]): any[] {
    if (!experience || !Array.isArray(experience) || experience.length === 0) {
      return [];
    }

    return experience.map(exp => {
      // Ensure all required fields have values
      const processedEntry = {
        _id: new mongoose.Types.ObjectId().toString(),
        company: exp.company || 'Non spécifié',
        position: exp.position || 'Non spécifié',
        location: exp.location || 'Non spécifié',
        startDate: DateHelper.safeParse(exp.startDate),
        isCurrent: exp.isCurrent || false,
        description: exp.description || '',
        skills: Array.isArray(exp.skills) ? exp.skills : [],
        achievements: Array.isArray(exp.achievements) ? exp.achievements : []
      };

      // Only add endDate if it exists to avoid date validation errors
      if (exp.endDate) {
        processedEntry['endDate'] = DateHelper.safeParse(exp.endDate);
      }

      return processedEntry;
    });
  }

  /**
   * Prepares certification entries for database update
   * @param certifications Certification entries from extracted profile
   * @returns Properly formatted certification entries with IDs and date objects
   */
  static prepareCertificationEntries(certifications: any[]): any[] {
    if (!certifications || !Array.isArray(certifications) || certifications.length === 0) {
      return [];
    }

    return certifications.map(cert => {
      // Ensure all required fields have values
      const processedEntry = {
        _id: new mongoose.Types.ObjectId().toString(),
        name: cert.name || 'Non spécifié',
        issuingOrganization: cert.issuingOrganization || 'Non spécifié',
        issueDate: DateHelper.safeParse(cert.issueDate),
        credentialId: cert.credentialId || '',
        credentialUrl: cert.credentialUrl || '',
        description: cert.description || '',
        skills: Array.isArray(cert.skills) ? cert.skills : []
      };

      // Only add expiryDate if it exists to avoid date validation errors
      if (cert.expiryDate) {
        processedEntry['expiryDate'] = DateHelper.safeParse(cert.expiryDate);
      }

      return processedEntry;
    });
  }

  /**
   * Prepares skill entries for database update
   * @param skills Skill entries from extracted profile
   * @returns Properly formatted skill entries with IDs
   */
  static prepareSkillEntries(skills: any[]): any[] {
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return [];
    }

    return skills
      .filter(skill => skill.name && skill.category)
      .map(skill => ({
        _id: new mongoose.Types.ObjectId().toString(),
        name: skill.name,
        category: skill.category,
        level: typeof skill.level === 'number' ? skill.level : 3,
        yearsOfExperience: skill.yearsOfExperience || 0,
        isLanguage: skill.isLanguage || false,
        proficiencyLevel: skill.proficiencyLevel || ''
      }));
  }

  /**
   * Calculates profile completion percentage
   * @param fieldsCompleted The fields completed object from candidate document
   * @returns Completion percentage (0-100)
   */
  static calculateCompletionScore(fieldsCompleted: any): number {
    if (!fieldsCompleted) return 0;
    
    const completed = Object.values(fieldsCompleted).filter(Boolean).length;
    const total = Object.keys(fieldsCompleted).length || 6; // Default to 6 fields if empty
    
    return Math.round((completed / total) * 100);
  }
}