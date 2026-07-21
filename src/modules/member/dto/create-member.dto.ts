import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MemberGender } from '../../../common/enums';

export class CreateMemberDto {
  @ApiProperty({ example: 'John Member' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'member@gym.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '9876543210' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: 'Mobile number must be exactly 10 digits' })
  mobile: string;

  @ApiPropertyOptional({ example: '9876543210' })
  @IsString()
  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: 'Emergency contact must be exactly 10 digits',
  })
  emergencyContact?: string;

  @ApiPropertyOptional({ example: '123 Gym Street' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsDateString()
  @IsOptional()
  dob?: string;

  @ApiPropertyOptional({ enum: MemberGender, example: MemberGender.MALE })
  @IsEnum(MemberGender)
  @IsOptional()
  gender?: MemberGender;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  activePlanId?: string;

  @ApiPropertyOptional({ example: 'image-url' })
  @IsString()
  @IsOptional()
  profileImage?: string;
}
