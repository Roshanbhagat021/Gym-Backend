import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AuditLogAction } from '../../../common/enums';

export class CreateAuditLogDto {
  @ApiProperty({ enum: AuditLogAction, example: AuditLogAction.CREATE })
  @IsEnum(AuditLogAction)
  @IsNotEmpty()
  action: AuditLogAction;

  @ApiProperty({ example: 'uuid-of-user' })
  @IsString()
  @IsNotEmpty()
  performedById: string;

  @ApiProperty({ example: 'Member' })
  @IsString()
  @IsNotEmpty()
  entityType: string;

  @ApiProperty({ example: 'uuid-of-entity' })
  @IsString()
  @IsNotEmpty()
  entityId: string;

  @ApiPropertyOptional()
  @IsOptional()
  previousData?: any;

  @ApiPropertyOptional()
  @IsOptional()
  newData?: any;
}
