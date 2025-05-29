import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { RegisterCompanyDto, VerifyCompanyOtpDto } from './dto/register-company.dto';
import { VerifyLoginDto } from './dto/login-company.dto';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../interfaces/user.interface';
import { CompanyResponse } from '../interfaces/company-response.interface';
import { CompanyJournalService } from '../journal/services/company-journal.service';
import { CompanyActionType } from '../journal/enums/action-types.enum';

@Injectable()
export class CompanyAuthService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
    private readonly companyJournalService: CompanyJournalService,
  ) {}

  // Helper function to create the response object
  private createCompanyResponse(companyData: any, nomDeUtilisateur: string | null, role: UserRole): CompanyResponse {
    return {
      _id: companyData._id,
      nomDeUtilisateur: nomDeUtilisateur,
      nomUtilisateur: nomDeUtilisateur, // Add alias field
      role,
      nomEntreprise: companyData.nomEntreprise,
      email: companyData.email,
      secteurActivite: companyData.secteurActivite,
      tailleEntreprise: companyData.tailleEntreprise,
      phone: companyData.phone,
      adresse: companyData.adresse,
      siteWeb: companyData.siteWeb || null,
      reseauxSociaux: {
        linkedin: companyData.reseauxSociaux?.linkedin || null,
        instagram: companyData.reseauxSociaux?.instagram || null,
        facebook: companyData.reseauxSociaux?.facebook || null,
        x: companyData.reseauxSociaux?.x || null
      },
      description: companyData.description,
      activiteCles: companyData.activiteCles,
      logo: companyData.logo ? `/uploads/${companyData.logo}` : null,
      profileCompleted: companyData.profileCompleted,
      verified: companyData.verified,
      lastLoginAt: companyData.lastLoginAt,
      invitedUsers: companyData.invitedUsers,
      createdAt: companyData.createdAt,
      updatedAt: companyData.updatedAt
    };
  }

  async registerCompany(registerCompanyDto: RegisterCompanyDto): Promise<void> {
    const { email, nomEntreprise } = registerCompanyDto;

    try {
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Processing registration for:', normalizedEmail);

      // Check if company already exists using case-insensitive email check
      console.log('Checking for existing company with email:', email);
      const existingCompany = await this.companyModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });
      console.log('Existing company:', existingCompany);

      if (existingCompany) {
        throw new ConflictException('Cet email est déjà utilisé par une entreprise');
      }

      // Check if email is used by a candidate
      const candidateModel = this.companyModel.db.model('Candidate');
      const existingCandidate = await candidateModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });

      if (existingCandidate) {
        throw new ConflictException('Cet email est déjà utilisé par un candidat');
      }

      // Check if RNE number already exists
      const existingRNE = await this.companyModel.findOne({
        numeroRNE: registerCompanyDto.numeroRNE
      });

      if (existingRNE) {
        throw new ConflictException('Ce numéro RNE est déjà utilisé par une autre entreprise');
      }

      // Create the company document
      console.log('Creating new company:', { nomEntreprise, email, numeroRNE: registerCompanyDto.numeroRNE });
      const company = new this.companyModel({
        nomEntreprise,
        email: email.toLowerCase(), // Store email in lowercase
        numeroRNE: registerCompanyDto.numeroRNE,
        verified: false,
        profileCompleted: false,
        invitedUsers: [],
      });

      // Save to database
      await company.save();

      // Double-check the save was successful
      const savedCompany = await this.companyModel.findOne({
        email: email.toLowerCase()
      });

      if (!savedCompany) {
        console.error('Company save verification failed');
        throw new Error('Failed to save company');
      }

      console.log('Company saved successfully:', savedCompany);

      // Send OTP
      await this.otpService.sendOtp(email);
      console.log('OTP sent successfully to:', email);

    } catch (error) {
      console.error('Error in registerCompany:', error);

      if (error.code === 11000) {
        throw new ConflictException('Cet email est déjà utilisé par une entreprise');
      }

      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de l\'inscription de l\'entreprise');
    }
  }

  async verifyCompany(verifyCompanyOtpDto: VerifyCompanyOtpDto) {
    const { email, otp } = verifyCompanyOtpDto;
    try {
      await this.otpService.verifyOtp(email, otp);
    } catch {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    // Retrieve company from database after OTP verification
    const company = await this.companyModel.findOne({ email });
    if (!company) {
      throw new BadRequestException('Aucune inscription en attente trouvée pour cet email');
    }

    // Update company verification status
    company.verified = true;
    await company.save();

    const tokens = await this.authService.generateTokens({
      userId: company.id,
      email,
      role: UserRole.ADMIN,
      companyId: company.id,
    });

    return {
      company,
      tokens,
      needsProfileCompletion: !company.profileCompleted,
      nextStep: company.profileCompleted ? 'home' : 'complete-profile'
    };
  }

  async verifyLogin(verifyLoginDto: VerifyLoginDto): Promise<{
    company: CompanyResponse;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { email, otp } = verifyLoginDto;
    const normalizedEmail = email.toLowerCase().trim();

    console.log('Starting login verification for:', normalizedEmail);

    try {
      // First, find the company and validate user status
      console.log('Looking for company with email:', normalizedEmail);
      const company = await this.companyModel.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
          { 'invitedUsers.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
        ]
      });

      console.log('Company search result:', company ? 'Found' : 'Not found');
      if (!company) {
        throw new BadRequestException('Cette entreprise n\'existe pas');
      }

      if (!company.verified) {
        throw new BadRequestException('Cette entreprise n\'est pas encore vérifiée');
      }

      console.log('Checking if user is invited');
      const isInvitedUser = company.email.toLowerCase() !== normalizedEmail;
      console.log('Is invited user:', isInvitedUser);
      let userRole = UserRole.ADMIN;
      let nomDeUtilisateur = company.nomEntreprise;
      let invitedUser;

      if (isInvitedUser) {
        invitedUser = company.invitedUsers?.find(
          user => user.email.toLowerCase() === normalizedEmail
        );
        if (!invitedUser) {
          throw new BadRequestException('Cette entreprise n\'existe pas');
        }
        userRole = UserRole.USER;
        nomDeUtilisateur = invitedUser.nomDeUtilisateur;
      }

      // Then verify OTP
      console.log('Attempting OTP verification');
      try {
        await this.otpService.verifyOtp(normalizedEmail, otp);
        console.log('OTP verification successful');
      } catch (error) {
        console.error('OTP verification failed:', error);
        throw new UnauthorizedException('Code OTP invalide ou expiré');
      }

      // Update company and user status after successful OTP verification
      company.lastLoginAt = new Date();
      if (isInvitedUser && invitedUser) {
        invitedUser.isAccepted = true;
      }
      await company.save();
      
      // Log the login activity
      await this.companyJournalService.logActivity(
        company.id,
        CompanyActionType.CONNEXION,
        {
          isInvitedUser,
          userRole,
          nomDeUtilisateur
        },
        `Connexion réussie pour ${normalizedEmail}`
      );

      const companyData = company.toObject();
      const response = this.createCompanyResponse(companyData, nomDeUtilisateur, userRole);

      const tokens = await this.authService.generateTokens({
        userId: company.id,
        email: normalizedEmail,
        role: userRole,
        companyId: company.id,
      });

      return { company: response, tokens };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la vérification de connexion');
    }
  }
}