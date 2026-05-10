import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { MembershipStatus } from '../../../common/enums';
import { User } from '../../user/entities/user.entity';
import { MemberMembership } from './member-membership.entity';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { cascade: true, eager: true })
  @JoinColumn()
  user: User;

  @Column({ unique: true })
  mobile: string;

  @Column({ nullable: true })
  emergencyContact: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ nullable: true })
  gender: string;

  @Column({
    type: 'enum',
    enum: MembershipStatus,
    default: MembershipStatus.CANCELLED,
  })
  membershipStatus: MembershipStatus;

  @OneToMany(() => MemberMembership, (membership) => membership.member)
  memberships: MemberMembership[];

  @Column({ nullable: true })
  profileImage: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;
}
