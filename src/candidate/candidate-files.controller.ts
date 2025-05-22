import {
  Controller,
  Post,
  Get,
  Delete,
  Put, // Added Put for potential update functionality
  UseGuards,
  Request,
  UploadedFile,
  UseInterceptors,
  HttpException,
  HttpStatus,
  Param, // Added Param for GET/DELETE by ID
  Res, // Added Res for sending files
  NotFoundException, // Import NotFoundException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CandidateFileService } from './candidate-file.service'; // Import CandidateFileService
import { RequestWithUser } from './interfaces/request-with-user.interface'; // Assuming this interface exists
import * as fs from 'fs';
import * as path from 'path';

// Helper function for file filter
const fileFilter = (fileType: 'image' | 'pdf') => (req, file, cb) => {
  const allowedImageTypes = /\.(jpg|jpeg|png)$/;
  const allowedPdfTypes = /\.(pdf)$/;

  if (fileType === 'image' && !file.originalname.match(allowedImageTypes)) {
    return cb(new HttpException('Only image files (JPG, JPEG, PNG) are allowed!', HttpStatus.BAD_REQUEST), false);
  }
  if (fileType === 'pdf' && !file.originalname.match(allowedPdfTypes)) {
    return cb(new HttpException('Only PDF files are allowed!', HttpStatus.BAD_REQUEST), false);
  }
  cb(null, true);
};

// Helper function for destination path
const destinationPath = (fileType: 'images' | 'cv') => (req: RequestWithUser, file, cb) => {
  const userId = req.user.userId;
  const dirPath = path.join('uploads', userId, fileType);
  fs.mkdirSync(dirPath, { recursive: true });
  cb(null, dirPath);
};

// Helper function for filename
const generateFilename = (fileTypePrefix: string) => (req: RequestWithUser, file, cb) => {
  const userId = req.user.userId;
  const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
  cb(null, `${userId}-${fileTypePrefix}-${uniqueSuffix}${path.extname(file.originalname)}`);
};

@Controller('auth/candidate')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CandidateFilesController {
  constructor(private readonly candidateFileService: CandidateFileService) {} // Inject CandidateFileService

  // --- Profile Picture Endpoints ---

  @Post('profile/picture')
  @ApiTags('Profile Picture')
  @ApiOperation({ summary: 'Upload/Update profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'Profile picture uploaded successfully.', schema: { properties: { url: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file or missing file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: destinationPath('images'),
      filename: generateFilename('profile'),
    }),
    fileFilter: fileFilter('image'),
  }))
  async uploadProfilePicture(@Request() req: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
    }
    try {
      const url = await this.candidateFileService.updateProfilePicture(req.user.userId, file);
      return { url };
    } catch (error) {
      // Clean up uploaded file if service fails
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting file after failed upload:", err);
      });
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile/picture')
  @ApiTags('Profile Picture')
  @ApiOperation({ summary: 'Get profile picture URL' })
  @ApiResponse({ status: 200, description: 'Profile picture URL retrieved.', schema: { properties: { url: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'Profile picture not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getProfilePictureUrl(@Request() req: RequestWithUser) {
    try {
      const url = await this.candidateFileService.getProfilePictureUrl(req.user.userId);
      if (!url) {
        throw new NotFoundException('Profile picture not found.');
      }
      // Construct full URL if needed, assuming '/uploads' prefix is handled by static serving
      const fullUrl = url.startsWith('/') ? url : `/uploads/${req.user.userId}/images/${path.basename(url)}`;
      return { url: fullUrl };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('profile/picture')
  @ApiTags('Profile Picture')
  @ApiOperation({ summary: 'Delete profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Profile picture not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteProfilePicture(@Request() req: RequestWithUser) {
    try {
      await this.candidateFileService.deleteProfilePicture(req.user.userId);
      return { message: 'Profile picture deleted successfully.' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- CV Endpoints ---

  @Post('profile/cv')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Upload/Update CV' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 200, description: 'CV uploaded successfully.', schema: { properties: { filename: { type: 'string' } } } })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file or missing file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: destinationPath('cv'),
      filename: generateFilename('cv'),
    }),
    fileFilter: fileFilter('pdf'),
  }))
  async uploadCV(@Request() req: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
    }
    try {
      const filename = await this.candidateFileService.updateCV(req.user.userId, file);
      return { filename };
    } catch (error) {
       // Clean up uploaded file if service fails
       fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting file after failed upload:", err);
      });
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('profile/cv')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Get CV URL' })
  @ApiResponse({ status: 200, description: 'CV URL retrieved.', schema: { properties: { url: { type: 'string' } } } })
  @ApiResponse({ status: 404, description: 'CV not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async getCVUrl(@Request() req: RequestWithUser) {
    try {
      const url = await this.candidateFileService.getCVUrl(req.user.userId);
      if (!url) {
        throw new NotFoundException('CV not found.');
      }
       // Construct full URL if needed
       const fullUrl = url.startsWith('/') ? url : `/uploads/${req.user.userId}/cv/${path.basename(url)}`;
      return { url: fullUrl };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Delete('profile/cv')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Delete CV' })
  @ApiResponse({ status: 200, description: 'CV deleted successfully.' })
  @ApiResponse({ status: 404, description: 'CV not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async deleteCV(@Request() req: RequestWithUser) {
    try {
      await this.candidateFileService.deleteCV(req.user.userId);
      return { message: 'CV deleted successfully.' };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('profile/cv/analyze')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Analyze CV content and provide feedback' })
  @ApiResponse({
    status: 201,
    description: 'CV content analysis completed successfully.',
    schema: {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            overallAssessment: { type: 'string' },
            generalFeedback: { type: 'string' },
            quality: { type: 'number' }
          }
        },
        strengths: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              aspect: { type: 'string' },
              details: { type: 'string' }
            }
          }
        },
        formattingFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        contentFeedback: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              section: { type: 'string' },
              issue: { type: 'string' },
              recommendation: { type: 'string' },
              severity: { type: 'string' }
            }
          }
        },
        improvementSuggestions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'CV not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async analyzeCV(@Request() req: RequestWithUser) {
    try {
      const analysis = await this.candidateFileService.analyzeCVContent(req.user.userId);
      return analysis;
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('profile/cv/job-match')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Analyze CV for job matching scores' })
  @ApiResponse({
    status: 201,
    description: 'CV job matching analysis completed successfully.',
    schema: {
      type: 'object',
      properties: {
        fitScore: {
          type: 'object',
          properties: {
            overall: { type: 'number' },
            skills: { type: 'number' },
            experience: { type: 'number' },
            education: { type: 'number' },
            yearsExperience: { type: 'number' }
          }
        },
        jobFitSummary: { type: 'object' },
        recruiterRecommendations: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'CV not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async analyzeJobMatch(@Request() req: RequestWithUser) {
    try {
      const analysis = await this.candidateFileService.analyzeCV(req.user.userId);
      return analysis;
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('profile/cv-image')
  @ApiTags('CV')
  @ApiOperation({ summary: 'Upload and analyze CV as image' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @ApiResponse({ status: 201, description: 'CV image analyzed successfully.' })
  @ApiResponse({ status: 400, description: 'Bad Request - Invalid file or missing file.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: destinationPath('cv'),
      filename: generateFilename('cv-image'),
    }),
    fileFilter: fileFilter('image'),
  }))
  async uploadAndAnalyzeCVImage(@Request() req: RequestWithUser, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new HttpException('No file uploaded.', HttpStatus.BAD_REQUEST);
    }
    try {
      // First upload the image
      const fileUrl = await this.candidateFileService.uploadCVImage(req.user.userId, file);
      
      // Then analyze it
      const analysis = await this.candidateFileService.analyzeCVImage(req.user.userId);
      
      return {
        url: fileUrl,
        analysis
      };
    } catch (error) {
      // Clean up uploaded file if service fails
      fs.unlink(file.path, (err) => {
        if (err) console.error("Error deleting file after failed upload:", err);
      });
      throw new HttpException(error.message, error.status || HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}