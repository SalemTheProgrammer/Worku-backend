import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { Request as ExpressRequest } from 'express';
import { ApiTags, ApiOkResponse, ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { UpdatePersonalInfoDto } from './dto/update-personal-info.dto';
import { ProfileSuggestionsResponseDto } from './dto/profile-suggestions.dto';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('auth/candidate')
@ApiTags('candidate')

export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post('register')
  @ApiOperation({
    summary: 'Register new candidate',
    description: 'Register a new candidate account'
  })
  @ApiResponse({
    status: 201,
    description: 'Registration successful',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Inscription réussie. Veuillez vérifier le code OTP.'
        }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Email already exists' })
  async register(@Body() registerCandidateDto: RegisterCandidateDto) {
    try {
      await this.candidateService.register(registerCandidateDto);
      return { message: 'Inscription réussie. Veuillez vérifier le code OTP.' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify-otp')
  @ApiOperation({
    summary: 'Verify OTP code',
    description: 'Verify the OTP code sent after registration'
  })
  @ApiResponse({
    status: 200,
    description: 'OTP verified successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'OTP verified successfully' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid or expired OTP' })
  async verifyOtp(@Body() verifyCandidateOtpDto: VerifyCandidateOtpDto) {
    try {
      return await this.candidateService.verifyOtp(verifyCandidateOtpDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiOperation({
    summary: 'Candidate login',
    description: 'Login with email and password'
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        access_token: { type: 'string' },
        refresh_token: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid credentials' })
  async login(@Body() loginCandidateDto: LoginCandidateDto) {
    try {
      return await this.candidateService.login(loginCandidateDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get candidate profile',
    description: 'Get complete profile information for the authenticated candidate'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    schema: {
      properties: {
        personalInfo: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            profilePicture: { type: 'string' },
            phone: { type: 'string' },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string' },
                city: { type: 'string' }
              }
            },
            employmentStatus: {
              type: 'string',
              enum: ['Looking for a job', 'Open to new opportunities', 'Looking for an internship', 'Exploring options', 'Currently employed', 'Currently unemployed']
            },
            availabilityDate: {
              type: 'string',
              format: 'date'
            }
          }
        },
        experiences: { type: 'array' },
        stats: {
          type: 'object',
          properties: {
            experienceCount: { type: 'number' },
            educationCount: { type: 'number' },
            skillsCount: { type: 'number' },
            certificatesCount: { type: 'number' }
          }
        },
        profileCompletion: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Not Found - Profile not found' })
  async getProfile(@Request() req: RequestWithUser) {
    try {
      const profile = await this.candidateService.getProfile(req.user.userId);
      return {
        personalInfo: {
          firstName: profile.firstName,
          lastName: profile.lastName,
          email: profile.email,
          profilePicture: profile.profilePicture,
          phone: profile.phone,
          location: {
            country: profile.country,
            city: profile.city,
          },
          professionalStatus: profile.jobTitle,
          workPreferences: profile.workPreferences,
          employmentStatus: profile.employmentStatus,
          availabilityDate: profile.availabilityDate
        },
        experiences: profile.experience,
        stats: {
          experienceCount: profile.experience?.length || 0,
          educationCount: profile.education?.length || 0,
          skillsCount: profile.skills?.length || 0,
          certificatesCount: profile.certifications?.length || 0
        },
        profileCompletion: profile.profileCompletionScore,
        cvInfo: {
          exists: Boolean(profile.cvUrl),
          filename: profile.cvUrl,
        },
        isOpenToWork: profile.isOpenToWork,
        isProfilePublic: profile.isProfilePublic,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile/personal-info')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update candidate personal information',
    description: 'Update basic personal details like name, status, availability, etc.'
  })
  @ApiResponse({
    status: 200,
    description: 'Personal information updated successfully',
    schema: {
      properties: {
        message: { type: 'string' },
        data: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async updatePersonalInfo(@Request() req: RequestWithUser, @Body() updatePersonalInfoDto: UpdatePersonalInfoDto) {
    try {
      const result = await this.candidateService.updatePersonalInfo(req.user.userId, updatePersonalInfoDto);
      return { message: 'Personal information updated successfully', data: result };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/suggestions')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profile improvement suggestions',
    description: 'Get AI-powered suggestions to improve the candidate profile based on Tunisian market context'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile suggestions generated successfully',
    type: ProfileSuggestionsResponseDto
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Not Found - Profile not found' })
  async getProfileSuggestions(@Request() req: RequestWithUser): Promise<ProfileSuggestionsResponseDto> {
    try {
      return await this.candidateService.generateProfileSuggestions(req.user.userId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile/progression')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get profile progression',
    description: 'Get the profile completion percentage based on CV, personal info, education, and experience'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile progression calculated successfully',
    schema: {
      properties: {
        percentage: {
          type: 'number',
          description: 'Profile completion percentage',
          example: 75
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Not Found - Profile not found' })
  async getProfileProgression(@Request() req: RequestWithUser) {
    try {
      return await this.candidateService.calculateProfileProgression(req.user.userId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
  @UseGuards(JwtAuthGuard)
  @Delete('delete-account')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete candidate account',
    description: 'Permanently delete the candidate account and all associated data'
  })
  @ApiResponse({
    status: 200,
    description: 'Account deleted successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Account deleted successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid password' })
  @ApiResponse({ status: 404, description: 'Not Found - Account not found' })
  async deleteAccount(@Request() req: RequestWithUser, @Body() deleteAccountDto: DeleteAccountDto) {
    try {
      await this.candidateService.deleteAccount(req.user.userId, deleteAccountDto.password);
      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}
