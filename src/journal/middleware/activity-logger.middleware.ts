import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { CompanyJournalService } from '../services/company-journal.service';
import { CandidateJournalService } from '../services/candidate-journal.service';
import { CompanyActionType, CandidateActionType } from '../enums/action-types.enum';

/**
 * Extended Request interface with user information
 */
interface RequestWithUser extends Request {
  user?: {
    type?: 'company' | 'candidate';
    companyId?: string;
    candidateId?: string;
    userId?: string;
  };
  startTime?: number;
}

/**
 * Middleware to log user activities for both candidates and companies
 * This middleware captures HTTP requests and logs relevant actions
 * based on URL patterns and request methods
 */
@Injectable()
export class ActivityLoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger(ActivityLoggerMiddleware.name);

  constructor(
    private readonly candidateJournalService: CandidateJournalService,
    private readonly companyJournalService: CompanyJournalService,
  ) {}

  async use(req: RequestWithUser, res: Response, next: NextFunction) {
    // Original URL before any manipulations
    const originalUrl = req.originalUrl;
    
    // Track the request start time
    req.startTime = Date.now();
    
    // Continue with the request
    next();
    
    // After the request is processed
    res.on('finish', async () => {
      try {
        // Don't log activity for non-successful responses
        if (res.statusCode >= 400) {
          return;
        }
        
        // Extract user information from the request
        const user = req.user;
        
        if (!user) return;
        
        const ipAddress = req.ip || req.connection.remoteAddress || '0.0.0.0';
        
        // Calculate response time
        const responseTime = Date.now() - (req.startTime || Date.now());
        
        // Determine user type and log appropriate activity
        if (user.type === 'candidate' && user.candidateId) {
          await this.logCandidateActivity(user.candidateId, req, ipAddress, responseTime);
        } else if (user.type === 'company' && user.companyId) {
          await this.logCompanyActivity(user.companyId, req, ipAddress, user.userId, responseTime);
        }
      } catch (error) {
        // Don't let activity logging errors affect the application
        this.logger.error(`Error logging activity: ${error.message}`, error.stack);
      }
    });
  }

  /**
   * Logs activity for candidate users
   * @param candidateId ID of the candidate
   * @param req Request object
   * @param ipAddress IP address of the request
   * @param responseTime Time taken to process the request in ms
   */
  private async logCandidateActivity(
    candidateId: string,
    req: RequestWithUser,
    ipAddress: string,
    responseTime: number
  ) {
    const { method, originalUrl, body } = req;
    
    // Map routes to action types
    let actionType: CandidateActionType | undefined;
    let details: Record<string, any> = {
      method,
      path: originalUrl,
      responseTime,
      statusCode: req.res?.statusCode
    };
    let message: string | undefined;
    
    // Login/Logout
    if (originalUrl.includes('/auth/login')) {
      actionType = CandidateActionType.CONNEXION;
      message = 'Connexion au compte';
    } else if (originalUrl.includes('/auth/logout')) {
      actionType = CandidateActionType.DECONNEXION;
      message = 'Déconnexion du compte';
    }
    // Profile updates
    else if (method === 'PUT' && originalUrl.includes('/profile')) {
      actionType = CandidateActionType.MISE_A_JOUR_PROFIL;
      message = 'Mise à jour du profil';
      details.updates = this.sanitizeBody(body);
    }
    // Job applications
    else if (method === 'POST' && originalUrl.includes('/job/') && originalUrl.includes('/apply')) {
      actionType = CandidateActionType.ENVOI_CANDIDATURE;
      const jobId = this.extractIdFromUrl(originalUrl, '/job/');
      message = `Candidature envoyée pour le poste ${jobId}`;
      details.jobId = jobId;
    }
    // Experience
    else if (originalUrl.includes('/experience')) {
      if (method === 'POST') {
        actionType = CandidateActionType.AJOUT_EXPERIENCE;
        message = 'Ajout d\'une nouvelle expérience professionnelle';
      } else if (method === 'PUT') {
        actionType = CandidateActionType.MODIFICATION_EXPERIENCE;
        message = 'Modification d\'une expérience professionnelle';
      } else if (method === 'DELETE') {
        actionType = CandidateActionType.SUPPRESSION_EXPERIENCE;
        message = 'Suppression d\'une expérience professionnelle';
      }
      details.experienceData = this.sanitizeBody(body);
    }
    // Education
    else if (originalUrl.includes('/education')) {
      if (method === 'POST') {
        actionType = CandidateActionType.AJOUT_FORMATION;
        message = 'Ajout d\'une nouvelle formation';
      } else if (method === 'PUT') {
        actionType = CandidateActionType.MODIFICATION_FORMATION;
        message = 'Modification d\'une formation';
      } else if (method === 'DELETE') {
        actionType = CandidateActionType.SUPPRESSION_FORMATION;
        message = 'Suppression d\'une formation';
      }
      details.educationData = this.sanitizeBody(body);
    }
    // Certification
    else if (originalUrl.includes('/certification')) {
      if (method === 'POST') {
        actionType = CandidateActionType.AJOUT_CERTIFICATION;
        message = 'Ajout d\'une nouvelle certification';
      } else if (method === 'PUT') {
        actionType = CandidateActionType.MODIFICATION_CERTIFICATION;
        message = 'Modification d\'une certification';
      } else if (method === 'DELETE') {
        actionType = CandidateActionType.SUPPRESSION_CERTIFICATION;
        message = 'Suppression d\'une certification';
      }
      details.certificationData = this.sanitizeBody(body);
    }
    // Skills
    else if (originalUrl.includes('/skills')) {
      actionType = CandidateActionType.MISE_A_JOUR_COMPETENCES;
      message = 'Mise à jour des compétences';
      details.skillsData = this.sanitizeBody(body);
    }
    // CV download/upload
    else if (originalUrl.includes('/cv') || originalUrl.includes('/resume')) {
      actionType = CandidateActionType.TELECHARGEMENT_CV;
      message = 'Téléchargement ou mise à jour du CV';
    }
    
    // Only log if we identified an action type
    if (actionType && message) {
      try {
        await this.candidateJournalService.logActivity(
          candidateId,
          actionType,
          details,
          message,
          ipAddress,
        );
      } catch (error) {
        this.logger.warn(`Failed to log candidate activity: ${error.message}`);
      }
    }
  }

  /**
   * Logs activity for company users
   * @param companyId ID of the company
   * @param req Request object
   * @param ipAddress IP address of the request
   * @param userId Optional ID of the specific user
   * @param responseTime Time taken to process the request in ms
   */
  private async logCompanyActivity(
    companyId: string,
    req: RequestWithUser,
    ipAddress: string,
    userId?: string,
    responseTime?: number
  ) {
    const { method, originalUrl, body } = req;
    
    // Map routes to action types
    let actionType: CompanyActionType | undefined;
    let details: Record<string, any> = {
      method,
      path: originalUrl,
      responseTime,
      statusCode: req.res?.statusCode
    };
    let message: string | undefined;
    
    // Login/Logout
    if (originalUrl.includes('/auth/login')) {
      actionType = CompanyActionType.CONNEXION;
      message = 'Connexion au compte entreprise';
    } else if (originalUrl.includes('/auth/logout')) {
      actionType = CompanyActionType.DECONNEXION;
      message = 'Déconnexion du compte entreprise';
    }
    // Profile updates
    else if (method === 'PUT' && originalUrl.includes('/profile')) {
      actionType = CompanyActionType.MODIFICATION_PROFIL_ENTREPRISE;
      message = 'Mise à jour du profil entreprise';
      details.updates = this.sanitizeBody(body);
    }
    // Job postings
    else if (originalUrl.includes('/job')) {
      if (method === 'POST') {
        actionType = CompanyActionType.CREATION_OFFRE_EMPLOI;
        message = 'Création d\'une nouvelle offre d\'emploi';
      } else if (method === 'PUT' || method === 'PATCH') {
        actionType = CompanyActionType.MODIFICATION_OFFRE_EMPLOI;
        message = 'Modification d\'une offre d\'emploi';
      } else if (method === 'DELETE') {
        actionType = CompanyActionType.SUPPRESSION_OFFRE_EMPLOI;
        message = 'Suppression d\'une offre d\'emploi';
      }
      details.jobData = this.sanitizeBody(body);
    }
    // View candidate profile
    else if (method === 'GET' && originalUrl.includes('/candidate/')) {
      actionType = CompanyActionType.CONSULTATION_PROFIL_CANDIDAT;
      const candidateId = this.extractIdFromUrl(originalUrl, '/candidate/');
      message = `Consultation du profil du candidat ${candidateId}`;
      details.candidateId = candidateId;
    }
    // Interview scheduling
    else if (originalUrl.includes('/interview')) {
      if (method === 'POST') {
        actionType = CompanyActionType.PLANIFICATION_ENTRETIEN;
        message = 'Planification d\'un entretien';
      } else if (method === 'PUT' || method === 'PATCH') {
        actionType = CompanyActionType.MODIFICATION_ENTRETIEN;
        message = 'Modification d\'un entretien';
      } else if (method === 'DELETE') {
        actionType = CompanyActionType.ANNULATION_ENTRETIEN;
        message = 'Annulation d\'un entretien';
      }
      details.interviewData = this.sanitizeBody(body);
    }
    // Application status changes
    else if (originalUrl.includes('/application/') && (method === 'PUT' || method === 'PATCH')) {
      actionType = CompanyActionType.CHANGEMENT_STATUT_CANDIDATURE;
      const applicationId = this.extractIdFromUrl(originalUrl, '/application/');
      message = `Changement de statut pour la candidature ${applicationId}`;
      details.applicationId = applicationId;
      details.statusChange = this.sanitizeBody(body);
    }
    // User invitations
    else if (originalUrl.includes('/invite') && method === 'POST') {
      actionType = CompanyActionType.INVITATION_UTILISATEUR;
      message = 'Invitation d\'un utilisateur';
      details.invitationData = this.sanitizeBody(body);
    }
    
    // Only log if we identified an action type
    if (actionType && message) {
      try {
        await this.companyJournalService.logActivity(
          companyId,
          actionType,
          details,
          message,
          ipAddress,
          userId,
        );
      } catch (error) {
        this.logger.warn(`Failed to log company activity: ${error.message}`);
      }
    }
  }

  /**
   * Sanitizes request body to remove sensitive information
   * @param body Request body
   * @returns Sanitized body object
   */
  private sanitizeBody(body: any): any {
    if (!body) return {};
    
    // Create a deep copy of the body to avoid modifying the original
    const sanitized = JSON.parse(JSON.stringify(body));
    
    // Remove sensitive fields
    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'Authorization',
      'auth',
      'key',
      'apiKey',
      'access_token',
      'refresh_token'
    ];
    
    // Function to recursively sanitize objects
    const sanitizeObject = (obj: any) => {
      if (!obj || typeof obj !== 'object') return;
      
      Object.keys(obj).forEach(key => {
        if (sensitiveFields.includes(key) || key.toLowerCase().includes('password')) {
          obj[key] = '[REDACTED]';
        } else if (typeof obj[key] === 'object') {
          sanitizeObject(obj[key]);
        }
      });
    };
    
    sanitizeObject(sanitized);
    return sanitized;
  }

  private extractIdFromUrl(url: string, prefix: string): string {
    const parts = url.split('/');
    const prefixParts = prefix.split('/').filter(p => p.length > 0);
    
    for (let i = 0; i < parts.length - prefixParts.length; i++) {
      let match = true;
      
      for (let j = 0; j < prefixParts.length; j++) {
        if (parts[i + j] !== prefixParts[j]) {
          match = false;
          break;
        }
      }
      
      if (match && i + prefixParts.length < parts.length) {
        return parts[i + prefixParts.length];
      }
    }
    
    return '';
  }
}