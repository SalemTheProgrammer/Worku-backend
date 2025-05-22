import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ApplicationService } from './application.service';
import { ApplicationController } from './application.controller';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { Company, CompanySchema } from '../schemas/company.schema';
import { JobMatchAnalysisWrapperService } from './job-match-analysis-wrapper.service';
import { EmailModule } from '../email/email.module';
import { ApplicationQueueModule } from './application-queue.module';
import { GeminiModule } from '../services/gemini.module';
import { JobMatchModule } from './job-match/job-match.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Job.name, schema: JobSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Company.name, schema: CompanySchema }
    ]),
    EmailModule,
    ApplicationQueueModule,
    GeminiModule,
    JobMatchModule
  ],
  controllers: [ApplicationController],
  providers: [ApplicationService, JobMatchAnalysisWrapperService],
  exports: [ApplicationService, JobMatchAnalysisWrapperService]
})
export class ApplicationModule {}