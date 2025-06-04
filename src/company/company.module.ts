import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CompanyController } from './company.controller';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyLogoController } from './company-logo.controller';
import { InvitedUsersController } from './invited-users.controller';
import { CompanyDashboardController } from './company-dashboard.controller';
import { Company, CompanySchema } from '../schemas/company.schema';
import { Job, JobSchema } from '../schemas/job.schema';
import { Application, ApplicationSchema } from '../schemas/application.schema';
import { Interview, InterviewSchema } from '../schemas/interview.schema';
import { CompanyJournal, CompanyJournalSchema } from '../schemas/company-journal.schema';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { EmailTemplateService } from '../services/email-template.service';
import { CompanyAuthService } from './company-auth.service';
import { CompanyProfileService } from './company-profile.service';
import { InvitedUsersService } from './invited-users.service';
import { CompanyDashboardService } from './company-dashboard.service';
import { EmailModule } from 'src/email/email.module';
import { JournalModule } from '../journal/journal.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema },
      { name: Job.name, schema: JobSchema },
      { name: Application.name, schema: ApplicationSchema },
      { name: Interview.name, schema: InterviewSchema },
      { name: CompanyJournal.name, schema: CompanyJournalSchema }
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
    OtpModule,
    AuthModule,
    EmailModule,
    JournalModule,
  ],
  controllers: [
    CompanyController,
    CompanyProfileController,
    CompanyLogoController,
    InvitedUsersController,
    CompanyDashboardController
  ],
  providers: [
    CompanyAuthService,
    CompanyProfileService,
    InvitedUsersService,
    CompanyDashboardService,
    {
      provide: 'InvitedUsersServiceInterface',
      useClass: InvitedUsersService
    },
    EmailTemplateService
  ],
  exports: [
    CompanyAuthService,
    CompanyProfileService,
    InvitedUsersService,
    CompanyDashboardService,
    EmailTemplateService
  ],
})
export class CompanyModule {}