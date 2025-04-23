import { IsString, IsEmail } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  email: string;

  @IsString()
  nomDeUtilisateur: string;
}