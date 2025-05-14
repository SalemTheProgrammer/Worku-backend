import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Skill } from '../../schemas/skill.schema';
import { CVAnalysisService } from '../../services/cv-analysis.service';
import { GeminiClientService } from '../../services/gemini-client.service';
import { SkillCategory } from '../enums/skill-category.enum';

interface SkillExtraction {
  skills: Array<{
    name: string;
    level?: string; // Make level optional
    category?: string; // Make category optional in the extraction
  }>;
}

@Injectable()
export class CvSkillsService {
  private readonly logger = new Logger(CvSkillsService.name);

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>,
    @InjectModel(Skill.name) private skillModel: Model<Skill>,
    private readonly cvAnalysisService: CVAnalysisService,
    private readonly geminiClient: GeminiClientService
  ) {}

  async extractSkillsFromCV(cvPath: string, candidateId: string): Promise<void> {
    try {
      this.logger.log(`🔍 Starting skill extraction for candidate ${candidateId}`);

      const cvAnalysis = await this.cvAnalysisService.analyzeCV(cvPath);
      this.logger.debug('✅ CV Analysis completed');

      // Include both synthesis and strong points for better context
      // Format the analysis data for skill extraction
      const analysisContext = `
Analyse du profil:
${cvAnalysis.jobFitSummary.reason}

Évaluation des compétences:
${cvAnalysis.jobFitSummary.fitBreakdown.skillsFit.details.join('\n')}

Expérience:
${cvAnalysis.jobFitSummary.fitBreakdown.experienceFit.details.join('\n')}

Formation:
${cvAnalysis.jobFitSummary.fitBreakdown.educationFit.details.join('\n')}
`;
      const prompt = this.buildSkillExtractionPrompt(analysisContext);

      const response = await this.geminiClient.generateContent(prompt);
      this.logger.debug('🧠 Received skill extraction response');

      const skillsData = this.parseSkillsJson(response);

      if (!skillsData) {
        this.logger.warn(`⚠️ Failed to parse skills JSON for candidate ${candidateId}`);
        return;
      }

      // Filter out skills without a name first
      const validSkillsData = skillsData.skills.filter(skill => {
        if (!skill.name) {
          this.logger.warn('Skipping skill with missing name from AI extraction');
          return false;
        }
        return true;
      });
      
      this.logger.log(`Found ${validSkillsData.length} skills with valid names`);
      
      const newSkills = validSkillsData.map(skill => {
        // Ensure we have a valid category
        const category = this.mapSkillCategory(skill.category);
        
        // Check if this is a language skill
        const isLanguage = category === SkillCategory.LANGUAGE;
        
        // Map proficiency level directly for language skills
        let proficiencyLevel;
        if (isLanguage && skill.level) {
          const level = skill.level.toLowerCase();
          // Ensure we only use schema-approved French terms
          const cleanLevel = level.toLowerCase()
            .replace('native', 'natif')
            .replace('advanced', 'professionnel')
            .replace('expert', 'professionnel')
            .replace('intermediate', 'intermédiaire')
            .replace('beginner', 'débutant');

          if (cleanLevel.includes('natif')) {
            proficiencyLevel = 'Natif';
          } else if (cleanLevel.includes('professionnel')) {
            proficiencyLevel = 'Professionnel';
          } else if (cleanLevel.includes('intermédiaire')) {
            proficiencyLevel = 'Intermédiaire';
          } else if (cleanLevel.includes('débutant')) {
            proficiencyLevel = 'Débutant';
          } else {
            // Final fallback to schema default
            proficiencyLevel = 'Intermédiaire';
          }
        }
        // Assign a default proficiencyLevel for non-language skills
        if (!isLanguage) {
          proficiencyLevel = 'Intermédiaire';
        }
        return {
          name: skill.name,
          category: category,
          level: this.normalizeSkillLevel(skill.level),
          yearsOfExperience: null, // Optional future improvement
          isLanguage: isLanguage,
          proficiencyLevel: proficiencyLevel,
        };
      });

      this.logger.log(`Extracted ${newSkills.length} skills with categories`);
      await this.updateCandidateSkills(candidateId, newSkills);
    } catch (error) {
      this.logger.error(`❌ Error extracting skills for candidate ${candidateId}`, {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  private buildSkillExtractionPrompt(cvSummary: string): string {
    return `
Based on this CV summary, extract technical skills, language skills, and their estimated levels.
If the level is not explicitly mentioned, INFER it based on experience described in the CV (e.g. years of use, job role, responsibilities).

IMPORTANT: Return ONLY raw JSON without any markdown formatting or code blocks. The response must start with { and end with }.

Use this exact format:
{
  "skills": [
    {
      "name": "skill name",
      "level": "expert" | "intermediate" | "beginner",
      "category": "technical" | "soft" | "language" | "tool" | "framework" | "database" | "other" // REQUIRED - must be one of these values
    }
  ]
}

For technical skills, use "technical" for programming languages, "framework" for frameworks, "database" for database technologies, "tool" for development tools, and "other" for any other technical skills.

For language skills, set category to "language" and use one of these specific proficiency levels:
- For native/fluent language skills: "Natif"
- For advanced/professional language skills: "Professionnel"
- For intermediate language skills: "Intermédiaire"
- For beginner language skills: "Débutant"

CV Summary:
${cvSummary}
`;
  }

  private parseSkillsJson(response: string): SkillExtraction | null {
    try {
      // Clean up the response by removing markdown code blocks
      const cleanedResponse = response.replace(/```json\n|\n```|```/g, '').trim();
      const data = JSON.parse(cleanedResponse);
      if (Array.isArray(data.skills)) {
        return data;
      }
    } catch (error) {
      this.logger.error('🛑 Failed to parse Gemini response as JSON', {
        error: error.message,
        response,
      });
    }
    return null;
  }

  private async updateCandidateSkills(candidateId: string, skills: any[]): Promise<void> {
    // Final validation to ensure all skills have a valid category
    const validSkills = skills.filter(skill => {
      if (!skill.name) {
        this.logger.warn('Skipping skill with missing name');
        return false;
      }
      
      if (!skill.category) {
        this.logger.warn(`Skipping skill "${skill.name}" due to missing category`);
        return false;
      }
      
      return true;
    });
    
    if (validSkills.length === 0) {
      this.logger.warn('No valid skills found after filtering, skills will not be updated');
      return;
    }
    
    // Add unique IDs to each skill
    const skillsWithIds = validSkills.map(skill => ({
      ...skill,
      _id: new mongoose.Types.ObjectId().toString()
    }));
    
    this.logger.log(`Adding ${skillsWithIds.length} validated skills to candidate profile`);
    
    await this.candidateModel.findByIdAndUpdate(
      candidateId,
      { $set: { skills: skillsWithIds } },
      { new: true }
    );
    
    this.logger.log(`✅ Successfully updated ${skillsWithIds.length} skills for candidate ${candidateId}`);
  }

  private normalizeSkillLevel(level?: string): number {
    if (!level) {
      return 3; // Default to intermediate if no level provided
    }
    
    const value = level.toLowerCase();
    if (value.includes('expert') || value.includes('advanced')) return 5;
    if (value.includes('intermediate')) return 3;
    if (value.includes('beginner') || value.includes('basic')) return 1;
    return 3; // default fallback
  }

  private mapSkillCategory(category?: string): SkillCategory {
    // If category is undefined, null, or empty, return TECHNICAL as default
    if (!category) {
      this.logger.warn('Skill missing category, defaulting to TECHNICAL');
      return SkillCategory.TECHNICAL;
    }

    // Try to find a matching enum display value
    const entry = Object.entries(SkillCategory).find(([_, value]) => {
      // Check both display value and key
      return value === category || value.toLowerCase() === category.toLowerCase();
    });

    if (entry) {
      return SkillCategory[entry[0] as keyof typeof SkillCategory];
    }

    // If no match, map based on category type
    switch(category.toLowerCase()) {
      case 'technical':
      case 'tool':
      case 'framework':
      case 'database':
      case 'other':
        return SkillCategory.TECHNICAL;
      case 'soft':
      case 'interpersonal':
        return SkillCategory.INTERPERSONAL;
      case 'language':
        return SkillCategory.LANGUAGE;
      default:
        this.logger.warn(`Unknown category "${category}", defaulting to TECHNICAL`);
        return SkillCategory.TECHNICAL;
    }
  }
}
