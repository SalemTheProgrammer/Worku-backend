import { ApiProperty } from '@nestjs/swagger';

export class CandidateInfoDto {
  @ApiProperty({ description: 'Candidate ID' })
  id: string;

  @ApiProperty({ description: 'Full name of the candidate' })
  fullName: string;

  @ApiProperty({ description: 'Email address' })
  email: string;

  @ApiProperty({ description: 'Phone number' })
  phone: string;
}