import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'; // Import Swagger decorators

@ApiTags('authentication') // Add ApiTags decorator
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('verify')
  @ApiOperation({ summary: 'Verify JWT token validity' }) // Add ApiOperation
  @ApiBearerAuth() // Indicate that this endpoint requires Bearer token auth
  @ApiResponse({ status: 200, description: 'Token is valid', schema: { example: { isValid: true } } }) // Add success response
  @ApiResponse({ status: 401, description: 'Unauthorized' }) // Add error response
  async verifyToken() {
    return { isValid: true };
  }
}