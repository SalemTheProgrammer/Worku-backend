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

    const isExpired = createCertificationDto.expiryDate && 
      new Date(createCertificationDto.expiryDate) < new Date();

    const newCertification = {
      _id: new Types.ObjectId().toString(),
      ...createCertificationDto,
      issueDate: new Date(createCertificationDto.issueDate),
      expiryDate: createCertificationDto.expiryDate ? new Date(createCertificationDto.expiryDate) : undefined,
      isExpired,
      skills: createCertificationDto.skills || []
    };

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

    if (!candidate.certifications) {
      throw new HttpException('Certification not found', HttpStatus.NOT_FOUND);
    }

    const certification = candidate.certifications.find(
      (cert) => cert._id === certificationId
    );

    if (!certification) {
      throw new HttpException('Certification entry not found', HttpStatus.NOT_FOUND);
    }

    return certification;
  }

  async updateCertification(userId: string, certificationId: string, updateCertificationDto: UpdateCertificationDto) {
    const isExpired = updateCertificationDto.expiryDate && 
      new Date(updateCertificationDto.expiryDate) < new Date();

    const result = await this.candidateModel.updateOne(
      { 
        _id: userId,
        'certifications._id': certificationId 
      },
      {
        $set: {
          'certifications.$': {
            _id: certificationId,
            ...updateCertificationDto,
            issueDate: new Date(updateCertificationDto.issueDate),
            expiryDate: updateCertificationDto.expiryDate ? new Date(updateCertificationDto.expiryDate) : undefined,
            isExpired,
            skills: updateCertificationDto.skills || []
          }
        }
      }
    );

    if (result.matchedCount === 0) {
      throw new HttpException(
        'Certification entry not found',
        HttpStatus.NOT_FOUND
      );
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
      throw new HttpException(
        'Certification entry not found',
        HttpStatus.NOT_FOUND
      );
    }

    return { message: 'Certification entry deleted successfully' };
  }

  async validateCertification(userId: string, certificationId: string) {
    const certification = await this.getCertificationById(userId, certificationId);
    
    let isExpired = false;
    if (certification.expiryDate) {
      isExpired = new Date(certification.expiryDate) < new Date();
      
      // Update the expiry status if it has changed
      if (isExpired !== certification.isExpired) {
        await this.candidateModel.updateOne(
          { 
            _id: userId,
            'certifications._id': certificationId 
          },
          {
            $set: {
              'certifications.$.isExpired': isExpired
            }
          }
        );
      }
    }

    return {
      isValid: !isExpired,
      expiryStatus: isExpired ? 'Expired' : 'Valid',
      expiryDate: certification.expiryDate,
      validationDetails: {
        credentialId: certification.credentialId,
        credentialUrl: certification.credentialUrl,
        issuingOrganization: certification.issuingOrganization,
        issueDate: certification.issueDate
      }
    };
  }
}