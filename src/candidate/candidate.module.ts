import { Module, forwardRef } from '@nestjs/common';
import { CandidateController } from './candidate.controller';
import { CandidateService } from './candidate.service';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { CandidateSchema, Candidate } from '../schemas/candidate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Candidate.name, schema: CandidateSchema }]),
    OtpModule,
    forwardRef(() => AuthModule),
  ],
  controllers: [CandidateController],
  providers: [CandidateService],
  exports: [CandidateService],
})
export class CandidateModule {}