import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentStatus } from '../../../common/enums';

export enum PaymentMethodFilter {
  CASH = 'CASH',
  ONLINE = 'ONLINE',
}

export enum PaymentPeriodFilter {
  THIS_WEEK = 'thisWeek',
  THIS_MONTH = 'thisMonth',
  THIS_YEAR = 'thisYear',
}

export class PaymentQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  status?: PaymentStatus;

  @ApiPropertyOptional({ enum: PaymentMethodFilter })
  @IsOptional()
  @IsEnum(PaymentMethodFilter)
  method?: PaymentMethodFilter;

  @ApiPropertyOptional({ enum: PaymentPeriodFilter })
  @IsOptional()
  @IsEnum(PaymentPeriodFilter)
  period?: PaymentPeriodFilter;
}
