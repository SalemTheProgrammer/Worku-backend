import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class InitiateLoginDto {
  @ApiProperty({
    description: 'Email professionnel',
    example: 'contact@acmecorp.com'
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  readonly email: string;
}

export class VerifyLoginDto {
  @ApiProperty({
    description: 'Email professionnel',
    example: 'contact@acmecorp.com'
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  readonly email: string;

  @ApiProperty({
    description: 'Code OTP reçu par email',
    example: '123456'
  })
  @IsString({ message: 'Le code OTP doit être une chaîne de caractères' })
  readonly otp: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Token de rafraîchissement',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
  })
  @IsString({ message: 'Le token de rafraîchissement doit être une chaîne de caractères' })
  readonly refreshToken: string;
}

export class RegisterUserDto {
  @ApiProperty({
    description: 'Prénom',
    example: 'Jean'
  })
  @IsString({ message: 'Le prénom doit être une chaîne de caractères' })
  readonly firstName: string;

  @ApiProperty({
    description: 'Nom',
    example: 'Dupont'
  })
  @IsString({ message: 'Le nom doit être une chaîne de caractères' })
  readonly lastName: string;

  @ApiProperty({
    description: 'Email professionnel',
    example: 'j.dupont@acmecorp.com'
  })
  @IsEmail({}, { message: "L'adresse email n'est pas valide" })
  readonly email: string;

  @ApiProperty({
    description: 'Numéro de téléphone',
    example: '+33612345678'
  })
  @IsString({ message: 'Le numéro de téléphone doit être une chaîne de caractères' })
  readonly phoneNumber: string;
}
