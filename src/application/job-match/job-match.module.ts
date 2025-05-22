import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Job, JobSchema } from '../../schemas/job.schema';
import { Candidate, CandidateSchema } from '../../schemas/candidate.schema';
import { Application, ApplicationSchema } from '../../schemas/application.schema';
import { GeminiModule } from '../../services/gemini.module';
import { JobMatchAnalysisService } from './services/job-match-analysis.service';
import { MatchResponseFormatterService } from './services/match-response-formatter.service';
import { JobMatchPromptService } from './services/job-match-prompt.service';

/**
 * Module for job match analysis
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Job.name, schema: JobSchema },
      { name: Candidate.name, schema: CandidateSchema },
      { name: Application.name, schema: ApplicationSchema },
    ]),
    GeminiModule,
  ],
  providers: [
    JobMatchAnalysisService,
    MatchResponseFormatterService,
    JobMatchPromptService,
  ],
  exports: [
    JobMatchAnalysisService,
  ],
})
export class JobMatchModule {}