import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SkillService } from '../services/skill.service';
import { CreateSkillDto, UpdateSkillDto, SkillResponseDto } from '../dto/skill.dto';
import { SkillCategory } from '../enums/skill-category.enum';

@Controller('auth/candidate/skills')
@ApiTags('Candidate Skills')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SkillController {
  constructor(private readonly skillService: SkillService) {}

  @Post()
  @ApiOperation({ summary: 'Add new skill' })
  @ApiResponse({ 
    status: 201, 
    description: 'Skill has been successfully created.',
    type: SkillResponseDto
  })
  async addSkill(
    @Request() req,
    @Body() createSkillDto: CreateSkillDto
  ) {
    return await this.skillService.addSkill(req.user.userId, createSkillDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all skills grouped by category' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns all skills grouped by category'
  })
  async getAllSkills(@Request() req) {
    const skills = await this.skillService.getSkills(req.user.userId);
    const groupedSkills = this.groupSkillsByCategory(skills);
    return { skills: groupedSkills };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get specific skill' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the specified skill.',
    type: SkillResponseDto
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
    description: 'Skill has been successfully updated.',
    type: SkillResponseDto
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

  private groupSkillsByCategory(skills: any[]) {
    const groupedSkills: Record<SkillCategory, any[]> = {
      [SkillCategory.TECHNICAL]: [],
      [SkillCategory.INTERPERSONAL]: [],
      [SkillCategory.LANGUAGE]: []
    };

    skills.forEach(skill => {
      if (skill.category in groupedSkills) {
        groupedSkills[skill.category].push(skill);
      }
    });

    return groupedSkills;
  }
}