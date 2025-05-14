import { Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Injectable()
export class CvAnalysisQueue {
  constructor(
    @InjectQueue('cv-analysis') private cvAnalysisQueue: Queue
  ) {}

  async addCvAnalysisJob(cvPath: string, candidateId: string) {
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
}