import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class CvAnalysisQueue {
  private readonly logger = new Logger(CvAnalysisQueue.name);
  
  constructor(
    @InjectQueue('cv-analysis') private cvAnalysisQueue: Queue
  ) {}

  async addCvAnalysisJob(cvPath: string, candidateId: string) {
    this.logger.log(`Adding CV analysis job for candidate ${candidateId}`);
    await this.cvAnalysisQueue.add('analyze-cv', {
      cvPath,
      candidateId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
  
  async addProfileExtractionJob(cvPath: string, candidateId: string) {
    this.logger.log(`Adding profile extraction job for candidate ${candidateId}`);
    await this.cvAnalysisQueue.add('extract-profile', {
      cvPath,
      candidateId
    }, {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000
      }
    });
  }
}