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
    try {
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
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
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
      // Check if required profile fields are filled
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

  async linkLinkedIn(userId: string, linkedinUrl: string): Promise<{ message: string }> {
    try {
      await this.candidateModel.findByIdAndUpdate(userId, { $set: { linkedinUrl } });
      return { message: 'Profil LinkedIn lié avec succès' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async linkGitHub(userId: string, githubUrl: string): Promise<{ message: string }> {
    try {
      await this.candidateModel.findByIdAndUpdate(userId, { $set: { githubUrl } });
      return { message: 'Profil GitHub lié avec succès' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async linkedinLogin(res: Response): Promise<void> {
    try {
      const linkedinAuthUrl = 'https://www.linkedin.com/oauth/v2/authorization';
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/candidate/linkedin/callback';
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const scope = 'r_emailaddress r_liteprofile';
      const state = Math.random().toString(36).substring(7);

      const url = `${linkedinAuthUrl}?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
      res.redirect(url);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async linkedinCallback(req: any, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
      const clientId = process.env.LINKEDIN_CLIENT_ID;
      const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
      const redirectUri = process.env.LINKEDIN_REDIRECT_URI || 'http://localhost:3000/candidate/linkedin/callback';

      // Exchange code for access token
      const tokenResponse = await axios.post(tokenEndpoint, null, {
        params: {
          grant_type: 'authorization_code',
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user profile
      const profileResponse = await axios.get('https://api.linkedin.com/v2/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profile = profileResponse.data;
      const email = emailResponse.data.elements[0]['handle~'].emailAddress;

      // Find or create candidate
      let candidate = await this.candidateModel.findOne({ email });

      if (!candidate) {
        candidate = await this.candidateModel.create({
          email,
          firstName: profile.localizedFirstName,
          lastName: profile.localizedLastName,
          linkedinUrl: `https://www.linkedin.com/in/${profile.id}`,
          isVerified: true,
        });
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens({
        userId: candidate.id,
        email: candidate.email,
        role: UserRole.CANDIDATE,
      });

      // Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`);
    } catch (error) {
      console.error('LinkedIn callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Échec de l\'authentification avec LinkedIn')}`);
    }
  }

  async githubLogin(res: Response): Promise<void> {
    try {
      const githubAuthUrl = 'https://github.com/login/oauth/authorize';
      const redirectUri = process.env.GITHUB_REDIRECT_URI || 'http://localhost:3000/candidate/github/callback';
      const clientId = process.env.GITHUB_CLIENT_ID;
      const scope = 'read:user user:email';
      const state = Math.random().toString(36).substring(7);

      const url = `${githubAuthUrl}?client_id=${clientId}&redirect_uri=${redirectUri}&state=${state}&scope=${scope}`;
      res.redirect(url);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  async githubCallback(req: any, res: Response): Promise<void> {
    try {
      const { code } = req.query;
      const tokenEndpoint = 'https://github.com/login/oauth/access_token';
      const clientId = process.env.GITHUB_CLIENT_ID;
      const clientSecret = process.env.GITHUB_CLIENT_SECRET;

      // Exchange code for access token
      const tokenResponse = await axios.post(tokenEndpoint, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }, {
        headers: {
          Accept: 'application/json',
        },
      });

      const accessToken = tokenResponse.data.access_token;

      // Get user profile
      const profileResponse = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      // Get user email
      const emailsResponse = await axios.get('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const profile = profileResponse.data;
      const primaryEmail = emailsResponse.data.find(email => email.primary).email;

      // Find or create candidate
      let candidate = await this.candidateModel.findOne({ email: primaryEmail });

      if (!candidate) {
        const names = profile.name ? profile.name.split(' ') : ['', ''];
        candidate = await this.candidateModel.create({
          email: primaryEmail,
          firstName: names[0] || profile.login,
          lastName: names[1] || '',
          githubUrl: profile.html_url,
          isVerified: true,
        });
      }

      // Generate tokens
      const tokens = await this.authService.generateTokens({
        userId: candidate.id,
        email: candidate.email,
        role: UserRole.CANDIDATE,
      });

      // Redirect to frontend with tokens
      res.redirect(`${process.env.FRONTEND_URL}/auth/success?access_token=${tokens.accessToken}&refresh_token=${tokens.refreshToken}`);
    } catch (error) {
      console.error('GitHub callback error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth/error?message=${encodeURIComponent('Échec de l\'authentification avec GitHub')}`);
    }
  }

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