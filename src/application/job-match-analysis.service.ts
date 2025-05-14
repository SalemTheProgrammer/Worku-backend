import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../schemas/job.schema';
import { Candidate } from '../schemas/candidate.schema';
import { Application } from '../schemas/application.schema';
import { GeminiClientService } from '../services/gemini-client.service';
import {
  JobMatchResponse,
  JobMatchResponseSchema,
  CompetenceType,
  SeverityType,
  Alert,
} from './schemas/job-match.schema';


@Injectable()
export class JobMatchAnalysisService {
  private readonly logger = new Logger(JobMatchAnalysisService.name);

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>,
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly geminiClient: GeminiClientService
  ) {}

  private getNiveauAdequation(score: number): string {
    if (score >= 85) return 'Excellent';
    if (score >= 70) return 'Bon';
    if (score >= 50) return 'Moyen';
    return 'Faible';
  }

  private getNiveauForType(type: string, alerts: Alert[]): string {
    const alert = alerts.find(a => a.type === type);
    if (!alert) return 'Non évalué';
    
    switch (alert.severite) {
      case 'faible': return 'Excellent';
      case 'moyenne': return 'Bon';
      case 'élevée': return 'À améliorer';
      default: return 'Non évalué';
    }
  }

  private getDetailsForType(type: string, alerts: Alert[]): string[] {
    const alert = alerts.find(a => a.type === type);
    if (!alert) return [];
    return [alert.probleme];
  }

  private getDecision(score: number): string {
    if (score >= 85) return 'Recommandé fortement';
    if (score >= 70) return 'Recommandé';
    if (score >= 50) return 'À considérer';
    return 'Non recommandé';
  }

  private getActionSuggérée(alerts: Alert[]): string {
    const highPriorityAlert = alerts.find(a => a.severite === 'élevée');
    if (highPriorityAlert) {
      return 'Action prioritaire: ' + highPriorityAlert.probleme;
    }
    const mediumPriorityAlert = alerts.find(a => a.severite === 'moyenne');
    if (mediumPriorityAlert) {
      return mediumPriorityAlert.probleme;
    }
    return 'Procéder à l\'évaluation standard';
  }

  private getRetourCandidat(alerts: Alert[]): string[] {
    return alerts
      .sort((a, b) => {
        const severityOrder = { 'élevée': 3, 'moyenne': 2, 'faible': 1 };
        return severityOrder[b.severite] - severityOrder[a.severite];
      })
      .map(alert => alert.probleme)
      .filter(Boolean);
  }


  async analyzeMatch(candidateId: string, jobId: string): Promise<JobMatchResponse> {
    this.logger.log('========== JOB MATCH ANALYSIS ==========');
    this.logger.log(`Starting analysis...`);
    this.logger.log(`Candidate ID: ${candidateId}`);
    this.logger.log(`Job ID: ${jobId}`);
    this.logger.log('=======================================');
    
    const [candidate, job] = await Promise.all([
      this.candidateModel.findById(candidateId).exec(),
      this.jobModel.findById(jobId).exec()
    ]);
    console.log('[JobMatchAnalysis] Retrieved candidate and job data');
  
    if (!job) {
      console.error('[JobMatchAnalysis] Job not found');
      throw new Error('Job not found');
    }
    
    if (!candidate) {
      console.error('[JobMatchAnalysis] Candidate not found');
      throw new Error('Candidate not found');
    }
    
    this.logger.log('\n1️⃣ Creating job matching prompt...');
    const prompt = this.createJobMatchingPrompt(job, candidate);
    
    let attempt = 0;
    let parsedResponse: any = null;
    const maxAttempts = 3;
    
    while (attempt < maxAttempts) {
      attempt++;
      this.logger.log(`\n🔄 Analysis attempt ${attempt} of ${maxAttempts}...`);
      
      try {
        this.logger.log('Sending prompt to Gemini...');
        let text = await this.geminiClient.generateContent(prompt);
        this.logger.log('Received response from Gemini');
        text = text.replace(/```json|```/g, '').trim();
        
        if (!text.startsWith('{')) {
          this.logger.warn(`Attempt ${attempt}: Non-JSON response received: ${text.slice(0, 50)}`);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch && jsonMatch[0]) {
            text = jsonMatch[0];
            this.logger.log('Extracted potential JSON from response');
          } else {
            if (attempt < maxAttempts) continue;
          }
        }
        
        try {
          parsedResponse = JSON.parse(text);
          
          if (parsedResponse.resume && parsedResponse.signauxAlerte) {
            break;
          } else {
            this.logger.warn('Response has invalid structure, retrying...');
            if (attempt < maxAttempts) continue;
          }
        } catch (error) {
          this.logger.error(`Attempt ${attempt}: Failed to parse JSON:`, error);
          if (attempt < maxAttempts) continue;
        }
      } catch (error) {
        this.logger.error(`Error in job match analysis attempt ${attempt}:`, error);
        if (attempt < maxAttempts) continue;
      }
    }
    
    if (!parsedResponse) {
      this.logger.error('❌ Failed to get valid response after all attempts');
      return this.createFallbackJobMatchResponse();
    }
    
    this.logger.log('\n✅ Analysis completed successfully');
    
    try {
      // Ensure required arrays are present
      parsedResponse.resume.suggestions = parsedResponse.resume.suggestions || [];
      parsedResponse.resume.matchedKeywords = parsedResponse.resume.matchedKeywords || [];
      parsedResponse.resume.highlightsToStandOut = parsedResponse.resume.highlightsToStandOut || [];
      
      const validatedResponse = JobMatchResponseSchema.parse(parsedResponse);
      this.logger.log('Response validation successful');
      
      // Create sanitized copy for logging
      const logResponse = {
        ...validatedResponse,
        resume: {
          ...validatedResponse.resume,
          score: validatedResponse.resume.score,
          correspondance: validatedResponse.resume.correspondance
        }
      };
      this.logger.debug('Final Analysis Result:', logResponse);
      
      
      // Structure signal alerts according to schema
      const formattedSignalAlerts = validatedResponse.signauxAlerte.map(alert => {
        return {
          type: alert.type as CompetenceType,
          probleme: alert.probleme,
          severite: alert.severite as SeverityType,
          score: typeof alert.score === 'number' ? alert.score : 0
        };
      });
      
      const analysisData = {
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
          signauxAlerte: formattedSignalAlerts,
          synthèseAdéquation: {
            recommandé: validatedResponse.resume.score > 50,
            niveauAdéquation: this.getNiveauAdequation(validatedResponse.resume.score),
            raison: validatedResponse.resume.score > 50 ? 'Profil correspondant au poste' : 'Profil à améliorer',
            détailsAdéquation: {
              adéquationCompétences: {
                niveau: this.getNiveauForType('Compétence', formattedSignalAlerts),
                détails: this.getDetailsForType('Compétence', formattedSignalAlerts)
              },
              adéquationExpérience: {
                niveau: this.getNiveauForType('Expérience', formattedSignalAlerts),
                détails: this.getDetailsForType('Expérience', formattedSignalAlerts)
              },
              adéquationFormation: {
                niveau: this.getNiveauForType('Formation', formattedSignalAlerts),
                détails: this.getDetailsForType('Formation', formattedSignalAlerts)
              }
            }
          },
          recommandationsRecruteur: {
            décision: this.getDecision(validatedResponse.resume.score),
            actionSuggérée: this.getActionSuggérée(formattedSignalAlerts),
            retourCandidat: this.getRetourCandidat(formattedSignalAlerts)
          }
        }
      };
      // Save analysis results to application
      const result = await this.applicationModel.findOneAndUpdate(
        { candidat: candidateId, poste: jobId },
        {
          $set: {
            ...analysisData,
            statut: 'analysé',
            dateAnalyse: new Date()
          }
        },
        { new: true }
      ).exec();

      if (!result) {
        this.logger.error('Failed to update application with analysis results');
        throw new Error('Application update failed');
      }

      this.logger.log('Successfully saved analysis results to database');
      
      return validatedResponse;
    } catch (error) {
      this.logger.error('❌ Error validating response:', error);
      this.logger.debug('Invalid Response:', parsedResponse);
      try {
        const recoveredResponse = this.recoverPartialJobMatchResponse(parsedResponse);
        this.logger.log('⚠️ Recovered partial response');
        return recoveredResponse;
      } catch (recoverError) {
        this.logger.error('❌ Recovery failed, using fallback response');
        return this.createFallbackJobMatchResponse();
      }
    }
  }
  
  private createFallbackJobMatchResponse(): JobMatchResponse {
    return {
      resume: {
        score: 50,
        correspondance: {
          competences: 50,
          experience: false,
          formation: false,
          langues: 50
        },
        matchedKeywords: [],
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
  }
  
  private recoverPartialJobMatchResponse(partialData: any): JobMatchResponse {
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
    
    return response;
  }

  private createJobMatchingPrompt(job: Job, candidate: Candidate): string {
    return `
    Analyse le profil du candidat pour ce poste et génère UNIQUEMENT un objet JSON valide correspondant exactement à ce schéma:
    {
      "resume": {
        "score": number (0-100),
        "correspondance": {
          "competences": number (0-100),
          "experience": boolean,
          "formation": boolean,
          "langues": number (0-100)
        }
      },
      "matchedKeywords": string[],
      "highlightsToStandOut": string[],
      "signauxAlerte": [
        {
          "type": "Compétence" | "Expérience" | "Formation" | "Langue",
          "probleme": string,
          "severite": "faible" | "moyenne" | "élevée",
          "score": number (0-100)
        }
      ],
      "suggestions": string[]
    }

    Détails du poste:
    Titre: ${job.title}
    Niveau requis: ${job.requirements.educationLevel} en ${job.requirements.fieldOfStudy}
    Expérience: ${job.requirements.yearsExperienceRequired} ans en ${job.requirements.experienceDomain}
    Compétences techniques: ${job.requirements.hardSkills}
    Soft Skills: ${job.requirements.softSkills}
    Langues: ${job.requirements.languages}

    Profil du candidat:
    - Compétences: ${candidate.skills?.map((s: any) => s.name).join(', ') || 'Aucune'}
    - Expériences: ${candidate.experience?.map((e: any) => `${e.position} chez ${e.company}`).join('; ') || 'Aucune'}
    - Formations: ${candidate.education?.map((e: any) => `${e.degree} en ${e.fieldOfStudy}`).join('; ') || 'Aucune'}
    - Statut professionnel: ${candidate.professionalStatus}
    - Situation actuelle: ${candidate.employmentStatus}
    - Ville/Pays: ${candidate.city}, ${candidate.country}
    - Disponibilité: ${candidate.availabilityDate}

    Règles d'analyse:
    1. Le score global doit être calculé comme suit:
     - 60% compétences (0-100)
     - 20% langues (0-100)
     - 20% bonus si experience=true
     - 20% bonus si formation=true
    2. experience=true si le candidat a l'expérience requise
    3. formation=true si le candidat a le niveau d'éducation requis
    4. matchedKeywords = compétences communes entre l'offre et le profil
    5. highlightsToStandOut = 2-4 points forts du profil
    6. signauxAlerte = faiblesses majeures avec score et sévérité

    Output ONLY the JSON - no additional text, comments or markdown.`;
  }
}
