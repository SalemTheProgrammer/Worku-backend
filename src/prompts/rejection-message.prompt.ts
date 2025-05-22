/**
 * Prompt for generating personalized rejection messages using Gemini AI
 */
export function createRejectionMessagePrompt(data: {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  rejectionReason: string;
  rejectionNotes?: string;
  candidateProfile: any;
  jobDetails: any;
}): string {
  const {
    candidateName,
    jobTitle,
    companyName,
    rejectionReason,
    rejectionNotes,
    candidateProfile,
    jobDetails,
  } = data;

  return `
Tu es un expert en ressources humaines spécialisé dans la rédaction de messages de refus professionnels, empathiques et constructifs.

CONTEXTE:
- Entreprise: ${companyName}
- Poste concerné: ${jobTitle}
- Candidat: ${candidateName}
- Raison principale du refus: ${rejectionReason}
${rejectionNotes ? `- Notes supplémentaires sur le refus: ${rejectionNotes}` : ''}

DÉTAILS DU POSTE:
${JSON.stringify(jobDetails, null, 2)}

PROFIL DU CANDIDAT:
${JSON.stringify(candidateProfile, null, 2)}

ANALYSE DE L'ÉCART:
La candidature a été rejetée pour la raison suivante: "${rejectionReason}"
${rejectionNotes ? `Détails supplémentaires fournis par le recruteur: "${rejectionNotes}"` : ''}
Ton rôle est d'expliquer cette décision de manière empathique et constructive.

TÂCHE:
Rédige un message de refus personnalisé en français pour ce candidat qui:
1. Exprime de la gratitude pour l'intérêt porté au poste
2. Explique poliment et avec tact pourquoi la candidature n'a pas été retenue, en se basant SPÉCIFIQUEMENT sur la raison principale fournie
3. Établit un lien clair entre les exigences du poste et le profil du candidat pour justifier la décision
4. Propose des conseils constructifs et spécifiques basés sur les lacunes identifiées
5. Encourage le candidat dans sa recherche d'emploi future
6. Reste professionnel, empathique et respectueux

IMPORTANT:
- Le message doit être personnalisé en fonction du profil spécifique du candidat et des exigences précises du poste
- Le message doit CLAIREMENT mentionner la raison du refus tout en restant respectueux
- Le message doit être rédigé en français
- Évite tout langage discriminatoire ou qui pourrait avoir des implications légales
- N'invente pas de détails qui ne sont pas fournis dans les informations ci-dessus
- Le message ne doit pas dépasser 300-400 mots
- Ne pas inclure de salutations initiales ni de formules de politesse finales, seulement le corps du message

Rédige uniquement le corps du message, sans titre ni signature.
`;
}