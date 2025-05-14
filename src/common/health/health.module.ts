import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { HealthController } from '../controllers/health.controller';

@Module({
  imports: [
    ConfigModule,
    MongooseModule,
    BullModule.registerQueue({
      name: 'cv-analysis',
    })
  ],
  controllers: [HealthController]
})
export class HealthModule {}