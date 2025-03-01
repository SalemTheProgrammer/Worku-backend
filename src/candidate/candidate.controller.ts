import { Controller, Post, Get, Put, Body, Param, UseGuards, Request, HttpStatus, HttpException, Res } from '@nestjs/common';
import { ApiTags, ApiCreatedResponse, ApiOkResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { RegisterCandidateDto } from './dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from './dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from './dto/login-candidate.dto';
import { VerifyLoginCandidateOtpDto } from './dto/verify-login-candidate-otp.dto';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto';
import { Response } from 'express';

@Controller('candidate')
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
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify-otp')
  @ApiOkResponse({ description: 'Candidate OTP verified successfully.' })
  async verifyOtp(@Body() verifyCandidateOtpDto: VerifyCandidateOtpDto) {
    try {
      return await this.candidateService.verifyOtp(verifyCandidateOtpDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('login')
  @ApiOkResponse({ description: 'Candidate login initiated successfully.' })
  async login(@Body() loginCandidateDto: LoginCandidateDto) {
    try {
      await this.candidateService.login(loginCandidateDto);
      return { message: 'Connexion initiée. Veuillez vérifier le code OTP.' };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Post('verify-login-otp')
  @ApiOkResponse({ description: 'Candidate logged in successfully.' })
  async verifyLoginOtp(@Body() verifyLoginCandidateOtpDto: VerifyLoginCandidateOtpDto) {
    try {
      return await this.candidateService.verifyLoginOtp(verifyLoginCandidateOtpDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('refresh-token')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Token refreshed successfully.' })
  async refreshToken(@Request() req) {
    return this.candidateService.refreshToken(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Candidate profile retrieved successfully.' })
  async getProfile(@Request() req) {
    return this.candidateService.getProfile(req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Candidate profile updated successfully.' })
  async updateProfile(@Request() req, @Body() updateCandidateProfileDto: UpdateCandidateProfileDto) {
    try {
      return await this.candidateService.updateProfile(req.user.userId, updateCandidateProfileDto);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('linkedin/login')
  @ApiOkResponse({ description: 'Démarrer la connexion LinkedIn.' })
  async linkedinLogin(@Res() res: Response) {
    try {
      return await this.candidateService.linkedinLogin(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('linkedin/callback')
  @ApiOkResponse({ description: 'Retour de connexion LinkedIn.' })
  async linkedinCallback(@Request() req: any, @Res() res: Response) {
    try {
      return await this.candidateService.linkedinCallback(req, res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('github/login')
  @ApiOkResponse({ description: 'Démarrer la connexion GitHub.' })
  async githubLogin(@Res() res: Response) {
    try {
      return await this.candidateService.githubLogin(res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('github/callback')
  @ApiOkResponse({ description: 'Retour de connexion GitHub.' })
  async githubCallback(@Request() req: any, @Res() res: Response) {
    try {
      return await this.candidateService.githubCallback(req, res);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('link-linkedin')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profil LinkedIn lié avec succès.' })
  async linkLinkedIn(@Request() req, @Body('linkedinUrl') linkedinUrl: string) {
    try {
      return await this.candidateService.linkLinkedIn(req.user.userId, linkedinUrl);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @UseGuards(JwtAuthGuard)
  @Put('link-github')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Profil GitHub lié avec succès.' })
  async linkGitHub(@Request() req, @Body('githubUrl') githubUrl: string) {
    try {
      return await this.candidateService.linkGitHub(req.user.userId, githubUrl);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}