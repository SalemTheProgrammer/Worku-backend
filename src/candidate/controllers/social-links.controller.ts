import { Controller, Get, Put, Delete, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { SocialLinksService } from '../services/social-links.service';
import { SocialLinksDto } from '../dto/social-links.dto';

@Controller('candidate/social-links')
@ApiTags('Candidate Social Links')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SocialLinksController {
  constructor(private readonly socialLinksService: SocialLinksService) {}

  @Get()
  @ApiOperation({ summary: 'Get candidate social links' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the social links for the candidate.'
  })
  async getSocialLinks(@Request() req) {
    return await this.socialLinksService.getSocialLinks(req.user.userId);
  }

  @Put()
  @ApiOperation({ summary: 'Update social links' })
  @ApiResponse({ 
    status: 200, 
    description: 'Social links have been successfully updated.'
  })
  async updateSocialLinks(
    @Request() req,
    @Body() socialLinksDto: SocialLinksDto
  ) {
    return await this.socialLinksService.updateSocialLinks(req.user.userId, socialLinksDto);
  }

  @Delete()
  @ApiOperation({ summary: 'Delete all social links' })
  @ApiResponse({ 
    status: 200, 
    description: 'Social links have been successfully cleared.'
  })
  async deleteSocialLinks(@Request() req) {
    return await this.socialLinksService.deleteSocialLinks(req.user.userId);
  }
}