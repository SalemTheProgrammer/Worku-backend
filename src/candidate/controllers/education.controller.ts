import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { EducationService } from '../services/education.service';
import { CreateEducationDto, UpdateEducationDto } from '../dto/education.dto';

@Controller('auth/candidate/education')
@ApiTags('Candidate Education')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EducationController {
  constructor(private readonly educationService: EducationService) {}

  @Post()
  @ApiOperation({ summary: 'Add new education entry' })
  @ApiResponse({ 
    status: 201, 
    description: 'Education entry has been successfully created.'
  })
  async addEducation(
    @Request() req,
    @Body() createEducationDto: CreateEducationDto
  ) {
    return await this.educationService.addEducation(req.user.userId, createEducationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all education entries' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all education entries for the candidate.'
  })
  async getEducation(@Request() req) {
    const education = await this.educationService.getEducation(req.user.userId);
    return { education };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific education entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified education entry.'
  })
  async getEducationById(
    @Request() req,
    @Param('id') educationId: string
  ) {
    return await this.educationService.getEducationById(req.user.userId, educationId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update education entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Education entry has been successfully updated.'
  })
  async updateEducation(
    @Request() req,
    @Param('id') educationId: string,
    @Body() updateEducationDto: UpdateEducationDto
  ) {
    return await this.educationService.updateEducation(
      req.user.userId,
      educationId,
      updateEducationDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete education entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Education entry has been successfully deleted.'
  })
  async deleteEducation(
    @Request() req,
    @Param('id') educationId: string
  ) {
    return await this.educationService.deleteEducation(req.user.userId, educationId);
  }
}