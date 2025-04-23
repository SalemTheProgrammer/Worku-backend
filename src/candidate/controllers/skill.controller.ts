import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SkillService } from '../services/skill.service';
import { CreateSkillDto, UpdateSkillDto, BulkUpdateSkillsDto } from '../dto/skill.dto';

@Controller('candidate/skills')
@ApiTags('Candidate Skills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  @ApiOperation({ summary: 'Add new skill' })
  @ApiResponse({ 
    status: 201, 
    description: 'Skill has been successfully created.'
  })
  async addSkill(
    @Request() req,
    @Body() createSkillDto: CreateSkillDto
  ) {
    return await this.skillService.addSkill(req.user.userId, createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all skills for the candidate.'
  })
  async getSkills(@Request() req) {
    return await this.skillService.getSkills(req.user.userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific skill' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified skill.'
  })
  async getSkillById(
    @Request() req,
    @Param('id') skillId: string
  ) {
    return await this.skillService.getSkillById(req.user.userId, skillId);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update skill' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skill has been successfully updated.'
  })
  async updateSkill(
    @Request() req,
    @Param('id') skillId: string,
    @Body() updateSkillDto: UpdateSkillDto
  ) {
    return await this.skillService.updateSkill(
      req.user.userId,
      skillId,
      updateSkillDto
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete skill' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skill has been successfully deleted.'
  })
  async deleteSkill(
    @Request() req,
    @Param('id') skillId: string
  ) {
    return await this.skillService.deleteSkill(req.user.userId, skillId);
  }

  @Put()
  @ApiOperation({ summary: 'Bulk update skills' })
  @ApiResponse({ 
    status: 200, 
    description: 'Skills have been successfully updated.'
  })
  async bulkUpdateSkills(
    @Request() req,
    @Body() bulkUpdateDto: BulkUpdateSkillsDto
  ) {
    return await this.skillService.bulkUpdateSkills(req.user.userId, bulkUpdateDto.skills);
  }
}