import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate } from '../schemas/candidate.schema';
import * as path from 'path';
import { CvProfileExtractorService } from './cv-profile-extractor/cv-profile-extractor.service';

@Processor('cv-analysis')
export class CvProfileExtractionProcessor {
  private readonly logger = new Logger(CvProfileExtractionProcessor.name);

  constructor(
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>,
    private readonly profileExtractorService: CvProfileExtractorService,
    private readonly configService: ConfigService,
  ) {}

  @Process('extract-profile')
  async handleProfileExtraction(job: Job<{ cvPath: string; candidateId: string }>) {
    try {
      const { cvPath, candidateId } = job.data;
      this.logger.log(`Starting CV profile extraction job ${job.id} for candidate ${candidateId}`);

      // Verify the CV file exists
      const candidate = await this.candidateModel.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Process the CV with multiple retries
      let attempt = 1;
      const maxAttempts = 3;
      let lastError;

      while (attempt <= maxAttempts) {
        try {
          this.logger.log(`Attempt ${attempt} of profile extraction for candidate ${candidateId}`);
          
          // Extract and update the profile
          const success = await this.profileExtractorService.extractAndUpdateProfile(cvPath, candidateId);
          
          if (success) {
            this.logger.log(`Successfully completed profile extraction job ${job.id}`);
            return;
          } else {
            throw new Error('Profile extraction did not complete successfully');
          }
        } catch (error) {
          lastError = error;
          this.logger.warn(`Attempt ${attempt} failed:`, error.message);
          await new Promise(resolve => setTimeout(resolve, 2000 * attempt)); // Exponential backoff
          attempt++;
        }
      }

      // If we get here, all attempts failed
      throw lastError;
    } catch (error) {
      this.logger.error(`Error processing CV profile extraction job ${job.id}:`, error);
      throw error;
    }
  }
}