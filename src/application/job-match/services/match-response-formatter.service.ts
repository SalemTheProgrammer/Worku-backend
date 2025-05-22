import { Injectable, Logger } from '@nestjs/common';
import { 
  Alert, 
  CompetenceType, 
  JobMatchResponse, 
  SeverityType 
} from '../interfaces/job-match.interface';
import { EvaluationUtils } from '../utils/evaluation.utils';
import { SalaryCalculatorUtils } from '../utils/salary-calculator.utils';

/**
 * Service for formatting and enhancing job match responses
 */
@Injectable()
export class MatchResponseFormatterService {
  private readonly logger = new Logger(MatchResponseFormatterService.name);

  /**
   * Format signal alerts according to schema
   */
  formatSignalAlerts(rawAlerts: any[]): Alert[] {
    return rawAlerts.map(alert => {
      return {
        type: alert.type as CompetenceType,
        probleme: alert.probleme,
        severite: alert.severite as SeverityType,
        score: typeof alert.score === 'number' ? alert.score : 0
      };
    });
  }

  /**
   * Create analysis data from validated response
   */
  createAnalysisData(
    validatedResponse: JobMatchResponse, 
    formattedAlerts: Alert[],
    tunisianSalaryRange: { min: number; max: number; currency: string },
    candidateSkills: string[]
  ) {
    return {
      analyse: {
        scoreDAdéquation: {
          global: validatedResponse.resume.score,
          compétences: validatedResponse.resume.correspondance.competences,
          expérience: validatedResponse.resume.correspondance.experience,
          formation: validatedResponse.resume.correspondance.formation,
          langues: validatedResponse.resume.correspondance.langues
        },
        matchedKeywords: validatedResponse.resume.matchedKeywords || [],
        highlightsToStandOut: validatedResponse.resume.highlightsToStandOut || [],
        signauxAlerte: formattedAlerts,
        marchéTunisien: {
          fourchetteSalariale: {
            min: tunisianSalaryRange.min,
            max: tunisianSalaryRange.max,
            devise: tunisianSalaryRange.currency
          },
          potentielDEmbauche: validatedResponse.resume.score >= 65 ? 'Élevé' : 
                            validatedResponse.resume.score >= 50 ? 'Moyen' : 'Faible',
          compétencesDemandées: candidateSkills,
          tempsEstiméRecrutement: validatedResponse.resume.score >= 75 ? '1-2 semaines' : 
                                validatedResponse.resume.score >= 60 ? '2-4 semaines' : '4+ semaines'
        },
        synthèseAdéquation: {
          recommandé: validatedResponse.resume.score > 50,
          niveauAdéquation: EvaluationUtils.getNiveauAdequation(validatedResponse.resume.score),
          raison: validatedResponse.resume.score > 50 ? 'Profil correspondant au poste' : 'Profil à améliorer',
          détailsAdéquation: {
            adéquationCompétences: {
              niveau: EvaluationUtils.getNiveauForType('Compétence', formattedAlerts),
              détails: EvaluationUtils.getDetailsForType('Compétence', formattedAlerts)
            },
            adéquationExpérience: {
              niveau: EvaluationUtils.getNiveauForType('Expérience', formattedAlerts),
              détails: EvaluationUtils.getDetailsForType('Expérience', formattedAlerts)
            },
            adéquationFormation: {
              niveau: EvaluationUtils.getNiveauForType('Formation', formattedAlerts),
              détails: EvaluationUtils.getDetailsForType('Formation', formattedAlerts)
            }
          }
        },
        recommandationsRecruteur: {
          décision: EvaluationUtils.getDecision(validatedResponse.resume.score),
          actionSuggérée: EvaluationUtils.getActionSuggérée(formattedAlerts),
          retourCandidat: EvaluationUtils.getRetourCandidat(formattedAlerts)
        }
      }
    };
  }

  /**
   * Create a fallback response when the AI analysis fails
   */
  createFallbackJobMatchResponse(): JobMatchResponse {
    const fallbackResponse: JobMatchResponse = {
      resume: {
        score: 50,
        correspondance: {
          competences: 50,
          experience: false,
          formation: false,
          langues: 50
        },
        matchedKeywords: ['compétences techniques', 'aptitudes professionnelles'],
        suggestions: [
          "L'analyse automatique n'a pas pu être complétée, veuillez examiner le profil manuellement"
        ],
        highlightsToStandOut: []
      },
      signauxAlerte: [
        {
          type: "Compétence" as CompetenceType,
          probleme: "L'analyse automatique n'a pas pu générer un résultat structuré",
          severite: "moyenne" as SeverityType,
          score: 0
        }
      ]
    };
    
    return fallbackResponse;
  }

  /**
   * Recover partial response data when complete parsing fails
   */
  recoverPartialJobMatchResponse(partialData: any): JobMatchResponse {
    const response: JobMatchResponse = {
      resume: {
        score: partialData?.resume?.score || 0,
        correspondance: {
          competences: partialData?.resume?.correspondance?.competences || 0,
          experience: partialData?.resume?.correspondance?.experience || false,
          formation: partialData?.resume?.correspondance?.formation || false,
          langues: partialData?.resume?.correspondance?.langues || 0
        },
        matchedKeywords: partialData?.resume?.matchedKeywords || [],
        suggestions: partialData?.resume?.suggestions || [
          "L'analyse automatique a rencontré des difficultés, veuillez vérifier manuellement"
        ],
        highlightsToStandOut: partialData?.resume?.highlightsToStandOut || []
      },
      signauxAlerte: []
    };
    
    if (partialData.resume) {
      if (typeof partialData.resume.score === 'number') {
        response.resume.score = partialData.resume.score;
      }
      
      if (partialData.resume.correspondance) {
        const corr = partialData.resume.correspondance;
        response.resume.correspondance.competences = typeof corr.competences === 'number' ? corr.competences : 0;
        response.resume.correspondance.experience = typeof corr.experience === 'boolean' ? corr.experience : false;
        response.resume.correspondance.formation = typeof corr.formation === 'boolean' ? corr.formation : false;
        response.resume.correspondance.langues = typeof corr.langues === 'number' ? corr.langues : 0;
      }
      
      if (Array.isArray(partialData.resume?.suggestions)) {
        response.resume.suggestions = partialData.resume.suggestions
          .filter(s => typeof s === 'string')
          .slice(0, 5);
      }
    }
    
    if (Array.isArray(partialData?.signauxAlerte)) {
      response.signauxAlerte = partialData.signauxAlerte
        .filter(a => a && typeof a.probleme === 'string')
        .map(a => ({
          type: (a.type || "Compétence") as CompetenceType,
          probleme: a.probleme,
          severite: (a.severite || "moyenne") as SeverityType,
          score: typeof a.score === 'number' ? a.score : 0
        }))
        .slice(0, 10);
    }
    
    if (response.signauxAlerte.length === 0) {
      response.signauxAlerte.push({
        type: "Compétence" as CompetenceType,
        probleme: "Données partiellement récupérées suite à une erreur d'analyse",
        severite: "moyenne" as SeverityType,
        score: 0
      });
    }
    
    // Ensure there are some keywords for UI display
    if (response.resume.matchedKeywords.length === 0) {
      // Add some generic tech keywords
      response.resume.matchedKeywords = ['technologies', 'compétences techniques'];
    }
    
    return response;
  }
}