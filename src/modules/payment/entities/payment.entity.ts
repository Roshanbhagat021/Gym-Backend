import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PaymentGateway, PaymentStatus } from '../../../common/enums';
import { Member } from '../../member/entities/member.entity';
import { MemberMembership } from '../../member/entities/member-membership.entity';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Member, { eager: true })
  @JoinColumn()
  member: Member;

  @ManyToOne(() => MemberMembership, { nullable: true })
  @JoinColumn()
  membership: MemberMembership;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({
    type: 'enum',
    enum: PaymentStatus,
    default: PaymentStatus.PENDING,
  })
  status: PaymentStatus;

  @Column({ nullable: true })
  transactionId: string;

  @Column({
    type: 'enum',
    enum: PaymentGateway,
    default: PaymentGateway.CASH,
  })
  paymentGateway: PaymentGateway;

  @Column({ type: 'jsonb', nullable: true })
  gatewayResponse: any;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
