import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { CVAnalysisService } from '../services/cv-analysis.service';
import { ImageAnalysisService } from '../services/image-analysis.service';
import { CvAnalysisQueue } from './cv-analysis.queue';
import { CvSkillsService } from './services/cv-skills.service';
import { CvAnalysisResponseDto } from './dto/cv-analysis.dto';

@Injectable()
export class CandidateFileService {
  private readonly logger = new Logger(CandidateFileService.name);

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<CandidateDocument>,
    private cvAnalysisService: CVAnalysisService,
    private imageAnalysisService: ImageAnalysisService,
    private cvAnalysisQueue: CvAnalysisQueue,
  ) {}

  private async findCandidate(userId: string): Promise<CandidateDocument> {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new NotFoundException('Candidate not found');
    }
    return candidate;
  }

  private async safeUnlink(filePath?: string): Promise<void> {
    if (filePath) {
      try {
        const absolutePath = path.resolve(filePath); // Ensure absolute path
        await fs.unlink(absolutePath);
      } catch (error) {
        // Log error but don't throw, as the primary operation might have succeeded
        console.error(`Error deleting file ${filePath}:`, error);
      }
    }
  }

  // --- Profile Picture Methods ---

  async updateProfilePicture(userId: string, file: Express.Multer.File): Promise<string> {
    const candidate = await this.findCandidate(userId);
    const oldPicturePath = candidate.profilePicture ? path.resolve(candidate.profilePicture) : undefined;

    const newRelativePath = path.join('uploads', userId, 'images', file.filename).replace(/\\/g, '/');

    candidate.profilePicture = newRelativePath;
    await candidate.save();

    if (oldPicturePath && oldPicturePath !== path.resolve(newRelativePath)) {
       await this.safeUnlink(oldPicturePath);
    }

    return `/${newRelativePath}`;
  }

  async getProfilePictureUrl(userId: string): Promise<string | null> {
    const candidate = await this.findCandidate(userId);
    return candidate.profilePicture ? `/${candidate.profilePicture}` : null;
  }

  async deleteProfilePicture(userId: string): Promise<void> {
    const candidate = await this.findCandidate(userId);
    const picturePath = candidate.profilePicture;

    if (!picturePath) {
      throw new NotFoundException('Profile picture not found.');
    }

    candidate.profilePicture = undefined;
    await candidate.save();
    await this.safeUnlink(picturePath);
  }

  // --- CV Methods ---

  async updateCV(userId: string, file: Express.Multer.File): Promise<string> {
    const candidate = await this.findCandidate(userId);
    const oldCvPath = candidate.cvUrl ? path.resolve(candidate.cvUrl) : undefined;

    const newRelativePath = path.join('uploads', userId, 'cv', file.filename).replace(/\\/g, '/');
    const absolutePath = path.resolve(newRelativePath);

    // Save CV and validate
    candidate.cvUrl = newRelativePath;
    // Initialize empty skills array with valid proficiency levels
    candidate.skills = [];
    
    // Ensure there's at least one valid education entry with all required fields
    if (!candidate.education || candidate.education.length === 0) {
      candidate.education = [{
        _id: new mongoose.Types.ObjectId().toString(),
        institution: 'Non spécifié',
        degree: 'Non spécifié',
        fieldOfStudy: 'Non spécifié', // Critical field that's causing validation errors
        startDate: new Date()
      }];
    } else {
      // Validate all existing education entries
      candidate.education = candidate.education.map(edu => {
        if (!edu.fieldOfStudy) edu.fieldOfStudy = 'Non spécifié';
        if (!edu.institution) edu.institution = 'Non spécifié';
        if (!edu.degree) edu.degree = 'Non spécifié';
        if (!edu.startDate) edu.startDate = new Date();
        return edu;
      });
    }
    
    await candidate.save();

    try {
      // Basic validation of file format
      await fs.access(absolutePath);
      
      // Only queue profile extraction job for CV upload
      await this.cvAnalysisQueue.addProfileExtractionJob(absolutePath, userId);
      this.logger.log(`Queued profile extraction for candidate ${userId}`);
    } catch (error) {
      // If validation fails, clean up and throw error
      await this.safeUnlink(absolutePath);
      candidate.cvUrl = oldCvPath?.replace(/\\/g, '/');
      await candidate.save();
      throw new HttpException('Invalid CV format or content', HttpStatus.BAD_REQUEST);
    }

    // Clean up old CV if exists and different from new one
    if (oldCvPath && oldCvPath !== absolutePath) {
      await this.safeUnlink(oldCvPath);
    }

    return `/${newRelativePath}`;
  }

  async getCVUrl(userId: string): Promise<string | null> {
    const candidate = await this.findCandidate(userId);
    return candidate.cvUrl ? `/${candidate.cvUrl}` : null;
  }

  async getCVContent(userId: string): Promise<string | null> {
    try {
      const candidate = await this.findCandidate(userId);
      if (!candidate.cvUrl) {
        return null;
      }

      const cvPath = path.resolve(candidate.cvUrl);
      const content = await fs.readFile(cvPath, 'utf-8');
      return content;
    } catch (error) {
      console.error(`Error reading CV file for user ${userId}:`, error);
      return null;
    }
  }

  async deleteCV(userId: string): Promise<void> {
    const candidate = await this.findCandidate(userId);
    const cvPath = candidate.cvUrl;

    if (!cvPath) {
      throw new NotFoundException('CV not found.');
    }

    candidate.cvUrl = undefined;
    await candidate.save();
    await this.safeUnlink(cvPath);
  }

  async analyzeCV(userId: string): Promise<any> {
    this.logger.debug(`Starting CV analysis for user ${userId}`);
    const candidate = await this.findCandidate(userId);
    if (!candidate.cvUrl) {
      this.logger.warn(`No CV found for user ${userId}`);
      throw new NotFoundException('No CV found for analysis.');
    }

    try {
      const absolutePath = path.resolve(candidate.cvUrl);
      this.logger.debug(`CV path resolved: ${absolutePath}`);
      
      // Verify file exists and is accessible
      await fs.access(absolutePath);
      this.logger.debug(`CV file exists and is accessible at ${absolutePath}`);
      
      // Get file stats to check size
      const fileStats = await fs.stat(absolutePath);
      this.logger.debug(`CV file size: ${fileStats.size} bytes`);
      
      if (fileStats.size === 0) {
        this.logger.warn(`CV file is empty for user ${userId}`);
        throw new HttpException('CV file is empty', HttpStatus.BAD_REQUEST);
      }
      
      const result = await this.cvAnalysisService.analyzeCV(absolutePath);
      this.logger.debug(`CV analysis completed successfully for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error during CV analysis for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error analyzing CV: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  // --- CV Image Methods ---

  async uploadCVImage(userId: string, file: Express.Multer.File): Promise<string> {
    const candidate = await this.findCandidate(userId);
    const oldCvImagePath = candidate.cvImageUrl ? path.resolve(candidate.cvImageUrl) : undefined;

    const newRelativePath = path.join('uploads', userId, 'cv', file.filename).replace(/\\/g, '/');
    const absolutePath = path.resolve(newRelativePath);

    // Save CV image URL
    candidate.cvImageUrl = newRelativePath;
    await candidate.save();

    // Clean up old CV image if exists and different from new one
    if (oldCvImagePath && oldCvImagePath !== absolutePath) {
      await this.safeUnlink(oldCvImagePath);
    }

    return `/${newRelativePath}`;
  }

  async analyzeCVImage(userId: string): Promise<any> {
    const candidate = await this.findCandidate(userId);
    if (!candidate.cvImageUrl) {
      throw new NotFoundException('No CV image found for analysis.');
    }

    const absolutePath = path.resolve(candidate.cvImageUrl);
    return await this.imageAnalysisService.analyzeResumeImage(absolutePath);
  }

  /**
   * Analyzes the CV content and provides feedback about the CV itself,
   * such as formatting issues, inconsistencies, and improvement suggestions.
   * This is different from job matching analysis.
   */
  async analyzeCVContent(userId: string): Promise<CvAnalysisResponseDto> {
    this.logger.debug(`Starting CV content analysis for user ${userId}`);
    const candidate = await this.findCandidate(userId);
    if (!candidate.cvUrl) {
      this.logger.warn(`No CV found for user ${userId}`);
      throw new NotFoundException('No CV found for analysis.');
    }

    try {
      const absolutePath = path.resolve(candidate.cvUrl);
      this.logger.debug(`CV path resolved: ${absolutePath}`);
      
      // Verify file exists and is accessible
      await fs.access(absolutePath);
      this.logger.debug(`CV file exists and is accessible at ${absolutePath}`);
      
      // Get file stats to check size
      const fileStats = await fs.stat(absolutePath);
      this.logger.debug(`CV file size: ${fileStats.size} bytes`);
      
      if (fileStats.size === 0) {
        this.logger.warn(`CV file is empty for user ${userId}`);
        throw new HttpException('CV file is empty', HttpStatus.BAD_REQUEST);
      }
      
      // Pass the file to the CV analysis service for content feedback
      const result = await this.cvAnalysisService.analyzeCVContent(absolutePath);
      this.logger.debug(`CV content analysis completed successfully for user ${userId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error during CV content analysis for user ${userId}: ${error.message}`, error.stack);
      if (error instanceof NotFoundException || error instanceof HttpException) {
        throw error;
      }
      throw new HttpException('Error analyzing CV content: ' + error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}