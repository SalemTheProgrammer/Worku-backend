import { Injectable } from '@nestjs/common';

interface FitScore {
  overall: number;
  skills: number;
  experience: number;
  education: number;
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
    return (
      response &&
      this.isValidFitScore(response.fitScore) &&
      this.isValidJobFitSummary(response.jobFitSummary) &&
      this.isValidRecruiterRecommendations(response.recruiterRecommendations)
    );
  }

  private isValidFitScore(score: any): score is FitScore {
    return (
      score &&
      typeof score.overall === 'number' &&
      typeof score.skills === 'number' &&
      typeof score.experience === 'number' &&
      typeof score.education === 'number' &&
      score.overall >= 0 && score.overall <= 100 &&
      score.skills >= 0 && score.skills <= 100 &&
      score.experience >= 0 && score.experience <= 100 &&
      score.education >= 0 && score.education <= 100
    );
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

  private isValidRecruiterRecommendations(recommendations: any): recommendations is RecruiterRecommendations {
    return (
      recommendations &&
      ['Hire', 'Consider', 'Reject'].includes(recommendations.decision) &&
      typeof recommendations.suggestedAction === 'string' &&
      Array.isArray(recommendations.feedbackToSend) &&
      recommendations.feedbackToSend.every((feedback: any) => typeof feedback === 'string')
    );
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