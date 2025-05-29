import { ApiProperty } from '@nestjs/swagger';

export class BulkApplyResponseDto {
  @ApiProperty({
    description: 'Number of jobs successfully applied to',
    example: 5
  })
  appliedCount: number;
}