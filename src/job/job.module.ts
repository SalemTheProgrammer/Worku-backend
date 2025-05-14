import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JobController } from './job.controller';
import { JobApplicationsController } from './job-applications.controller';
import { JobService } from './job.service';
import { ApplicationModule } from '../application/application.module';
import { JobBaseService } from './services/job-base.service';
import { JobCacheService } from './services/job-cache.service';
import { JobViewService } from './services/job-view.service';
import { JobCandidateService } from './services/job-candidate.service';
import { JobQueryService } from './services/job-query.service';
import { Job, JobSchema } from '../schemas/job.schema';
import { JobView, JobViewSchema } from '../schemas/job-view.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { RedisCacheModule } from '../cache/cache.module';
import { ScheduleModule } from '@nestjs/schedule';
import { JobMapperImpl } from './interfaces/job-mapper.interface';

const schemas = [
  { name: Job.name, schema: JobSchema },
  { name: JobView.name, schema: JobViewSchema },
  { name: Candidate.name, schema: CandidateSchema }
];

const services = [
  JobService,
  JobBaseService,
  JobCacheService,
  JobViewService,
  JobCandidateService,
  JobQueryService,
  {
    provide: 'JobMapper',
    useClass: JobMapperImpl
  }
];

@Module({
  imports: [
    MongooseModule.forFeature(schemas),
    RedisCacheModule,
    ScheduleModule.forRoot(),
    ApplicationModule
  ],
  controllers: [JobController, JobApplicationsController],
  providers: [...services],
  exports: [JobService]
})
export class JobModule {}