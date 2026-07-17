import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../member/entities/member.entity';
import { Payment } from '../payment/entities/payment.entity';
import { MembershipStatus, PaymentStatus } from '../../common/enums';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
  ) {}

  async getDashboardStats() {
    const totalMembers = await this.memberRepository.count();
    const activeMembers = await this.memberRepository.count({
      where: { membershipStatus: MembershipStatus.ACTIVE },
    });

    // Revenue calculations
    const result = await this.paymentRepository
      .createQueryBuilder('payment')
      .select('SUM(payment.amount)', 'totalRevenue')
      .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
      .getRawOne();

    return {
      totalMembers,
      activeMembers,
      totalRevenue: result.totalRevenue ? parseFloat(result.totalRevenue) : 0,
      recentRegistrations: await this.memberRepository.find({
        order: { createdAt: 'DESC' },
        take: 5,
        relations: ['user'],
      }),
    };
  }
}
