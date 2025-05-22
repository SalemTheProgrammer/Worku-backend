import { Logger, Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CandidateController } from './candidate.controller';
import { CandidateAuthController } from './auth/candidate-auth.controller';
import { CandidateService } from './candidate.service';
import { CandidateFileService } from './candidate-file.service';
import { CandidateFilesController } from './candidate-files.controller';
import { CandidateProfileController } from './candidate-profile.controller';
import { SkillController } from './controllers/skill.controller';
import { SkillService } from './services/skill.service';
import { EducationController } from './controllers/education.controller';
import { EducationService } from './services/education.service';
import { CertificationController } from './controllers/certification.controller';
import { CertificationService } from './services/certification.service';
import { CvSkillsService } from './services/cv-skills.service';
import { CvAnalysisQueue } from './cv-analysis.queue';
import { CvAnalysisProcessor } from './cv-analysis.processor';
import { CvProfileExtractionProcessor } from './cv-profile-extraction.processor';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { Skill, SkillSchema } from '../schemas/skill.schema';
import { Education, EducationSchema } from '../schemas/education.schema';
import { Certification, CertificationSchema } from '../schemas/certification.schema';
import { GeminiModule } from '../services/gemini.module';
import { OtpModule } from '../otp/otp.module';
import { CvProfileExtractorModule } from './cv-profile-extractor/cv-profile-extractor.module';
import { JournalModule } from '../journal/journal.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: Skill.name, schema: SkillSchema },
      { name: Education.name, schema: EducationSchema },
      { name: Certification.name, schema: CertificationSchema }
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn')
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'cv-analysis',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        },
        removeOnComplete: true
      },
    }),
    ConfigModule,
    OtpModule,
    forwardRef(() => CvProfileExtractorModule),
    GeminiModule,
    JournalModule
  ],
  controllers: [
    CandidateController,
    CandidateFilesController,
    CandidateProfileController,
    CandidateAuthController,
    EducationController,
    SkillController,
    CertificationController,
  ],
  providers: [
    CandidateService,
    CandidateFileService,
    CvSkillsService,
    CvAnalysisQueue,
    CvAnalysisProcessor,
    CvProfileExtractionProcessor,
    EducationService,
    SkillService,
    CertificationService,
    Logger
  ],
  exports: [CandidateService, CandidateFileService]
})
export class CandidateModule {}