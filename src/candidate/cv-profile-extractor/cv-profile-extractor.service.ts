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
import pdfParse from 'pdf-parse';

interface ExtractedProfile {
  education?: Array<{
    institution: string;
    degree: string;
    fieldOfStudy: string;
    startDate: string;
    endDate?: string;
    description?: string;
    specialization?: string;
    grade?: string;
  }>;
  experience?: Array<{
    company: string;
    position: string;
    location?: string;
    startDate: string;
    endDate?: string;
    isCurrent?: boolean;
    description?: string;
    skills?: string[];
    achievements?: string[];
  }>;
  certifications?: Array<{
    name: string;
    issuingOrganization: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
    description?: string;
    skills?: string[];
  }>;
  skills?: Array<{
    name: string;
    category: string;
    level: number;
    yearsOfExperience?: number;
    isLanguage?: boolean;
    proficiencyLevel?: string;
  }>;
  cvUrl?: string;
}

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
        const dataBuffer = await fs.readFile(absolutePath);
        const data = await pdfParse(dataBuffer);
        cvText = data.text;
      } catch (err) {
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
      this.logger.log(`Received full response from Gemini: ${response}`);
      this.logger.log(`Received response from Gemini: ${response.substring(0, 100)}...`);
      
      // Clean up the response by removing markdown code blocks
      const cleanedResponse = response.replace(/```json\n|\n```|```/g, '').trim();
      
      try {
        // Try to find JSON in the response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : cleanedResponse;
        
        this.logger.log(`Attempting to parse JSON: ${jsonString.substring(0, 100)}...`);
        const extractedData = JSON.parse(jsonString);
        return this.validateExtractedProfile(extractedData);
      } catch (error) {
        this.logger.error('Failed to parse Gemini response as JSON', {
          error: error.message,
          response: cleanedResponse.substring(0, 200) + '...',
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
        institution: edu.institution || '',
        degree: edu.degree || '',
        fieldOfStudy: edu.fieldOfStudy || '',
        startDate: this.formatDate(edu.startDate),
        endDate: edu.endDate ? this.formatDate(edu.endDate) : undefined,
        description: edu.description,
        specialization: edu.specialization,
        grade: edu.grade
      })).filter(edu => edu.institution && edu.degree);
    }

    // Validate and normalize experience data
    if (Array.isArray(data.experience)) {
      validatedProfile.experience = data.experience.map(exp => ({
        company: exp.company || '',
        position: exp.position || '',
        location: exp.location,
        startDate: this.formatDate(exp.startDate),
        endDate: exp.endDate ? this.formatDate(exp.endDate) : undefined,
        isCurrent: exp.isCurrent || false,
        description: exp.description,
        skills: Array.isArray(exp.skills) ? exp.skills : [],
        achievements: Array.isArray(exp.achievements) ? exp.achievements : []
      })).filter(exp => exp.company && exp.position);
    }

    // Validate and normalize certification data
    if (Array.isArray(data.certifications)) {
      validatedProfile.certifications = data.certifications.map(cert => ({
        name: cert.name || '',
        issuingOrganization: cert.issuingOrganization || '',
        issueDate: this.formatDate(cert.issueDate),
        expiryDate: cert.expiryDate ? this.formatDate(cert.expiryDate) : undefined,
        credentialId: cert.credentialId,
        credentialUrl: cert.credentialUrl,
        description: cert.description,
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

  private formatDate(dateString: string): string {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return new Date().toISOString().split('T')[0];
      }
      return date.toISOString().split('T')[0];
    } catch (e) {
      return new Date().toISOString().split('T')[0];
    }
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
    return `
Extract structured profile data from this CV content. Focus on education, experience, certifications, and skills.

IMPORTANT: Return ONLY raw JSON without any markdown formatting or code blocks. The response must start with { and end with }.

Use this exact format:
{
  "education": [
    {
      "institution": "University name",
      "degree": "Degree name",
      "fieldOfStudy": "Field of study",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "Optional description",
      "specialization": "Optional specialization",
      "grade": "Optional grade"
    }
  ],
  "experience": [
    {
      "company": "Company name",
      "position": "Job title",
      "location": "Location",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "isCurrent": false,
      "description": "Job description",
      "skills": ["Skill 1", "Skill 2"],
      "achievements": ["Achievement 1", "Achievement 2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification name",
      "issuingOrganization": "Issuing organization",
      "issueDate": "YYYY-MM-DD",
      "expiryDate": "YYYY-MM-DD",
      "credentialId": "Optional credential ID",
      "credentialUrl": "Optional credential URL",
      "description": "Optional description",
      "skills": ["Skill 1", "Skill 2"]
    }
  ],
  "skills": [
    {
      "name": "Skill name",
      "category": "technical" | "soft" | "language" | "tool" | "framework" | "database" | "other", // REQUIRED - must be one of these values
      "level": 1-5 (1=beginner, 5=expert),
      "yearsOfExperience": Optional years of experience,
      "isLanguage": false,
      "proficiencyLevel": For language skills only, use one of: "Natif", "Professionnel", "Intermédiaire", "Débutant"
    }
  ]
}

CV Content:
${cvContent}
`;
  }

  private async updateCandidateProfile(candidateId: string, extractedProfile: ExtractedProfile): Promise<void> {
    const updateOperations = {};
    const objectId = new mongoose.Types.ObjectId(candidateId);

    // Update education if available
    if (extractedProfile.education && extractedProfile.education.length > 0) {
      // Generate unique IDs for each education entry
      const educationWithIds = extractedProfile.education.map(edu => ({
        ...edu,
        _id: new mongoose.Types.ObjectId().toString()
      }));
      updateOperations['education'] = educationWithIds;
      updateOperations['fieldsCompleted.education'] = true;
    }

    // Update experience if available
    if (extractedProfile.experience && extractedProfile.experience.length > 0) {
      // Generate unique IDs for each experience entry
      const experienceWithIds = extractedProfile.experience.map(exp => ({
        ...exp,
        _id: new mongoose.Types.ObjectId().toString()
      }));
      updateOperations['experience'] = experienceWithIds;
      updateOperations['fieldsCompleted.experience'] = true;
    }

    // Update certifications if available
    if (extractedProfile.certifications && extractedProfile.certifications.length > 0) {
      // Generate unique IDs for each certification entry
      const certificationsWithIds = extractedProfile.certifications.map(cert => ({
        ...cert,
        _id: new mongoose.Types.ObjectId().toString()
      }));
      updateOperations['certifications'] = certificationsWithIds;
      updateOperations['fieldsCompleted.certifications'] = true;
    }

    // Update skills if available
    if (extractedProfile.skills && extractedProfile.skills.length > 0) {
      // Final validation to ensure all skills have a valid category
      const validSkills = extractedProfile.skills.filter(skill => {
        if (!skill.category) {
          this.logger.warn(`Skipping skill "${skill.name}" due to missing category`);
          return false;
        }
        return true;
      });
      
      if (validSkills.length === 0) {
        this.logger.warn('No valid skills found after filtering, skills will not be updated');
      } else {
        // Generate unique IDs for each skill entry
        const skillsWithIds = validSkills.map(skill => ({
          ...skill,
          _id: new mongoose.Types.ObjectId().toString()
        }));
        
        this.logger.log(`Adding ${skillsWithIds.length} validated skills to candidate profile`);
        updateOperations['skills'] = skillsWithIds;
      }
    }

    // Calculate profile completion score
    const fieldsCompleted = await this.candidateModel.findById(candidateId).select('fieldsCompleted');
    const completedFields = fieldsCompleted && fieldsCompleted.fieldsCompleted ?
      Object.values(fieldsCompleted.fieldsCompleted).filter(Boolean).length : 0;
    const totalFields = fieldsCompleted && fieldsCompleted.fieldsCompleted ?
      Object.keys(fieldsCompleted.fieldsCompleted).length : 6; // Default to 6 fields
    const completionScore = Math.round((completedFields / totalFields) * 100);
    
    updateOperations['profileCompletionScore'] = completionScore;
    updateOperations['updatedAt'] = new Date();

    // Log the update operations
    this.logger.log(`Updating candidate profile with: ${JSON.stringify(updateOperations, null, 2).substring(0, 200)}...`);

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
  }
}