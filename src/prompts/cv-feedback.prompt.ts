/**
 * Template function for creating CV feedback analysis prompt
 * @param cvContent The content of the CV to analyze
 * @returns The prompt string
 */
export function createCVFeedbackPrompt(cvContent: string): string {
  return `
Vous êtes un conseiller en ressources humaines spécialisé dans l'analyse de CV.
Analysez le CV fourni et donnez une évaluation détaillée avec des conseils d'amélioration.

ANALYSE ATTENDUE:
- Identifiez les forces du CV
- Repérez les problèmes de formatage, de structure ou de présentation
- Détectez toute incohérence dans les dates ou les informations
- Suggérez des améliorations concrètes

RÈGLES IMPORTANTES:
- Soyez très attentif aux dates (format inconsistant, dates impossibles, chronologie incorrecte)
- Vérifiez la cohérence des informations
- Évaluez la clarté et la structure du document

FORMAT DE RÉPONSE (JSON):
{
  "summary": {
    "overallAssessment": "Évaluation générale du CV en une phrase",
    "generalFeedback": "Feedback global sur la qualité du CV",
    "quality": 85 // Note globale sur 100
  },
  "strengths": [
    {
      "aspect": "Point fort spécifique",
      "details": "Détails sur ce point fort"
    }
  ],
  "formattingFeedback": [
    {
      "section": "Partie du CV concernée",
      "issue": "Description du problème de formatage",
      "recommendation": "Suggestion pour résoudre ce problème",
      "severity": "high" // critical, high, medium, low
    }
  ],
  "contentFeedback": [
    {
      "section": "Partie du CV concernée",
      "issue": "Description du problème de contenu (ex: dates incorrectes)",
      "recommendation": "Suggestion pour résoudre ce problème",
      "severity": "medium" // critical, high, medium, low
    }
  ],
  "improvementSuggestions": [
    "Suggestion d'amélioration 1",
    "Suggestion d'amélioration 2"
  ]
}

CV à analyser:
${cvContent}
`;
}

/**
 * Prompt for CV feedback analysis of PDF files
 */
export const PDF_CV_FEEDBACK_PROMPT = `
Vous êtes un conseiller en ressources humaines spécialisé dans l'analyse de CV.
Analysez le CV fourni et donnez une évaluation détaillée avec des conseils d'amélioration.

ANALYSE ATTENDUE:
- Identifiez les forces du CV
- Repérez les problèmes de formatage, de structure ou de présentation
- Détectez toute incohérence dans les dates ou les informations
- Suggérez des améliorations concrètes

RÈGLES IMPORTANTES:
- Soyez très attentif aux dates (format inconsistant, dates impossibles, chronologie incorrecte)
- Vérifiez la cohérence des informations
- Évaluez la clarté et la structure du document

FORMAT DE RÉPONSE (JSON):
{
  "summary": {
    "overallAssessment": "Évaluation générale du CV en une phrase",
    "generalFeedback": "Feedback global sur la qualité du CV",
    "quality": 85 // Note globale sur 100
  },
  "strengths": [
    {
      "aspect": "Point fort spécifique",
      "details": "Détails sur ce point fort"
    }
  ],
  "formattingFeedback": [
    {
      "section": "Partie du CV concernée",
      "issue": "Description du problème de formatage",
      "recommendation": "Suggestion pour résoudre ce problème",
      "severity": "high" // critical, high, medium, low
    }
  ],
  "contentFeedback": [
    {
      "section": "Partie du CV concernée",
      "issue": "Description du problème de contenu (ex: dates incorrectes)",
      "recommendation": "Suggestion pour résoudre ce problème",
      "severity": "medium" // critical, high, medium, low
    }
  ],
  "improvementSuggestions": [
    "Suggestion d'amélioration 1",
    "Suggestion d'amélioration 2"
  ]
}
`;