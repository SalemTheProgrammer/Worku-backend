import { Controller, Get, Param, Query, UseGuards, Request, Logger, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CandidateJournalService } from '../services/candidate-journal.service';
import { JournalFilterDto } from '../dto/journal-filter.dto';
import { CandidateActionType } from '../enums/action-types.enum';
import { PaginatedJournalResponse, CandidateJournalActivityDto } from '../dto/journal-activity.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';

// Import guards if available, otherwise comment them out
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { CandidateGuard } from '../../auth/guards/candidate.guard';

/**
 * Controller handling candidate journal activities
 */
@ApiTags('Journal des Activités - Candidat')
@Controller('candidate-journal')
export class CandidateJournalController {
  private readonly logger = new Logger(CandidateJournalController.name);

  constructor(private readonly candidateJournalService: CandidateJournalService) {}

  /**
   * Get candidate activity journal with pagination and filtering
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Récupérer le journal d'activités du candidat",
    description: "Retourne les activités du candidat authentifié avec pagination et filtrage par type d'action et dates"
  })
  @ApiOkResponse({
    description: 'Liste paginée des activités du candidat',
    type: PaginatedJournalResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Non autorisé'
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Accès interdit'
  })
  async getCandidateActivities(
    @Request() req,
    @Query() filter: JournalFilterDto,
  ): Promise<PaginatedJournalResponse<CandidateJournalActivityDto>> {
    const candidateId = req.user.candidateId || req.user.userId;
    
    if (!candidateId) {
      throw new UnauthorizedException('Accès candidat requis');
    }
    
    this.logger.log(`Retrieving journal activities for candidate ${candidateId}`);
    
    const options: any = {
      page: filter.page || 1,
      limit: filter.limit || 10,
    };
    
    if (filter.actionTypes && filter.actionTypes.length > 0) {
      // Validate that all action types are valid CandidateActionType values
      const validActionTypes = filter.actionTypes.filter(type =>
        Object.values(CandidateActionType).includes(type as CandidateActionType)
      );
      options.actionTypes = validActionTypes as CandidateActionType[];
      
      if (validActionTypes.length !== filter.actionTypes.length) {
        this.logger.warn(`Some action types were invalid and have been filtered out`);
      }
    }
    
    if (filter.startDate) {
      options.startDate = new Date(filter.startDate);
    }
    
    if (filter.endDate) {
      options.endDate = new Date(filter.endDate);
    }
    
    return this.candidateJournalService.getActivities(candidateId, options);
  }
}