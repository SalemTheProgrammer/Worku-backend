/**
 * Improved prompt for CV profile extraction with better JSON handling
 * @param cvContent The content of the CV to analyze
 * @returns The prompt string
 */
export function buildImprovedProfileExtractionPrompt(cvContent: string): string {
  return `
Tu es un expert en extraction de données de CV qui génère UNIQUEMENT du JSON valide.

TÂCHE: Extraire les données structurées de ce CV en français. Concentre-toi sur l'éducation, l'expérience, les certifications et les compétences.

TRÈS IMPORTANT: TOUT le contenu extrait doit être en français, même si le CV original est dans une autre langue. Traduis tous les noms d'entreprises, titres de postes, compétences, descriptions et autres informations en français.

RÈGLES STRICTES POUR LE FORMAT JSON:
1. Réponds UNIQUEMENT avec du JSON brut sans formatage markdown ni blocs de code
2. Ta réponse doit commencer par { et se terminer par }
3. Tous les noms de propriétés doivent être entre guillemets doubles
4. Toutes les valeurs de chaînes doivent être entre guillemets doubles
5. Évite les caractères de contrôle ou spéciaux qui pourraient casser le JSON
6. Assure-toi que toutes les chaînes sont correctement échappées (\\n, \\" etc.)
7. N'utilise pas de virgules après le dernier élément d'un objet ou d'un tableau
8. Pour les valeurs manquantes, utilise des chaînes vides ("") ou null plutôt que d'omettre le champ

Utilise exactement ce format:
{
  "education": [
    {
      "institution": "Nom de l'université",
      "degree": "Nom du diplôme",
      "fieldOfStudy": "Domaine d'étude",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "description": "Description optionnelle",
      "specialization": "Spécialisation optionnelle",
      "grade": "Mention optionnelle"
    }
  ],
  "experience": [
    {
      "company": "Nom de l'entreprise",
      "position": "Titre du poste",
      "location": "Lieu",
      "startDate": "YYYY-MM-DD",
      "endDate": "YYYY-MM-DD",
      "isCurrent": false,
      "description": "Description du poste",
      "skills": ["Compétence 1", "Compétence 2"],
      "achievements": ["Réalisation 1", "Réalisation 2"]
    }
  ],
  "certifications": [
    {
      "name": "Nom de la certification",
      "issuingOrganization": "Organisme émetteur",
      "issueDate": "YYYY-MM-DD",
      "expiryDate": "YYYY-MM-DD",
      "credentialId": "ID de certification optionnel",
      "credentialUrl": "URL de certification optionnelle",
      "description": "Description optionnelle",
      "skills": ["Compétence 1", "Compétence 2"]
    }
  ],
  "skills": [
    {
      "name": "Nom de la compétence",
      "category": "technical",
      "level": 5,
      "yearsOfExperience": 3,
      "isLanguage": false,
      "proficiencyLevel": "Intermédiaire"
    }
  ]
}

Pour la propriété "category" des compétences, utilise UNIQUEMENT une de ces valeurs exactes:
- "technical" (pour les compétences techniques)
- "soft" (pour les compétences interpersonnelles)
- "language" (pour les langues)
- "tool" (pour les outils spécifiques)
- "framework" (pour les frameworks)
- "database" (pour les bases de données)
- "other" (pour tout le reste)

Pour les langues, utilise une de ces valeurs exactes pour "proficiencyLevel":
- "Natif"
- "Professionnel"
- "Intermédiaire"
- "Débutant"

Si tu n'es pas sûr d'une valeur, utilise une valeur par défaut logique plutôt que de laisser un champ vide ou malformé.

EXEMPLES DE TRADUCTION:
- Position: "Software Engineer" → "Ingénieur Logiciel"
- Position: "Data Scientist" → "Scientifique des Données"
- Company: "Google" → "Google" (les noms d'entreprises restent généralement inchangés)
- Skill: "JavaScript" → "JavaScript" (les langages de programmation restent inchangés)
- Skill: "Leadership" → "Leadership"
- Description: "Developed a web application" → "Développement d'une application web"

RAPPEL: Tu dois absolument traduire tous les contenus textuels en français, y compris:
- Les titres de postes
- Les descriptions de postes
- Les domaines d'études
- Les noms de diplômes
- Les descriptions des compétences
- Les réalisations

Contenu du CV:
${cvContent}
`;
}