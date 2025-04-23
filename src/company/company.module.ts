import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MulterModule } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { CompanyProfileController } from './company-profile.controller';
import { CompanyLogoController } from './company-logo.controller';
import { Company, CompanySchema } from '../schemas/company.schema';
import { OtpModule } from '../otp/otp.module';
import { AuthModule } from '../auth/auth.module';

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
  ],
  controllers: [
    CompanyController,
    CompanyProfileController,
    CompanyLogoController
  ],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}