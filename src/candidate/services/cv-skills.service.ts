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
      this.logger.log(`Starting skill extraction for candidate ${candidateId}`);

      // Get CV analysis
      const cvAnalysis = await this.cvAnalysisService.analyzeCV(cvPath);
      this.logger.debug('CV Analysis completed successfully');

      // Format analysis data for skill extraction
      const analysisContext = `
Professional Profile:
${cvAnalysis.jobFitSummary.reason}

Skills Assessment:
${cvAnalysis.jobFitSummary.fitBreakdown.skillsFit.details.join('\n')}

Experience:
${cvAnalysis.jobFitSummary.fitBreakdown.experienceFit.details.join('\n')}

Education:
${cvAnalysis.jobFitSummary.fitBreakdown.educationFit.details.join('\n')}
`;
      
      // Generate and send prompt
      const prompt = this.buildSkillExtractionPrompt(analysisContext);
      const response = await this.geminiClient.generateContent(prompt);
      
      if (!response) {
        this.logger.error(`Failed to get response from Gemini for candidate ${candidateId}`);
        return;
      }
      
      this.logger.debug('Received skill extraction response');

      const skillsData = this.parseSkillsJson(response);

      if (!skillsData) {
        this.logger.warn(`⚠️ Failed to parse skills JSON for candidate ${candidateId}`);
        this.logger.debug('Raw response:', response);
        return;
      }

      this.logger.debug('Extracted skills data:', JSON.stringify(skillsData, null, 2));

      // Filter out skills without a name first
      const validSkillsData = skillsData.skills.filter(skill => {
        if (!skill.name) {
          this.logger.warn('Skipping skill with missing name:', JSON.stringify(skill));
          return false;
        }
        return true;
      });
      
      this.logger.log(`Found ${validSkillsData.length} skills with valid names`);
      this.logger.debug('Valid skills:', validSkillsData.map(s => ({
        name: s.name,
        category: s.category,
        level: s.level
      })));
      
      // First map and validate categories
      const processedSkills = validSkillsData
        .map(skill => {
          const category = this.mapSkillCategory(skill.category);
          if (!category) {
            this.logger.warn(`Skipping skill "${skill.name}" - invalid category "${skill.category}"`);
            return null;
          }
          return { ...skill, mappedCategory: category };
        })
        .filter(Boolean);

      this.logger.log(`Processed ${processedSkills.length} skills with valid categories`);

      // Then create the final skill objects
      const newSkills = processedSkills.map(skill => {
        // Since we've filtered out null values with .filter(Boolean),
        // we can safely assert that skill is not null
        if (!skill) {
          // This should never happen due to the filter, but TypeScript needs the check
          return null as any;
        }

        const isLanguage = skill.mappedCategory === SkillCategory.LANGUAGE;
        
        // Handle language skills
        if (isLanguage) {
          const proficiencyLevel = skill.level ?
            this.normalizeLanguageLevel(skill.level) || 'Intermédiaire' :
            'Intermédiaire';

          return {
            name: skill.name,
            category: skill.mappedCategory,
            level: 3, // Default level for languages
            isLanguage: true,
            proficiencyLevel,
            yearsOfExperience: null,
            _id: new mongoose.Types.ObjectId().toString()
          };
        }
        
        // Handle technical and interpersonal skills
        return {
          name: skill.name,
          category: skill.mappedCategory,
          level: this.normalizeSkillLevel(skill.level),
          isLanguage: false,
          proficiencyLevel: 'Intermédiaire',
          yearsOfExperience: null,
          _id: new mongoose.Types.ObjectId().toString()
        };
      });

      this.logger.log(`Created ${newSkills.length} normalized skill objects`);
      this.logger.debug('Normalized skills:', newSkills.map(s => ({
        name: s.name,
        category: s.category,
        level: s.level,
        isLanguage: s.isLanguage,
        proficiencyLevel: s.proficiencyLevel
      })));
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
Analyze this CV summary and extract all skills with their levels in French. Return ONLY a JSON object.

Required format:
{
  "skills": [
    {
      "name": "skill name (required)",
      "level": "skill level (based on context)",
      "category": "one of: technical, interpersonal, language (required)"
    }
  ]
}

Category definitions:
1. "technical": Any hard skills including:
   - Programming languages (ex: Java, Python)
   - Frameworks (ex: React, Angular)
   - Tools (ex: Git, Docker)
   - Technical concepts (ex: RESTful APIs)

2. "interpersonal": Soft skills including:
   - Leadership/Management skills
   - Communication abilities
   - Team collaboration
   - Problem-solving skills

3. "language": Spoken/written languages only
   Use these exact French levels:
   - "Natif" for native/mother tongue
   - "Professionnel" for business fluent/advanced
   - "Intermédiaire" for conversational/working
   - "Débutant" for basic/elementary

For technical/interpersonal skills, use:
- "expert" for advanced/extensive experience
- "intermediate" for working knowledge
- "beginner" for basic familiarity

CV Summary to analyze:
${cvSummary}
`;
  }

  private parseSkillsJson(response: string): SkillExtraction | null {
    try {
      // Remove any markdown formatting or extra text
      const cleanedResponse = response
        .replace(/```json\s*|\s*```/g, '')  // Remove code blocks
        .replace(/^[^{]*({[\s\S]*})[^}]*$/, '$1'); // Extract JSON object

      // Try parsing the cleaned response
      let data: any;
      try {
        data = JSON.parse(cleanedResponse);
      } catch (e) {
        // If that fails, try to extract just the JSON object
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          this.logger.error('No valid JSON found in response', {
            originalResponse: response,
            cleanedResponse
          });
          return null;
        }
        data = JSON.parse(jsonMatch[0]);
      }

      // Validate the structure
      if (!data || typeof data !== 'object') {
        this.logger.error('Parsed response is not an object', { data });
        return null;
      }

      if (!Array.isArray(data.skills)) {
        this.logger.error('Missing skills array in response', { data });
        return null;
      }

      // Validate each skill has required fields
      const validSkills = data.skills.filter(skill => {
        if (!skill || typeof skill !== 'object') {
          this.logger.warn('Invalid skill entry', { skill });
          return false;
        }
        
        if (!skill.name || typeof skill.name !== 'string') {
          this.logger.warn('Skill missing valid name', { skill });
          return false;
        }

        if (!skill.category || typeof skill.category !== 'string') {
          this.logger.warn('Skill missing valid category', { skill });
          return false;
        }

        return true;
      });

      return { skills: validSkills };

    } catch (error) {
      this.logger.error('Failed to parse Gemini response', {
        error: error.message,
        response,
      });
      return null;
    }
  }

  private normalizeLanguageLevel(level: string): string | null {
    if (!level) return null;

    const normalizedLevel = level.toLowerCase().trim();
    
    // Common variations for native/fluent level
    const nativeTerms = [
      'natif', 'native', 'fluent', 'fluently', 'couramment',
      'langue maternelle', 'mother tongue', 'first language',
      'c2', 'mastery', 'maîtrise'
    ];
    
    // Common variations for professional/advanced level
    const professionalTerms = [
      'professionnel', 'professional', 'advanced', 'avancé',
      'expert', 'fluide', 'c1', 'proficiency', 'business',
      'working professional', 'full professional'
    ];
    
    // Common variations for intermediate level
    const intermediateTerms = [
      'intermédiaire', 'intermediate', 'medium', 'moyen',
      'b1', 'b2', 'conversational', 'working knowledge',
      'professional working'
    ];
    
    // Common variations for beginner level
    const beginnerTerms = [
      'débutant', 'beginner', 'basic', 'basique', 'elementary',
      'a1', 'a2', 'novice', 'limited', 'notions'
    ];
    
    // Check against term lists
    if (nativeTerms.some(term => normalizedLevel.includes(term))) {
      return 'Natif';
    }
    
    if (professionalTerms.some(term => normalizedLevel.includes(term))) {
      return 'Professionnel';
    }
    
    if (intermediateTerms.some(term => normalizedLevel.includes(term))) {
      return 'Intermédiaire';
    }
    
    if (beginnerTerms.some(term => normalizedLevel.includes(term))) {
      return 'Débutant';
    }

    // Log unrecognized level for future improvements
    this.logger.debug(`Unrecognized language level: "${level}"`);
    return null;
  }

  private async updateCandidateSkills(candidateId: string, skills: any[]): Promise<void> {
    // Track invalid skills for debugging
    const invalidSkills: Array<{skill: any, reason: string}> = [];
    
    // Filter out invalid skills and track reasons
    const validSkills = skills
      .filter(skill => {
        // Check for null/undefined skills
        if (!skill) {
          invalidSkills.push({ skill, reason: 'skill is null or undefined' });
          return false;
        }

        // Validate required fields
        if (!skill.name || typeof skill.name !== 'string') {
          invalidSkills.push({ skill, reason: 'missing or invalid name' });
          return false;
        }

        if (!skill.category) {
          invalidSkills.push({ skill: { name: skill.name }, reason: 'missing category' });
          return false;
        }

        return true;
      });
    
    if (validSkills.length === 0) {
      this.logger.warn('No valid skills found after filtering. Invalid skills:',
        invalidSkills.map(({skill, reason}) =>
          `${JSON.stringify(skill)} - ${reason}`
        ).join('\n')
      );
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
    if (!level) return 3; // Default to intermediate
    
    const normalizedLevel = level.toLowerCase().trim();

    // Map various level indicators to numeric values
    if ([
      'expert', 'advanced', 'senior', 'master', 'proficient',
      'extensive', 'excellent', 'lead', 'architect', 'specialist',
      '5+ years', '5 years+', 'principal', 'professionnel'
    ].some(term => normalizedLevel.includes(term))) {
      return 5; // Expert level
    }

    if ([
      'beginner', 'basic', 'elementary', 'novice', 'junior',
      'entry', 'learning', 'limited', 'débutant', 'basique',
      '< 1 year', 'less than 1 year', '0-1 year', 'notions'
    ].some(term => normalizedLevel.includes(term))) {
      return 1; // Beginner level
    }

    // Check for specific year ranges that indicate intermediate level
    const yearMatch = normalizedLevel.match(/(\d+)[-\s]?(\d+)?\s*(?:year|an|année)/i);
    if (yearMatch) {
      const startYear = parseInt(yearMatch[1]);
      const endYear = yearMatch[2] ? parseInt(yearMatch[2]) : startYear;
      const avgYears = (startYear + endYear) / 2;
      
      if (avgYears >= 4) return 5; // 4+ years -> expert
      if (avgYears >= 1) return 3; // 1-3 years -> intermediate
      return 1; // < 1 year -> beginner
    }

    // Default intermediate level terms
    if ([
      'intermediate', 'medium', 'moderate', 'working knowledge',
      'competent', 'familiar', 'proficient', 'intermédiaire',
      'experienced', '2-3 years', '1-3 years'
    ].some(term => normalizedLevel.includes(term))) {
      return 3;
    }

    return 3; // Default to intermediate if no clear indicators
  }

  private mapSkillCategory(category?: string): SkillCategory | null {
    if (!category) {
      this.logger.warn('Received empty category');
      return null;
    }

    const normalizedCategory = category.toLowerCase().trim();
    
    // Map various common terms to our enum values
    if (['technical', 'tech', 'programming', 'database', 'framework', 'tool'].includes(normalizedCategory)) {
      return SkillCategory.TECHNICAL;
    }
    
    if (['interpersonal', 'soft', 'personal', 'social', 'communication'].includes(normalizedCategory)) {
      return SkillCategory.INTERPERSONAL;
    }
    
    if (['language', 'languages', 'spoken', 'written'].includes(normalizedCategory)) {
      return SkillCategory.LANGUAGE;
    }

    this.logger.warn(`Unmapped category "${category}"`);
    return null;
  }
}
