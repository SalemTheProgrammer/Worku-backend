import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ConfigService } from '@nestjs/config';
import { CvSkillsService } from './services/cv-skills.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate } from '../schemas/candidate.schema';

@Processor('cv-analysis')
export class CvAnalysisProcessor {
  private readonly logger = new Logger(CvAnalysisProcessor.name);

  constructor(
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>,
    private readonly cvSkillsService: CvSkillsService,
    private readonly configService: ConfigService,
  ) {}

  @Process('analyze-cv')
  async handleCvAnalysis(job: Job<{ cvPath: string; candidateId: string }>) {
    try {
      const { cvPath, candidateId } = job.data;
      this.logger.log(`Starting CV analysis job ${job.id} for candidate ${candidateId}`);

      // Verify the CV file exists
      const candidate = await this.candidateModel.findById(candidateId);
      if (!candidate) {
        throw new Error('Candidate not found');
      }

      // Process the CV in the background with multiple retries
      let attempt = 1;
      const maxAttempts = 3;
      let lastError;

      while (attempt <= maxAttempts) {
        try {
          this.logger.log(`Attempt ${attempt} of CV analysis for candidate ${candidateId}`);
          await this.cvSkillsService.extractSkillsFromCV(cvPath, candidateId);
          this.logger.log(`Successfully completed CV analysis job ${job.id}`);
          return;
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
      this.logger.error(`Error processing CV analysis job ${job.id}:`, error);
      throw error;
    }
  }
}