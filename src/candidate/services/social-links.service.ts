import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { SocialLinksDto } from '../dto/social-links.dto';

@Injectable()
export class SocialLinksService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async getSocialLinks(userId: string) {
    const candidate = await this.candidateModel
      .findById(userId)
      .select('linkedinUrl githubUrl portfolioUrl otherLinks');
    
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return {
      linkedinUrl: candidate.linkedinUrl,
      githubUrl: candidate.githubUrl,
      portfolioUrl: candidate.portfolioUrl,
      otherLinks: candidate.otherLinks || []
    };
  }

  async updateSocialLinks(userId: string, socialLinksDto: SocialLinksDto) {
    const candidate = await this.candidateModel.findByIdAndUpdate(
      userId,
      {
        linkedinUrl: socialLinksDto.linkedinUrl,
        githubUrl: socialLinksDto.githubUrl,
        portfolioUrl: socialLinksDto.portfolioUrl,
        otherLinks: socialLinksDto.otherLinks || []
      },
      { new: true }
    ).select('linkedinUrl githubUrl portfolioUrl otherLinks');

    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return candidate;
  }

  async deleteSocialLinks(userId: string) {
    const candidate = await this.candidateModel.findByIdAndUpdate(
      userId,
      {
        $unset: {
          linkedinUrl: "",
          githubUrl: "",
          portfolioUrl: "",
        },
        otherLinks: []
      },
      { new: true }
    ).select('linkedinUrl githubUrl portfolioUrl otherLinks');

    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return { message: 'Social links cleared successfully' };
  }
}