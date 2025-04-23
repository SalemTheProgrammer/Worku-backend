import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CertificationService } from '../services/certification.service';
import { CreateCertificationDto, UpdateCertificationDto } from '../dto/certification.dto';

@Controller('candidate/certifications')
@ApiTags('Candidate Certifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CertificationController {
  constructor(private readonly certificationService: CertificationService) {}

  @Post()
  @ApiOperation({ summary: 'Add new certification' })
  @ApiResponse({ 
    status: 201, 
    description: 'Certification has been successfully created.'
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
    description: 'Returns all certifications for the candidate.'
  })
  async getCertifications(@Request() req) {
    return await this.certificationService.getCertifications(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific certification' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified certification.'
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
    description: 'Certification has been successfully updated.'
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

  @Get(':id/validate')
  @ApiOperation({ summary: 'Validate certification expiry status' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the validation status of the certification.'
  })
  async validateCertification(
    @Request() req,
    @Param('id') certificationId: string
  ) {
    return await this.certificationService.validateCertification(req.user.userId, certificationId);
  }
}