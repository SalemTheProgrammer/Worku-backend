import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, Matches } from 'class-validator';

export class RequestPasswordResetDto {
  @ApiProperty({
    description: 'Email address of the candidate',
    example: 'user@example.com',
    required: true
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  readonly email: string;
}

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Reset token received via email',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: true
  })
  @IsString()
  readonly token: string;

  @ApiProperty({
    description: 'New password (minimum 8 characters, must include at least one number)',
    example: 'newSecurePassword123',
    required: true,
    minLength: 8
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[0-9])/, { message: 'Password must contain at least one number' })
  readonly newPassword: string;
}