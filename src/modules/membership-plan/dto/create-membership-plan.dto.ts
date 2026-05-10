import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateMembershipPlanDto {
  @ApiProperty({ example: 'Yearly Plan' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 365, description: 'Duration in days' })
  @IsNumber()
  @Min(1)
  @IsNotEmpty()
  duration: number;

  @ApiProperty({ example: 1200.00 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  price: number;


  @ApiPropertyOptional({ example: 'Best value plan for a full year of access.' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
