import { Controller, Get, Param, Query, UseGuards, Request, Logger, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { CompanyJournalService } from '../services/company-journal.service';
import { JournalFilterDto } from '../dto/journal-filter.dto';
import { CompanyActionType } from '../enums/action-types.enum';
import { PaginatedJournalResponse, CompanyJournalActivityDto } from '../dto/journal-activity.dto';
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse, ApiOkResponse } from '@nestjs/swagger';

// Import guards if available, otherwise comment them out
// import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
// import { CompanyGuard } from '../../auth/guards/company.guard';

/**
 * Controller handling company journal activities
 */
@ApiTags('Journal des Activités - Entreprise')
@Controller('company-journal')
export class CompanyJournalController {
  private readonly logger = new Logger(CompanyJournalController.name);

  constructor(private readonly companyJournalService: CompanyJournalService) {}

  /**
   * Get company activity journal with pagination and filtering
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: "Récupérer le journal d'activités de l'entreprise",
    description: "Retourne les activités de l'entreprise authentifiée avec pagination et filtrage par type d'action et dates"
  })
  @ApiOkResponse({
    description: 'Liste paginée des activités de l\'entreprise',
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
  async getCompanyActivities(
    @Request() req,
    @Query() filter: JournalFilterDto,
  ): Promise<PaginatedJournalResponse<CompanyJournalActivityDto>> {
    const companyId = req.user.companyId;
    
    if (!companyId) {
      throw new UnauthorizedException('Accès entreprise requis');
    }
    
    this.logger.log(`Retrieving journal activities for company ${companyId}`);
    
    const options: any = {
      page: filter.page || 1,
      limit: filter.limit || 10,
    };
    
    if (filter.actionTypes && filter.actionTypes.length > 0) {
      // Validate that all action types are valid CompanyActionType values
      const validActionTypes = filter.actionTypes.filter(type =>
        Object.values(CompanyActionType).includes(type as CompanyActionType)
      );
      options.actionTypes = validActionTypes as CompanyActionType[];
      
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
    
    return this.companyJournalService.getActivities(companyId, options);
  }
}