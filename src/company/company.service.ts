import { Injectable, ConflictException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { RegisterCompanyDto, VerifyCompanyOtpDto } from './dto/register-company.dto';
import { VerifyLoginDto } from './dto/login-company.dto';
import { CompleteCompanyProfileDto } from './dto/complete-profile.dto';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';
import { UserRole } from '../interfaces/user.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class CompanyService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private readonly otpService: OtpService,
    private readonly authService: AuthService,
  ) {}

  async registerCompany(registerCompanyDto: RegisterCompanyDto): Promise<void> {
    const { email, nomEntreprise, numeroRNE } = registerCompanyDto;

    // Check if company already exists
    const existingCompany = await this.companyModel.findOne({
      $or: [{ email }, { numeroRNE }],
    });

    if (existingCompany) {
      throw new ConflictException('Cet email est déjà utilisé par une entreprise');
    }

    // Check if email is used by a candidate
    const candidateModel = this.companyModel.db.model('Candidate');
    const existingCandidate = await candidateModel.findOne({ email });

    if (existingCandidate) {
      throw new ConflictException('Cet email est déjà utilisé par un candidat');
    }

    // Create new company object
    const company = {
      nomEntreprise,
      numeroRNE,
      email,
      verified: false,
      profileCompleted: false
    };

    await this.otpService.generateOtp(email, company);
  }

  async verifyCompany(verifyCompanyOtpDto: VerifyCompanyOtpDto) {
    const { email, otp } = verifyCompanyOtpDto;
    const isValid = await this.otpService.verifyOtp(email, otp, true); // true for registration

    if (!isValid) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    // Retrieve company from database after OTP verification
    const company = await this.companyModel.findOne({ email });
      if (!company) {
        throw new BadRequestException('Aucune inscription en attente trouvée pour cet email');
      }

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
    company: Company;
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const { email, otp } = verifyLoginDto;

    // First verify OTP
    const isValid = await this.otpService.verifyOtp(email, otp, false); // false for login
    if (!isValid) {
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }

    // Then get company data
    const company = await this.companyModel.findOne({ email });
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.lastLoginAt = new Date();
    await company.save();

    const tokens = await this.authService.generateTokens({
      userId: company.id,
      email,
      role: UserRole.ADMIN,
      companyId: company.id,
    });

    return { company, tokens };
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

  // Helper method to check if a company is verified
  async isCompanyVerified(email: string): Promise<boolean> {
    const company = await this.companyModel.findOne({ email });
    return !!company;
  }

  // Helper method to get company profile
  async getCompanyProfile(email: string): Promise<Company | undefined> {
    const company = await this.companyModel.findOne({ email });
    return company || undefined;
  }

  async disconnect(companyId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.lastLoginAt = new Date();
    await company.save();
  }
}