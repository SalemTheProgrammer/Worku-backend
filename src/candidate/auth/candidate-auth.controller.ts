import { Controller, Post, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CandidateService } from '../candidate.service';
import { RegisterCandidateDto } from '../dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from '../dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from '../dto/login-candidate.dto';

@Controller('auth/candidate')
@ApiTags('authentication')
export class CandidateAuthController {
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
}