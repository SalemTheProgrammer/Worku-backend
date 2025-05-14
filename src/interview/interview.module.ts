import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InterviewController } from './interview.controller';
import { InterviewService } from './interview.service';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Interview.name, schema: InterviewSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Candidate.name, schema: CandidateSchema }
    ]),
    EmailModule,
    ConfigModule
  ],
  controllers: [InterviewController],
  providers: [InterviewService],
  exports: [InterviewService]
})
export class InterviewModule {}