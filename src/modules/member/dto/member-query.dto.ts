import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { MemberGender, MembershipStatus } from '../../../common/enums';
import { ApiPropertyOptional } from '@nestjs/swagger';

export enum MemberSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'user.name',
  MOBILE = 'mobile',
}

export enum MembershipExpiryFilter {
  THIS_WEEK = 'thisWeek',
  THIS_MONTH = 'thisMonth',
}

export class MemberQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: MembershipStatus })
  @IsOptional()
  @IsEnum(MembershipStatus)
  status?: MembershipStatus;

  @ApiPropertyOptional({ enum: MemberGender })
  @IsOptional()
  @IsEnum(MemberGender)
  gender?: MemberGender;

  @ApiPropertyOptional({ enum: MembershipExpiryFilter })
  @IsOptional()
  @IsEnum(MembershipExpiryFilter)
  expiry?: MembershipExpiryFilter;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  planId?: string;

  @ApiPropertyOptional({ enum: MemberSortBy })
  @IsOptional()
  @IsEnum(MemberSortBy)
  sortBy?: MemberSortBy = MemberSortBy.CREATED_AT;

  @ApiPropertyOptional({ enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
