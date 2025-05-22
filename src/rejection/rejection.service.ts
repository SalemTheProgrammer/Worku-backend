import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Application, ApplicationDocument } from '../schemas/application.schema';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { RejectionData, DEFAULT_REJECTION_REASONS_FR } from './types/rejection.types';
import { GeminiClientService } from '../services/gemini-client.service';
import { EmailService } from '../email/email.service';
import { createRejectionMessagePrompt } from '../prompts/rejection-message.prompt';
import { generateRejectionEmailTemplate } from '../email-templates/rejection-email.template';

interface PopulatedApplication extends Omit<ApplicationDocument, 'candidat' | 'poste' | 'companyId'> {
  candidat: {
    _id: string;
    fullName: string;
    email: string;
    skills?: any[];
    experience?: any[];
    education?: any[];
  };
  poste: {
    _id: string;
    titre: string;
    description: string;
    exigences?: string[];
    competencesRequises?: string[];
    experienceRequise?: string;
  };
  companyId: {
    _id: string;
    nom: string;
    logo?: string;
  };
}

@Injectable()
export class RejectionService {
  private readonly logger = new Logger(RejectionService.name);

  constructor(
    @InjectModel(Application.name) private applicationModel: Model<ApplicationDocument>,
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private geminiClientService: GeminiClientService,
    private emailService: EmailService,
  ) {}

  /**
   * Reject an application and send a personalized rejection email
   * @param rejectionData The rejection data including reason and optional notes
   * @returns Promise with the result of the operation
   */
  async rejectApplication(rejectionData: RejectionData): Promise<{ success: boolean; message: string }> {
    try {
      const { applicationId, reason, notes } = rejectionData;
      
      // Find the application and populate related data
      const application = await this.applicationModel.findById(applicationId)
        .populate('candidat')
        .populate('poste')
        .populate('companyId')
        .exec() as unknown as PopulatedApplication;
      
      if (!application) {
        throw new NotFoundException(`Application with ID ${applicationId} not found`);
      }
      
      // Extract relevant data needed for the immediate operations
      const candidateId = application.candidat._id;
      
      // Update application status to rejected and set isRejected flag immediately
      application.statut = 'rejeté';
      application.isRejected = true; // Set the isRejected flag
      await application.save();
      
      // Add the application to the candidate's rejectedApplications list
      await this.candidateModel.findByIdAndUpdate(
        candidateId,
        { 
          $addToSet: { rejectedApplications: applicationId } 
        },
        { new: true }
      );
      
      // Return success response immediately
      const response = {
        success: true,
        message: `La candidature a été rejetée et le candidat sera notifié`,
      };
      
      // Process email in the background
      this.processRejectionEmailInBackground(application, reason, notes)
        .catch(error => {
          this.logger.error(`Error processing rejection email: ${error.message}`, error.stack);
        });
      
      return response;
    } catch (error) {
      this.logger.error(`Error rejecting application: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  /**
   * Process the rejection email generation and sending in the background
   * This allows the API to return a response immediately while handling time-consuming tasks separately
   */
  private async processRejectionEmailInBackground(
    application: PopulatedApplication, 
    reason: string, 
    notes?: string
  ): Promise<void> {
    try {
      // Extract relevant data for the rejection message
      const candidateProfile = application.candidat;
      const jobDetails = application.poste;
      const companyDetails = application.companyId;
      
      // Get the rejection reason label
      const rejectionReasonObj = DEFAULT_REJECTION_REASONS_FR.find(r => r.id === reason);
      if (!rejectionReasonObj) {
        throw new Error(`Invalid rejection reason: ${reason}`);
      }
      
      // Prepare data for Gemini prompt
      const promptData = {
        candidateName: candidateProfile.fullName || 'Candidat',
        jobTitle: jobDetails.titre || 'le poste',
        companyName: companyDetails.nom || 'Worku', // Default to Worku instead of "notre entreprise"
        rejectionReason: rejectionReasonObj.label,
        rejectionNotes: notes,
        candidateProfile: {
          fullName: candidateProfile.fullName,
          email: candidateProfile.email,
          skills: candidateProfile.skills || [],
          experience: candidateProfile.experience || [],
          education: candidateProfile.education || [],
        },
        jobDetails: {
          title: jobDetails.titre,
          description: jobDetails.description,
          requirements: jobDetails.exigences || [],
          skills: jobDetails.competencesRequises || [],
          experienceRequired: jobDetails.experienceRequise,
        },
      };
      
      // Generate personalized rejection message using Gemini AI
      this.logger.log(`Generating rejection message for application ${application._id}`);
      const prompt = createRejectionMessagePrompt(promptData);
      const rejectionMessage = await this.geminiClientService.generateContent(prompt);
      
      // Create email content
      const emailData = {
        candidateName: promptData.candidateName,
        jobTitle: promptData.jobTitle,
        companyName: promptData.companyName,
        rejectionMessage,
      };
      
      const emailHtml = generateRejectionEmailTemplate(emailData);
      
      // Send the rejection email using the proper method
      await this.emailService.sendRejectionEmail(
        candidateProfile.email,
        `Réponse concernant votre candidature pour ${promptData.jobTitle}`,
        emailHtml
      );
      
      this.logger.log(`Rejection email sent successfully to ${candidateProfile.email}`);
    } catch (error) {
      this.logger.error(`Error in background email processing: ${error.message}`, error.stack);
      // We don't throw here as this is a background process
    }
  }
  
  /**
   * Get all available rejection reasons
   * @returns List of rejection reasons
   */
  getRejectionReasons() {
    return DEFAULT_REJECTION_REASONS_FR;
  }
}