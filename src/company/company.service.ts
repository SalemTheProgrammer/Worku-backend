import { Injectable, ConflictException, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Document, Types } from 'mongoose'; // Import Types
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateCompanySocialsDto } from './dto/update-company-socials.dto';
import { UpdateCompanyCoordinatesDto } from './dto/update-company-coordinates.dto';
import { InviteUserDto } from './dto/invite-user.dto';
import { RegisterCompanyDto, VerifyCompanyOtpDto } from './dto/register-company.dto';
import { VerifyLoginDto } from './dto/login-company.dto';
import { CompleteCompanyProfileDto } from './dto/complete-profile.dto';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../interfaces/user.interface';
import { CompanyResponse } from '../interfaces/company-response.interface';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  // Helper function to create the response object
  private createCompanyResponse(companyData: any, nomDeUtilisateur: string | null, role: UserRole): CompanyResponse {
    const response = {
      _id: companyData._id as Types.ObjectId,
      nomDeUtilisateur: nomDeUtilisateur,
      nomUtilisateur: nomDeUtilisateur, // Add alias field
      role,
      nomEntreprise: companyData.nomEntreprise,
      numeroRNE: companyData.numeroRNE,
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
    return response;
  }

  async registerCompany(registerCompanyDto: RegisterCompanyDto): Promise<void> {
    const { email, nomEntreprise, numeroRNE } = registerCompanyDto;

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

      // Check RNE separately
      console.log('Checking for existing RNE:', numeroRNE);
      const existingRNE = await this.companyModel.findOne({ numeroRNE });
      console.log('Existing RNE:', existingRNE);

      if (existingRNE) {
        throw new ConflictException('Ce numéro RNE est déjà utilisé');
      }

      // Check if email is used by a candidate
      const candidateModel = this.companyModel.db.model('Candidate');
      const existingCandidate = await candidateModel.findOne({
        email: { $regex: new RegExp(`^${email}$`, 'i') }
      });

      if (existingCandidate) {
        throw new ConflictException('Cet email est déjà utilisé par un candidat');
      }

      // Create the company document
      console.log('Creating new company:', { nomEntreprise, numeroRNE, email });
      const company = new this.companyModel({
        nomEntreprise,
        numeroRNE,
        email: email.toLowerCase(), // Store email in lowercase
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

    try {
      await this.otpService.verifyOtp(normalizedEmail, otp);

      const company = await this.companyModel.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
          { 'invitedUsers.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
        ]
      });

      if (!company) {
        throw new BadRequestException('Entreprise non trouvée');
      }

      if (!company.verified) {
        throw new BadRequestException('Cette entreprise n\'est pas encore vérifiée');
      }

      company.lastLoginAt = new Date();
      await company.save();

      const isInvitedUser = company.email !== normalizedEmail;
      let userRole = UserRole.ADMIN;
      let nomDeUtilisateur = company.nomEntreprise;

      if (isInvitedUser) {
        userRole = UserRole.USER;
        const invitedUser = company.invitedUsers?.find(
          user => user.email.toLowerCase() === normalizedEmail
        );
        if (!invitedUser) {
          throw new BadRequestException('Utilisateur invité non trouvé');
        }
        nomDeUtilisateur = invitedUser.nomDeUtilisateur;
        invitedUser.isAccepted = true;
        await company.save();
      }

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

  async inviteUser(companyId: string, inviteUserDto: InviteUserDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new NotFoundException('Entreprise non trouvée');
    }

    const { email, nomDeUtilisateur } = inviteUserDto;
    const normalizedEmail = email.toLowerCase();

    // Check if user is already invited
    if (company.invitedUsers?.some(user => user.email.toLowerCase() === normalizedEmail)) {
      throw new ConflictException('Cet utilisateur est déjà invité');
    }

    // Check if email is already used by a company
    const existingCompany = await this.companyModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    if (existingCompany) {
      throw new ConflictException('Cet email est déjà utilisé par une entreprise');
    }

    // Add user to invited users
    if (!company.invitedUsers) {
      company.invitedUsers = [];
    }

    company.invitedUsers.push({
      email: normalizedEmail,
      nomDeUtilisateur,
      isAccepted: false
    });

    await company.save();

    // Send OTP
    await this.otpService.sendOtp(email);

    return company;
  }

  async completeProfile(companyId: string, profileDto: CompleteCompanyProfileDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Check if all required profile fields are filled
    const isProfileComplete = !!(
      profileDto.secteurActivite &&
      profileDto.tailleEntreprise !== undefined &&
      profileDto.adresse &&
      profileDto.descriptionEntreprise &&
      profileDto.activitesClees?.length > 0
    );

    Object.assign(company, profileDto, {
      updatedAt: new Date(),
      profileCompleted: isProfileComplete
    });

    await company.save();
    return company;
  }

  async updateCompanyCoordinates(companyId: string, updateCoordinatesDto: UpdateCompanyCoordinatesDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Update company fields
    Object.assign(company, {
      phone: updateCoordinatesDto.phone,
      adresse: updateCoordinatesDto.adresse,
      nomDeUtilisateur: updateCoordinatesDto.nomUtilisateur || updateCoordinatesDto.nomDeUtilisateur || null,
      updatedAt: new Date()
    });

    await company.save();

    return company;
  }

  async updateCompanySocials(companyId: string, updateSocialsDto: UpdateCompanySocialsDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Handle social media links - ensure null values for undefined links
    if (updateSocialsDto.reseauxSociaux) {
      updateSocialsDto.reseauxSociaux = {
        linkedin: updateSocialsDto.reseauxSociaux.linkedin || null,
        instagram: updateSocialsDto.reseauxSociaux.instagram || null,
        facebook: updateSocialsDto.reseauxSociaux.facebook || null,
        x: updateSocialsDto.reseauxSociaux.x || null,
      };
    }

    // Update company fields
    Object.assign(company, updateSocialsDto, {
      updatedAt: new Date()
    });

    await company.save();

    return company;
  }

  async updateCompanyProfile(companyId: string, updateProfileDto: UpdateCompanyProfileDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    console.log('Received updateProfileDto:', updateProfileDto);

    // Transform secteurActivite to array if it's not already
    if (updateProfileDto.secteurActivite && !Array.isArray(updateProfileDto.secteurActivite)) {
      updateProfileDto.secteurActivite = Array.isArray(updateProfileDto.secteurActivite)
        ? updateProfileDto.secteurActivite
        : [updateProfileDto.secteurActivite];
    }

    // Normalize URL - add https:// if missing
    if (updateProfileDto.siteWeb && !updateProfileDto.siteWeb.startsWith('http')) {
      updateProfileDto.siteWeb = `https://${updateProfileDto.siteWeb}`;
    }

    console.log('Transformed updateProfileDto:', updateProfileDto);

    // Update company fields
    Object.assign(company, updateProfileDto, {
      updatedAt: new Date()
    });

    await company.save();

    // Transform response to ensure null values
    const result = company.toObject();

    // Ensure null values for social media links
    if (!result.reseauxSociaux) {
      result.reseauxSociaux = {
        linkedin: null,
        instagram: null,
        facebook: null,
        x: null
      };
    }

    // Ensure null value for website
    result.siteWeb = result.siteWeb || null;

    // Return the plain object, not the Mongoose document
    return result as Company;
  }

  async updateLogo(companyId: string, logoUrl: string | null): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.logo = logoUrl;
    await company.save();
    return company;
  }

  async disconnect(companyId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.lastLoginAt = new Date();
    await company.save();
  }

  async getCompanyProfile(email: string): Promise<CompanyResponse> {
    const company = await this.companyModel.findOne({
      $or: [
        { email: { $regex: new RegExp(`^${email}$`, 'i') } },
        { 'invitedUsers.email': { $regex: new RegExp(`^${email}$`, 'i') } }
      ]
    }).lean();

    if (!company) {
      throw new NotFoundException('Entreprise ou utilisateur non trouvé');
    }

    const isInvitedUser = company.email.toLowerCase() !== email.toLowerCase();
    let role = UserRole.ADMIN;
    let nomDeUtilisateur: string | null = company.email; // Use email as default username

    if (isInvitedUser) {
      const invitedUser = company.invitedUsers?.find(
        user => user.email.toLowerCase() === email.toLowerCase()
      );
      if (invitedUser) {
        role = UserRole.USER;
        nomDeUtilisateur = invitedUser.nomDeUtilisateur || null;
      }
    }

    return this.createCompanyResponse(company, nomDeUtilisateur, role);
  }
}
