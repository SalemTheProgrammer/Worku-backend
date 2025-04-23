import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Education } from '../../schemas/education.schema';
import { CreateEducationDto, UpdateEducationDto } from '../dto/education.dto';

@Injectable()
export class EducationService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async addEducation(userId: string, createEducationDto: CreateEducationDto) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    // Initialize education array if it doesn't exist
    if (!candidate.education) {
      candidate.education = [];
    }

    const newEducation = {
      _id: new Types.ObjectId().toString(),
      ...createEducationDto,
      startDate: new Date(createEducationDto.startDate),
      endDate: createEducationDto.endDate ? new Date(createEducationDto.endDate) : undefined
    };

    candidate.education.push(newEducation);
    await candidate.save();
    return newEducation;
  }

  async getEducation(userId: string) {
    const candidate = await this.candidateModel
      .findById(userId)
      .select('education');
    
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return candidate.education || [];
  }

  async getEducationById(userId: string, educationId: string) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    if (!candidate.education) {
      throw new HttpException('Education not found', HttpStatus.NOT_FOUND);
    }

    const education = candidate.education.find(
      (edu) => edu._id === educationId
    );

    if (!education) {
      throw new HttpException('Education entry not found', HttpStatus.NOT_FOUND);
    }

    return education;
  }

  async updateEducation(userId: string, educationId: string, updateEducationDto: UpdateEducationDto) {
    const result = await this.candidateModel.updateOne(
      { 
        _id: userId,
        'education._id': educationId 
      },
      {
        $set: {
          'education.$': {
            _id: educationId,
            ...updateEducationDto,
            startDate: new Date(updateEducationDto.startDate),
            endDate: updateEducationDto.endDate ? new Date(updateEducationDto.endDate) : undefined
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpException(
        'Education entry not found',
        HttpStatus.NOT_FOUND
      );
    }

    return this.getEducationById(userId, educationId);
  }

  async deleteEducation(userId: string, educationId: string) {
    const result = await this.candidateModel.updateOne(
      { _id: userId },
      {
        $pull: {
          education: { _id: educationId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      throw new HttpException(
        'Education entry not found',
        HttpStatus.NOT_FOUND
      );
    }

    return { message: 'Education entry deleted successfully' };
  }
}