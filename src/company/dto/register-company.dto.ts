import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, MinLength, Matches } from 'class-validator';
import { IsBusinessEmail } from '../../common/utils/email-validator.util';

export class RegisterCompanyDto {
  @ApiProperty({
    description: "Nom de l'entreprise",
    example: 'Acme Corporation'
  })
  @IsString({ message: "Le nom de l'entreprise doit être une chaîne de caractères" })
  @MinLength(2, { message: "Le nom de l'entreprise doit contenir au moins 2 caractères" })
  readonly nomEntreprise: string;

  @ApiProperty({
    description: 'Numéro RNE (Registre National des Entreprises)',
    example: 'RNE123456789'
  })
  @IsString({ message: 'Le numéro RNE doit être une chaîne de caractères' })
  @Matches(/^RNE\d{9}$/, {
    message: 'Le numéro RNE doit commencer par "RNE" suivi de 9 chiffres'
  })
  readonly numeroRNE: string;

  @ApiProperty({
    description: 'Email professionnel',
    example: 'contact@acmecorp.com'
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  @IsBusinessEmail()
  readonly email: string;

 
}

export class VerifyCompanyOtpDto {
  @ApiProperty({
    description: "Email utilisé lors de l'inscription",
    example: 'contact@acmecorp.com'
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  readonly email: string;

  @ApiProperty({
    description: 'Code OTP reçu par email',
    example: '123456'
  })
  @IsString({ message: 'Le code OTP doit être une chaîne de caractères' })
  @MinLength(6, { message: 'Le code OTP doit contenir 6 caractères' })
  readonly otp: string;
}