import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Otp } from './interfaces/otp.interface';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private transporter: nodemailer.Transporter;

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
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    await this.otpModel.findOneAndUpdate(
      { email },
      { 
        email,
        otp,
        expiresAt,
        verified: false
      },
      { upsert: true }
    );

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
    
    // Add logging to debug the verification attempt
    console.log('Verifying OTP:', {
      email: normalizedEmail,
      otp,
      currentTime: new Date()
    });

    const otpRecord = await this.otpModel.findOne({ 
      email: normalizedEmail,
      otp,
      expiresAt: { $gt: new Date() },
      verified: false
    });

    // Add logging to see what was found
    console.log('OTP Record found:', otpRecord);

    if (!otpRecord) {
      throw new HttpException('Invalid or expired OTP', HttpStatus.BAD_REQUEST);
    }

    // Mark OTP as verified
    await this.otpModel.findByIdAndUpdate(otpRecord._id, { verified: true });
  }
}
