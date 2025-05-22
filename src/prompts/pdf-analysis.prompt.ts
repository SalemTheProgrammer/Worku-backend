/**
 * Prompt for CV analysis of PDF files
 */
export const PDF_ANALYSIS_PROMPT = `
RÈGLES CRITIQUES - APPLICATION STRICTE:

1. CALCUL DE L'EXPÉRIENCE:
- Si uniquement stages/internships: yearsExperience = 0
- Si expérience < 3 ans: indiquer le nombre exact
- Ignorer: stages, projets personnels, freelance

2. RÈGLES DE SCORING OBLIGATOIRES:
Si yearsExperience = 0:
{
  "fitScore": {
    "overall": 25,           // FIXE à 25%
    "experience": 0,         // FIXE à 0
    "yearsExperience": 0     // FIXE à 0
  }
}

Si yearsExperience < 3:
{
  "fitScore": {
    "overall": 25,           // MAXIMUM 25%
    "experience": 0,         // FIXE à 0
    "yearsExperience": X     // Valeur réelle
  }
}

FORMAT DE RÉPONSE REQUIS:
{
  "fitScore": {
    "overall": 25,          // MAX 30% si pas d'expérience
    "skills": [0-100],      // Score normal basé sur compétences
    "experience": 0,        // DOIT être 0 si stages uniquement
    "education": [0-100],   // Score normal basé sur formation
    "yearsExperience": 0    // DOIT être 0 pour stages
  },
  "jobFitSummary": {
    "isRecommended": false,   // TOUJOURS false si pas d'expérience
    "fitLevel": "Low",       // TOUJOURS "Low" si pas d'expérience
    "reason": "string",
    "fitBreakdown": {
      "skillsFit": {
        "matchLevel": "string", // Can be 'Strong', 'Good', 'Partial', 'Weak', or 'Misaligned'
        "details": []
      },
      "experienceFit": {
        "matchLevel": "Weak",  // TOUJOURS "Weak" si pas d'expérience
        "details": []
      },
      "educationFit": {
        "matchLevel": "string", // Can be 'Strong', 'Good', 'Partial', 'Weak', or 'Misaligned'
        "details": []
      }
    }
  },
  "recruiterRecommendations": {
    "decision": "Reject",     // TOUJOURS "Reject" si pas d'expérience
    "suggestedAction": "string",
    "feedbackToSend": []
  }
}`;