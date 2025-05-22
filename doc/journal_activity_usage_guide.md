# Guide d'Utilisation de l'API Journal d'Activités

Ce document explique comment utiliser l'API de journalisation d'activités pour suivre et récupérer les actions des utilisateurs.

## Authentification

Toutes les routes de l'API Journal nécessitent une authentification. Utilisez le token JWT obtenu lors de la connexion dans l'en-tête `Authorization`:

```
Authorization: Bearer votre_token_jwt
```

## API pour les Entreprises

### Récupérer le journal d'activités de l'entreprise

```
GET /api/company/journal
```

Cette route renvoie le journal d'activités de l'entreprise authentifiée.

#### Paramètres de requête

| Paramètre    | Type    | Description | Défaut |
|--------------|---------|-------------|--------|
| page         | number  | Numéro de page | 1 |
| limit        | number  | Nombre d'activités par page | 10 |
| actionTypes  | string[] | Types d'actions à filtrer | [] |
| startDate    | string  | Date de début (ISO) | null |
| endDate      | string  | Date de fin (ISO) | null |

#### Exemple de requête

```http
GET /api/company/journal?page=1&limit=10&actionTypes=connexion,création_offre_emploi&startDate=2025-01-01T00:00:00Z
```

#### Exemple de réponse

```json
{
  "activities": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "actionType": "création_offre_emploi",
      "timestamp": "2025-05-22T17:03:45.123Z",
      "message": "Création d'une nouvelle offre d'emploi",
      "details": {
        "method": "POST",
        "path": "/api/jobs/create",
        "jobData": {
          "title": "Développeur Frontend",
          "location": "Paris"
        }
      },
      "isSystem": false,
      "companyId": "60d21b4667d0d8992e610c84",
      "userId": "60d21b4667d0d8992e610c83"
    },
    // ... autres activités
  ],
  "total": 42,
  "page": 1,
  "limit": 10
}
```

## API pour les Candidats

### Récupérer le journal d'activités du candidat

```
GET /api/candidate/journal
```

Cette route renvoie le journal d'activités du candidat authentifié.

#### Paramètres de requête

| Paramètre    | Type    | Description | Défaut |
|--------------|---------|-------------|--------|
| page         | number  | Numéro de page | 1 |
| limit        | number  | Nombre d'activités par page | 10 |
| actionTypes  | string[] | Types d'actions à filtrer | [] |
| startDate    | string  | Date de début (ISO) | null |
| endDate      | string  | Date de fin (ISO) | null |

#### Exemple de requête

```http
GET /api/candidate/journal?page=1&limit=10&actionTypes=mise_à_jour_profil,envoi_candidature&startDate=2025-01-01T00:00:00Z
```

#### Exemple de réponse

```json
{
  "activities": [
    {
      "id": "60d21b4667d0d8992e610c85",
      "actionType": "envoi_candidature",
      "timestamp": "2025-05-22T17:03:45.123Z",
      "message": "Candidature envoyée pour le poste 60d21b4667d0d8992e610c84",
      "details": {
        "method": "POST",
        "path": "/api/jobs/60d21b4667d0d8992e610c84/apply",
        "jobId": "60d21b4667d0d8992e610c84"
      },
      "isSystem": false,
      "candidateId": "60d21b4667d0d8992e610c83"
    },
    // ... autres activités
  ],
  "total": 25,
  "page": 1,
  "limit": 10
}
```

## Types d'Actions

### Actions des entreprises

| Type d'action | Description |
|---------------|-------------|
| création_offre_emploi | Création d'une nouvelle offre d'emploi |
| modification_offre_emploi | Modification d'une offre d'emploi existante |
| suppression_offre_emploi | Suppression d'une offre d'emploi |
| consultation_profil_candidat | Consultation du profil d'un candidat |
| planification_entretien | Planification d'un entretien |
| modification_entretien | Modification d'un entretien |
| annulation_entretien | Annulation d'un entretien |
| changement_statut_candidature | Changement de statut d'une candidature |
| invitation_utilisateur | Invitation d'un utilisateur |
| modification_profil_entreprise | Modification du profil de l'entreprise |
| connexion | Connexion au compte |
| déconnexion | Déconnexion du compte |
| réception_candidature | Réception d'une nouvelle candidature |

### Actions des candidats

| Type d'action | Description |
|---------------|-------------|
| mise_à_jour_profil | Mise à jour du profil |
| ajout_expérience | Ajout d'une expérience professionnelle |
| modification_expérience | Modification d'une expérience professionnelle |
| suppression_expérience | Suppression d'une expérience professionnelle |
| ajout_formation | Ajout d'une formation |
| modification_formation | Modification d'une formation |
| suppression_formation | Suppression d'une formation |
| ajout_certification | Ajout d'une certification |
| modification_certification | Modification d'une certification |
| suppression_certification | Suppression d'une certification |
| mise_à_jour_compétences | Mise à jour des compétences |
| envoi_candidature | Envoi d'une candidature |
| retrait_candidature | Retrait d'une candidature |
| notification_acceptation | Notification d'acceptation d'une candidature |
| notification_rejet | Notification de rejet d'une candidature |
| téléchargement_cv | Téléchargement ou mise à jour du CV |
| connexion | Connexion au compte |
| déconnexion | Déconnexion du compte |

## Intégration dans l'Application

Le système de journalisation enregistre automatiquement les activités des utilisateurs lorsqu'ils interagissent avec l'application. Aucune action supplémentaire n'est nécessaire pour enregistrer les activités.