import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { BullModule } from '@nestjs/bull';
import { JwtService } from '@nestjs/jwt';

// Schemas
import { Company, CompanySchema } from '../schemas/company.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { CompanyJournal, CompanyJournalSchema } from '../schemas/company-journal.schema';
import { Otp, OtpSchema } from '../otp/schemas/otp.schema';

// Controllers
import { CompanyController } from './company.controller';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyDashboardController } from './company-dashboard.controller';
import { CompanyLogoController } from './company-logo.controller';
import { InvitedUsersController } from './invited-users.controller';
import { CompanyListController } from './controllers/company-list.controller';

// Services
import { CompanyAuthService } from './company-auth.service';
import { CompanyProfileService } from './company-profile.service';
import { CompanyDashboardService } from './company-dashboard.service';
import { InvitedUsersService } from './invited-users.service';
import { CompanyListService } from './services/company-list.service';
import { CompanyJournalService } from '../journal/services/company-journal.service';

// External Modules
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: CompanyJournal.name, schema: CompanyJournalSchema },
      { name: Otp.name, schema: OtpSchema },
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
    BullModule.registerQueue({
      name: 'cv-analysis',
    }),
    OtpModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [
    CompanyController,
    CompanyProfileController,
    CompanyDashboardController,
    CompanyLogoController,
    InvitedUsersController,
    CompanyListController,
  ],
  providers: [
    CompanyAuthService,
    CompanyProfileService,
    CompanyDashboardService,
    InvitedUsersService,
    {
      provide: 'InvitedUsersServiceInterface',
      useClass: InvitedUsersService,
    },
    CompanyListService,
    JwtService,
    CompanyJournalService,
  ],
  exports: [
    CompanyAuthService,
    CompanyProfileService,
    CompanyDashboardService,
    InvitedUsersService,
    CompanyListService,
  ],
})
export class CompanyModule {}