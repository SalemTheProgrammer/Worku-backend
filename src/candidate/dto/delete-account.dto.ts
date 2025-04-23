import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class DeleteAccountDto {
  @ApiProperty({
    description: 'Password confirmation required to delete account',
    example: 'yourPassword123'
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}