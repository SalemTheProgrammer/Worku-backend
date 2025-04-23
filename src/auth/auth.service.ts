import { Injectable, UnauthorizedException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { TokenPayload, Tokens } from '../interfaces/user.interface';
import { OtpService } from '../otp/otp.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private otpService: OtpService,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async initiateLogin(email: string): Promise<void> {
    try {
      // Check database connection first
      try {
        await this.companyModel.findOne().limit(1);
        console.log('Database connection successful');
      } catch (error) {
        console.error('Database connection error:', error);
        throw new InternalServerErrorException('Erreur de connexion à la base de données');
      }

      // Normalize email
      const normalizedEmail = email.toLowerCase().trim();
      console.log('Initiating login for email:', normalizedEmail);

      // Find company with case-insensitive email match
      const company = await this.companyModel.findOne({
        email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
      });
      
      console.log('Company lookup result:', company ? 'Found' : 'Not found');

      if (!company) {
        throw new BadRequestException('Cette entreprise n\'existe pas');
      }

      if (!company.verified) {
        throw new BadRequestException('Cette entreprise n\'est pas encore vérifiée');
      }

      // Send OTP
      await this.otpService.sendOtp(normalizedEmail);
      console.log('OTP sent successfully');

    } catch (error) {
      console.error('Login initiation error:', error);
      if (error instanceof BadRequestException || error instanceof InternalServerErrorException) {
        throw error;
      }
      throw new InternalServerErrorException('Erreur lors de l\'initiation de la connexion');
    }
  }

  async verifyLoginOtp(email: string, otp: string): Promise<void> {
    try {
      console.log('Verifying OTP for email:', email);
      await this.otpService.verifyOtp(email, otp);
      console.log('OTP verification successful');
    } catch (error) {
      console.error('OTP verification error:', error);
      throw new UnauthorizedException('Code OTP invalide ou expiré');
    }
  }


  async generateTokens(payload: TokenPayload): Promise<Tokens> {
    try {
      console.log('Generating tokens for user:', payload.email);
      
      const [accessToken, refreshToken] = await Promise.all([
        this.jwtService.signAsync(
          payload,
          {
            secret: this.configService.get('jwt.secret'),
            expiresIn: this.configService.get('jwt.expiresIn'),
          }
        ),
        this.jwtService.signAsync(
          payload,
          {
            secret: this.configService.get('jwt.refreshSecret'),
            expiresIn: this.configService.get('jwt.refreshExpiresIn'),
          }
        ),
      ]);

      console.log('Tokens generated successfully');
      return { accessToken, refreshToken };
    } catch (error) {
      console.error('Token generation error:', error);
      throw new InternalServerErrorException('Erreur lors de la génération des tokens');
    }
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      console.log('Attempting to refresh tokens');
      
      const payload = await this.jwtService.verifyAsync<TokenPayload>(
        refreshToken,
        {
          secret: this.configService.get('jwt.refreshSecret'),
        }
      );

      // Verify company still exists and is verified
      const company = await this.companyModel.findOne({
        email: payload.email,
        verified: true
      });

      if (!company) {
        throw new UnauthorizedException('Entreprise non trouvée ou non vérifiée');
      }

      return this.generateTokens({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
      });
    } catch (error) {
      console.error('Token refresh error:', error);
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      console.log('Verifying token');
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
      console.log('Token verified successfully');
      return payload;
    } catch (error) {
      console.error('Token verification error:', error);
      throw new UnauthorizedException('Token invalide');
    }
  }

  private generateSessionMetadata() {
    const metadata = {
      lastLoginAt: new Date(),
      userAgent: 'web',
      ipAddress: '0.0.0.0',
    };
    console.log('Generated session metadata:', metadata);
    return metadata;
  }
}
