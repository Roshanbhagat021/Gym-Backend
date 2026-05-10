import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { MembershipStatus } from '../../../common/enums';
import { Member } from './member.entity';
import { MembershipPlan } from '../../membership-plan/entities/membership-plan.entity';
import { Payment } from '../../payment/entities/payment.entity';

@Entity('member_memberships')
export class MemberMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Member, (member) => member.memberships)
  @JoinColumn({ name: 'member_id' })
  member: Member;

  @ManyToOne(() => MembershipPlan, { eager: true })
  @JoinColumn({ name: 'plan_id' })
  plan: MembershipPlan;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  expiryDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  pricePaid: number;

  @Column({ nullable: true })
  planName: string;

  @Column({ type: 'int', nullable: true, comment: 'Duration in days' })
  planDuration: number;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.UPCOMING,
  })
  status: MembershipStatus;

  @OneToOne(() => Payment, { nullable: true })
  @JoinColumn({ name: 'payment_id' })
  payment: Payment;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
