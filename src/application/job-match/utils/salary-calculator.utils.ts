import { SalaryRange } from '../interfaces/job-match.interface';

/**
 * Utility for calculating salary ranges based on candidate profile
 */
export class SalaryCalculatorUtils {
  /**
   * Calculate estimated salary range based on Tunisian market
   */
  static calculateTunisianSalaryRange(
    yearsOfExperience: number,
    skills: string[],
    education: string,
    jobLevel: string
  ): SalaryRange {
    // Base salary ranges for Tunisia (in TND)
    const baseSalaryByLevel = {
      junior: { min: 800, max: 1500 },
      midLevel: { min: 1500, max: 2500 },
      senior: { min: 2500, max: 4000 },
      expert: { min: 4000, max: 5000 }
    };

    // Determine level based on experience
    let level = 'junior';
    if (yearsOfExperience >= 7) {
      level = 'expert';
    } else if (yearsOfExperience >= 4) {
      level = 'senior';
    } else if (yearsOfExperience >= 2) {
      level = 'midLevel';
    }

    // Get base salary for the level
    let { min, max } = baseSalaryByLevel[level];

    // Adjust for education
    if (education?.toLowerCase().includes('master') || education?.toLowerCase().includes('mba')) {
      min += 300;
      max += 500;
    } else if (education?.toLowerCase().includes('phd') || education?.toLowerCase().includes('doctorat')) {
      min += 500;
      max += 1000;
    }

    // Adjust for high-demand skills (simplified)
    const highDemandSkills = [
      'javascript', 'typescript', 'react', 'angular', 'vue', 'node', 'python', 'java', 
      'devops', 'cloud', 'aws', 'azure', 'docker', 'kubernetes', 'data science', 'machine learning',
      'ai', 'blockchain', 'security', 'mongodb', 'mongoose', 'nosql'
    ];

    const highDemandSkillCount = skills.filter(skill => 
      highDemandSkills.some(hds => skill.toLowerCase().includes(hds))
    ).length;

    if (highDemandSkillCount >= 3) {
      min += 400;
      max += 800;
    } else if (highDemandSkillCount >= 1) {
      min += 200;
      max += 400;
    }

    // Job level adjustments
    if (jobLevel?.toLowerCase().includes('lead') || jobLevel?.toLowerCase().includes('senior')) {
      min += 300;
      max += 600;
    } else if (jobLevel?.toLowerCase().includes('manager') || jobLevel?.toLowerCase().includes('director')) {
      min += 800;
      max += 1500;
    }

    // Make sure we don't exceed the maximum for Tunisian market
    if (max > 5000) max = 5000;
    
    return { min, max, currency: 'TND' };
  }
}