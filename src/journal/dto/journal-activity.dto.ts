import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Base DTO for journal activity entries
 */
export class JournalActivityDto {
  @ApiProperty({
    description: 'Unique identifier of the journal entry',
    example: '60d21b4667d0d8992e610c85'
  })
  id: string;

  @ApiProperty({
    description: 'Type of action performed',
    example: 'connexion'
  })
  actionType: string;

  @ApiProperty({
    description: 'Timestamp when the action occurred',
    example: '2025-05-22T17:03:45.123Z'
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Human-readable description of the action',
    example: 'Connexion au compte'
  })
  message: string;

  @ApiProperty({
    description: 'Additional details about the action',
    example: { method: 'POST', path: '/api/auth/login' }
  })
  details: Record<string, any>;

  @ApiProperty({
    description: 'Indicates if the action was performed by the system',
    example: false
  })
  isSystem: boolean;
}

/**
 * DTO for company journal activity entries
 */
export class CompanyJournalActivityDto extends JournalActivityDto {
  @ApiProperty({
    description: 'ID of the company',
    example: '60d21b4667d0d8992e610c85'
  })
  companyId: string;

  @ApiPropertyOptional({
    description: 'ID of the user who performed the action',
    example: '60d21b4667d0d8992e610c86'
  })
  userId?: string;
}

/**
 * DTO for candidate journal activity entries
 */
export class CandidateJournalActivityDto extends JournalActivityDto {
  @ApiProperty({
    description: 'ID of the candidate',
    example: '60d21b4667d0d8992e610c87'
  })
  candidateId: string;
}

/**
 * DTO for paginated journal activity responses
 */
export class PaginatedJournalResponse<T extends JournalActivityDto> {
  @ApiProperty({
    description: 'List of journal activity entries',
    type: [JournalActivityDto],
    isArray: true
  })
  activities: T[];

  @ApiProperty({
    description: 'Total number of entries matching the filter criteria',
    example: 42
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1
  })
  page: number;

  @ApiProperty({
    description: 'Number of entries per page',
    example: 10
  })
  limit: number;
}