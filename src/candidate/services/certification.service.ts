import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Candidate } from '../../schemas/candidate.schema';
import { Certification } from '../../schemas/certification.schema';
import { CreateCertificationDto, UpdateCertificationDto } from '../dto/certification.dto';

@Injectable()
export class CertificationService {
  constructor(
    @InjectModel(Candidate.name) private candidateModel: Model<Candidate>
  ) {}

  async addCertification(userId: string, createCertificationDto: CreateCertificationDto) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    // Initialize certifications array if it doesn't exist
    if (!candidate.certifications) {
      candidate.certifications = [];
    }

    const expiryDate = createCertificationDto.expiryDate || createCertificationDto.expirationDate;
    const today = new Date().toISOString().split('T')[0];

    const newCertification = {
      _id: new Types.ObjectId().toString(),
      ...createCertificationDto,
      issueDate: createCertificationDto.issueDate,
      expiryDate: expiryDate,
      isExpired: expiryDate ? expiryDate < today : false,
      skills: createCertificationDto.skills || []
    };

    delete newCertification['expirationDate'];

    candidate.certifications.push(newCertification);
    await candidate.save();
    return newCertification;
  }

  async getCertifications(userId: string) {
    const candidate = await this.candidateModel
      .findById(userId)
      .select('certifications');
    
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    return candidate.certifications || [];
  }

  async getCertificationById(userId: string, certificationId: string) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    const certification = candidate.certifications?.find(
      cert => cert._id === certificationId
    );

    if (!certification) {
      throw new HttpException('Certification not found', HttpStatus.NOT_FOUND);
    }

    return certification;
  }

  async updateCertification(userId: string, certificationId: string, updateCertificationDto: UpdateCertificationDto) {
    const candidate = await this.candidateModel.findById(userId);
    if (!candidate) {
      throw new HttpException('Candidate not found', HttpStatus.NOT_FOUND);
    }

    const currentCertification = candidate.certifications?.find(
      cert => cert._id === certificationId
    );

    if (!currentCertification) {
      throw new HttpException('Certification not found', HttpStatus.NOT_FOUND);
    }

    const expiryDate = updateCertificationDto.expiryDate || updateCertificationDto.expirationDate;
    const today = new Date().toISOString().split('T')[0];

    const updateData = {
      ...updateCertificationDto,
      issueDate: updateCertificationDto.issueDate || currentCertification.issueDate,
      expiryDate: expiryDate || currentCertification.expiryDate,
      isExpired: expiryDate ? String(expiryDate) < today : currentCertification.isExpired
    };

    delete updateData['expirationDate'];

    const result = await this.candidateModel.updateOne(
      { 
        _id: userId,
        'certifications._id': certificationId 
      },
      {
        $set: {
          'certifications.$': {
            _id: certificationId,
            ...updateData
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpException('Certification not found', HttpStatus.NOT_FOUND);
    }

    return this.getCertificationById(userId, certificationId);
  }

  async deleteCertification(userId: string, certificationId: string) {
    const result = await this.candidateModel.updateOne(
      { _id: userId },
      {
        $pull: {
          certifications: { _id: certificationId }
        }
      }
    );

    if (result.modifiedCount === 0) {
      throw new HttpException('Certification not found', HttpStatus.NOT_FOUND);
    }

    return { message: 'Certification deleted successfully' };
  }
}