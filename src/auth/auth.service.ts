import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
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
    // Check if company exists first
    const company = await this.companyModel.findOne({ email });
    if (!company) {
      throw new BadRequestException('Cette entreprise n\'existe pas');
    }

    // Generate OTP for existing company
    await this.otpService.generateOtp(email, {});
  }

  async verifyLoginOtp(email: string, otp: string): Promise<boolean> {
    return this.otpService.verifyOtp(email, otp, false); // false for login verification
  }

  async generateTokens(payload: TokenPayload): Promise<Tokens> {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    ]);

    return { accessToken, refreshToken };
  }

  async refreshTokens(refreshToken: string): Promise<Tokens> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      return this.generateTokens({
        userId: payload.userId,
        email: payload.email,
        role: payload.role,
        companyId: payload.companyId,
      });
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async verifyToken(token: string): Promise<TokenPayload> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('jwt.secret'),
      });
    } catch {
      throw new UnauthorizedException('Token invalide');
    }
  }

  private generateSessionMetadata() {
    return {
      lastLoginAt: new Date(),
      userAgent: 'web', // Extend this to capture the actual user agent if needed
      ipAddress: '0.0.0.0', // Extend this to capture the actual IP address if needed
    };
  }
}
