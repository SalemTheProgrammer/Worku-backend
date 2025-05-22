import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Job } from '../../../schemas/job.schema';
import { Candidate } from '../../../schemas/candidate.schema';
import { Application } from '../../../schemas/application.schema';
import { GeminiClientService } from '../../../services/gemini-client.service';
import { JobMatchResponse } from '../interfaces/job-match.interface';
import { MatchResponseFormatterService } from './match-response-formatter.service';
import { JobMatchPromptService } from './job-match-prompt.service';
import { SalaryCalculatorUtils } from '../utils/salary-calculator.utils';
import { SkillMatcherUtils } from '../utils/skill-matcher.utils';

/**
 * Main service for analyzing job matches between candidates and jobs
 */
@Injectable()
export class JobMatchAnalysisService {
  private readonly logger = new Logger(JobMatchAnalysisService.name);
  private readonly maxAttempts = 3;

  constructor(
    @InjectModel(Job.name) private readonly jobModel: Model<Job>,
    @InjectModel(Candidate.name) private readonly candidateModel: Model<Candidate>,
    @InjectModel(Application.name) private readonly applicationModel: Model<Application>,
    private readonly geminiClient: GeminiClientService,
    private readonly responseFormatter: MatchResponseFormatterService,
    private readonly promptService: JobMatchPromptService
  ) {}

  /**
   * Analyze job match between a candidate and a job
   */
  async analyzeMatch(candidateId: string, jobId: string): Promise<JobMatchResponse> {
    this.logger.log('========== JOB MATCH ANALYSIS ==========');
    this.logger.log(`Starting analysis...`);
    this.logger.log(`Candidate ID: ${candidateId}`);
    this.logger.log(`Job ID: ${jobId}`);
    this.logger.log('=======================================');
    
    // Step 1: Retrieve candidate and job data
    const [candidate, job] = await Promise.all([
      this.candidateModel.findById(candidateId).exec(),
      this.jobModel.findById(jobId).exec()
    ]);
    
    if (!job) {
      this.logger.error('[JobMatchAnalysis] Job not found');
      throw new Error('Job not found');
    }
    
    if (!candidate) {
      this.logger.error('[JobMatchAnalysis] Candidate not found');
      throw new Error('Candidate not found');
    }
    
    // Step 2: Preprocess data and identify potential skill matches
    const potentialMatches = this.promptService.preprocessMatchData(job, candidate);
    this.logger.log(`Found ${potentialMatches.length} potential skill matches`);
    
    // Step 3: Create job matching prompt
    this.logger.log('\n1️⃣ Creating job matching prompt...');
    const prompt = this.promptService.createJobMatchingPrompt(job, candidate, potentialMatches);
    
    // Step 4: Generate AI analysis
    let parsedResponse: any = null;
    let attempt = 0;
    
    while (attempt < this.maxAttempts) {
      attempt++;
      this.logger.log(`\n🔄 Analysis attempt ${attempt} of ${this.maxAttempts}...`);
      
      try {
        this.logger.log('Sending prompt to Gemini...');
        let text = await this.geminiClient.generateContent(prompt);
        this.logger.log('Received response from Gemini');
        text = text.replace(/```json|```/g, '').trim();
        
        if (!text.startsWith('{')) {
          this.logger.warn(`Attempt ${attempt}: Non-JSON response received: ${text.slice(0, 50)}`);
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          if (jsonMatch && jsonMatch[0]) {
            text = jsonMatch[0];
            this.logger.log('Extracted potential JSON from response');
          } else {
            if (attempt < this.maxAttempts) continue;
          }
        }
        
        try {
          parsedResponse = JSON.parse(text);
          
          if (parsedResponse.resume && parsedResponse.signauxAlerte) {
            break;
          } else {
            this.logger.warn('Response has invalid structure, retrying...');
            if (attempt < this.maxAttempts) continue;
          }
        } catch (error) {
          this.logger.error(`Attempt ${attempt}: Failed to parse JSON:`, error);
          if (attempt < this.maxAttempts) continue;
        }
      } catch (error) {
        this.logger.error(`Error in job match analysis attempt ${attempt}:`, error);
        if (attempt < this.maxAttempts) continue;
      }
    }
    
    // Step 5: Process AI response
    if (!parsedResponse) {
      this.logger.error('❌ Failed to get valid response after all attempts');
      
      // Calculate salary even for fallback response
      const candidateSkills = SkillMatcherUtils.extractCandidateSkills(candidate.skills);
      const candidateEducation = candidate.education?.map((e: any) => e.degree).join(', ') || '';
      const yearsOfExperience = candidate.yearsOfExperience || 0;
      
      const fallbackWithSalary = {
        ...this.responseFormatter.createFallbackJobMatchResponse(),
        potentialSalary: SalaryCalculatorUtils.calculateTunisianSalaryRange(
          yearsOfExperience,
          candidateSkills,
          candidateEducation,
          job.title
        )
      };
      
      return this.saveFallbackResultToDatabase(candidateId, jobId, fallbackWithSalary);
    }
    
    this.logger.log('\n✅ Analysis completed successfully');
    
    try {
      // Step 6: Ensure required arrays are present and validate
      parsedResponse.resume.suggestions = parsedResponse.resume.suggestions || [];
      parsedResponse.resume.matchedKeywords = parsedResponse.resume.matchedKeywords || [];
      parsedResponse.resume.highlightsToStandOut = parsedResponse.resume.highlightsToStandOut || [];
      
      const validatedResponse = parsedResponse as JobMatchResponse;
      this.logger.log('Response validation successful');
      
      // Step 7: Format signals and calculate salary
      const formattedSignalAlerts = this.responseFormatter.formatSignalAlerts(validatedResponse.signauxAlerte);
      
      const candidateSkills = SkillMatcherUtils.extractCandidateSkills(candidate.skills);
      const candidateEducation = candidate.education?.map((e: any) => e.degree).join(', ') || '';
      const yearsOfExperience = candidate.yearsOfExperience || 0;
      
      const tunisianSalaryRange = SalaryCalculatorUtils.calculateTunisianSalaryRange(
        yearsOfExperience,
        candidateSkills,
        candidateEducation,
        job.title
      );
      
      // Step 8: Create analysis data
      const analysisData = this.responseFormatter.createAnalysisData(
        validatedResponse, 
        formattedSignalAlerts,
        tunisianSalaryRange,
        candidateSkills
      );
      
      // Step 9: Save analysis results to application
      await this.saveResultToDatabase(candidateId, jobId, analysisData, tunisianSalaryRange);
      
      // Step 10: Return enriched response
      const enrichedResponse = {
        ...validatedResponse,
        potentialSalary: tunisianSalaryRange
      };
      
      return enrichedResponse;
    } catch (error) {
      this.logger.error('❌ Error validating response:', error);
      return this.handleResponseError(error, parsedResponse, candidate, job, candidateId, jobId);
    }
  }

  /**
   * Handle errors in response processing
   */
  private async handleResponseError(error: any, parsedResponse: any, candidate: any, job: any, candidateId: string, jobId: string): Promise<JobMatchResponse> {
    this.logger.debug('Invalid Response:', parsedResponse);
    
    try {
      const recoveredResponse = this.responseFormatter.recoverPartialJobMatchResponse(parsedResponse);
      this.logger.log('⚠️ Recovered partial response');
      
      // Add salary information to recovered response
      const candidateSkills = SkillMatcherUtils.extractCandidateSkills(candidate.skills);
      const candidateEducation = candidate.education?.map((e: any) => e.degree).join(', ') || '';
      const yearsOfExperience = candidate.yearsOfExperience || 0;
      
      const tunisianSalaryRange = SalaryCalculatorUtils.calculateTunisianSalaryRange(
        yearsOfExperience,
        candidateSkills,
        candidateEducation,
        job.title
      );
      
      const recoveredWithSalary = {
        ...recoveredResponse,
        potentialSalary: tunisianSalaryRange
      };
      
      // Save recovered response to database
      await this.saveRecoveredResultToDatabase(candidateId, jobId, recoveredWithSalary, tunisianSalaryRange);
      
      return recoveredWithSalary;
    } catch (recoverError) {
      this.logger.error('❌ Recovery failed, using fallback response');
      
      // Get candidate and job information for salary calculation
      const candidateSkills = SkillMatcherUtils.extractCandidateSkills(candidate.skills);
      const candidateEducation = candidate.education?.map((e: any) => e.degree).join(', ') || '';
      const yearsOfExperience = candidate.yearsOfExperience || 0;
      
      // Create fallback response with salary information
      const fallbackWithSalary = {
        ...this.responseFormatter.createFallbackJobMatchResponse(),
        potentialSalary: SalaryCalculatorUtils.calculateTunisianSalaryRange(
          yearsOfExperience,
          candidateSkills,
          candidateEducation,
          job.title
        )
      };
      
      // Save fallback response to database
      return this.saveFallbackResultToDatabase(candidateId, jobId, fallbackWithSalary);
    }
  }

  /**
   * Save analysis results to application
   */
  private async saveResultToDatabase(candidateId: string, jobId: string, analysisData: any, salaryRange: any): Promise<void> {
    const result = await this.applicationModel.findOneAndUpdate(
      { candidat: candidateId, poste: jobId },
      {
        $set: {
          ...analysisData,
          statut: 'analysé',
          dateAnalyse: new Date(),
          potentialSalary: salaryRange
        }
      },
      { new: true }
    ).exec();

    if (!result) {
      this.logger.error('Failed to update application with analysis results');
      throw new Error('Application update failed');
    }

    this.logger.log('Successfully saved analysis results to database');
  }

  /**
   * Save recovered results to application
   */
  private async saveRecoveredResultToDatabase(candidateId: string, jobId: string, recoveredResponse: any, salaryRange: any): Promise<JobMatchResponse> {
    const result = await this.applicationModel.findOneAndUpdate(
      { candidat: candidateId, poste: jobId },
      {
        $set: {
          statut: 'analysé',
          dateAnalyse: new Date(),
          analyse: {
            recoveredData: true,
            score: recoveredResponse.resume.score,
            matchedKeywords: recoveredResponse.resume.matchedKeywords,
            highlightsToStandOut: recoveredResponse.resume.highlightsToStandOut,
            signauxAlerte: recoveredResponse.signauxAlerte,
            potentialSalary: salaryRange
          }
        }
      },
      { new: true }
    ).exec();

    if (!result) {
      this.logger.error('Failed to update application with recovered results');
    } else {
      this.logger.log('Saved recovered results to database');
    }

    return recoveredResponse;
  }

  /**
   * Save fallback results to application
   */
  private async saveFallbackResultToDatabase(candidateId: string, jobId: string, fallbackResponse: JobMatchResponse): Promise<JobMatchResponse> {
    const result = await this.applicationModel.findOneAndUpdate(
      { candidat: candidateId, poste: jobId },
      {
        $set: {
          statut: 'analysé',
          dateAnalyse: new Date(),
          analyse: {
            fallbackData: true,
            score: 50,
            matchedKeywords: fallbackResponse.resume.matchedKeywords,
            signauxAlerte: fallbackResponse.signauxAlerte,
            potentialSalary: fallbackResponse.potentialSalary
          }
        }
      },
      { new: true }
    ).exec();

    if (!result) {
      this.logger.error('Failed to update application with fallback results');
    } else {
      this.logger.log('Saved fallback results to database');
    }

    return fallbackResponse;
  }
}