import { Controller, Post, Body, HttpStatus, HttpException, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CandidateService } from '../candidate.service';
import { RegisterCandidateDto } from '../dto/register-candidate.dto';
import { VerifyCandidateOtpDto } from '../dto/verify-candidate-otp.dto';
import { LoginCandidateDto } from '../dto/login-candidate.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from '../dto/reset-password.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { User } from '../../common/decorators/user.decorator';
import { TokenPayload } from '../../interfaces/user.interface';

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
  @ApiResponse({ status: 409, description: 'Conflict - already exists' })
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

  @Post('request-password-reset')
  @ApiOperation({
    summary: 'Request password reset',
    description: 'Send a password reset link to the candidate email'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset email sent',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password reset email sent successfully' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Not Found - No account found with this email' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid email format' })
  async requestPasswordReset(@Body() requestPasswordResetDto: RequestPasswordResetDto) {
    try {
      await this.candidateService.requestPasswordReset(requestPasswordResetDto.email);
      return { message: 'Password reset email sent successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('reset-password')
  @ApiOperation({
    summary: 'Reset password',
    description: 'Reset password using the token received via email'
  })
  @ApiResponse({
    status: 200,
    description: 'Password reset successful',
    schema: {
      properties: {
        message: { type: 'string', example: 'Password reset successfully' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or expired reset token' })
  @ApiResponse({ status: 400, description: 'Bad Request - Password does not meet requirements' })
  @ApiResponse({ status: 404, description: 'Not Found - User not found' })
  async resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    try {
      await this.candidateService.resetPassword(resetPasswordDto);
      return { message: 'Password reset successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('delete-account')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete candidate account',
    description: 'Permanently delete the candidate account and associated data. This action is irreversible.'
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
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid or missing JWT token' })
  @ApiResponse({ status: 404, description: 'Not Found - User not found' })
  async deleteAccount(@User('userId') userId: string) {
    try {
      await this.candidateService.deleteAccount(userId);
      return { message: 'Account deleted successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}