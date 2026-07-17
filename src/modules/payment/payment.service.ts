import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
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

  async findAll(): Promise<Payment[]> {
    return this.paymentRepository.find({ relations: ['member'] });
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

    if (memberId) {
      payment.member = { id: memberId } as any;
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
