import { Injectable, ConflictException, BadRequestException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession } from 'mongoose';
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
  private readonly logger = new Logger(CompanyAuthService.name);

  constructor(
    @InjectModel(Company.name) private readonly companyModel: Model<Company>,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
    private readonly companyJournalService: CompanyJournalService,
  ) {}

  private createCompanyResponse(companyData: any, nomDeUtilisateur: string | null, role: UserRole): CompanyResponse {
    return {
      _id: companyData._id,
      nomDeUtilisateur: nomDeUtilisateur,
      nomUtilisateur: nomDeUtilisateur,
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
      remainingJobs: companyData.remainingJobs || 5,
      accountType: companyData.accountType || 'freemium-beta',
      createdAt: companyData.createdAt,
      updatedAt: companyData.updatedAt
    };
  }

  async registerCompany(registerCompanyDto: RegisterCompanyDto): Promise<void> {
    const { email, nomEntreprise, numeroRNE } = registerCompanyDto;
    const normalizedEmail = email.toLowerCase().trim();

    const session: ClientSession = await this.companyModel.db.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Check for existing company and candidate in parallel
        const [existingCompany, existingCandidate, existingRNE] = await Promise.all([
          this.companyModel.findOne({ 
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
          }).session(session),
          this.companyModel.db.model('Candidate').findOne({ 
            email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } 
          }).session(session),
          this.companyModel.findOne({ numeroRNE }).session(session)
        ]);

        if (existingCompany) {
          throw new ConflictException('Cet email est déjà utilisé par une entreprise');
        }

        if (existingCandidate) {
          throw new ConflictException('Cet email est déjà utilisé par un candidat');
        }

        if (existingRNE) {
          throw new ConflictException('Ce numéro RNE est déjà utilisé par une autre entreprise');
        }

        // Create the company document
        const companyData = {
          nomEntreprise,
          email: normalizedEmail,
          numeroRNE,
          verified: false,
          profileCompleted: false,
          invitedUsers: [],
          remainingJobs: 5,
          accountType: 'freemium-beta',
        };

        await this.companyModel.create([companyData], { session });
      });

      // Send OTP after successful company creation
      await this.otpService.sendOtp(normalizedEmail);
      this.logger.log(`Company registered successfully: ${normalizedEmail}`);
      
    } catch (error) {
      this.logger.error('Registration error:', error);

      if (error.code === 11000) {
        throw new ConflictException('Cet email est déjà utilisé par une entreprise');
      }

      if (error instanceof ConflictException || error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException('Erreur lors de l\'inscription de l\'entreprise');
    } finally {
      await session.endSession();
    }
  }

  async verifyCompany(verifyCompanyOtpDto: VerifyCompanyOtpDto) {
    const { email, otp } = verifyCompanyOtpDto;
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // Verify OTP first
      await this.otpService.verifyOtp(normalizedEmail, otp);
    } catch {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    // Update company verification status
    const company = await this.companyModel.findOneAndUpdate(
      { email: normalizedEmail },
      { verified: true, lastLoginAt: new Date() },
      { new: true }
    );

    if (!company) {
      throw new BadRequestException('Aucune inscription en attente trouvée pour cet email');
    }

    const tokens = await this.authService.generateTokens({
      userId: company.id,
      email: normalizedEmail,
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
      // Find company efficiently with single query
      const company = await this.companyModel.findOne({
        $or: [
          { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
          { 'invitedUsers.email': { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } }
        ]
      }).lean();

      if (!company) {
        throw new BadRequestException('Cette entreprise n\'existe pas');
      }

      if (!company.verified) {
        throw new BadRequestException('Cette entreprise n\'est pas encore vérifiée');
      }

      // Determine user type and role
      const isInvitedUser = company.email.toLowerCase() !== normalizedEmail;
      let userRole = UserRole.ADMIN;
      let nomDeUtilisateur = company.nomEntreprise;
      let invitedUser: any = null;

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

      // Verify OTP
      await this.otpService.verifyOtp(normalizedEmail, otp);

      // Update company status
      const updateData: any = { lastLoginAt: new Date() };
      if (isInvitedUser && invitedUser) {
        updateData['invitedUsers.$.isAccepted'] = true;
      }

      await this.companyModel.updateOne(
        isInvitedUser 
          ? { _id: company._id, 'invitedUsers.email': normalizedEmail }
          : { _id: company._id },
        updateData
      );
      
      // Log activity asynchronously
      this.companyJournalService.logActivity(
        company._id.toString(),
        CompanyActionType.CONNEXION,
        { isInvitedUser, userRole, nomDeUtilisateur },
        `Connexion réussie pour ${normalizedEmail}`
      ).catch(error => 
        this.logger.warn('Failed to log activity:', error)
      );

      const response = this.createCompanyResponse(company, nomDeUtilisateur, userRole);
      const tokens = await this.authService.generateTokens({
        userId: company._id.toString(),
        email: normalizedEmail,
        role: userRole,
        companyId: company._id.toString(),
      });

      return { company: response, tokens };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error('Login verification error:', error);
      throw new BadRequestException('Erreur lors de la vérification de connexion');
    }
  }
}