import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  HttpException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CompanyService } from './company.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RegisterCompanyDto, VerifyCompanyOtpDto } from './dto/register-company.dto';
import { InitiateLoginDto, VerifyLoginDto, RefreshTokenDto } from './dto/login-company.dto';
import { CompleteCompanyProfileDto } from './dto/complete-profile.dto';
import { TokenPayload } from '../interfaces/user.interface';

@ApiTags('company')
@Controller('company')
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Enregistrer une nouvelle entreprise' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Inscription initiée avec succès. Code OTP envoyé par email.',
  })
  @ApiBadRequestResponse({
    description: 'Données invalides (ex: email non professionnel, format RNE invalide)',
  })
  @ApiConflictResponse({
    description: "L'entreprise est déjà enregistrée",
  })
  async register(@Body() registerCompanyDto: RegisterCompanyDto): Promise<{ message: string }> {
    await this.companyService.registerCompany(registerCompanyDto);
    return {
      message: 'Inscription initiée. Veuillez vérifier votre email pour le code de vérification.',
    };
  }

  @Post('verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Vérifier l'inscription de l'entreprise avec OTP" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Entreprise vérifiée avec succès',
  })
  @ApiBadRequestResponse({
    description: 'OTP invalide ou aucune inscription en attente trouvée',
  })
  async verify(@Body() verifyCompanyOtpDto: VerifyCompanyOtpDto): Promise<{
    message: string;
    tokens: { accessToken: string; refreshToken: string };
    entreprise: {
      nomEntreprise: string;
      numeroRNE: string;
      email: string;
    };
  }> {
    const { company, tokens } = await this.companyService.verifyCompany(verifyCompanyOtpDto);
    
    return {
      message: 'Entreprise vérifiée avec succès',
      tokens,
      entreprise: {
        nomEntreprise: company.nomEntreprise,
        numeroRNE: company.numeroRNE,
        email: company.email,
      },
    };
  }

  @Post('login/initiate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Initier la connexion avec OTP' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Code OTP envoyé par email',
  })
  async initiateLogin(@Body() initiateLoginDto: InitiateLoginDto): Promise<{ message: string }> {
    await this.authService.initiateLogin(initiateLoginDto.email);
    return {
      message: 'Code de vérification envoyé par email',
    };
  }

  @Post('login/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vérifier le code OTP et se connecter' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Connexion réussie',
  })
  async verifyLogin(@Body() verifyLoginDto: VerifyLoginDto): Promise<{
    message: string;
    tokens: { accessToken: string; refreshToken: string };
    entreprise: {
      nomEntreprise: string;
      numeroRNE: string;
      email: string;
    };
  }> {
    const { company, tokens } = await this.companyService.verifyLogin(verifyLoginDto);
    
    return {
      message: 'Connexion réussie',
      tokens,
      entreprise: {
        nomEntreprise: company.nomEntreprise,
        numeroRNE: company.numeroRNE,
        email: company.email,
      },
    };
  }

  @Post('refresh-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rafraîchir le token d'accès" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Nouveaux tokens générés avec succès',
  })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto): Promise<{
    tokens: { accessToken: string; refreshToken: string };
  }> {
    const tokens = await this.authService.refreshTokens(refreshTokenDto.refreshToken);
    return { tokens };
  }

  @Post('profile/complete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Compléter le profil de l'entreprise" })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Profil complété avec succès',
  })
  async completeProfile(
    @Request() req: { user: TokenPayload },
    @Body() completeProfileDto: CompleteCompanyProfileDto,
  ): Promise<{ message: string }> {
    if (!req.user.companyId) {
      throw new HttpException('Company ID not found', HttpStatus.BAD_REQUEST);
    }
    await this.companyService.completeProfile(req.user.companyId, completeProfileDto);
    return {
      message: "Profil de l'entreprise mis à jour avec succès",
    };
  }
}