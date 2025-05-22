export type CompetenceType = 'Compétence' | 'Expérience' | 'Formation' | 'Langue';
export type SeverityType = 'faible' | 'moyenne' | 'élevée';

export interface Alert {
  type: CompetenceType;
  probleme: string;
  severite: SeverityType;
  score: number;
}

export interface JobMatchResponseData {
  score: number;
  correspondance: {
    competences: number;
    experience: boolean;
    formation: boolean;
    langues: number;
  };
  matchedKeywords: string[];
  suggestions: string[];
  highlightsToStandOut: string[];
}

export interface JobMatchResponse {
  resume: JobMatchResponseData;
  signauxAlerte: Alert[];
  potentialSalary?: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
}

export const JobMatchResponseSchema = {
  parse: (data: any): JobMatchResponse => {
    // Simple validation - in real app use Zod or class-validator
    if (!data || !data.resume || !data.signauxAlerte) {
      throw new Error('Invalid job match response format');
    }
    return data as JobMatchResponse;
  }
};