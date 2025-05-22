import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Candidate, CandidateSchema } from '../../schemas/candidate.schema';
import { CvProfileExtractorService } from './cv-profile-extractor.service';
import { GeminiModule } from '../../services/gemini.module';
import { ConfigModule } from '@nestjs/config';
import { CandidateModule } from '../candidate.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
    ]),
    forwardRef(() => CandidateModule),
    GeminiModule,
    ConfigModule,
  ],
  providers: [
    CvProfileExtractorService,
  ],
  exports: [
    CvProfileExtractorService
  ]
})
export class CvProfileExtractorModule {}