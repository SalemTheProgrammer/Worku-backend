import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ExperienceService } from '../services/experience.service';
import { CreateExperienceDto, UpdateExperienceDto } from '../dto/experience.dto';

@Controller('candidate/experience')
@ApiTags('Candidate Experience')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ExperienceController {
  constructor(private readonly experienceService: ExperienceService) {}

  @Post()
  @ApiOperation({ summary: 'Add new experience entry' })
  @ApiResponse({ 
    status: 201, 
    description: 'Experience entry has been successfully created.'
  })
  async addExperience(
    @Request() req,
    @Body() createExperienceDto: CreateExperienceDto
  ) {
    return await this.experienceService.addExperience(req.user.userId, createExperienceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all experience entries' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all experience entries for the candidate.'
  })
  async getExperience(@Request() req) {
    return await this.experienceService.getExperience(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific experience entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified experience entry.'
  })
  async getExperienceById(
    @Request() req,
    @Param('id') experienceId: string
  ) {
    return await this.experienceService.getExperienceById(req.user.userId, experienceId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update experience entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Experience entry has been successfully updated.'
  })
  async updateExperience(
    @Request() req,
    @Param('id') experienceId: string,
    @Body() updateExperienceDto: UpdateExperienceDto
  ) {
    return await this.experienceService.updateExperience(
      req.user.userId,
      experienceId,
      updateExperienceDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete experience entry' })
  @ApiResponse({ 
    status: 200, 
    description: 'Experience entry has been successfully deleted.'
  })
  async deleteExperience(
    @Request() req,
    @Param('id') experienceId: string
  ) {
    return await this.experienceService.deleteExperience(req.user.userId, experienceId);
  }
}