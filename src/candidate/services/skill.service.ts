import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Skill } from '../../schemas/skill.schema';
import { CreateSkillDto, UpdateSkillDto, ProficiencyLevel } from '../dto/skill.dto';

@Injectable()
export class SkillService {
  private readonly logger = new Logger(SkillService.name);

  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async addSkill(userId: string, createSkillDto: CreateSkillDto) {
    try {
      const candidate = await this.candidateModel.findById(userId);
      if (!candidate) {
        throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
      }

      // Initialize skills array if it doesn't exist
      if (!candidate.skills) {
        candidate.skills = [];
      }

      // Ensure proficiency level is valid for language skills
      let proficiencyLevel = createSkillDto.proficiencyLevel;
      
      // If it's a language skill but proficiency level is not one of the valid values, map it
      if (createSkillDto.isLanguage && proficiencyLevel) {
        const validLevels = Object.values(ProficiencyLevel);
        if (!validLevels.includes(proficiencyLevel as ProficiencyLevel)) {
          // Map English levels to French
          const level = proficiencyLevel.toLowerCase();
          if (level.includes('native') || level.includes('natif')) {
            proficiencyLevel = ProficiencyLevel.NATIF;
          } else if (level.includes('advanced') || level.includes('expert') || level.includes('professionnel')) {
            proficiencyLevel = ProficiencyLevel.PROFESSIONNEL;
          } else if (level.includes('intermediate') || level.includes('intermédiaire')) {
            proficiencyLevel = ProficiencyLevel.INTERMEDIAIRE;
          } else if (level.includes('beginner') || level.includes('basic') || level.includes('débutant')) {
            proficiencyLevel = ProficiencyLevel.DEBUTANT;
          } else {
            proficiencyLevel = ProficiencyLevel.INTERMEDIAIRE; // Default
          }
        }
      }
      
      const newSkill = {
        name: createSkillDto.name,
        category: createSkillDto.category,
        level: createSkillDto.level,
        yearsOfExperience: createSkillDto.yearsOfExperience,
        isLanguage: createSkillDto.isLanguage,
        proficiencyLevel: proficiencyLevel
      };

      this.logger.log('Creating new skill:', newSkill);
      candidate.skills.push(newSkill);

      // Patch: Add default category to existing skills missing it
      candidate.skills = candidate.skills.map(skill => ({
        ...skill,
        category: skill.category || "Compétences Techniques"
      }));

      this.logger.log('Candidate skills before save:', candidate.skills);
      await candidate.save();
      
      this.logger.log('Skill added successfully');
      return newSkill;
    } catch (error) {
      this.logger.error('Error adding skill:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        `Failed to add skill: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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

    const skill = candidate.skills?.find(skill => skill._id === skillId);
    if (!skill) {
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    return skill;
  }

  async updateSkill(userId: string, skillId: string, updateSkillDto: UpdateSkillDto) {
    try {
      const candidate = await this.candidateModel.findById(userId);
      if (!candidate) {
        throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
      }
      
      const existingSkill = candidate.skills?.find(skill => skill._id === skillId);
      if (!existingSkill) {
        throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
      }

      // Ensure proficiency level is valid for language skills
      let proficiencyLevel = updateSkillDto.proficiencyLevel || existingSkill.proficiencyLevel;
      const isLanguage = updateSkillDto.isLanguage !== undefined ? updateSkillDto.isLanguage : existingSkill.isLanguage;
      
      // If it's a language skill but proficiency level is not one of the valid values, map it
      if (isLanguage && proficiencyLevel) {
        const validLevels = Object.values(ProficiencyLevel);
        if (!validLevels.includes(proficiencyLevel as ProficiencyLevel)) {
          // Map English levels to French
          const level = proficiencyLevel.toLowerCase();
          if (level.includes('native') || level.includes('natif')) {
            proficiencyLevel = ProficiencyLevel.NATIF;
          } else if (level.includes('advanced') || level.includes('expert') || level.includes('professionnel')) {
            proficiencyLevel = ProficiencyLevel.PROFESSIONNEL;
          } else if (level.includes('intermediate') || level.includes('intermédiaire')) {
            proficiencyLevel = ProficiencyLevel.INTERMEDIAIRE;
          } else if (level.includes('beginner') || level.includes('basic') || level.includes('débutant')) {
            proficiencyLevel = ProficiencyLevel.DEBUTANT;
          } else {
            proficiencyLevel = ProficiencyLevel.INTERMEDIAIRE; // Default
          }
        }
      }
      
      // Create updated skill object with the mapped proficiency level
      const updatedSkillDto = { ...updateSkillDto };
      if (isLanguage && proficiencyLevel) {
        updatedSkillDto.proficiencyLevel = proficiencyLevel as ProficiencyLevel;
      }
      
      const updatedSkill = {
        ...existingSkill,
        ...updatedSkillDto, // The category is already transformed by the DTO
        _id: skillId
      };
      
      const result = await this.candidateModel.updateOne(
        {
          _id: userId,
          'skills._id': skillId
        },
        {
          $set: {
            'skills.$': updatedSkill
          }
        }
      );
  
      if (result.matchedCount === 0) {
        throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
      }
  
      return this.getSkillById(userId, skillId);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      console.error('Error updating skill:', error);
      throw new HttpException(
        `Failed to update skill: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
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
      throw new HttpException('Skill not found', HttpStatus.NOT_FOUND);
    }

    return { message: 'Skill deleted successfully' };
  }
}