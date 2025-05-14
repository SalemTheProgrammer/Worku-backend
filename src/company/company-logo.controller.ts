import { Controller, Post, UseGuards, Delete, UseInterceptors, UploadedFile, BadRequestException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyProfileService } from './company-profile.service';
import { FileUtils } from '../common/utils/file.utils';

interface MulterRequest {
  user: {
    userId: string;
    email: string;
    role: string;
    companyId: string;
  };
}

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    companyId: string;
  };
}

@Controller('company/logo')
@ApiTags('company-logo')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyLogoController {
  constructor(private readonly companyProfileService: CompanyProfileService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload company logo',
    description: 'Upload or update company logo image'
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req: Request & MulterRequest, file, callback) => {
        if (!req.user?.companyId) {
          return callback(new Error('Company ID not found'), './uploads');
        }
        const uploadPath = join('./uploads', req.user.companyId);
        if (!existsSync(uploadPath)) {
          mkdirSync(uploadPath, { recursive: true });
        }
        callback(null, uploadPath);
      },
      filename: (req: Request & MulterRequest, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        if (!req.user?.companyId) {
          throw new BadRequestException('Company ID not found');
        }
        callback(null, `logo-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      if (!file.originalname.match(/\.(jpg|jpeg|png)$/)) {
        return callback(new BadRequestException('Only image files are allowed!'), false);
      }
      callback(null, true);
    },
    limits: {
      fileSize: 1024 * 1024 * 2 // 2MB
    }
  }))
  async uploadLogo(
    @Req() req: RequestWithUser,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Construct the relative path for storage in the database
    const relativeFilePath = `${req.user.companyId}/${file.filename}`;
    await this.companyProfileService.updateLogo(req.user.companyId, relativeFilePath);

    // Construct the URL to return to the client
    const responseUrl = `/uploads/${req.user.companyId}/${relativeFilePath}`;

    return {
      message: 'Logo uploaded successfully',
      url: responseUrl
    };
  }

  @Delete()
  @ApiOperation({
    summary: 'Delete company logo',
    description: 'Remove the company logo'
  })
  async deleteLogo(@Req() req: RequestWithUser) {
    await this.companyProfileService.updateLogo(req.user.companyId, null);
    return {
      message: 'Logo deleted successfully'
    };
  }
}
