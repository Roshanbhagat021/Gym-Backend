import { IsArray, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateGymContentDto {
  @ApiPropertyOptional({ example: 'Gold Gym' })
  @IsString()
  @IsOptional()
  gymName?: string;

  @ApiPropertyOptional({ example: 'url-to-logo' })
  @IsString()
  @IsOptional()
  logo?: string;

  @ApiPropertyOptional({ example: 'We are the best gym in town' })
  @IsString()
  @IsOptional()
  aboutSection?: string;

  @ApiPropertyOptional({ example: ['url-banner-1', 'url-banner-2'] })
  @IsArray()
  @IsOptional()
  heroBanners?: string[];

  @ApiPropertyOptional({
    example: {
      phone: '12345',
      email: 'contact@gym.com',
      address: '123 Fitness Street',
      hours: '5:00 AM - 11:00 PM',
    },
  })
  @IsOptional()
  contactInformation?: any;

  @ApiPropertyOptional({ example: { facebook: 'url', instagram: 'url' } })
  @IsOptional()
  socialLinks?: any;

  @ApiPropertyOptional({ example: ['img1-url', 'img2-url'] })
  @IsArray()
  @IsOptional()
  galleryImages?: string[];
}
