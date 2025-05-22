import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RejectionController } from './rejection.controller';
import { RejectionService } from './rejection.service';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { GeminiClientService } from '../services/gemini-client.service';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Application.name, schema: ApplicationSchema },
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    EmailModule,
    ConfigModule,
  ],
  controllers: [RejectionController],
  providers: [RejectionService, GeminiClientService],
  exports: [RejectionService],
})
export class RejectionModule {}