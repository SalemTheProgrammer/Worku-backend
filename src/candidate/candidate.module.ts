import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CandidateController } from './candidate.controller';
import { EducationController } from './controllers/education.controller';
import { ExperienceController } from './controllers/experience.controller';
import { SocialLinksController } from './controllers/social-links.controller';
import { CertificationController } from './controllers/certification.controller';
import { SkillController } from './controllers/skill.controller';
import { CandidateFilesController } from './candidate-files.controller'; // Import new controller
import { CandidateService } from './candidate.service';
import { CandidateFileService } from './candidate-file.service'; // Import new service
import { EducationService } from './services/education.service';
import { ExperienceService } from './services/experience.service';
import { SocialLinksService } from './services/social-links.service';
import { CertificationService } from './services/certification.service';
import { SkillService } from './services/skill.service';
import { GeminiService } from '../services/gemini.service';
import { OtpModule } from '../otp/otp.module';
import { Candidate, CandidateSchema } from '../schemas/candidate.schema';
import { Education, EducationSchema } from '../schemas/education.schema';
import { Experience, ExperienceSchema } from '../schemas/experience.schema';
import { Certification, CertificationSchema } from '../schemas/certification.schema';
import { Skill, SkillSchema } from '../schemas/skill.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Candidate.name, schema: CandidateSchema },
      { name: Education.name, schema: EducationSchema },
      { name: Experience.name, schema: ExperienceSchema },
      { name: Certification.name, schema: CertificationSchema },
      { name: Skill.name, schema: SkillSchema }
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
      inject: [ConfigService],
    }),
    OtpModule
  ],
  controllers: [
    CandidateController,
    EducationController,
    ExperienceController,
    SocialLinksController,
    CertificationController,
    SkillController,
    CandidateFilesController // Add new controller
  ],
  providers: [
    CandidateService,
    EducationService,
    ExperienceService,
    SocialLinksService,
    CertificationService,
    SkillService,
    ConfigService,
    GeminiService,
    CandidateFileService // Add new service
  ],
  exports: [CandidateService, CandidateFileService] // Export new service if needed elsewhere
})
export class CandidateModule {}