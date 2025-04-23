import { Injectable, HttpException, HttpStatus, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { OtpService } from '../otp/otp.service';
import { GeminiService } from '../services/gemini.service';
import { TokenPayload } from '../interfaces/user.interface';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { ProfileSuggestionsResponseDto } from './dto/profile-suggestions.dto';

@Injectable()
export class CandidateService {
  // --- Helper Methods ---
  private generateTokens(candidate: CandidateDocument): { access_token: string; refresh_token: string } {
    const payload = { userId: candidate._id, email: candidate.email, role: 'candidate' };
    return {
      access_token: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.secret'),
        expiresIn: this.configService.get('jwt.expiresIn'),
      }),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.get('jwt.refreshSecret'),
        expiresIn: this.configService.get('jwt.refreshExpiresIn'),
      }),
    };
  }

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private configService: ConfigService,
    private geminiService: GeminiService,
  ) {}

  // --- Profile Suggestions ---
  async generateProfileSuggestions(userId: string): Promise<ProfileSuggestionsResponseDto> {
    const candidate = await this.candidateModel.findById(userId).select('-password');
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const profileData = {
      userId, // Add userId to the profile data
      education: candidate.education,
      experience: candidate.experience,
      skills: candidate.skills,
      certifications: candidate.certifications,
      professionalStatus: candidate.professionalStatus,
      workPreferences: candidate.workPreferences,
      industryPreferences: candidate.industryPreferences,
      yearsOfExperience: candidate.yearsOfExperience,
      country: candidate.country,
      city: candidate.city
    };

    try {
      const suggestions = await this.geminiService.generateProfileSuggestions(profileData);
      return suggestions;
    } catch (error) {
      console.error('Profile suggestions error:', error);
      throw new HttpException(
        'Failed to generate profile suggestions',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Calculate profile progression percentage
  async calculateProfileProgression(userId: string): Promise<{ percentage: number }> {
    const candidate = await this.candidateModel.findById(userId).select('-password');
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    let percentage = 0;

    // Check CV (30%)
    if (candidate.cvUrl) {
      percentage += 30;
    }

    // Check personal information (20%)
    const personalInfoFields = [
      candidate.firstName,
      candidate.lastName,
      candidate.phone,
      candidate.dateOfBirth,
      candidate.address,
      candidate.city,
      candidate.country
    ];
    const filledPersonalFields = personalInfoFields.filter(field => field !== undefined && field !== null && field !== '').length;
    const personalInfoPercentage = (filledPersonalFields / personalInfoFields.length) * 20;
    percentage += personalInfoPercentage;

    // Check education (25%)
    if (candidate.education && candidate.education.length > 0) {
      percentage += 25;
    }

    // Check experience (25%)
    if (candidate.experience && candidate.experience.length > 0) {
      percentage += 25;
    }

    return { percentage: Math.round(percentage) };
  }

  // --- Authentication ---
  async register(registerCandidateDto: RegisterCandidateDto): Promise<void> {
    const { email, password } = registerCandidateDto;

    const existingCandidate = await this.candidateModel.findOne({ email });
    if (existingCandidate) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const candidate = new this.candidateModel({
      ...registerCandidateDto,
      password: hashedPassword,
    });

    await candidate.save();
    await this.otpService.sendOtp(email);
  }

  async verifyOtp(verifyCandidateOtpDto: VerifyCandidateOtpDto): Promise<{ message: string }> {
    const { email, otp } = verifyCandidateOtpDto;
    await this.otpService.verifyOtp(email, otp);
    await this.candidateModel.updateOne({ email }, { isVerified: true });
    return { message: 'OTP verified successfully' };
  }

  async login(loginCandidateDto: LoginCandidateDto): Promise<{ access_token: string; refresh_token: string }> {
    const { email, password } = loginCandidateDto;
    const candidate = await this.candidateModel.findOne({ email });
    if (!candidate) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    if (!candidate.isVerified) {
      throw new HttpException('Please verify your email first', HttpStatus.UNAUTHORIZED);
    }
    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid credentials', HttpStatus.UNAUTHORIZED);
    }
    const tokens = this.generateTokens(candidate);
    await this.candidateModel.updateOne({ _id: candidate._id }, { lastLoginAt: new Date() });
    return tokens;
  }

  async refreshToken(user: TokenPayload): Promise<{ access_token: string }> {
    try {
      const candidate = await this.candidateModel.findById(user.userId);
      if (!candidate) {
        throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
      }
      const access_token = this.jwtService.sign(
        { userId: candidate._id, email: candidate.email, role: 'candidate' },
        { secret: this.configService.get('jwt.secret'), expiresIn: this.configService.get('jwt.expiresIn') }
      );
      return { access_token };
    } catch {
      throw new HttpException('Invalid refresh token', HttpStatus.UNAUTHORIZED);
    }
  }

  // --- Profile Management ---
  async getProfile(userId: string): Promise<Omit<Candidate, 'password'>> {
    const candidate = await this.candidateModel.findById(userId).select('-password');
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  async updatePersonalInfo(userId: string, updatePersonalInfoDto: UpdatePersonalInfoDto): Promise<Omit<Candidate, 'password'>> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    Object.assign(candidate, updatePersonalInfoDto);
    if (updatePersonalInfoDto.location) {
      Object.assign(candidate, updatePersonalInfoDto.location);
    }
    candidate.updatedAt = new Date();

    await candidate.save();
    return candidate.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } });
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<Omit<Candidate, 'password'>> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    Object.assign(candidate, {
      ...updateProfileDto,
      jobTitle: updateProfileDto.professionalStatus,
      country: updateProfileDto.location?.country,
      city: updateProfileDto.location?.city,
      updatedAt: new Date()
    });

    await candidate.save();
    return candidate.toObject({ transform: (doc, ret) => { delete ret.password; return ret; } });
  }

  // --- Experience Management ---
  async addExperience(userId: string, createExperienceDto: CreateExperienceDto): Promise<any> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    const objectId = new Types.ObjectId();
    const experience = {
      _id: objectId.toString(),
      ...createExperienceDto,
      startDate: new Date(createExperienceDto.startDate),
      endDate: createExperienceDto.endDate ? new Date(createExperienceDto.endDate) : undefined
    };
    candidate.experience.push(experience);

    await candidate.save();
    return { id: experience._id };
  }

  async updateExperience(userId: string, experienceId: string, updateExperienceDto: UpdateExperienceDto): Promise<void> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    const experienceIndex = candidate.experience.findIndex(e => e._id === experienceId);
    if (experienceIndex === -1) {
      throw new NotFoundException('Experience not found');
    }
    candidate.experience[experienceIndex] = {
      _id: experienceId,
      ...updateExperienceDto,
      startDate: new Date(updateExperienceDto.startDate),
      endDate: updateExperienceDto.endDate ? new Date(updateExperienceDto.endDate) : undefined
    };

    await candidate.save();
  }

  async deleteExperience(userId: string, experienceId: string): Promise<void> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    const experienceIndex = candidate.experience.findIndex(e => e._id === experienceId);
    if (experienceIndex === -1) {
      throw new NotFoundException('Experience not found');
    }
    candidate.experience.splice(experienceIndex, 1);

    await candidate.save();
  }
  // --- Account Management ---
  async deleteAccount(userId: string, password: string): Promise<void> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    const isPasswordValid = await bcrypt.compare(password, candidate.password);
    if (!isPasswordValid) {
      throw new HttpException('Invalid password', HttpStatus.UNAUTHORIZED);
    }

    // Clean up uploaded files
    const userUploadPath = `uploads/${userId}`;
    if (require('fs').existsSync(userUploadPath)) {
      require('fs').rmSync(userUploadPath, { recursive: true, force: true });
    }

    // Delete the candidate document
    await this.candidateModel.findByIdAndDelete(userId);
  }
}