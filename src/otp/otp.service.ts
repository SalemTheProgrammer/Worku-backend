import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './interfaces/otp.interface';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  public transporter: nodemailer.Transporter; // Make transporter public

  constructor(
    @InjectModel('Otp') private otpModel: Model<Otp>,
    private configService: ConfigService
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('email.host'),
      port: this.configService.get('email.port'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('email.user'),
        pass: this.configService.get('email.password'),
      },
    });
  }

  async sendOtp(email: string): Promise<void> {
    // Normalize email to ensure case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim();
    console.log('Generating OTP for:', normalizedEmail);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    // First invalidate any existing OTPs for this email
    await this.otpModel.updateMany(
      { email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } },
      { verified: true }
    );

    // Create new OTP record
    const otpDoc = new this.otpModel({
      email: normalizedEmail,
      otp,
      expiresAt,
      verified: false
    });

    await otpDoc.save();

    try {
      await this.transporter.sendMail({
        from: this.configService.get('email.from'),
        to: email,
        subject: 'Code de vérification Worku',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Votre code de vérification Worku</h2>
            <p>Voici votre code de vérification à 6 chiffres :</p>
            <h1 style="font-size: 32px; text-align: center; color: #2563eb; margin: 20px 0;">${otp}</h1>
            <p>Ce code expirera dans 10 minutes.</p>
            <p>Si vous n'avez pas demandé ce code, veuillez ignorer cet email.</p>
          </div>
        `
      });
      console.log(`OTP email sent successfully to ${email}`);
    } catch (error) {
      console.error('Failed to send OTP email:', error);
      throw new HttpException('Failed to send verification email', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async verifyOtp(email: string, otp: string): Promise<void> {
    // Normalize email to ensure case-insensitive matching
    const normalizedEmail = email.toLowerCase().trim();
    
    console.log('Starting OTP verification:', {
      email: normalizedEmail,
      otp,
      currentTime: new Date()
    });

    // Find all OTPs for this email to help with debugging
    const allOtps = await this.otpModel.find({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') }
    }).sort({ createdAt: -1 });

    console.log('All OTPs found:', allOtps.length);

    // Find valid OTP
    const otpRecord = await this.otpModel.findOne({
      email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') },
      otp,
      expiresAt: { $gt: new Date() },
      verified: false
    }).sort({ createdAt: -1 });  // Get the most recent OTP in case there are multiple

    // Enhanced logging for debugging
    console.log('OTP Verification Details:', {
      found: !!otpRecord,
      totalOtpsFound: allOtps.length,
      otpMatches: allOtps.some(record => record.otp === otp),
      expired: otpRecord ? otpRecord.expiresAt < new Date() : null,
      verified: otpRecord ? otpRecord.verified : null,
      providedOtp: otp,
      currentTime: new Date(),
      emailNormalized: normalizedEmail,
      mostRecentOtp: allOtps.length > 0 ? allOtps[0].otp : null,
      mostRecentOtpTimestamp: allOtps.length > 0 ? allOtps[0].expiresAt : null
    });

    if (!otpRecord) {
      console.log('OTP verification failed. Reasons:', {
        noValidOtp: !allOtps.length,
        allExpired: allOtps.every(record => record.expiresAt < new Date()),
        allVerified: allOtps.every(record => record.verified),
        noMatch: !allOtps.some(record => record.otp === otp)
      });
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Mark OTP as verified
    await this.otpModel.findByIdAndUpdate(otpRecord._id, { verified: true });
    console.log('OTP marked as verified successfully');
  }
}
