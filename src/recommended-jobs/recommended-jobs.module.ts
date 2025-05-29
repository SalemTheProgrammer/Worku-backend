import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecommendedJobsController } from './recommended-jobs.controller';
import { RecommendedJobsService } from './recommended-jobs.service';
import { Job, JobSchema } from '../schemas/job.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
  ],
  controllers: [RecommendedJobsController],
  providers: [RecommendedJobsService],
  exports: [RecommendedJobsService],
})
export class RecommendedJobsModule {}