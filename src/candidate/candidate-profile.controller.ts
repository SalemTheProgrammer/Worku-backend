import { Controller, Get, Put, Post, Delete, Body, Param, UseGuards, Request, UseInterceptors, UploadedFile, HttpStatus, HttpException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOkResponse, ApiCreatedResponse, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateService } from './candidate.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { CreateExperienceDto, UpdateExperienceDto } from './dto/experience.dto';
import { CandidateFileService } from './candidate-file.service';

@Controller('auth/candidate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiTags('Candidate Profile')
export class CandidateProfileController {
  constructor(
    private readonly candidateService: CandidateService,
    private readonly candidateFileService: CandidateFileService,
  ) {}

  @Get()
  @ApiOkResponse({
    description: 'Profile retrieved successfully',
    schema: {
      properties: {
        personalInfo: {
          type: 'object',
          properties: {
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            profilePicture: { type: 'string', nullable: true },
            phone: { type: 'string', nullable: true },
            location: {
              type: 'object',
              properties: {
                country: { type: 'string', nullable: true },
                city: { type: 'string', nullable: true }
              }
            },
            professionalStatus: { type: 'string', nullable: true },
            workPreferences: { type: 'array', items: { type: 'string' } }
          }
        },
        experiences: { type: 'array', items: { type: 'object' } },
        stats: {
          type: 'object',
          properties: {
            experienceCount: { type: 'number' },
            educationCount: { type: 'number' },
            skillsCount: { type: 'number' },
            certificatesCount: { type: 'number' },
          }
        },
        profileCompletion: { type: 'number' },
        cvInfo: {
          type: 'object',
          properties: {
            exists: { type: 'boolean' },
            filename: { type: 'string', nullable: true }
          }
        },
        isOpenToWork: { type: 'boolean' },
        isProfilePublic: { type: 'boolean' }
      }
    }
  })
  async getProfile(@Request() req) {
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
        },
        experiences: profile.experience,
        stats: {
          experienceCount: profile.experience?.length || 0,
          educationCount: profile.education?.length || 0,
          skillsCount: profile.skills?.length || 0,
          certificatesCount: profile.certifications?.length || 0,
        },
        profileCompletion: this.calculateProfileCompletion(profile),
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

  @Put()
  @ApiOkResponse({ description: 'Profile updated successfully' })
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto) {
    try {
      const profile = await this.candidateService.updateProfile(req.user.userId, {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
        professionalStatus: updateProfileDto.professionalStatus,
        workPreferences: updateProfileDto.workPreferences,
        isOpenToWork: updateProfileDto.isOpenToWork,
        location: updateProfileDto.location,
      });

      return { message: 'Profile updated successfully', data: profile };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Get('experiences')
  @ApiOkResponse({ description: 'Experiences retrieved successfully' })
  async getExperiences(@Request() req) {
    try {
      const profile = await this.candidateService.getProfile(req.user.userId);
      return { experiences: profile.experience || [] };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.NOT_FOUND);
    }
  }

  @Post('experiences')
  @ApiCreatedResponse({ description: 'Experience added successfully' })
  async addExperience(@Request() req, @Body() createExperienceDto: CreateExperienceDto) {
    try {
      const experience = await this.candidateService.addExperience(req.user.userId, createExperienceDto);
      return {
        id: experience.id,
        message: 'Experience added successfully',
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Put('experiences/:id')
  @ApiOkResponse({ description: 'Experience updated successfully' })
  async updateExperience(
    @Request() req,
    @Param('id') id: string,
    @Body() updateExperienceDto: UpdateExperienceDto,
  ) {
    try {
      await this.candidateService.updateExperience(req.user.userId, id, updateExperienceDto);
      return { message: 'Experience updated successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Delete('experiences/:id')
  @ApiOkResponse({ description: 'Experience deleted successfully' })
  async deleteExperience(@Request() req, @Param('id') id: string) {
    try {
      await this.candidateService.deleteExperience(req.user.userId, id);
      return { message: 'Experience deleted successfully' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('picture')
  @UseInterceptors(FileInterceptor('profileImage'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        profileImage: {
          type: 'string',
          format: 'binary',
          description: 'Profile picture file (jpg, jpeg, png)',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'Profile picture updated successfully' })
  async uploadProfilePicture(@Request() req, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }
      const url = await this.candidateFileService.updateProfilePicture(req.user.userId, file);
      return {
        message: 'Profile picture updated successfully',
        url,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('cv')
  @UseInterceptors(FileInterceptor('cvFile'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        cvFile: {
          type: 'string',
          format: 'binary',
          description: 'CV file (pdf, doc, docx)',
        },
      },
    },
  })
  @ApiOkResponse({ description: 'CV uploaded successfully' })
  async uploadCV(@Request() req, @UploadedFile() file: Express.Multer.File) {
    try {
      if (!file) {
        throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
      }
      const filename = await this.candidateFileService.updateCV(req.user.userId, file);
      return {
        message: 'CV uploaded successfully',
        filename,
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  private calculateProfileCompletion(profile: any): number {
    const fields = [
      'firstName',
      'lastName',
      'email',
      'phone',
      'country',
      'city',
      'jobTitle',
      'summary',
      'workPreferences',
      'experience',
      'education',
      'skills',
      'profilePicture',
      'cvUrl',
    ];

    const filledFields = fields.filter(field => {
      const value = profile[field];
      return Array.isArray(value) ? value.length > 0 : Boolean(value);
    });

    return Math.round((filledFields.length / fields.length) * 100);
  }
}
