import { Injectable } from '@nestjs/common';

export interface FitScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  yearsExperience: number; // Actual years of professional experience (excluding internships)
  languages?: number;      // Optional language proficiency score
}

export interface FitBreakdown {
  matchLevel: 'Strong' | 'Good' | 'Partial' | 'Weak' | 'Misaligned';
  details: string[];
}

export interface JobFitSummary {
  isRecommended: boolean;
  fitLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  fitBreakdown: {
    skillsFit: FitBreakdown;
    experienceFit: FitBreakdown;
    educationFit: FitBreakdown;
  };
}

export interface RecruiterRecommendations {
  decision: 'Hire' | 'Consider' | 'Reject';
  suggestedAction: string;
  feedbackToSend: string[];
}

export interface ApplicationAnalysisResponse {
  fitScore: FitScore;
  jobFitSummary: JobFitSummary;
  recruiterRecommendations: RecruiterRecommendations;
}

export interface ProfileSuggestionsResponseDto {
  suggestions: {
    role: string[];
    skills: string[];
    industries: string[];
    locations: string[];
    certifications: string[];
  };
}

@Injectable()
export class ValidationUtilsService {
  isValidApplicationAnalysisResponse(response: any): response is ApplicationAnalysisResponse {
    if (!response) return false;

    // Validate fitScore first as other validations depend on it
    if (!this.isValidFitScore(response.fitScore)) {
      return false;
    }

    // Validate jobFitSummary
    if (!this.isValidJobFitSummary(response.jobFitSummary)) {
      return false;
    }

    // Validate recruiterRecommendations with fitScore context
    if (!this.isValidRecruiterRecommendations(response.recruiterRecommendations, response.fitScore)) {
      return false;
    }

    return true;
  }

  private isValidFitScore(score: any): score is FitScore {
    // Required fields validation
    if (!score ||
        typeof score.overall !== 'number' ||
        typeof score.skills !== 'number' ||
        typeof score.experience !== 'number' ||
        typeof score.education !== 'number' ||
        typeof score.yearsExperience !== 'number') {
      return false;
    }

    // Optional fields validation
    if (score.languages !== undefined && typeof score.languages !== 'number') {
      return false;
    }

    // Basic range checks
    if (score.overall < 0 || score.overall > 100 ||
        score.skills < 0 || score.skills > 100 ||
        score.experience < 0 || score.experience > 100 ||
        score.education < 0 || score.education > 100 ||
        (score.languages !== undefined && (score.languages < 0 || score.languages > 100))) {
      return false;
    }

    // Fixed scoring rules for insufficient experience
    if (score.yearsExperience === 0 || !score.yearsExperience) {
      return score.experience === 0 && score.overall <= 25;
    }

    if (score.yearsExperience < 3) {
      return score.experience === 0 && score.overall <= 25;
    }

    // Calculate weighted score including optional language score
    const weights = {
      experience: 0.45,  // Reduced from 0.5 to accommodate languages
      skills: 0.25,      // Reduced from 0.3
      education: 0.2,    // Unchanged
      languages: 0.1     // New weight for languages
    };

    let expectedOverall = (
      (score.experience * weights.experience) +
      (score.skills * weights.skills) +
      (score.education * weights.education)
    );

    // Add language score if present
    if (score.languages !== undefined) {
      expectedOverall += (score.languages * weights.languages);
    } else {
      // Redistribute language weight to other categories
      expectedOverall = expectedOverall * (1 / (1 - weights.languages));
    }

    // Allow for reasonable variance in overall score calculation
    if (Math.abs(score.overall - expectedOverall) > 5) {
      return false;
    }

    return true;
  }

  private isValidFitBreakdown(breakdown: any): breakdown is FitBreakdown {
    return (
      breakdown &&
      ['Strong', 'Good', 'Partial', 'Weak', 'Misaligned'].includes(breakdown.matchLevel) &&
      Array.isArray(breakdown.details) &&
      breakdown.details.every((detail: any) => typeof detail === 'string')
    );
  }

  private isValidJobFitSummary(summary: any): summary is JobFitSummary {
    return (
      summary &&
      typeof summary.isRecommended === 'boolean' &&
      ['High', 'Medium', 'Low'].includes(summary.fitLevel) &&
      typeof summary.reason === 'string' &&
      summary.fitBreakdown &&
      this.isValidFitBreakdown(summary.fitBreakdown.skillsFit) &&
      this.isValidFitBreakdown(summary.fitBreakdown.experienceFit) &&
      this.isValidFitBreakdown(summary.fitBreakdown.educationFit)
    );
  }

  private isValidRecruiterRecommendations(recommendations: any, fitScore?: FitScore): recommendations is RecruiterRecommendations {
    if (!recommendations ||
        !['Hire', 'Consider', 'Reject'].includes(recommendations.decision) ||
        typeof recommendations.suggestedAction !== 'string' ||
        !Array.isArray(recommendations.feedbackToSend) ||
        !recommendations.feedbackToSend.every((feedback: any) => typeof feedback === 'string')) {
      return false;
    }

    // Strict rules for recommendations based on experience
    if (!fitScore) return true;

    // No experience or insufficient experience must be Reject
    if (fitScore.yearsExperience === 0 || fitScore.yearsExperience < 3) {
      if (recommendations.decision !== 'Reject' ||
          !recommendations.feedbackToSend.some(f => f.includes('expérience'))) {
        return false;
      }
    }

    return true;
  }

  isValidProfileSuggestions(response: any): response is ProfileSuggestionsResponseDto {
    return (
      response?.suggestions &&
      Array.isArray(response.suggestions.role) &&
      Array.isArray(response.suggestions.skills) &&
      Array.isArray(response.suggestions.industries) &&
      Array.isArray(response.suggestions.locations) &&
      Array.isArray(response.suggestions.certifications)
    );
  }
}