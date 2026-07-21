import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import {
  PaymentMethodFilter,
  PaymentPeriodFilter,
  PaymentQueryDto,
} from './dto/payment-query.dto';
import { MemberService } from '../member/member.service';
import { PaymentStatus } from '../../common/enums';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    private readonly memberService: MemberService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    const { memberId, planId, ...paymentData } = createPaymentDto;

    let payment = this.paymentRepository.create({
      ...paymentData,
      member: { id: memberId },
    });

    payment = await this.paymentRepository.save(payment);

    if (planId && payment.status === PaymentStatus.COMPLETED) {
      const membership = await this.memberService.purchaseMembership(
        memberId,
        planId,
        Number(payment.amount),
      );
      payment.membership = membership;
      payment = await this.paymentRepository.save(payment);
    }

    return payment;
  }

  async findAll(filters: PaymentQueryDto = {}): Promise<Payment[]> {
    const query = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.member', 'member')
      .leftJoinAndSelect('member.user', 'user');

    if (filters.search?.trim()) {
      query.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR member.mobile ILIKE :search OR payment.transactionId ILIKE :search)',
        { search: `%${filters.search.trim()}%` },
      );
    }
    if (filters.status) query.andWhere('payment.status = :status', { status: filters.status });
    if (filters.method === PaymentMethodFilter.CASH) {
      query.andWhere('payment.paymentGateway = :cash', { cash: 'CASH' });
    } else if (filters.method === PaymentMethodFilter.ONLINE) {
      query.andWhere('payment.paymentGateway != :cash', { cash: 'CASH' });
    }
    if (filters.period) {
      const now = new Date();
      let start: Date;
      if (filters.period === PaymentPeriodFilter.THIS_WEEK) {
        start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      } else if (filters.period === PaymentPeriodFilter.THIS_MONTH) {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
      } else {
        start = new Date(now.getFullYear(), 0, 1);
      }
      query.andWhere('payment.createdAt >= :start', { start });
    }

    return query.orderBy('payment.createdAt', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['member'],
    });
    if (!payment) {
      throw new NotFoundException(`Payment with ID ${id} not found`);
    }
    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    const { memberId, planId, ...paymentData } = updatePaymentDto;

    if (memberId && memberId !== payment.member.id) {
      throw new BadRequestException(
        'The member cannot be changed after a payment is recorded',
      );
    }

    const oldStatus = payment.status;
    Object.assign(payment, paymentData);

    const savedPayment = await this.paymentRepository.save(payment);

    // If status changed to COMPLETED and we have a planId, trigger membership purchase
    if (
      planId &&
      oldStatus !== PaymentStatus.COMPLETED &&
      savedPayment.status === PaymentStatus.COMPLETED
    ) {
      const membership = await this.memberService.purchaseMembership(
        payment.member.id,
        planId,
        Number(savedPayment.amount),
      );
      savedPayment.membership = membership;
      return this.paymentRepository.save(savedPayment);
    }

    return savedPayment;
  }

  // Payment history for a specific member
  async findByMember(memberId: string): Promise<Payment[]> {
    return this.paymentRepository.find({
      where: { member: { id: memberId } },
      relations: ['member', 'membership', 'membership.plan'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUser(userId: string): Promise<Payment[]> {
    const member = await this.memberService.findByUserId(userId);
    return this.paymentRepository.find({
      where: { member: { id: member.id } },
      relations: ['member', 'membership', 'membership.plan'],
      order: { createdAt: 'DESC' },
    });
  }
}
