import { Body, Controller, Get, Post, UseGuards, Logger } from '@nestjs/common';
import { RejectionService } from './rejection.service';
import { RejectionDto } from './dto/rejection.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('rejections')
@Controller('rejections')
export class RejectionController {
  private readonly logger = new Logger(RejectionController.name);

  constructor(private readonly rejectionService: RejectionService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reject an application and send notification' })
  @ApiResponse({ status: 200, description: 'Application rejected successfully' })
  @ApiResponse({ status: 404, description: 'Application not found' })
  @ApiResponse({ status: 400, description: 'Invalid rejection data' })
  async rejectApplication(@Body() rejectionDto: RejectionDto) {
    this.logger.log(`Rejecting application ${rejectionDto.applicationId}`);
    return this.rejectionService.rejectApplication(rejectionDto);
  }

  @Get('reasons')
  @ApiOperation({ summary: 'Get all available rejection reasons' })
  @ApiResponse({ status: 200, description: 'List of rejection reasons' })
  getRejectionReasons() {
    return this.rejectionService.getRejectionReasons();
  }
}