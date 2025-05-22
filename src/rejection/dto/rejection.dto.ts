import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';
import { RejectionData } from '../types/rejection.types';

export class RejectionDto implements RejectionData {
  @ApiProperty({
    description: 'ID of the application to reject',
    example: '60d21b4667d0d8992e610c85'
  })
  @IsNotEmpty()
  @IsString()
  applicationId: string;

  @ApiProperty({
    description: 'Reason for rejection (id from the rejection reasons list)',
    example: 'competences_insuffisantes',
  })
  @IsNotEmpty()
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the rejection (required for "autre" reason)',
    example: 'Le candidat manque d\'expérience avec les technologies spécifiques requises pour ce poste.'
  })
  @IsOptional()
  @IsString()
  notes?: string;
}