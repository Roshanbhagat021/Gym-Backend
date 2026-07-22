import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Member } from '../member/entities/member.entity';
import { Payment } from '../payment/entities/payment.entity';
import { MemberModule } from '../member/member.module';

@Module({
  imports: [TypeOrmModule.forFeature([Member, Payment]), MemberModule],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
