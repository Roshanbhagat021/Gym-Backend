import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGateway, PaymentStatus } from '../../../common/enums';

export class CreatePaymentDto {
  @ApiProperty({ example: 'uuid-of-member' })
  @IsString()
  @IsNotEmpty()
  memberId: string;

  @ApiProperty({ example: 1200.0 })
  @IsNumber()
  @Min(0)
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.PENDING })
  @IsEnum(PaymentStatus)
  @IsOptional()
  status?: PaymentStatus;

  @ApiPropertyOptional({ example: 'txn_123456789' })
  @IsString()
  @IsOptional()
  transactionId?: string;

  @ApiPropertyOptional({
    enum: PaymentGateway,
    example: PaymentGateway.RAZORPAY,
  })
  @IsEnum(PaymentGateway)
  @IsOptional()
  paymentGateway?: PaymentGateway;

  @ApiPropertyOptional({ example: 'uuid-of-plan' })
  @IsString()
  @IsOptional()
  planId?: string;
}
