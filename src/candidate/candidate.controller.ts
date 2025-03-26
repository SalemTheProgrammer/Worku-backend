import { Controller, Post, Get, Put, Delete, Body, UseGuards, Request, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';

@Controller('auth/candidate')
@ApiTags('Candidate')
export class CandidateController {
  constructor(private readonly candidateService: CandidateService) {}

  @Post('register')
  @ApiCreatedResponse({ description: 'Candidate registered successfully.' })
  async register(@Body() registerCandidateDto: RegisterCandidateDto) {
    try {
      await this.candidateService.register(registerCandidateDto);
      return { message: 'Inscription réussie. Veuillez vérifier le code OTP.' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify-otp')
  @ApiOkResponse({ description: 'Candidate OTP verified successfully.' })
  async verifyOtp(@Body() verifyCandidateOtpDto: VerifyCandidateOtpDto) {
    try {
      return await this.candidateService.verifyOtp(verifyCandidateOtpDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiOkResponse({ description: 'Candidate logged in successfully.' })
  async login(@Body() loginCandidateDto: LoginCandidateDto) {
    try {
      return await this.candidateService.login(loginCandidateDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Delete('disconnect')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Candidate disconnected successfully.' })
  async disconnect(@Request() req) {
    try {
      await this.candidateService.disconnect(req.user.userId);
      return { message: 'Déconnexion réussie' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh-token')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Token refreshed successfully.' })
  async refreshToken(@Request() req) {
    try {
      return await this.candidateService.refreshToken(req.user);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.UNAUTHORIZED);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Candidate profile retrieved successfully.' })
  async getProfile(@Request() req) {
    try {
      return await this.candidateService.getProfile(req.user.userId);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Candidate profile updated successfully.' })
  async updateProfile(@Request() req, @Body() updateCandidateProfileDto: UpdateCandidateProfileDto) {
    try {
      return await this.candidateService.updateProfile(req.user.userId, updateCandidateProfileDto);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}