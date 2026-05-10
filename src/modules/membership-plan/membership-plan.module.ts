import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipPlan } from './entities/membership-plan.entity';

import { MembershipPlanController } from './membership-plan.controller';
import { MembershipPlanService } from './membership-plan.service';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipPlan])],
  controllers: [MembershipPlanController],
  providers: [MembershipPlanService],
})
export class MembershipPlanModule {}
