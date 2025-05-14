import { Module, Provider } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CompanyController } from './company.controller';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyLogoController } from './company-logo.controller';
import { InvitedUsersController } from './invited-users.controller';
import { Company, CompanySchema } from '../schemas/company.schema';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';
import { EmailTemplateService } from '../services/email-template.service';
import { CompanyAuthService } from './company-auth.service';
import { CompanyProfileService } from './company-profile.service';
import { InvitedUsersService } from './invited-users.service';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Company.name, schema: CompanySchema }
    ]),
    MulterModule.register({
      dest: './uploads',
    }),
    OtpModule,
    AuthModule,
    EmailModule,
  ],
  controllers: [
    CompanyController,
    CompanyProfileController,
    CompanyLogoController,
    InvitedUsersController
  ],
  providers: [
    CompanyAuthService,
    CompanyProfileService,
    InvitedUsersService,
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
    EmailTemplateService
  ],
})
export class CompanyModule {}