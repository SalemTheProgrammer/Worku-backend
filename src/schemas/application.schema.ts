import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema, Types } from 'mongoose';
import { Candidate } from './candidate.schema';
import { Job } from './job.schema';
import { Company } from './company.schema';

export type ApplicationDocument = Application & Document & {
  _id: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

@Schema({ timestamps: true })
export class Application {
  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Candidate', required: true })
  candidat: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Job', required: true })
  poste: Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Company', required: true })
  companyId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  datePostulation: Date;

  @Prop({ type: Date, required: false })
  dateAnalyse?: Date;

  @Prop({ 
    type: String, 
    enum: ['en_attente', 'analysé', 'présélectionné', 'rejeté'],
    default: 'en_attente'
  })
  statut: string;

  @Prop({ type: Boolean, default: false })
  isRejected: boolean;

  @Prop({
    type: {
      scoreDAdéquation: {
        global: Number,
        compétences: Number,
        expérience: Boolean,
        formation: Boolean,
        langues: Number
      },
      matchedKeywords: [String],
      highlightsToStandOut: [String],
      marchéTunisien: {
        fourchetteSalariale: {
          min: Number,
          max: Number,
          devise: String
        },
        potentielDEmbauche: String,
        compétencesDemandées: [String],
        tempsEstiméRecrutement: String
      },
      synthèseAdéquation: {
        recommandé: Boolean,
        niveauAdéquation: String,
        raison: String,
        détailsAdéquation: {
          adéquationCompétences: {
            niveau: String,
            détails: [String]
          },
          adéquationExpérience: {
            niveau: String,
            détails: [String]
          },
          adéquationFormation: {
            niveau: String,
            détails: [String]
          }
        }
      },
      recommandationsRecruteur: {
        décision: String,
        actionSuggérée: String,
        retourCandidat: [String]
      },
      signauxAlerte: [{
        type: {
          type: String,
          enum: ['Compétence', 'Expérience', 'Formation', 'Langue'],
          required: true
        },
        probleme: {
          type: String,
          required: true
        },
        severite: {
          type: String,
          enum: ['faible', 'moyenne', 'élevée'],
          required: true
        },
        score: {
          type: Number,
          required: true
        }
      }]
    },
    required: false
  })
  analyse?: {
    scoreDAdéquation: {
      global: number;
      compétences: number;
      expérience: boolean;
      formation: boolean;
      langues: number;
    };
    matchedKeywords: string[];
    highlightsToStandOut: string[];
    marchéTunisien?: {
      fourchetteSalariale: {
        min: number;
        max: number;
        devise: string;
      };
      potentielDEmbauche: string;
      compétencesDemandées: string[];
      tempsEstiméRecrutement: string;
    };
    synthèseAdéquation: {
      recommandé: boolean;
      niveauAdéquation: string;
      raison: string;
      détailsAdéquation: {
        adéquationCompétences: {
          niveau: string;
          détails: string[];
        };
        adéquationExpérience: {
          niveau: string;
          détails: string[];
        };
        adéquationFormation: {
          niveau: string;
          détails: string[];
        };
      };
    };
    recommandationsRecruteur: {
      décision: string;
      actionSuggérée: string;
      retourCandidat: string[];
    };
    signauxAlerte: Array<{
      type: string;
      probleme: string;
      severite: string;
      score: number;
    }>;
  };
}

export const ApplicationSchema = SchemaFactory.createForClass(Application);

// Add index on isRejected field for better query performance
ApplicationSchema.index({ isRejected: 1 });

// Add compound index on candidat and poste fields for better query performance
ApplicationSchema.index({ candidat: 1, poste: 1 });