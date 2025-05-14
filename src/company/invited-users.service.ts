import { Injectable, ConflictException, NotFoundException, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { Company, CompanyDocument } from '../schemas/company.schema';
import { InviteUserDto } from './dto/invite-user.dto';
import { ResendInvitationDto } from './dto/resend-invitation.dto';
import { EmailService } from '../email/email.service';
import { InvitationEmailData } from '../email/interfaces/invitation-email.interface';

@Injectable()
export class InvitedUsersService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService
  ) {}

  async getCompanyById(companyId: string): Promise<CompanyDocument> {
    const company = await this.companyModel.findById(companyId).exec();
    if (!company) {
      throw new NotFoundException('Entreprise non trouvée');
    }
    return company;
  }

  async inviteUser(companyId: string, inviteUserDto: InviteUserDto): Promise<CompanyDocument> {
    const company = await this.getCompanyById(companyId);
    
    const { email, nomDeUtilisateur } = inviteUserDto;
    const normalizedEmail = email.toLowerCase().trim();

    if (company.invitedUsers?.some(user => user.email.toLowerCase() === normalizedEmail)) {
      throw new ConflictException('Cet utilisateur est déjà invité');
    }

    const existingCompanyOwner = await this.companyModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    });
    
    if (existingCompanyOwner) {
      throw new ConflictException('Cet email est déjà utilisé par une entreprise principale');
    }

    try {
      const candidateModel = this.companyModel.db.model('Candidate');
      const existingCandidate = await candidateModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
      if (existingCandidate) {
        throw new ConflictException('Cet email est déjà utilisé par un candidat');
      }
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      console.warn("Could not check candidate email during invite:", error.message);
    }

    if (!company.invitedUsers) {
      company.invitedUsers = [];
    }

    company.invitedUsers.push({
      email: normalizedEmail,
      nomDeUtilisateur,
      isAccepted: false
    });

    const savedCompany = await company.save();

    try {
      const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3000');
      const loginUrl = `${backendUrl}/auth/login`;
      
      let companyLogo: string | undefined;
      if (savedCompany.logo) {
        companyLogo = savedCompany.logo.startsWith('http')
          ? savedCompany.logo
          : `${backendUrl}/uploads/${savedCompany.logo}`;
      }

      const invitationData: InvitationEmailData = {
        userName: nomDeUtilisateur,
        userEmail: normalizedEmail,
        companyName: savedCompany.nomEntreprise,
        companyLogo,
        loginUrl
      };

      await this.emailService.sendInvitationEmail(normalizedEmail, invitationData);
      console.log(`Welcome email sent successfully to: ${normalizedEmail}`);
    } catch (error) {
      console.error(`Failed to send welcome email to ${normalizedEmail}:`, error);
    }

    return savedCompany;
  }

  async revokeInvitedUser(companyId: string, emailToRevoke: string): Promise<CompanyDocument> {
    const company = await this.getCompanyById(companyId);

    const normalizedEmailToRevoke = emailToRevoke.toLowerCase().trim();
    const initialLength = company.invitedUsers?.length ?? 0;
    
    company.invitedUsers = company.invitedUsers?.filter(
      user => user.email.toLowerCase() !== normalizedEmailToRevoke
    ) ?? [];

    if (company.invitedUsers.length === initialLength) {
      throw new NotFoundException(`Utilisateur invité avec l'email ${emailToRevoke} non trouvé`);
    }

    await company.save();
    console.log(`User ${emailToRevoke} revoked successfully from company ${companyId}`);
    return company;
  }

  async resendInvitation(companyId: string, email: string)  {
    const company = await this.getCompanyById(companyId);
    const normalizedEmail = email.toLowerCase().trim();

    const invitedUser = company.invitedUsers?.find(
      user => user.email.toLowerCase() === normalizedEmail
    );

    if (!invitedUser) {
      throw new NotFoundException('Utilisateur invité non trouvé');
    }

    try {
      const backendUrl = this.configService.get<string>('BACKEND_URL', 'http://localhost:3000');
      const loginUrl = `${backendUrl}/auth/login`;

      let companyLogo: string | undefined;
      if (company.logo) {
        companyLogo = company.logo.startsWith('http')
          ? company.logo
          : `${backendUrl}/uploads/${company.logo}`;
      }

      const invitationData: InvitationEmailData = {
        userName: invitedUser.nomDeUtilisateur,
        userEmail: normalizedEmail,
        companyName: company.nomEntreprise,
        companyLogo,
        loginUrl
      };

      await this.emailService.sendInvitationEmail(normalizedEmail, invitationData);
      console.log(`Welcome email resent successfully to: ${normalizedEmail}`);
    } catch (error) {
      console.error(`Failed to resend welcome email to ${normalizedEmail}:`, error);
      throw new HttpException(
        'Failed to resend welcome email',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
      return company;
    }
  }
}

export interface InvitedUsersServiceInterface {
  getCompanyById(companyId: string): Promise<CompanyDocument>;
  inviteUser(companyId: string, inviteUserDto: InviteUserDto): Promise<CompanyDocument>;
  revokeInvitedUser(companyId: string, emailToRevoke: string): Promise<CompanyDocument>;
  resendInvitation(companyId: string, email: string): Promise<CompanyDocument>;
}