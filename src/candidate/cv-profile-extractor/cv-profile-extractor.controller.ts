import { Controller, Post, UseGuards, Request, HttpStatus, HttpException, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import * as path from 'path';
import * as fs from 'fs/promises';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CvProfileExtractorService } from './cv-profile-extractor.service';
import { Request as ExpressRequest } from 'express';
import { CandidateFileService } from '../candidate-file.service';

interface RequestWithUser extends ExpressRequest {
  user: {
    userId: string;
    email: string;
    role: string;
  };
}

@Controller('candidate/cv-profile')
@ApiTags('candidate-cv-profile')
export class CvProfileExtractorController {
  constructor(
    private readonly cvProfileExtractorService: CvProfileExtractorService,
    private readonly candidateFileService: CandidateFileService
  ) {}

  @UseGuards(JwtAuthGuard)
  @Post('extract-existing')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Extract and update profile from CV',
    description: 'Extracts education, experience, certifications, and skills from the candidate\'s CV and updates their profile'
  })
  @ApiResponse({
    status: 200,
    description: 'Profile data extracted and updated successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - CV not found or invalid' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error - Failed to extract profile data' })
  async extractProfileFromExistingCV(@Request() req: RequestWithUser) {
    try {
      const candidateId = req.user.userId;
      
      // Get candidate to check if CV exists
      const candidate = await this.getCandidateWithCV(candidateId);
      
      if (!candidate || !candidate.cvUrl) {
        throw new HttpException('No CV found for this candidate', HttpStatus.BAD_REQUEST);
      }
      
      // Extract full path to CV file
      const cvPath = candidate.cvUrl;
      
      // Process CV and update profile
      const success = await this.cvProfileExtractorService.extractAndUpdateProfile(cvPath, candidateId);
      
      if (!success) {
        throw new HttpException('Failed to extract profile data from CV', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return {
        success: true,
        message: 'Profile data extracted and updated successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'An error occurred while processing the CV',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  @Post('extract')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Get user ID from request
          const userId = (req as any).user.userId;
          const uploadDir = path.join('uploads', userId, 'cv');
          
          // Create directory if it doesn't exist
          fs.mkdir(uploadDir, { recursive: true })
            .then(() => cb(null, uploadDir))
            .catch(err => cb(err, uploadDir));
        },
        filename: (req, file, cb) => {
          const userId = (req as any).user.userId;
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const filename = `${userId}-cv-${uniqueSuffix}${path.extname(file.originalname)}`;
          cb(null, filename);
        },
      }),
      fileFilter: (req, file, cb) => {
        // Accept only PDF files
        if (file.mimetype === 'application/pdf') {
          cb(null, true);
        } else {
          cb(new HttpException('Only PDF files are allowed', HttpStatus.BAD_REQUEST), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB max file size
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload CV and extract profile data',
    description: 'Upload a new CV file, extract education, experience, certifications, and skills, and update the candidate profile'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'PDF file to upload (max 5MB)'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'CV uploaded and profile data extracted successfully',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        cvUrl: { type: 'string' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file format' })
  @ApiResponse({ status: 401, description: 'Unauthorized - Invalid token' })
  @ApiResponse({ status: 500, description: 'Internal Server Error - Failed to process CV' })
  async uploadAndExtractProfile(
    @Request() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File
  ) {
    try {
      const candidateId = req.user.userId;
      
      if (!file) {
        // If no file was uploaded, try to use existing CV
        const candidate = await this.getCandidateWithCV(candidateId);
        
        if (!candidate || !candidate.cvUrl) {
          throw new HttpException('No CV file uploaded and no existing CV found', HttpStatus.BAD_REQUEST);
        }
        
        // Use existing CV - get absolute path
        const cvPath = path.resolve(candidate.cvUrl);
        
        // Check if file exists
        try {
          await fs.access(cvPath);
        } catch (error) {
          throw new HttpException('CV file not found on server', HttpStatus.BAD_REQUEST);
        }
        
        const success = await this.cvProfileExtractorService.extractAndUpdateProfile(candidate.cvUrl, candidateId);
        
        if (!success) {
          throw new HttpException('Failed to extract profile data from existing CV', HttpStatus.INTERNAL_SERVER_ERROR);
        }
        
        return {
          success: true,
          message: 'Profile data extracted from existing CV successfully',
          cvUrl: `/${candidate.cvUrl}`
        };
      }
      
      // If a new file was uploaded, update the CV and then extract profile data
      const cvUrl = await this.candidateFileService.updateCV(candidateId, file);
      
      // Extract profile data from the new CV
      const success = await this.cvProfileExtractorService.extractAndUpdateProfile(
        cvUrl.startsWith('/') ? cvUrl.substring(1) : cvUrl,
        candidateId
      );
      
      if (!success) {
        throw new HttpException('Failed to extract profile data from uploaded CV', HttpStatus.INTERNAL_SERVER_ERROR);
      }
      
      return {
        success: true,
        message: 'CV uploaded and profile data extracted successfully',
        cvUrl: cvUrl
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'An error occurred while processing the CV',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
  
  private async getCandidateWithCV(candidateId: string): Promise<any> {
    try {
      return await (this.cvProfileExtractorService as any).candidateModel.findById(candidateId).select('cvUrl').lean();
    } catch (error) {
      throw new HttpException('Failed to retrieve candidate information', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}