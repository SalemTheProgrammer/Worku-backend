import { Controller, Get, Put, Post, UseGuards, Req, Body, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyService } from './company.service';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateCompanySocialsDto } from './dto/update-company-socials.dto';
import { UpdateCompanyCoordinatesDto } from './dto/update-company-coordinates.dto';
import { InviteUserDto } from './dto/invite-user.dto';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    companyId: string;
  };
}

@Controller('company/profile')
@ApiTags('company-profile')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyProfileController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  @ApiOperation({
    summary: 'Get company profile',
    description: 'Get complete profile information for the authenticated company'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 404, description: 'Not Found - Profile not found' })
  async getProfile(@Req() req: RequestWithUser) {
    try {
      return await this.companyService.getCompanyProfile(req.user.email);
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Put('socials')
  @ApiOperation({
    summary: 'Update company social links',
    description: 'Update company social media links and website'
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        reseauxSociaux: {
          linkedin: 'https://www.linkedin.com/company/example',
          instagram: 'https://www.instagram.com/example',
          facebook: 'https://www.facebook.com/example',
          x: 'https://twitter.com/example',
          siteWeb: 'https://www.example.com'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Social links updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async updateSocials(
    @Req() req: RequestWithUser,
    @Body() updateCompanySocialsDto: UpdateCompanySocialsDto
  ) {
    try {
      const updatedProfile = await this.companyService.updateCompanySocials(
        req.user.companyId,
        updateCompanySocialsDto
      );
      return {
        message: 'Social links updated successfully',
        data: updatedProfile
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Put('coordinates')
  @ApiOperation({
    summary: 'Update company coordinates',
    description: 'Update company name, phone, and address'
  })
  @ApiBody({
    schema: {
      type: 'object',
      example: {
        nomUtilisateur: 'Example User',
        phone: '+15551234567',
        adresse: '123 Main St, Anytown'
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Coordinates updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async updateCoordinates(
    @Req() req: RequestWithUser,
    @Body() updateCompanyCoordinatesDto: UpdateCompanyCoordinatesDto
  ) {
    try {
      const updatedProfile = await this.companyService.updateCompanyCoordinates(
        req.user.companyId,
        updateCompanyCoordinatesDto
      );
      return {
        message: 'Coordinates updated successfully',
        data: updatedProfile
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Put()
  @ApiOperation({
    summary: 'Update company profile',
    description: 'Update company profile information'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateCompanyProfileDto: UpdateCompanyProfileDto
  ) {
    try {
      const updatedProfile = await this.companyService.updateCompanyProfile(
        req.user.companyId,
        updateCompanyProfileDto
      );
      return {
        message: 'Profile updated successfully',
        data: updatedProfile
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('invite')
  @ApiOperation({
    summary: 'Invite user to company',
    description: 'Invite a new user to access company data with their own user name'
  })
  @ApiBody({
    type: InviteUserDto,
    description: 'User invitation details',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          nomDeUtilisateur: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'User invited successfully'
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 409, description: 'Conflict - User already invited' })
  async inviteUser(
    @Req() req: RequestWithUser,
    @Body() inviteUserDto: InviteUserDto
  ) {
    try {
      const updatedCompany = await this.companyService.inviteUser(
        req.user.companyId,
        inviteUserDto
      );
      return {
        message: 'User invited successfully',
        data: updatedCompany
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}