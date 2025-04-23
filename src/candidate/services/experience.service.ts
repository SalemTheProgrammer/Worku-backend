import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Experience } from '../../schemas/experience.schema';
import { CreateExperienceDto, UpdateExperienceDto } from '../dto/experience.dto';

@Injectable()
export class ExperienceService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async addExperience(userId: string, createExperienceDto: CreateExperienceDto) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    // Initialize experience array if it doesn't exist
    if (!candidate.experience) {
      candidate.experience = [];
    }

    const newExperience = {
      _id: new Types.ObjectId().toString(),
      ...createExperienceDto,
      startDate: new Date(createExperienceDto.startDate),
      endDate: createExperienceDto.endDate ? new Date(createExperienceDto.endDate) : undefined,
      skills: createExperienceDto.skills || [],
      achievements: createExperienceDto.achievements || [],
      isCurrent: createExperienceDto.endDate ? false : true
    };

    candidate.experience.push(newExperience);
    await candidate.save();
    return newExperience;
  }

  async getExperience(userId: string) {
    const candidate = await this.candidateModel
      .findById(userId)
      .select('experience');
    
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return candidate.experience || [];
  }

  async getExperienceById(userId: string, experienceId: string) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    if (!candidate.experience) {
      throw new HttpException('Experience not found', HttpStatus.NOT_FOUND);
    }

    const experience = candidate.experience.find(
      (exp) => exp._id === experienceId
    );

    if (!experience) {
      throw new HttpException('Experience entry not found', HttpStatus.NOT_FOUND);
    }

    return experience;
  }

  async updateExperience(userId: string, experienceId: string, updateExperienceDto: UpdateExperienceDto) {
    const isCurrent = updateExperienceDto.endDate ? false : true;

    const result = await this.candidateModel.updateOne(
      { 
        _id: userId,
        'experience._id': experienceId 
      },
      {
        $set: {
          'experience.$': {
            _id: experienceId,
            ...updateExperienceDto,
            startDate: new Date(updateExperienceDto.startDate),
            endDate: updateExperienceDto.endDate ? new Date(updateExperienceDto.endDate) : undefined,
            skills: updateExperienceDto.skills || [],
            achievements: updateExperienceDto.achievements || [],
            isCurrent
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpException(
        'Experience entry not found',
        HttpStatus.NOT_FOUND
      );
    }

    return this.getExperienceById(userId, experienceId);
  }

  async deleteExperience(userId: string, experienceId: string) {
    const result = await this.candidateModel.updateOne(
      { _id: userId },
      {
        $pull: {
          experience: { _id: experienceId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      throw new HttpException(
        'Experience entry not found',
        HttpStatus.NOT_FOUND
      );
    }

    return { message: 'Experience entry deleted successfully' };
  }
}
