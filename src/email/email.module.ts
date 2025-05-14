import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { ConfigModule } from '@nestjs/config';
import { GeminiModule } from '../services/gemini.module';

@Module({
  imports: [ConfigModule, GeminiModule],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}