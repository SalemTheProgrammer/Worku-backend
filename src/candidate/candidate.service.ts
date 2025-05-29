import { Injectable, HttpException, HttpStatus, NotFoundException, UnauthorizedException, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { Skill } from '../schemas/skill.schema';
import { OtpService } from '../otp/otp.service';
import { ProfileSuggestionService } from '../services/profile-suggestion.service';
import { TokenPayload } from '../interfaces/user.interface';
import { EmailService } from '../email/email.service';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { ProfileSuggestionsResponseDto } from './dto/profile-suggestions.dto';

@Injectable()
export class CandidateService {
  private readonly logger = new Logger(CandidateService.name);  // --- Helper Methods ---
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
  /**
   * Validates and fixes skill objects to ensure they meet the schema requirements
   * Particularly focuses on ensuring proficiencyLevel is properly set
   * @param skills Array of skill objects to validate and fix
   * @returns Array of fixed skill objects
   */
  private validateAndFixSkills(skills: any[]): Skill[] {
    if (!skills || !Array.isArray(skills)) {
      return [];
    }

    let fixedSkillsCount = 0;
    const validatedSkills = skills.map(skill => {
      // Skip if skill is invalid
      if (!skill || typeof skill !== 'object') {
        return skill;
      }

      // For language skills, ensure proficiencyLevel is set to a valid value
      if (skill.isLanguage === true) {
        const validLevels = ['Natif', 'Professionnel', 'Intermédiaire', 'Débutant', 
                            'Native', 'Advanced', 'Intermediate', 'Beginner'];
        
        if (!skill.proficiencyLevel || !validLevels.includes(skill.proficiencyLevel)) {
          fixedSkillsCount++;
          this.logger.debug(`Fixed language skill: "${skill.name}" - Setting missing proficiencyLevel to "Intermédiaire"`);
          return {
            ...skill,
            proficiencyLevel: 'Intermédiaire' // Default to Intermediate level
          };
        }
      } 
      // For non-language skills, we should keep proficiencyLevel undefined, not set it to null
      else if (skill.proficiencyLevel === undefined) {
        fixedSkillsCount++;
        // Just return the skill as is, don't explicitly set proficiencyLevel to anything
        return skill;
      }
      
      return skill;
    });
    
    if (fixedSkillsCount > 0) {
      this.logger.log(`Fixed proficiencyLevel for ${fixedSkillsCount} skills`);
    }
    
    return validatedSkills as Skill[];
  }

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private configService: ConfigService,
    private profileSuggestionService: ProfileSuggestionService,
    private emailService: EmailService,
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
      professionalStatus: candidate.professionalStatus || 'NOT_AVAILABLE',
      workPreferences: candidate.workPreferences,
      industryPreferences: candidate.industryPreferences,
      yearsOfExperience: candidate.yearsOfExperience,
      country: candidate.country,
      city: candidate.city
    };

    try {
      const suggestions = await this.profileSuggestionService.generateProfileSuggestions(profileData);
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
    const { email, password, ...rest } = registerCandidateDto;

    const existingCandidate = await this.candidateModel.findOne({ email });
    if (existingCandidate) {
      throw new HttpException('Email already exists', HttpStatus.BAD_REQUEST);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Create candidate document with explicit undefined for phone
    const candidateData = {
      email,
      password: hashedPassword,
      firstName: rest.firstName,
      lastName: rest.lastName,
      employmentStatus: rest.employmentStatus,
      professionalStatus: rest.professionalStatus,
      availabilityDate: rest.availabilityDate,
      phone: undefined // Explicitly set phone to undefined
    };

    try {
      // Try to drop the phone index first
      try {
        await this.candidateModel.collection.dropIndex('phone_1');
      } catch (indexError) {
        // Ignore error if index doesn't exist
      }

      // Create and save the new candidate
      const candidate = new this.candidateModel(candidateData);
      await candidate.save();
      await this.otpService.sendOtp(email);
    } catch (error) {
      if (error.code === 11000) {
        // If we still get a duplicate key error, throw a more specific error
        throw new HttpException(
          'Unable to register candidate at this time. Please try again later.',
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
      throw error;
    }
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
  async deleteAccount(userId: string): Promise<void> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }

    // Clean up uploaded files
    const userUploadPath = `uploads/${userId}`;
    if (require('fs').existsSync(userUploadPath)) {
      require('fs').rmSync(userUploadPath, { recursive: true, force: true });
    }

    // Delete the candidate document
    await this.candidateModel.findByIdAndDelete(userId);
  }

  async requestPasswordReset(email: string): Promise<void> {
    const candidate = await this.candidateModel.findOne({ email });
    if (!candidate) {
      throw new NotFoundException('No account found with this email');
    }

    const token = this.jwtService.sign(
      { userId: candidate._id, email: candidate.email, type: 'password_reset' },
      {
        secret: this.configService.get('jwt.secret'),
        expiresIn: '1h'
      }
    );

    await this.emailService.sendPasswordResetEmail(email, token);
  }  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    try {
      const decoded = this.jwtService.verify(resetPasswordDto.token, {
        secret: this.configService.get('jwt.secret')
      }) as TokenPayload & { type: string };

      if (decoded.type !== 'password_reset') {
        throw new UnauthorizedException('Invalid reset token');
      }

      const candidate = await this.candidateModel.findById(decoded.userId);
      if (!candidate) {
        throw new NotFoundException('Candidate not found');
      }

      // Fix skills validation issue by ensuring all skills have a valid proficiencyLevel
      if (candidate.skills && Array.isArray(candidate.skills)) {
        this.logger.log(`Validating ${candidate.skills.length} skills for candidate ${candidate._id}`);
        candidate.skills = this.validateAndFixSkills(candidate.skills);
      }

      const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, 10);
      candidate.password = hashedPassword;
      
      try {
        await candidate.save();
        this.logger.log(`Password reset successful for candidate ${candidate._id}`);
      } catch (saveError) {
        this.logger.error(`Error saving candidate during password reset: ${saveError.message}`, saveError.stack);
        
        // If there's still a validation error, try a different approach
        if (saveError.name === 'ValidationError' && saveError.message.includes('proficiencyLevel')) {
          this.logger.warn('Still encountering validation errors, attempting direct update');
          
          // Update password directly with updateOne to bypass schema validation issues
          await this.candidateModel.updateOne(
            { _id: candidate._id },
            { $set: { password: hashedPassword } }
          );
          this.logger.log(`Password reset completed using direct update for candidate ${candidate._id}`);
        } else {
          // Re-throw any other errors
          throw saveError;
        }
      }
    } catch (error) {
      this.logger.error(`Password reset failed: ${error.message}`, error.stack);
      
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        throw new UnauthorizedException('Invalid or expired reset token');
      }
      throw error;
    }
  }
}