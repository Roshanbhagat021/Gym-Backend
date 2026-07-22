import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from '../member/entities/member.entity';
import { Payment } from '../payment/entities/payment.entity';
import { MembershipStatus, PaymentStatus } from '../../common/enums';
import { MemberService } from '../member/member.service';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly memberService: MemberService,
  ) {}

  async getDashboardStats(period = 'thisMonth', startDate?: string, endDate?: string) {
    await this.memberService.syncMembershipStatuses();
    const range = this.getDateRange(period, startDate, endDate);
    const params = { start: range.start, end: range.end };

    const [memberSummary, revenueSummary, genderRows, statusRows, revenueRows, registrationRows, gatewayRows, recentRegistrations] =
      await Promise.all([
        this.memberRepository
          .createQueryBuilder('member')
          .select('COUNT(*)', 'totalMembers')
          .addSelect(`COUNT(*) FILTER (WHERE member."membershipStatus" = :active)`, 'activeMembers')
          .addSelect(`COUNT(*) FILTER (WHERE member."membershipStatus" = :expired)`, 'expiredMembers')
          .addSelect(`COUNT(*) FILTER (WHERE member."createdAt" >= :start AND member."createdAt" < :end)`, 'newMembers')
          .setParameters({ ...params, active: MembershipStatus.ACTIVE, expired: MembershipStatus.EXPIRED })
          .getRawOne(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('COALESCE(SUM(payment.amount), 0)', 'revenue')
          .addSelect('COUNT(*)', 'payments')
          .where('payment.status = :completed', { completed: PaymentStatus.COMPLETED })
          .andWhere('payment."createdAt" >= :start AND payment."createdAt" < :end', params)
          .getRawOne(),
        this.memberRepository
          .createQueryBuilder('member')
          .select(`COALESCE(member.gender::text, 'Not specified')`, 'label')
          .addSelect('COUNT(*)', 'value')
          .groupBy('member.gender')
          .getRawMany(),
        this.memberRepository
          .createQueryBuilder('member')
          .select('member."membershipStatus"', 'label')
          .addSelect('COUNT(*)', 'value')
          .groupBy('member."membershipStatus"')
          .getRawMany(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select(`date_trunc('${range.bucket}', payment."createdAt")`, 'date')
          .addSelect('SUM(payment.amount)', 'value')
          .where('payment.status = :completed', { completed: PaymentStatus.COMPLETED })
          .andWhere('payment."createdAt" >= :start AND payment."createdAt" < :end', params)
          .groupBy('date')
          .orderBy('date', 'ASC')
          .getRawMany(),
        this.memberRepository
          .createQueryBuilder('member')
          .select(`date_trunc('${range.bucket}', member."createdAt")`, 'date')
          .addSelect('COUNT(*)', 'value')
          .where('member."createdAt" >= :start AND member."createdAt" < :end', params)
          .groupBy('date')
          .orderBy('date', 'ASC')
          .getRawMany(),
        this.paymentRepository
          .createQueryBuilder('payment')
          .select('payment."paymentGateway"', 'label')
          .addSelect('SUM(payment.amount)', 'value')
          .where('payment.status = :completed', { completed: PaymentStatus.COMPLETED })
          .andWhere('payment."createdAt" >= :start AND payment."createdAt" < :end', params)
          .groupBy('payment."paymentGateway"')
          .orderBy('value', 'DESC')
          .getRawMany(),
        this.memberRepository.find({ order: { createdAt: 'DESC' }, take: 5, relations: ['user'] }),
      ]);

    const totalMembers = Number(memberSummary.totalMembers);
    const activeMembers = Number(memberSummary.activeMembers);
    const totalRevenue = Number(revenueSummary.revenue);

    return {
      period,
      range: { start: range.start, end: new Date(range.end.getTime() - 1) },
      totalMembers,
      activeMembers,
      expiredMembers: Number(memberSummary.expiredMembers),
      newMembers: Number(memberSummary.newMembers),
      totalRevenue,
      completedPayments: Number(revenueSummary.payments),
      averagePayment: Number(revenueSummary.payments) ? totalRevenue / Number(revenueSummary.payments) : 0,
      activeRate: totalMembers ? Math.round((activeMembers / totalMembers) * 100) : 0,
      genderDistribution: this.numericRows(genderRows),
      membershipDistribution: this.numericRows(statusRows),
      revenueTrend: this.numericRows(revenueRows),
      registrationTrend: this.numericRows(registrationRows),
      paymentMethods: this.numericRows(gatewayRows),
      recentRegistrations,
    };
  }

  private numericRows(rows: Array<{ label?: string; date?: Date; value: string }>) {
    return rows.map((row) => ({ ...row, value: Number(row.value) }));
  }

  private getDateRange(period: string, startDate?: string, endDate?: string) {
    const allowed = ['lastWeek', 'thisWeek', 'lastMonth', 'thisMonth', 'thisQuarter', 'thisYear', 'custom'];
    if (!allowed.includes(period)) throw new BadRequestException('Invalid dashboard period');

    if (period === 'custom') {
      if (!startDate || !endDate || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
        throw new BadRequestException('Valid startDate and endDate are required for a custom period');
      }
      const start = new Date(`${startDate}T00:00:00`);
      const inclusiveEnd = new Date(`${endDate}T00:00:00`);
      if (Number.isNaN(start.getTime()) || Number.isNaN(inclusiveEnd.getTime()) || start > inclusiveEnd) {
        throw new BadRequestException('The custom date range is invalid');
      }
      const end = new Date(inclusiveEnd);
      end.setDate(end.getDate() + 1);
      const days = (end.getTime() - start.getTime()) / 86400000;
      const bucket: 'day' | 'week' | 'month' = days > 180 ? 'month' : days > 45 ? 'week' : 'day';
      return { start, end, bucket };
    }

    const now = new Date();
    const end = new Date(now);
    let start: Date;
    let bucket: 'day' | 'week' | 'month' = 'day';
    const monday = (date: Date) => {
      const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      result.setDate(result.getDate() - ((result.getDay() + 6) % 7));
      return result;
    };

    if (period === 'thisWeek') start = monday(now);
    else if (period === 'lastWeek') {
      end.setTime(monday(now).getTime());
      start = new Date(end);
      start.setDate(start.getDate() - 7);
    } else if (period === 'thisMonth') start = new Date(now.getFullYear(), now.getMonth(), 1);
    else if (period === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end.setTime(new Date(now.getFullYear(), now.getMonth(), 1).getTime());
    } else if (period === 'thisQuarter') {
      start = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
      bucket = 'week';
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      bucket = 'month';
    }
    return { start, end, bucket };
  }
}
