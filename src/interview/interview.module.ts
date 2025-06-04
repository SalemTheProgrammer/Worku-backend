import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { Company, CompanySchema } from '../schemas/company.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';
import { JournalModule } from '../journal/journal.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema }
    ]),
    EmailModule,
    ConfigModule,
    JournalModule
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService, MongooseModule.forFeature([{ name: Interview.name, schema: InterviewSchema }])]
})
export class InterviewModule {}