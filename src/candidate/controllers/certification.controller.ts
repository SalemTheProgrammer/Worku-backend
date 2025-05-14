import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CertificationService } from '../services/certification.service';
import { CreateCertificationDto, UpdateCertificationDto, CertificationResponseDto } from '../dto/certification.dto';

@Controller('auth/candidate/certifications')
@ApiTags('Candidate Certifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Post()
  @ApiOperation({ summary: 'Add new certification' })
  @ApiResponse({ 
    status: 201, 
    description: 'Certification has been successfully created.',
    type: CertificationResponseDto
  })
  async addCertification(
    @Request() req,
    @Body() createCertificationDto: CreateCertificationDto
  ) {
    return await this.certificationService.addCertification(req.user.userId, createCertificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all certifications' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all certifications for the candidate.',
    type: [CertificationResponseDto]
  })
  async getCertifications(@Request() req) {
    const certifications = await this.certificationService.getCertifications(req.user.userId);
    return { certifications };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific certification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified certification.',
    type: CertificationResponseDto
  })
  async getCertificationById(
    @Request() req,
    @Param('id') certificationId: string
  ) {
    return await this.certificationService.getCertificationById(req.user.userId, certificationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update certification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Certification has been successfully updated.',
    type: CertificationResponseDto
  })
  async updateCertification(
    @Request() req,
    @Param('id') certificationId: string,
    @Body() updateCertificationDto: UpdateCertificationDto
  ) {
    return await this.certificationService.updateCertification(
      req.user.userId,
      certificationId,
      updateCertificationDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete certification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Certification has been successfully deleted.'
  })
  async deleteCertification(
    @Request() req,
    @Param('id') certificationId: string
  ) {
    return await this.certificationService.deleteCertification(req.user.userId, certificationId);
  }
}