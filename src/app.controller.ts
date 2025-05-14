import { Controller, Delete, Get, HttpException, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { ApplicationService } from './application/application.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly applicationService: ApplicationService
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Delete('reset-applications')
  async resetApplications(): Promise<{ message: string; deletedCount: number }> {
    try {
      const result = await this.applicationService.deleteAllApplications();
      return {
        message: 'Applications reset successfully',
        deletedCount: result.deletedCount
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Error resetting applications',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
