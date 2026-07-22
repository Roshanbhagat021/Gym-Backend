import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum MembershipAccessAction {
  CANCEL = 'CANCEL',
  REACTIVATE = 'REACTIVATE',
}

export class ChangeMembershipAccessDto {
  @ApiProperty({ enum: MembershipAccessAction })
  @IsEnum(MembershipAccessAction)
  action: MembershipAccessAction;
}
