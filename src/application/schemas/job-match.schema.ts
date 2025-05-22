import { z } from 'zod';

// Define individual schemas
const CompetenceTypes = z.enum(['Compétence', 'Expérience', 'Formation', 'Langue']);
const SeverityTypes = z.enum(['élevée', 'moyenne', 'faible']);

const ScoreSchema = z.number().min(0).max(100);

const CorrespondanceSchema = z.object({
  competences: ScoreSchema,
  experience: z.boolean(),
  formation: z.boolean(),
  langues: ScoreSchema,
});

const AlertSchema = z.object({
  type: CompetenceTypes,
  probleme: z.string(),
  severite: SeverityTypes,
  score: ScoreSchema.optional(),
});

// New Tunisian market specific schemas
const SalaireSchema = z.object({
  min: z.number().min(0),
  max: z.number().min(0),
  devise: z.string(),
});

const MarcheTunisienSchema = z.object({
  fourchetteSalariale: SalaireSchema,
  potentielDEmbauche: z.string(),
  competencesDemandees: z.array(z.string()),
  tempsEstimeRecrutement: z.string(),
});

const AnalysisResultSchema = z.object({
  score: ScoreSchema,
  correspondance: CorrespondanceSchema,
  suggestions: z.array(z.string()),
  matchedKeywords: z.array(z.string()),
  highlightsToStandOut: z.array(z.string()),
  marcheTunisien: MarcheTunisienSchema.optional(),
});

const JobMatchResponseSchema = z.object({
  resume: AnalysisResultSchema,
  signauxAlerte: z.array(AlertSchema),
});

// Export types and schemas
export type CompetenceType = z.infer<typeof CompetenceTypes>;
export type SeverityType = z.infer<typeof SeverityTypes>;
export type Alert = z.infer<typeof AlertSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type JobMatchResponse = z.infer<typeof JobMatchResponseSchema>;
export type MarcheTunisien = z.infer<typeof MarcheTunisienSchema>;
export type Salaire = z.infer<typeof SalaireSchema>;

export {
  AlertSchema,
  AnalysisResultSchema,
  JobMatchResponseSchema,
  CompetenceTypes,
  SeverityTypes,
  MarcheTunisienSchema,
  SalaireSchema,
};