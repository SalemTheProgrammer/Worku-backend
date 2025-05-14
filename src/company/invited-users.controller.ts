import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request, HttpStatus, HttpException, UnauthorizedException, Inject } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiBody } from '@nestjs/swagger'; // Added ApiBody
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { InvitedUsersService, InvitedUsersServiceInterface } from './invited-users.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { ResendInvitationDto } from './dto/resend-invitation.dto';
import { CompanyDocument } from '../schemas/company.schema';

interface RequestWithUser extends Request {
  user: {
    userId: string;
    email: string;
    role: string;
    companyId: string;
  };
}

@Controller('company/invited-users')
@ApiTags('invited-users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class InvitedUsersController {
  constructor(
    @Inject('InvitedUsersServiceInterface')
    private readonly invitedUsersService: InvitedUsersServiceInterface
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtenir la liste des utilisateurs invités',
    description: 'Liste tous les utilisateurs invités pour cette entreprise'
  })
  @ApiResponse({
    status: 200,
    description: 'Liste des utilisateurs invités récupérée avec succès',
    schema: {
      type: 'object',
      properties: {
        invitedUsers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              email: { type: 'string' },
              nomDeUtilisateur: { type: 'string' },
              isAccepted: { type: 'boolean' }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  async getInvitedUsers(@Request() req: RequestWithUser) {
    try {
      const company = await this.invitedUsersService.getCompanyById(req.user.companyId);
      return {
        invitedUsers: company.invitedUsers.map(user => ({
          email: user.email,
          nomDeUtilisateur: user.nomDeUtilisateur,
          isAccepted: user.isAccepted
        }))
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Delete(':email')
  @ApiOperation({
    summary: 'Révoquer un utilisateur invité',
    description: 'Supprime un utilisateur invité de l\'entreprise'
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur révoqué avec succès'
  })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Administrateur uniquement' })
  async revokeUser(@Request() req: RequestWithUser, @Param('email') email: string) {
    try {
      // First, get the company to check admin status
      const company = await this.invitedUsersService.getCompanyById(req.user.companyId);

      // Check if company exists first (service throws NotFound, but good practice)
      if (!company) {
          // This case should technically be handled by the service throwing NotFoundException
          throw new HttpException('Entreprise non trouvée', HttpStatus.NOT_FOUND);
      }
      // Check if user is admin (creator of the company)
      if (company.email !== req.user.email) {
        console.log(`User ${req.user.email} is not authorized to revoke user ${email}`);
        throw new UnauthorizedException('Seul l\'administrateur peut révoquer les utilisateurs invités');
      }
      console.log(`User ${req.user.email} is authorized to revoke user ${email}`);

      // Call the revoke method from the new service
      await this.invitedUsersService.revokeInvitedUser(req.user.companyId, email);

      return {
        message: 'Utilisateur révoqué avec succès'
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
  @Post('invite')
  @ApiOperation({
    summary: 'Inviter un utilisateur dans l\'entreprise',
    description: 'Invite un nouvel utilisateur à accéder aux données de l\'entreprise'
  })
  @ApiBody({
    type: InviteUserDto,
    description: 'Détails de l\'invitation utilisateur',
    examples: {
      example1: {
        value: {
          email: 'user@example.com',
          nomDeUtilisateur: 'John Doe'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Utilisateur invité avec succès'
  })
  @ApiResponse({ status: 400, description: 'Mauvaise requête - Données d\'entrée invalides' })
  @ApiResponse({ status: 401, description: 'Non autorisé - Token invalide' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Administrateur uniquement' })
  @ApiResponse({ status: 409, description: 'Conflit - Utilisateur déjà invité' })
  async inviteUser(
    @Request() req: RequestWithUser,
    @Body() inviteUserDto: InviteUserDto
  ) {
    try {
      // First, get the company to check admin status
      const company = await this.invitedUsersService.getCompanyById(req.user.companyId);

      // Check if company exists first
      if (!company) {
          // This case should technically be handled by the service throwing NotFoundException
          throw new HttpException('Entreprise non trouvée', HttpStatus.NOT_FOUND);
      }
      // Check if user is admin (creator of the company)
      if (company.email !== req.user.email) {
        console.log(`User ${req.user.email} is not authorized to invite users`);
        throw new UnauthorizedException('Seul l\'administrateur peut inviter des utilisateurs');
      }
      console.log(`User ${req.user.email} is authorized to invite users`);

      // Call the invite method from the new service
      const updatedCompany = await this.invitedUsersService.inviteUser(
        req.user.companyId,
        inviteUserDto
      );
      return {
        message: 'Utilisateur invité avec succès',
        // Return limited data, maybe just the invited user list or a confirmation
        invitedUsers: updatedCompany.invitedUsers.map(u => ({ email: u.email, nomDeUtilisateur: u.nomDeUtilisateur, isAccepted: u.isAccepted }))
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }

  @Post('resend-invitation')
  @ApiOperation({
    summary: 'Renvoyer une invitation',
    description: 'Renvoie l\'email d\'invitation à l\'utilisateur'
  })
  @ApiBody({
    type: ResendInvitationDto,
    description: 'Email de l\'utilisateur invité',
    examples: {
      example1: {
        value: {
          email: 'user@example.com'
        }
      }
    }
  })
  @ApiResponse({
    status: 200,
    description: 'Invitation renvoyée avec succès',
    schema: {
      properties: {
        message: { type: 'string', example: 'Invitation renvoyée avec succès' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Utilisateur invité non trouvé' })
  @ApiResponse({ status: 401, description: 'Non autorisé' })
  @ApiResponse({ status: 403, description: 'Accès refusé - Administrateur uniquement' })
  async resendInvitation(
    @Request() req: RequestWithUser,
    @Body() resendInvitationDto: ResendInvitationDto
  ) {
    try {
      const company = await this.invitedUsersService.getCompanyById(req.user.companyId);

      if (!company) {
        throw new HttpException('Entreprise non trouvée', HttpStatus.NOT_FOUND);
      }

      if (company.email !== req.user.email) {
        throw new UnauthorizedException('Seul l\'administrateur peut renvoyer des invitations');
      }

      await this.invitedUsersService.resendInvitation(req.user.companyId, resendInvitationDto.email);

      return {
        message: 'Invitation renvoyée avec succès'
      };
    } catch (error) {
      throw new HttpException(error.message, error.status || HttpStatus.BAD_REQUEST);
    }
  }
}
