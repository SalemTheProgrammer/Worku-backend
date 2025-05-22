import { Module, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CompanyJournal, CompanyJournalSchema } from '../schemas/company-journal.schema';
import { CandidateJournal, CandidateJournalSchema } from '../schemas/candidate-journal.schema';
import { CompanyJournalService } from './services/company-journal.service';
import { CandidateJournalService } from './services/candidate-journal.service';
import { CompanyJournalController } from './controllers/company-journal.controller';
import { CandidateJournalController } from './controllers/candidate-journal.controller';
import { ActivityLoggerMiddleware } from './middleware/activity-logger.middleware';
import { AuthModule } from '../auth/auth.module';

/**
 * Module pour la gestion des journaux d'activité
 * Permet de suivre et enregistrer les actions des utilisateurs (entreprises et candidats)
 */
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CompanyJournal.name, schema: CompanyJournalSchema },
      { name: CandidateJournal.name, schema: CandidateJournalSchema },
    ]),
    AuthModule, // Import Auth module for guards
  ],
  providers: [CompanyJournalService, CandidateJournalService],
  exports: [CompanyJournalService, CandidateJournalService],
  controllers: [CompanyJournalController, CandidateJournalController],
})
export class JournalModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply the activity logger middleware to specific routes
    // You can customize this based on your application's needs
    consumer
      .apply(ActivityLoggerMiddleware)
      .exclude(
        // Exclude routes that don't need activity logging
        { path: 'api/health', method: RequestMethod.ALL },
        { path: 'api/:type/journal*path', method: RequestMethod.ALL }, // Exclude journal routes themselves
      )
      .forRoutes(
        // Include routes that need activity logging
        { path: 'api/candidate/*path', method: RequestMethod.ALL },
        { path: 'api/company/*path', method: RequestMethod.ALL },
        { path: 'api/job/*path', method: RequestMethod.ALL },
        { path: 'api/interview/*path', method: RequestMethod.ALL },
      );
  }
}