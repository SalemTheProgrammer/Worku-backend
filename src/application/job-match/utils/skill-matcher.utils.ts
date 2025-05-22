import { Logger } from '@nestjs/common';

/**
 * Utility for matching skills between candidates and job requirements
 */
export class SkillMatcherUtils {
  private static readonly logger = new Logger(SkillMatcherUtils.name);
  
  /**
   * Technology variants mapping to help with matching similar technologies
   */
  private static readonly techVariants = {
    'mongodb': ['mongo', 'nosql'],
    'mongoose': ['mongodb', 'orm'],
    'javascript': ['js', 'ecmascript'],
    'typescript': ['ts'],
    'reactjs': ['react'],
    'react.js': ['react'],
    'nodejs': ['node'],
    'node.js': ['node'],
    'expressjs': ['express'],
    'express.js': ['express'],
    'postgresql': ['postgres', 'psql'],
    'mysql': ['sql', 'mariadb'],
    'aws': ['amazon', 'cloud'],
    'azure': ['microsoft', 'cloud'],
    'docker': ['container'],
    'kubernetes': ['k8s', 'container orchestration']
  };

  /**
   * Find potential skill matches between candidate skills and job requirements
   */
  static findPotentialMatches(candidateSkills: string[], jobSkills: string[]): string[] {
    const candidateSkillsLower = candidateSkills.map(s => s?.toLowerCase() || '');
    const jobSkillsLower = jobSkills.map(s => s?.toLowerCase() || '');
    const potentialMatches: string[] = [];

    try {
      // Check each candidate skill against job skills
      candidateSkillsLower.forEach(candidateSkill => {
        if (!candidateSkill) return;
        
        jobSkillsLower.forEach(jobSkill => {
          if (!jobSkill) return;
          
          try {
            // Check for direct or partial matches in both directions
            if (candidateSkill.includes(jobSkill) || jobSkill.includes(candidateSkill)) {
              const originalSkill = candidateSkills[candidateSkillsLower.indexOf(candidateSkill)];
              if (originalSkill && !potentialMatches.includes(originalSkill)) {
                potentialMatches.push(originalSkill);
              }
            }
            
            // Check for technology variants
            Object.entries(this.techVariants).forEach(([tech, variants]) => {
              try {
                if ((candidateSkill.includes(tech) && variants.some(v => jobSkill.includes(v))) ||
                    (jobSkill.includes(tech) && variants.some(v => candidateSkill.includes(v)))) {
                  const originalSkill = candidateSkills[candidateSkillsLower.indexOf(candidateSkill)];
                  if (originalSkill && !potentialMatches.includes(originalSkill)) {
                    potentialMatches.push(originalSkill);
                  }
                }
              } catch (error) {
                this.logger.warn(`Error matching tech variants: ${error.message}`);
              }
            });
          } catch (error) {
            this.logger.warn(`Error matching skills: ${error.message}`);
          }
        });
      });
    } catch (error) {
      this.logger.error(`Error in findPotentialMatches: ${error.message}`);
    }

    return [...new Set(potentialMatches)]; // Remove duplicates
  }

  /**
   * Parse job skills from comma-separated string
   */
  static parseJobSkills(jobSkillsString: string | undefined): string[] {
    if (!jobSkillsString) return [];
    return jobSkillsString.split(',').map(s => s.trim()).filter(Boolean);
  }

  /**
   * Extract skills from candidate skills array
   */
  static extractCandidateSkills(candidateSkills: any[] | undefined): string[] {
    if (!candidateSkills || !Array.isArray(candidateSkills)) return [];
    return candidateSkills.map(s => s?.name || '').filter(Boolean);
  }
}