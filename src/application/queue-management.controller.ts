import { Controller, Post, Get, UseGuards } from '@nestjs/common';
import { QueueManagementService } from './queue-management.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('queue-management')
@UseGuards(JwtAuthGuard)
export class QueueManagementController {
  constructor(private readonly queueManagement: QueueManagementService) {}

  @Get('stats')
  async getQueueStats() {
    const stats = await this.queueManagement.getQueueStats();
    return {
      success: true,
      data: stats
    };
  }

  @Post('cleanup')
  async cleanupQueue() {
    const result = await this.queueManagement.cleanupProblematicJobs();
    return {
      success: true,
      message: `Cleaned up ${result.cleaned} jobs, validated ${result.validated} jobs`,
      data: result
    };
  }

  @Post('pause')
  async pauseQueue() {
    await this.queueManagement.pauseQueue();
    return {
      success: true,
      message: 'Queue paused successfully'
    };
  }

  @Post('resume')
  async resumeQueue() {
    await this.queueManagement.resumeQueue();
    return {
      success: true,
      message: 'Queue resumed successfully'
    };
  }
}