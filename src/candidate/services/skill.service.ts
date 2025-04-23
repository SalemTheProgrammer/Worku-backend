import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { CreateSkillDto, UpdateSkillDto } from '../dto/skill.dto';

@Injectable()
export class SkillService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async addSkill(userId: string, createSkillDto: CreateSkillDto) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    // Initialize skills array if it doesn't exist
    if (!candidate.skills) {
      candidate.skills = [];
    }

    const newSkill = {
      _id: new Types.ObjectId().toString(),
      ...createSkillDto
    };

    candidate.skills.push(newSkill);
    await candidate.save();
    return newSkill;
  }

  async getSkills(userId: string) {
    const candidate = await this.candidateModel
      .findById(userId)
      .select('skills');
    
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return candidate.skills || [];
  }

  async getSkillById(userId: string, skillId: string) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    if (!candidate.skills) {
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    const skill = candidate.skills.find(
      (skill) => skill._id === skillId
    );

    if (!skill) {
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    return skill;
  }

  async updateSkill(userId: string, skillId: string, updateSkillDto: UpdateSkillDto) {
    const result = await this.candidateModel.updateOne(
      { 
        _id: userId,
        'skills._id': skillId 
      },
      {
        $set: {
          'skills.$': {
            _id: skillId,
            ...updateSkillDto
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpException(
        'Skill not found',
        HttpStatus.NOT_FOUND
      );
    }

    return this.getSkillById(userId, skillId);
  }

  async deleteSkill(userId: string, skillId: string) {
    const result = await this.candidateModel.updateOne(
      { _id: userId },
      {
        $pull: {
          skills: { _id: skillId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      throw new HttpException(
        'Skill not found',
        HttpStatus.NOT_FOUND
      );
    }

    return { message: 'Skill deleted successfully' };
  }

  async bulkUpdateSkills(userId: string, skills: CreateSkillDto[]) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    // Replace all skills with new ones
    candidate.skills = skills.map(skill => ({
      _id: new Types.ObjectId().toString(),
      ...skill
    }));

    await candidate.save();
    return candidate.skills;
  }
}