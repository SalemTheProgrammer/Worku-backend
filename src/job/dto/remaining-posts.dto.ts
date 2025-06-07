import { ApiProperty } from '@nestjs/swagger';

export class RemainingPostsResponseDto {
  @ApiProperty({
    description: 'Number of remaining free job posts available',
    example: 3
  })
  remainingPosts: number;

  @ApiProperty({
    description: 'Total number of free job posts allowed',
    example: 5
  })
  totalAllowedPosts: number;

  @ApiProperty({
    description: 'Number of active job posts',
    example: 2
  })
  currentActivePosts: number;

  @ApiProperty({
    description: 'Company account type',
    example: 'freemium-beta',
    enum: ['freemium-beta', 'premium', 'enterprise']
  })
  accountType: string;
}