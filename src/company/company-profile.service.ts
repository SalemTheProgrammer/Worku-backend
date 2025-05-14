import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../schemas/company.schema';
import { UpdateCompanyProfileDto } from './dto/update-company-profile.dto';
import { UpdateCompanySocialsDto } from './dto/update-company-socials.dto';
import { UpdateCompanyCoordinatesDto } from './dto/update-company-coordinates.dto';
import { CompleteCompanyProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class CompanyProfileService {
  constructor(
    @InjectModel(Company.name) private companyModel: Model<Company>,
  ) {}

  async completeProfile(companyId: string, profileDto: CompleteCompanyProfileDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Check if all required profile fields are filled
    const isProfileComplete = !!(
      profileDto.secteurActivite &&
      profileDto.tailleEntreprise !== undefined &&
      profileDto.adresse &&
      profileDto.descriptionEntreprise &&
      profileDto.activitesClees?.length > 0
    );

    Object.assign(company, profileDto, {
      updatedAt: new Date(),
      profileCompleted: isProfileComplete
    });

    await company.save();
    return company;
  }

  async updateCompanyCoordinates(companyId: string, updateCoordinatesDto: UpdateCompanyCoordinatesDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Update company fields
    Object.assign(company, {
      phone: updateCoordinatesDto.phone,
      adresse: updateCoordinatesDto.adresse,
      nomDeUtilisateur: updateCoordinatesDto.nomUtilisateur || updateCoordinatesDto.nomDeUtilisateur || null,
      updatedAt: new Date()
    });

    await company.save();
    return company;
  }

  async updateCompanySocials(companyId: string, updateSocialsDto: UpdateCompanySocialsDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    // Handle social media links - ensure null values for undefined links
    if (updateSocialsDto.reseauxSociaux) {
      updateSocialsDto.reseauxSociaux = {
        linkedin: updateSocialsDto.reseauxSociaux.linkedin || null,
        instagram: updateSocialsDto.reseauxSociaux.instagram || null,
        facebook: updateSocialsDto.reseauxSociaux.facebook || null,
        x: updateSocialsDto.reseauxSociaux.x || null,
      };
    }

    // Update company fields
    Object.assign(company, updateSocialsDto, {
      updatedAt: new Date()
    });

    await company.save();
    return company;
  }

  async updateCompanyProfile(companyId: string, updateProfileDto: UpdateCompanyProfileDto): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    console.log('Received updateProfileDto:', updateProfileDto);

    // Transform secteurActivite to array if it's not already
    if (updateProfileDto.secteurActivite && !Array.isArray(updateProfileDto.secteurActivite)) {
      updateProfileDto.secteurActivite = [updateProfileDto.secteurActivite];
    }

    // Normalize URL - add https:// if missing
    if (updateProfileDto.siteWeb && !updateProfileDto.siteWeb.startsWith('http')) {
      updateProfileDto.siteWeb = `https://${updateProfileDto.siteWeb}`;
    }

    console.log('Transformed updateProfileDto:', updateProfileDto);

    // Update company fields
    Object.assign(company, updateProfileDto, {
      updatedAt: new Date()
    });

    await company.save();

    // Transform response to ensure null values
    const result = company.toObject();

    // Ensure null values for social media links
    if (!result.reseauxSociaux) {
      result.reseauxSociaux = {
        linkedin: null,
        instagram: null,
        facebook: null,
        x: null
      };
    }

    // Ensure null value for website
    result.siteWeb = result.siteWeb || null;

    return result as Company;
  }

  async updateLogo(companyId: string, logoUrl: string | null): Promise<Company> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.logo = logoUrl;
    await company.save();
    return company;
  }

  async disconnect(companyId: string): Promise<void> {
    const company = await this.companyModel.findById(companyId);
    if (!company) {
      throw new BadRequestException('Entreprise non trouvée');
    }

    company.lastLoginAt = new Date();
    await company.save();
  }
}