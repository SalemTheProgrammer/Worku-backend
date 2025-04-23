import { IsString, IsOptional, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class LocationDto {
  @IsString()
  country: string;

  @IsString()
  city: string;
}

export class UpdateProfileDto {
  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsString()
  @IsOptional()
  professionalStatus?: string;

  @IsBoolean()
  @IsOptional()
  isOpenToWork?: boolean;

  @ValidateNested()
  @Type(() => LocationDto)
  @IsOptional()
  location?: LocationDto;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  workPreferences?: string[];

  @IsString()
  @IsOptional()
  availability?: string;

  @IsBoolean()
  @IsOptional()
  remoteWork?: boolean;

}