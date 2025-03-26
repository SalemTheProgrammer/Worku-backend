import { Injectable, Inject, forwardRef, HttpException, HttpStatus } from '@nestjs/common';
import { OtpService } from '../otp/otp.service';
import { AuthService } from '../auth/auth.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { Response } from 'express';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate } from '../schemas/candidate.schema';
import { TokenPayload, UserRole } from '../interfaces/user.interface';
import * as bcrypt from 'bcrypt';
import axios from 'axios';

@Injectable()
export class CandidateService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>,
    private readonly otpService: OtpService,
    @Inject(forwardRef(() => AuthService))
    private readonly authService: AuthService,
  ) {}

  async register(registerCandidateDto: RegisterCandidateDto): Promise<void> {
    try {
      const { email, firstName, lastName, password } = registerCandidateDto;

      // Check if email is already used by a candidate
      const existingCandidate = await this.candidateModel.findOne({ email });
      if (existingCandidate) {
        throw new HttpException('Cet email est déjà utilisé par un candidat', HttpStatus.CONFLICT);
      }

      // Check if email is used by a company
      const companyModel = this.candidateModel.db.model('Company');
      const existingCompany = await companyModel.findOne({ email });
      if (existingCompany) {
        throw new HttpException('Cet email est déjà utilisé par une entreprise', HttpStatus.CONFLICT);
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const newCandidate = new this.candidateModel({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        isVerified: false,
      });

      await newCandidate.save();
      await this.otpService.generateOtp(email, { type: 'registration' });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async verifyOtp(verifyCandidateOtpDto: VerifyCandidateOtpDto): Promise<{ message: string }> {
    try {
      const { email, otp } = verifyCandidateOtpDto;
      const isValid = await this.otpService.verifyOtp(email, otp);
      
      if (!isValid) {
        throw new HttpException('Code OTP invalide ou expiré', HttpStatus.BAD_REQUEST);
      }

      await this.candidateModel.updateOne({ email }, { $set: { isVerified: true } });
      return { message: 'Compte vérifié avec succès' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async login(loginCandidateDto: LoginCandidateDto): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = loginCandidateDto;
    const candidate = await this.candidateModel.findOne({ email });
    
    if (!candidate) {
      throw new HttpException('Email ou mot de passe incorrect', HttpStatus.UNAUTHORIZED);
    }
    
    if (!candidate.isVerified) {
      throw new HttpException('Compte non vérifié', HttpStatus.FORBIDDEN);
    }

    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) {
      throw new HttpException('Email ou mot de passe incorrect', HttpStatus.UNAUTHORIZED);
    }

    try {
      const payload: TokenPayload = {
        userId: candidate.id,
        email: candidate.email,
        role: UserRole.CANDIDATE,
      };

      const tokens = await this.authService.generateTokens(payload);
      
      // Update last login
      candidate.lastLoginAt = new Date();
      await candidate.save();

      return {
        access_token: tokens.accessToken,
        refresh_token: tokens.refreshToken,
      };
    } catch (error) {
      throw new HttpException('Erreur lors de la génération du token', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async refreshToken(user: any): Promise<{ access_token: string }> {
    try {
      const tokens = await this.authService.generateTokens({
        userId: user.userId,
        email: user.email,
        role: UserRole.CANDIDATE,
      });

      return { access_token: tokens.accessToken };
    } catch (error) {
      throw new HttpException('Erreur lors du rafraîchissement du token', HttpStatus.UNAUTHORIZED);
    }
  }

  async getProfile(userId: string): Promise<Omit<Candidate, 'password'>> {
    try {
      const candidate = await this.candidateModel.findById(userId).select('-password').lean();
      if (!candidate) {
        throw new HttpException('Candidat non trouvé', HttpStatus.NOT_FOUND);
      }

      return candidate;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async updateProfile(userId: string, updateCandidateProfileDto: UpdateCandidateProfileDto): Promise<Omit<Candidate, 'password'>> {
    try {
      const isProfileComplete = !!(
        updateCandidateProfileDto.jobTitle &&
        updateCandidateProfileDto.phone &&
        updateCandidateProfileDto.city &&
        updateCandidateProfileDto.country
      );

      const candidate = await this.candidateModel.findByIdAndUpdate(
        userId,
        {
          $set: {
            ...updateCandidateProfileDto,
            profileCompleted: isProfileComplete
          }
        },
        { new: true, lean: true }
      ).select('-password');

      if (!candidate) {
        throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
      }

      return candidate;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // ... rest of the methods remain unchanged ...

  async disconnect(userId: string): Promise<void> {
    try {
      const candidate = await this.candidateModel.findByIdAndUpdate(
        userId,
        { $set: { lastLoginAt: new Date() } },
        { new: true }
      );
      
      if (!candidate) {
        throw new HttpException('Candidat non trouvé', HttpStatus.NOT_FOUND);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}