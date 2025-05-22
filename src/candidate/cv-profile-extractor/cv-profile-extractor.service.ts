import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { GeminiClientService } from '../../services/gemini-client.service';
import { SkillCategory } from '../enums/skill-category.enum';
import * as mongoose from 'mongoose';
import * as path from 'path';
import { promises as fs } from 'fs';
import { FileUtils } from '../../common/utils/file.utils';
import { buildImprovedProfileExtractionPrompt } from './improved-prompt';
import { JsonParser } from './json-parser';
import { TranslationHelper } from './translation-helper';
import { DateHelper } from './date-helper';
import { ProfileUpdater } from './profile-updater';
import { ExtractedProfile } from './interfaces/extracted-profile.interface';
const pdfParse = require('pdf-parse');

// Interface moved to interfaces/extracted-profile.interface.ts

@Injectable()
export class CvProfileExtractorService {
  private readonly logger = new Logger(CvProfileExtractorService.name);

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>,
    private readonly geminiClient: GeminiClientService
  ) {}

  async extractAndUpdateProfile(cvPath: string, candidateId: string): Promise<boolean> {
    try {
      this.logger.log(`Starting full profile extraction for candidate ${candidateId}`);

      // Make sure we have the absolute path
      const absolutePath = path.isAbsolute(cvPath) ? cvPath : path.resolve(cvPath);
      this.logger.log(`Using CV path: ${absolutePath}`);

      // Check if file exists and is accessible
      const isAccessible = await FileUtils.checkFileAccess(absolutePath);
      if (!isAccessible) {
        throw new InternalServerErrorException(`CV file is not accessible: ${absolutePath}`);
      }

      // Extract text from PDF using async operations
      let cvText = '';
      try {
        this.logger.log(`Reading PDF file from: ${absolutePath}`);
        const dataBuffer = await fs.readFile(absolutePath);
        this.logger.log('PDF file read successfully, attempting to parse...');
        const data = await pdfParse(dataBuffer);
        this.logger.log(`PDF parsed successfully, extracted ${data.text.length} characters`);
        cvText = data.text;
      } catch (err) {
        this.logger.error('PDF parsing error details:', {
          name: err.name,
          message: err.message,
          stack: err.stack
        });
        this.logger.error(`Failed to extract text from CV PDF for candidate ${candidateId}`, {
          error: err.message,
          path: absolutePath,
          candidateId
        });
        throw new InternalServerErrorException('Failed to extract text from CV file');
      }

      this.logger.log(`Successfully extracted CV text: ${cvText.substring(0, 100)}...`);

      // Extract structured profile data
      const extractedProfile = await this.extractProfileData(cvText);
      
      if (!extractedProfile) {
        this.logger.error(`Failed to extract profile data for candidate ${candidateId}`);
        return false;
      }

      this.logger.log(`Successfully extracted profile data: ${JSON.stringify(extractedProfile, null, 2)}`);

      // Update candidate profile with extracted data and cvUrl
      await this.updateCandidateProfile(candidateId, {
        ...extractedProfile,
        cvUrl: cvPath // Ensure cvUrl is updated with the new path
      });
      
      this.logger.log(`Successfully updated profile for candidate ${candidateId}`);
      return true;
    } catch (error) {
      this.logger.error(`Error extracting profile for candidate ${candidateId}`, {
        error: error.message,
        stack: error.stack,
      });
      return false;
    }
  }

  private async extractProfileData(cvContent: string): Promise<ExtractedProfile | null> {
    try {
      this.logger.log('Extracted CV text before sending to Gemini:');
      this.logger.log(cvContent);
      const prompt = this.buildProfileExtractionPrompt(cvContent);
      this.logger.log('Sending prompt to Gemini for profile extraction');
      
      const response = await this.geminiClient.generateContent(prompt)
        .catch(error => {
          this.logger.error('Failed to generate content from Gemini API', {
            error: error.message,
            Candidate
          });
          throw new InternalServerErrorException('Failed to analyze CV content');
        });
      this.logger.log(`Received response from Gemini: ${response.substring(0, 100)}...`);
      
      try {
        // Use our advanced JSON parser
        this.logger.debug('Using JsonParser to parse Gemini response');
        const extractedData = JsonParser.parseJson(response);
        
        if (!extractedData) {
          this.logger.error('JsonParser failed to parse the response');
          // Return empty structure as fallback
          return {
            education: [],
            experience: [],
            certifications: [],
            skills: []
          };
        }
        
        // Check for fitScore which indicates wrong response type (job analysis instead of profile)
        if (extractedData.fitScore || extractedData.jobFitSummary) {
          this.logger.error('Received job analysis response instead of profile data');
          // Return empty structure as fallback
          return {
            education: [],
            experience: [],
            certifications: [],
            skills: []
          };
        }
        
        this.logger.debug('JsonParser successfully parsed the response');
        return this.validateExtractedProfile(extractedData);
      } catch (error) {
        this.logger.error('Failed to parse Gemini response as JSON', {
          error: error.message,
          response: response.substring(0, 200) + '...',
        });
        return null;
      }
    } catch (error) {
      this.logger.error('Error in profile extraction', error);
      return null;
    }
  }

  private validateExtractedProfile(data: any): ExtractedProfile | null {
    // Basic validation to ensure we have the expected structure
    if (!data || typeof data !== 'object') {
      return null;
    }

    const validatedProfile: ExtractedProfile = {};

    // Validate and normalize education data
    if (Array.isArray(data.education)) {
      validatedProfile.education = data.education.map(edu => ({
        institution: edu.institution || 'Non spécifié',
        degree: edu.degree || 'Non spécifié',
        fieldOfStudy: edu.fieldOfStudy || 'Non spécifié', // Ensure fieldOfStudy is never empty
        startDate: this.formatDate(edu.startDate),
        endDate: edu.endDate ? this.formatDate(edu.endDate) : undefined,
        description: edu.description || '',
        specialization: edu.specialization || '',
        grade: edu.grade || ''
      })).filter(edu => edu.institution && edu.degree && edu.fieldOfStudy); // Ensure all required fields are present
    }

    // Validate and normalize experience data
    if (Array.isArray(data.experience)) {
      validatedProfile.experience = data.experience.map(exp => ({
        company: exp.company || 'Non spécifié',
        position: exp.position || 'Non spécifié',
        location: exp.location || 'Non spécifié',
        startDate: this.formatDate(exp.startDate),
        endDate: exp.endDate ? this.formatDate(exp.endDate) : undefined,
        isCurrent: exp.isCurrent || false,
        description: exp.description || '',
        skills: Array.isArray(exp.skills) ? exp.skills : [],
        achievements: Array.isArray(exp.achievements) ? exp.achievements : []
      })).filter(exp => exp.company && exp.position);
    }

    // Validate and normalize certification data
    if (Array.isArray(data.certifications)) {
      validatedProfile.certifications = data.certifications.map(cert => ({
        name: cert.name || 'Non spécifié',
        issuingOrganization: cert.issuingOrganization || 'Non spécifié',
        issueDate: this.formatDate(cert.issueDate),
        expiryDate: cert.expiryDate ? this.formatDate(cert.expiryDate) : undefined,
        credentialId: cert.credentialId || '',
        credentialUrl: cert.credentialUrl || '',
        description: cert.description || '',
        skills: Array.isArray(cert.skills) ? cert.skills : []
      })).filter(cert => cert.name && cert.issuingOrganization);
    }

    // Validate and normalize skills data
    if (Array.isArray(data.skills)) {
      this.logger.log(`Processing ${data.skills.length} skills from extracted data`);
      
      validatedProfile.skills = data.skills.map(skill => {
        // Log the original skill data for debugging
        if (!skill.category) {
          this.logger.warn(`Skill "${skill.name}" has no category, defaulting to TECHNICAL`);
        }
        
        // Ensure category is always set to a valid value
        const category = this.mapSkillCategory(skill.category);
        
        // Log the mapped category
        this.logger.debug(`Mapped skill "${skill.name}" category from "${skill.category}" to "${category}"`);
        
        return {
          name: skill.name || '',
          category: category, // This will always be a valid SkillCategory enum value
          level: this.normalizeSkillLevel(skill.level),
          yearsOfExperience: skill.yearsOfExperience,
          isLanguage: skill.isLanguage || false,
          proficiencyLevel: this.mapProficiencyLevel(skill.proficiencyLevel)
        };
      }).filter(skill => skill.name); // Only keep skills with a name
      
      this.logger.log(`Validated ${validatedProfile.skills?.length || 0} skills after filtering`);
    }

    return validatedProfile;
  }
  
  // Removed parseLenientJson method - functionality moved to JsonParser class

  private formatDate(dateString: string): string {
    // Use the DateHelper to parse and format the date
    return DateHelper.formatDateToString(DateHelper.safeParse(dateString));
  }

  private mapSkillCategory(category: string): SkillCategory {
    // If category is undefined, null, or empty, return TECHNICAL as default
    if (!category) {
      return SkillCategory.TECHNICAL;
    }

    const categoryMap = {
      'technical': SkillCategory.TECHNICAL,
      'soft': SkillCategory.INTERPERSONAL,
      'language': SkillCategory.LANGUAGE,
      'tool': SkillCategory.TECHNICAL,
      'framework': SkillCategory.TECHNICAL,
      'database': SkillCategory.TECHNICAL,
      'other': SkillCategory.TECHNICAL
    };

    const normalizedCategory = category.toLowerCase();
    return categoryMap[normalizedCategory] || SkillCategory.TECHNICAL;
  }

  private normalizeSkillLevel(level: any): number {
    if (typeof level === 'number' && level >= 1 && level <= 5) {
      return level;
    }
    
    if (typeof level === 'string') {
      const value = level.toLowerCase();
      if (value.includes('expert') || value.includes('advanced')) return 5;
      if (value.includes('intermediate')) return 3;
      if (value.includes('beginner') || value.includes('basic')) return 1;
    }
    
    return 3; // default fallback
  }

  private mapProficiencyLevel(level: string): string {
    if (!level) return ''; // Return empty string instead of null or undefined
    
    const levelMap = {
      'native': 'Natif',
      'advanced': 'Professionnel',
      'intermediate': 'Intermédiaire',
      'beginner': 'Débutant',
      // Add mappings for capitalized versions too
      'Native': 'Natif',
      'Advanced': 'Professionnel',
      'Intermediate': 'Intermédiaire',
      'Beginner': 'Débutant'
    };
    
    // Try direct mapping first
    if (levelMap[level]) {
      return levelMap[level];
    }
    
    // Try lowercase mapping
    const normalizedLevel = level.toLowerCase();
    return levelMap[normalizedLevel] || 'Intermédiaire'; // Default to Intermédiaire if no match
  }

  private buildProfileExtractionPrompt(cvContent: string): string {
    return buildImprovedProfileExtractionPrompt(cvContent);
  }

  private async updateCandidateProfile(candidateId: string, extractedProfile: ExtractedProfile): Promise<void> {
    try {
      this.logger.log(`Starting profile update for candidate: ${candidateId}`);
      const updateOperations = {};
      const objectId = new mongoose.Types.ObjectId(candidateId);

      // Translate profile data to French
      const translatedProfile = TranslationHelper.translateProfileToFrench(extractedProfile);
      this.logger.debug('Profile data translated to French');

      // Process education entries
      if (translatedProfile.education && translatedProfile.education.length > 0) {
        try {
          const educationEntries = ProfileUpdater.prepareEducationEntries(translatedProfile.education);
          this.logger.log(`Processed ${educationEntries.length} education entries`);
          
          if (educationEntries.length > 0) {
            updateOperations['education'] = educationEntries;
            updateOperations['fieldsCompleted.education'] = true;
          }
        } catch (error) {
          this.logger.error(`Error processing education entries: ${error.message}`, error.stack);
        }
      }

      // Process experience entries
      if (translatedProfile.experience && translatedProfile.experience.length > 0) {
        try {
          const experienceEntries = ProfileUpdater.prepareExperienceEntries(translatedProfile.experience);
          this.logger.log(`Processed ${experienceEntries.length} experience entries`);
          
          if (experienceEntries.length > 0) {
            updateOperations['experience'] = experienceEntries;
            updateOperations['fieldsCompleted.experience'] = true;
          }
        } catch (error) {
          this.logger.error(`Error processing experience entries: ${error.message}`, error.stack);
        }
      }

      // Process certification entries
      if (translatedProfile.certifications && translatedProfile.certifications.length > 0) {
        try {
          const certificationEntries = ProfileUpdater.prepareCertificationEntries(translatedProfile.certifications);
          this.logger.log(`Processed ${certificationEntries.length} certification entries`);
          
          if (certificationEntries.length > 0) {
            updateOperations['certifications'] = certificationEntries;
            updateOperations['fieldsCompleted.certifications'] = true;
          }
        } catch (error) {
          this.logger.error(`Error processing certification entries: ${error.message}`, error.stack);
        }
      }

      // Process skill entries
      if (translatedProfile.skills && translatedProfile.skills.length > 0) {
        try {
          const skillEntries = ProfileUpdater.prepareSkillEntries(translatedProfile.skills);
          this.logger.log(`Processed ${skillEntries.length} skill entries`);
          
          if (skillEntries.length > 0) {
            updateOperations['skills'] = skillEntries;
            updateOperations['fieldsCompleted.skills'] = true;
          }
        } catch (error) {
          this.logger.error(`Error processing skill entries: ${error.message}`, error.stack);
        }
      }

      // Calculate profile completion score
      try {
        const fieldsCompleted = await this.candidateModel.findById(candidateId).select('fieldsCompleted');
        const completionScore = ProfileUpdater.calculateCompletionScore(
          fieldsCompleted && fieldsCompleted.fieldsCompleted ? fieldsCompleted.fieldsCompleted : {}
        );
        
        updateOperations['profileCompletionScore'] = completionScore;
      } catch (error) {
        this.logger.error(`Error calculating completion score: ${error.message}`, error.stack);
        updateOperations['profileCompletionScore'] = 50; // Default value if calculation fails
      }
      
      updateOperations['updatedAt'] = new Date();

      // Check if we have any fields to update
      if (Object.keys(updateOperations).length === 0) {
        this.logger.warn(`No valid profile data extracted for candidate ${candidateId}`);
        return;
      }

      // Log update summary (not full object to avoid large logs)
      this.logger.log(`Updating candidate ${candidateId} with ${Object.keys(updateOperations).length} fields`);

      // Update the candidate profile
      const updatedCandidate = await this.candidateModel.findByIdAndUpdate(
        objectId,
        { $set: updateOperations },
        { new: true }
      );
      
      if (!updatedCandidate) {
        this.logger.error(`Failed to update candidate ${candidateId} - candidate not found`);
        throw new Error('Candidate not found');
      }
      
      this.logger.log(`Successfully updated candidate ${candidateId} profile`);
    } catch (error) {
      this.logger.error(`Failed to update candidate profile: ${error.message}`, error.stack);
      throw error;
    }
  }
}