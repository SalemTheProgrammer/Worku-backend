export interface RejectionData {
  applicationId: string;
  reason: string; // Selected reason
  notes?: string;  // Optional notes
}

export interface RejectionReason {
  id: string;
  label: string;
}

export const DEFAULT_REJECTION_REASONS_FR: RejectionReason[] = [
  { id: 'profil_inadequat', label: 'Profil ne correspond pas aux exigences du poste' },
  { id: 'manque_experience', label: 'Manque d\'expérience pertinente' },
  { id: 'competences_insuffisantes', label: 'Compétences techniques insuffisantes' },
  { id: 'attentes_salariales', label: 'Attentes salariales trop élevées' },
  { id: 'inadequation_culturelle', label: 'Inadéquation culturelle avec l\'entreprise' },
  { id: 'candidature_incomplete', label: 'Candidature incomplète ou mal présentée' },
  { id: 'meilleur_candidat_selectionne', label: 'Meilleur candidat sélectionné' },
  { id: 'poste_pourvu_annule', label: 'Poste pourvu / annulé' },
  { id: 'non_reponse_candidat', label: 'Non réponse du candidat après contact' },
  { id: 'autre', label: 'Autre (à préciser dans les notes)' }
];

export interface RejectionEmailData {
  candidateName: string;
  jobTitle: string;
  companyName: string;
  rejectionReason: string;
  rejectionNotes?: string;
  candidateProfile: any; // Candidate profile data
  jobDetails: any; // Job posting details
}