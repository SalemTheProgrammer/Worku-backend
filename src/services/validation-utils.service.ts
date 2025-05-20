import { Injectable } from '@nestjs/common';

interface FitScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
  yearsExperience: number; // Actual years of professional experience (excluding internships)
}

interface FitBreakdown {
  matchLevel: 'Strong' | 'Partial' | 'Weak' | 'Misaligned';
  details: string[];
}

interface JobFitSummary {
  isRecommended: boolean;
  fitLevel: 'High' | 'Medium' | 'Low';
  reason: string;
  fitBreakdown: {
    skillsFit: FitBreakdown;
    experienceFit: FitBreakdown;
    educationFit: FitBreakdown;
  };
}

interface RecruiterRecommendations {
  decision: 'Hire' | 'Consider' | 'Reject';
  suggestedAction: string;
  feedbackToSend: string[];
}

interface ApplicationAnalysisResponse {
  fitScore: FitScore;
  jobFitSummary: JobFitSummary;
  recruiterRecommendations: RecruiterRecommendations;
}

interface ProfileSuggestionsResponseDto {
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
    if (!score ||
        typeof score.overall !== 'number' ||
        typeof score.skills !== 'number' ||
        typeof score.experience !== 'number' ||
        typeof score.education !== 'number' ||
        typeof score.yearsExperience !== 'number') {
      return false;
    }

    // Fixed scoring rules for insufficient experience
    if (score.yearsExperience === 0 || !score.yearsExperience) {
      return (
        score.overall === 25 &&
        score.experience === 0
      );
    }

    if (score.yearsExperience < 3) {
      return (
        score.overall <= 25 &&
        score.experience === 0
      );
    }

    // Basic range checks
    if (score.overall < 0 || score.overall > 100 ||
        score.skills < 0 || score.skills > 100 ||
        score.experience < 0 || score.experience > 100 ||
        score.education < 0 || score.education > 100) {
      return false;
    }

    // Experience weight validation
    const expectedOverall = (
      (score.experience * 0.5) +  // Experience is 50%
      (score.skills * 0.3) +      // Skills are 30%
      (score.education * 0.2)     // Education is 20%
    );

    // Allow for small rounding differences
    if (Math.abs(score.overall - expectedOverall) > 1) {
      return false;
    }

    // Enforce max 30% overall score if experience is insufficient
    if (score.experience < 70 && score.overall > 30) {
      return false;
    }

    return true;
  }

  private isValidFitBreakdown(breakdown: any): breakdown is FitBreakdown {
    return (
      breakdown &&
      ['Strong', 'Partial', 'Weak', 'Misaligned'].includes(breakdown.matchLevel) &&
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