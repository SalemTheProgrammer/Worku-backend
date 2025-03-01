import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { IOtpService } from './interfaces/otp.interface';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { generateOtpEmailTemplate } from '../email-templates/otp-verification.template';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class OtpService implements IOtpService, OnModuleInit, OnModuleDestroy {
  private readonly redis: Redis;
  private readonly otpExpiration: number;
  private readonly otpLength: number;
  private readonly logger = new Logger(OtpService.name);
  private readonly transporter: Transporter;

  constructor(
    private configService: ConfigService,
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {
    // Initialize Redis connection
    this.redis = new Redis({
      host: this.configService.get('redis.host'),
      port: this.configService.get('redis.port'),
      retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });
    this.otpExpiration = this.configService.get<number>('otp.expiresIn') ?? 300; // in seconds
    this.otpLength = this.configService.get<number>('otp.length') ?? 6;

    // Create a singleton nodemailer transporter
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: false,
      auth: {
        user: this.configService.get('email.user'),
        pass: this.configService.get('email.password'),
      },
    });
  }

  async onModuleInit() {
    try {
      await this.redis.ping();
      this.logger.log('Redis connection established');
    } catch (error) {
      this.logger.error('Failed to connect to Redis', error.stack);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }

  private generateOtpCode(): string {
    return Math.random().toString().slice(2, 2 + this.otpLength);
  }

  /**
   * Generates an OTP for the provided email, stores it along with the company details in Redis,
   * and sends the OTP email. No company is persisted to the database until verification.
   * If an OTP has already been sent and is still valid, it returns a message indicating so.
   */
  async generateOtp(email: string, company?: any): Promise<string> {
    const otpKey = `otp:${email}`;

    // Check if an OTP already exists and is still valid.
    const existingOtp = await this.redis.get(otpKey);
    if (existingOtp) {
      this.logger.log(`OTP already sent to ${email}. Please check your inbox.`);
      return 'Email OTP already sent. Please verify your inbox.';
    }

    // Generate new OTP since none exists or it has expired.
    const otp = this.generateOtpCode();
    await this.redis.set(otpKey, otp, 'EX', this.otpExpiration);

    // Only store company data if provided (for registration)
    if (company) {
      const companyKey = `company:${email}`;
      await this.redis.set(companyKey, JSON.stringify(company), 'EX', this.otpExpiration);
    }

    await this.sendOtpEmail(email, otp);
    return otp;
  }

  /**
   * Verifies the OTP for the given email. If correct, removes the temporary keys from Redis
   * and saves the company data to the database.
   */
  async verifyOtp(email: string, otp: string, isRegistration: boolean = false): Promise<boolean> {
    const otpKey = `otp:${email}`;
    const companyKey = `company:${email}`;

    const storedOtp = await this.redis.get(otpKey);
    const storedCompany = await this.redis.get(companyKey);
    
    // Verify OTP
    const isValid = storedOtp === otp;
    if (!isValid) {
      return false;
    }

    // Clean up Redis
    await this.redis.del(otpKey);
    if (storedCompany) {
      await this.redis.del(companyKey);
    }

    // For registration, save company data
    if (isRegistration && storedCompany) {
      try {
        const companyData = JSON.parse(storedCompany);
        const company = new this.companyModel({
          ...companyData,
          verified: true,
        });
        await company.save();
      } catch (error) {
        this.logger.error(`Failed to save company to database`, error.stack);
        return false;
      }
    }

    return true;
  }

  /**
   * Sends the OTP email using the pre-created transporter.
   */
  async sendOtpEmail(email: string, otp: string): Promise<void> {
    try {
      const expiresInMinutes = this.otpExpiration / 60;
      const emailContent = generateOtpEmailTemplate(otp, expiresInMinutes);

      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: email,
        subject: 'Code de vérification Worku',
        html: emailContent,
      });

      this.logger.log(`Email OTP envoyé à ${email}`);
    } catch (error) {
      this.logger.error(`Échec de l'envoi de l'email OTP à ${email}`, error.stack);
      throw new Error('Échec de l\'envoi de l\'email OTP');
    }
  }

  isEmailVerified(email: string): boolean {
    return false;
  }

  private cleanupOtpStorage(): void {
    // Not needed for Redis-based storage.
  }
}
