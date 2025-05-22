/**
 * Helper for translating profile data to French
 */

import { Logger } from '@nestjs/common';
import { ExtractedProfile } from './interfaces/extracted-profile.interface';

export class TranslationHelper {
  private static readonly logger = new Logger('TranslationHelper');

  /**
   * Translates profile data to French
   * @param profile The profile data to translate
   * @returns The translated profile data
   */
  static translateProfileToFrench(profile: ExtractedProfile): ExtractedProfile {
    const translatedProfile: ExtractedProfile = {
      education: profile.education ? [...profile.education] : [],
      experience: profile.experience ? [...profile.experience] : [],
      certifications: profile.certifications ? [...profile.certifications] : [],
      skills: profile.skills ? [...profile.skills] : [],
      cvUrl: profile.cvUrl
    };
    
    // Translate skill categories to French
    if (translatedProfile.skills && translatedProfile.skills.length > 0) {
      translatedProfile.skills = translatedProfile.skills.map(skill => {
        const frenchCategory = this.translateSkillCategory(skill.category);
        this.logger.debug(`Mapped skill "${skill.name}" category from "${skill.category}" to "${frenchCategory}"`);
        
        return {
          ...skill,
          category: frenchCategory
        };
      });
    }
    
    // Translate experience positions and descriptions
    if (translatedProfile.experience && translatedProfile.experience.length > 0) {
      translatedProfile.experience = translatedProfile.experience.map(exp => {
        // Convert position titles to French if needed
        const position = this.translateJobTitle(exp.position);
        
        return {
          ...exp,
          position
        };
      });
    }
    
    return translatedProfile;
  }
  
  /**
   * Translates skill categories to French
   */
  private static translateSkillCategory(category: string): string {
    if (!category) return 'Compétences Techniques';
    
    const categoryMap = {
      'technical': 'Compétences Techniques',
      'soft': 'Compétences Interpersonnelles',
      'language': 'Langues',
      'tool': 'Compétences Techniques',
      'framework': 'Compétences Techniques',
      'database': 'Compétences Techniques',
      'other': 'Autres Compétences'
    };
    
    const normalizedCategory = category.toLowerCase();
    return categoryMap[normalizedCategory] || 'Compétences Techniques';
  }
  
  /**
   * Translates job titles to French
   */
  private static translateJobTitle(title: string): string {
    if (!title) return '';
    
    // Check if already in French
    if (this.isFrench(title)) return title;
    
    const titleMap = {
      // Technical positions
      'software engineer': 'Ingénieur Logiciel',
      'software developer': 'Développeur Logiciel',
      'web developer': 'Développeur Web',
      'frontend developer': 'Développeur Frontend',
      'backend developer': 'Développeur Backend',
      'full stack developer': 'Développeur Full Stack',
      'data scientist': 'Scientifique des Données',
      'data analyst': 'Analyste de Données',
      'database administrator': 'Administrateur de Base de Données',
      'devops engineer': 'Ingénieur DevOps',
      'qa engineer': 'Ingénieur QA',
      'quality assurance': 'Assurance Qualité',
      'project manager': 'Chef de Projet',
      'product manager': 'Chef de Produit',
      'scrum master': 'Scrum Master',
      'ux designer': 'Designer UX',
      'ui designer': 'Designer UI',
      'systems administrator': 'Administrateur Systèmes',
      'network engineer': 'Ingénieur Réseau',
      'security engineer': 'Ingénieur Sécurité',
      'mobile developer': 'Développeur Mobile',
      'android developer': 'Développeur Android',
      'ios developer': 'Développeur iOS',
      'game developer': 'Développeur de Jeux',
      'machine learning engineer': 'Ingénieur en Machine Learning',
      'ai engineer': 'Ingénieur IA',
      'technical lead': 'Lead Technique',
      'engineering manager': 'Manager d\'Ingénierie',
      'cto': 'Directeur Technique',
      'intern': 'Stagiaire',
      'software engineering intern': 'Stagiaire en Ingénierie Logicielle',
      'internship': 'Stage',
      
      // Common words that might appear in job titles
      'senior': 'Senior',
      'junior': 'Junior',
      'lead': 'Lead',
      'head of': 'Responsable de',
      'chief': 'Chef',
      'director': 'Directeur',
      'manager': 'Manager',
      'coordinator': 'Coordinateur',
      'specialist': 'Spécialiste',
      'consultant': 'Consultant',
      'architect': 'Architecte',
      'analyst': 'Analyste',
      'engineer': 'Ingénieur',
      'developer': 'Développeur',
      'administrator': 'Administrateur',
      'designer': 'Designer',
      'technician': 'Technicien'
    };
    
    // Try exact match (case insensitive)
    const normalizedTitle = title.toLowerCase();
    if (titleMap[normalizedTitle]) return titleMap[normalizedTitle];
    
    // Try partial match - replace any matching word
    let translatedTitle = title;
    Object.keys(titleMap).forEach(key => {
      // Use word boundary regex to match whole words only
      const regex = new RegExp(`\\b${key}\\b`, 'gi');
      translatedTitle = translatedTitle.replace(regex, titleMap[key.toLowerCase()]);
    });
    
    return translatedTitle;
  }
  
  /**
   * Simple check if text appears to be in French already
   */
  private static isFrench(text: string): boolean {
    const frenchWords = ['de', 'la', 'le', 'du', 'des', 'en', 'au', 'aux', 'chez', 'avec', 'pour',
      'développeur', 'ingénieur', 'analyste', 'chef', 'directeur', 'responsable', 'technicien',
      'stagiaire', 'stage'];
    
    const normalizedText = text.toLowerCase();
    
    // Check if text contains French-specific words
    return frenchWords.some(word => normalizedText.includes(word.toLowerCase()));
  }
}