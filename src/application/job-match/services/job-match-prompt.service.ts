import { Injectable, Logger } from '@nestjs/common';
import { SkillMatcherUtils } from '../utils/skill-matcher.utils';

/**
 * Service for generating prompts for the AI job match analysis
 */
@Injectable()
export class JobMatchPromptService {
  private readonly logger = new Logger(JobMatchPromptService.name);

  /**
   * Create a prompt for job matching analysis
   */
  createJobMatchingPrompt(job: any, candidate: any, potentialMatches: string[] = []): string {
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
        },
        "matchedKeywords": string[],
        "highlightsToStandOut": string[],
        "suggestions": string[]
      },
      "signauxAlerte": [
        {
          "type": "Compétence" | "Expérience" | "Formation" | "Langue",
          "probleme": string,
          "severite": "faible" | "moyenne" | "élevée",
          "score": number (0-100)
        }
      ]
    }

    Détails du poste:
    Titre: ${job.title || 'Non spécifié'}
    Niveau requis: ${job.requirements?.educationLevel || 'Non spécifié'} en ${job.requirements?.fieldOfStudy || 'Non spécifié'}
    Expérience: ${job.requirements?.yearsExperienceRequired || 0} ans en ${job.requirements?.experienceDomain || 'Non spécifié'}
    Compétences techniques: ${job.requirements?.hardSkills || 'Non spécifié'}
    Soft Skills: ${job.requirements?.softSkills || 'Non spécifié'}
    Langues: ${job.requirements?.languages || 'Non spécifié'}

    Profil du candidat:
    - Compétences: ${candidate.skills?.map((s: any) => s.name).join(', ') || 'Aucune'}
    - Expériences: ${candidate.experience?.map((e: any) => `${e.position} chez ${e.company}`).join('; ') || 'Aucune'}
    - Formations: ${candidate.education?.map((e: any) => `${e.degree} en ${e.fieldOfStudy}`).join('; ') || 'Aucune'}
    - Statut professionnel: ${candidate.professionalStatus || 'Non spécifié'}
    - Situation actuelle: ${candidate.employmentStatus || 'Non spécifié'}
    - Ville/Pays: ${candidate.city || 'Non spécifié'}, ${candidate.country || 'Non spécifié'}
    - Disponibilité: ${candidate.availabilityDate || 'Non spécifié'}

    Règles d'analyse STRICTES:
    1. Le score global doit être calculé comme suit:
      - 40% compétences (0-100)
      - 10% langues (0-100)
      - 25% expérience (0 si false, 100 si true)
      - 25% formation (0 si false, 100 si true)
    2. experience=true UNIQUEMENT si le candidat a au moins le nombre d'années d'expérience requises
    3. formation=true UNIQUEMENT si le candidat a au moins le niveau d'éducation requis
    4. matchedKeywords DOIT contenir TOUTES les compétences du candidat qui correspondent aux compétences requises pour le poste
       Par exemple: si le candidat a "JavaScript" et le poste demande "JavaScript/TypeScript", alors "JavaScript" DOIT être inclus
    5. IMPORTANT: Analyser TRÈS SOIGNEUSEMENT chaque compétence du candidat pour trouver des correspondances même partielles ou similaires
       Par exemple: "Node.js" correspond à "NodeJS", "React" correspond à "ReactJS", "Express" correspond à "ExpressJS", etc.
    6. NE PAS IGNORER les correspondances comme "MongoDB" si le poste demande "MongoDB/Mongoose" ou inversement
    7. Si experience=false, le score global ne peut pas dépasser 50
    8. Si formation=false, le score global ne peut pas dépasser 50
    9. Si les compétences correspondent à moins de 40%, le score global ne peut pas dépasser 30
    10. matchedKeywords = compétences communes entre l'offre et le profil, y compris les correspondances partielles comme "MongoDB" pour "MongoDB/Mongoose"
    11. highlightsToStandOut = 2-4 points forts du profil
    12. signauxAlerte = faiblesses majeures avec score et sévérité

    Context additionnel: 
    - L'analyse est pour le marché tunisien qui a des exigences strictes pour les compétences techniques.
    - Fourchette salariale typique en Tunisie: 800-5000 TND selon l'expérience et les compétences.
    - Potentielles correspondances de compétences détectées: ${potentialMatches.join(', ')}

    Output ONLY the JSON - no additional text, comments or markdown.`;
  }

  /**
   * Preprocess candidate and job data to enhance the matching
   */
  preprocessMatchData(job: any, candidate: any): string[] {
    // Extract skills from candidate and job
    const candidateSkills = SkillMatcherUtils.extractCandidateSkills(candidate.skills);
    const jobSkillsRaw = SkillMatcherUtils.parseJobSkills(job.requirements?.hardSkills);
    
    // Find potential skill matches to enhance the AI prompt
    return SkillMatcherUtils.findPotentialMatches(candidateSkills, jobSkillsRaw);
  }
}