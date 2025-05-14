import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { ConfigModule } from '@nestjs/config';

import { Candidate, CandidateSchema } from '../../schemas/candidate.schema';
import { Skill, SkillSchema } from '../../schemas/skill.schema';
import { Education, EducationSchema } from '../../schemas/education.schema';
import { Certification, CertificationSchema } from '../../schemas/certification.schema';

import { CandidateModule } from '../candidate.module';
import { CvAnalysisQueue } from '../cv-analysis.queue';
import { GeminiModule } from '../../services/gemini.module';
import { CvProfileExtractorController } from './cv-profile-extractor.controller';
import { CvProfileExtractorService } from './cv-profile-extractor.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Education.name, schema: EducationSchema },
      { name: Certification.name, schema: CertificationSchema }
    ]),
    BullModule.registerQueue({
      name: 'cv-analysis',
    }),
    ConfigModule,
    GeminiModule,
    forwardRef(() => CandidateModule)
  ],
  controllers: [CvProfileExtractorController],
  providers: [
    CvProfileExtractorService,
    CvAnalysisQueue
  ],
  exports: [CvProfileExtractorService]
})
export class CvProfileExtractorModule {}