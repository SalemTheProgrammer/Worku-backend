import { Injectable, NotFoundException, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs/promises';
import * as path from 'path';
import { Candidate, CandidateDocument } from '../schemas/candidate.schema';
import { CVAnalysisService } from '../services/cv-analysis.service';
import { ImageAnalysisService } from '../services/image-analysis.service';
import { CvAnalysisQueue } from './cv-analysis.queue';
import { CvSkillsService } from './services/cv-skills.service';

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
    await candidate.save();

    try {
      // Basic validation of file format
      await fs.access(absolutePath);
      
      // Queue CV analysis for background processing
      await this.cvAnalysisQueue.addCvAnalysisJob(absolutePath, userId);
      this.logger.log(`Queued CV analysis and skill extraction for candidate ${userId}`);
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
    const candidate = await this.findCandidate(userId);
    if (!candidate.cvUrl) {
      throw new NotFoundException('No CV found for analysis.');
    }

    const absolutePath = path.resolve(candidate.cvUrl);
    return await this.cvAnalysisService.analyzeCV(absolutePath);
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
}