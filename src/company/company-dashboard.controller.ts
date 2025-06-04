import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CompanyDashboardService } from './company-dashboard.service';
import { CompanyDashboardStatsDto } from './dto/company-dashboard-stats.dto';

@ApiTags('Company Dashboard')
@Controller('company/dashboard')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CompanyDashboardController {
  constructor(private readonly dashboardService: CompanyDashboardService) {}

  @Get('stats')
  @ApiOperation({
    summary: 'Get company dashboard statistics',
    description: 'Returns comprehensive dashboard statistics including job offers, applications, interviews, activities and remaining posts for authenticated company'
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard statistics retrieved successfully',
    type: CompanyDashboardStatsDto
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing authentication token'
  })
  @ApiResponse({
    status: 404,
    description: 'Company not found'
  })
  async getDashboardStats(@Request() req): Promise<CompanyDashboardStatsDto> {
    const companyId = req.user.companyId || req.user._id;
    return this.dashboardService.getDashboardStats(companyId);
  }
}