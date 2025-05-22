import { ProfileData } from './profile-data.interface';

/**
 * Template function for creating profile suggestions prompt
 * @param profileData The profile data to base suggestions on
 * @returns The prompt string
 */
export function createProfileSuggestionsPrompt(profileData: ProfileData): string {
  return `
Tu es un assistant RH spécialisé dans l'optimisation de profils professionnels.
Analyse les données du profil ci-dessous et suggère des améliorations pertinentes.

Basé sur l'expérience, les compétences et les préférences du candidat, propose :
- Des rôles professionnels adaptés
- Des compétences à développer pour progresser
- Des industries prometteuses selon son profil
- Des localisations stratégiques pour sa carrière
- Des certifications pertinentes à obtenir

Répond uniquement avec un JSON structuré comme ceci :
{
  "suggestions": {
    "role": ["Liste de rôles recommandés"],
    "skills": ["Liste de compétences à acquérir"],
    "industries": ["Liste d'industries prometteuses"],
    "locations": ["Liste de lieux stratégiques"],
    "certifications": ["Liste de certifications recommandées"]
  }
}

Profil du candidat :
${JSON.stringify(profileData, null, 2)}
`;
}