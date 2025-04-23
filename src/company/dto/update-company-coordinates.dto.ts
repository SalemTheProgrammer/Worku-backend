import { IsString, IsOptional } from 'class-validator';

export class UpdateCompanyCoordinatesDto {
  @IsString()
  @IsOptional()
  nomEntreprise?: string;

  @IsString()
  @IsOptional()
  nomUtilisateur?: string;

  @IsString()
  @IsOptional()
  nomDeUtilisateur?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  adresse?: string;
}