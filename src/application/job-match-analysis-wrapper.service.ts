import { Injectable } from '@nestjs/common';
import { JobMatchAnalysisService } from './job-match/services/job-match-analysis.service';

/**
 * Wrapper service to maintain backward compatibility with existing code
 * This service simply forwards calls to the refactored job match analysis service
 */
@Injectable()
export class JobMatchAnalysisWrapperService {
  constructor(private readonly jobMatchAnalysisService: JobMatchAnalysisService) {}

  /**
   * Analyze match between candidate and job
   */
  async analyzeMatch(candidateId: string, jobId: string) {
    return this.jobMatchAnalysisService.analyzeMatch(candidateId, jobId);
  }
}