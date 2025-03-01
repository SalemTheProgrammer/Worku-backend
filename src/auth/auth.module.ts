import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtStrategy, JwtRefreshStrategy } from './strategies/jwt.strategy';
import { OtpModule } from '../otp/otp.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Company, CompanySchema } from '../schemas/company.schema';

@Module({
  imports: [
    OtpModule,
    MongooseModule.forFeature([{ name: Company.name, schema: CompanySchema }]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('jwt.secret'),
        signOptions: {
          expiresIn: configService.get('jwt.expiresIn'),
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, JwtRefreshStrategy],
  exports: [AuthService],
})
export class AuthModule {}