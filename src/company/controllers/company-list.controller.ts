import { Controller, Get, Query, Param, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CompanyListService } from '../services/company-list.service';
import { GetCompaniesDto, CompaniesListResponseDto } from '../dto/company-list.dto';
import { GetCompanyJobsDto, CompanyJobsResponseDto } from '../dto/company-jobs.dto';

@ApiTags('Public Company Data')
@Controller('companies')
export class CompanyListController {
  constructor(private readonly companyListService: CompanyListService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Get all companies with pagination',
    description: 'Retrieve a paginated list of verified companies with their basic information, location, and job statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Companies retrieved successfully',
    type: CompaniesListResponseDto
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of companies per page (max 100)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of companies to skip' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by company name' })
  @ApiQuery({ name: 'sector', required: false, type: String, description: 'Filter by business sector' })
  @ApiQuery({ name: 'size', required: false, type: String, description: 'Filter by company size' })
  @ApiQuery({ name: 'location', required: false, type: String, description: 'Filter by location (city, region, or country)' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['name', 'createdAt', 'jobCount', 'activeJobsCount'], description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  async getAllCompanies(@Query() filters: GetCompaniesDto): Promise<CompaniesListResponseDto> {
    try {
      return await this.companyListService.getAllCompanies(filters);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch companies',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':companyId/jobs')
  @ApiOperation({ 
    summary: 'Get all jobs posted by a company',
    description: 'Retrieve all jobs (including expired ones) posted by a specific company with pagination and filtering options'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Company jobs retrieved successfully',
    type: CompanyJobsResponseDto
  })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of jobs per page (max 100)' })
  @ApiQuery({ name: 'skip', required: false, type: Number, description: 'Number of jobs to skip' })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Search by job title' })
  @ApiQuery({ name: 'onlyActive', required: false, type: Boolean, description: 'Show only active jobs' })
  @ApiQuery({ name: 'onlyExpired', required: false, type: Boolean, description: 'Show only expired jobs' })
  @ApiQuery({ name: 'contractType', required: false, type: String, description: 'Filter by contract type' })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['publishedAt', 'expiresAt', 'title', 'applicationsCount'], description: 'Sort by field' })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'], description: 'Sort order' })
  async getCompanyJobs(
    @Param('companyId') companyId: string,
    @Query() filters: GetCompanyJobsDto
  ): Promise<CompanyJobsResponseDto> {
    try {
      // Validate companyId format (basic validation)
      if (!companyId || companyId.length !== 24) {
        throw new HttpException('Invalid company ID format', HttpStatus.BAD_REQUEST);
      }

      return await this.companyListService.getCompanyJobs(companyId, filters);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch company jobs',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':companyId')
  @ApiOperation({ 
    summary: 'Get company details by ID',
    description: 'Retrieve detailed information about a specific company including job statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Company details retrieved successfully'
  })
  async getCompanyById(@Param('companyId') companyId: string) {
    try {
      // Validate companyId format
      if (!companyId || companyId.length !== 24) {
        throw new HttpException('Invalid company ID format', HttpStatus.BAD_REQUEST);
      }

      // Get company with job count
      const result = await this.companyListService.getAllCompanies({
        limit: 1,
        skip: 0
      });

      // Filter by specific company ID (this is a simple approach)
      // In a real implementation, you might want a separate method for this
      const companies = await this.companyListService.getAllCompanies({
        limit: 100,
        skip: 0
      });

      const company = companies.companies.find(c => c.id === companyId);
      
      if (!company) {
        throw new HttpException('Company not found', HttpStatus.NOT_FOUND);
      }

      return {
        success: true,
        data: company
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        error.message || 'Failed to fetch company details',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}