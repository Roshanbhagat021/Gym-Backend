import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { MemberMembership } from './entities/member-membership.entity';
import { MembershipPlan } from '../membership-plan/entities/membership-plan.entity';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import {
  MemberQueryDto,
  MemberSortBy,
  MembershipExpiryFilter,
} from './dto/member-query.dto';
import { User } from '../user/entities/user.entity';
import { MembershipStatus, Role } from '../../common/enums';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    @InjectRepository(MemberMembership)
    private readonly membershipRepository: Repository<MemberMembership>,
    @InjectRepository(MembershipPlan)
    private readonly planRepository: Repository<MembershipPlan>,
  ) {}

  async create(createMemberDto: CreateMemberDto): Promise<Member> {
    try {
      const { name, email, password, activePlanId, ...memberData } =
        createMemberDto;

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User();
      user.name = name;
      user.email = email;
      user.password = hashedPassword;
      user.role = Role.MEMBER;

      const existingMobile = await this.memberRepository.findOne({
        where: { mobile: memberData.mobile },
      });
      if (existingMobile) {
        throw new ConflictException('Mobile number already exists');
      }

      const member = this.memberRepository.create({
        ...memberData,
        user,
      });

      const savedMember = await this.memberRepository.save(member);

      if (activePlanId) {
        await this.purchaseMembership(savedMember.id, activePlanId, 0);
      }

      return this.findOne(savedMember.id);
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Email already exists in users');
      }
      throw error;
    }
  }

  async findAll(): Promise<Member[]> {
    return this.memberRepository.find({
      relations: ['user', 'memberships', 'memberships.plan'],
    });
  }

  async findOne(id: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { id },
      relations: ['user', 'memberships', 'memberships.plan'],
    });
    if (!member) {
      throw new NotFoundException(`Member with ID ${id} not found`);
    }
    return member;
  }

  async findByUserId(userId: string): Promise<Member> {
    const member = await this.memberRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'memberships', 'memberships.plan'],
    });
    if (!member) {
      throw new NotFoundException(
        `Member profile for user ${userId} not found`,
      );
    }
    return member;
  }

  async update(id: string, updateMemberDto: UpdateMemberDto): Promise<Member> {
    const member = await this.findOne(id);
    const { name, email, password, activePlanId, ...memberData } =
      updateMemberDto;

    if (name) member.user.name = name;
    if (email) member.user.email = email;
    if (password) {
      member.user.password = await bcrypt.hash(password, 10);
    }

    if (activePlanId) {
      await this.purchaseMembership(member.id, activePlanId, 0);
    }

    Object.assign(member, memberData);

    return this.memberRepository.save(member);
  }

  async purchaseMembership(
    memberId: string,
    planId: string,
    pricePaid: number,
  ): Promise<MemberMembership> {
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
    });
    if (!member) throw new NotFoundException('Member not found');

    const plan = await this.planRepository.findOne({ where: { id: planId } });
    if (!plan) throw new NotFoundException('Plan not found');

    // Find latest membership to determine start date
    const latestMembership = await this.membershipRepository.findOne({
      where: { member: { id: memberId } },
      order: { expiryDate: 'DESC' },
    });

    let startDate = new Date();
    let status = MembershipStatus.ACTIVE;

    if (
      latestMembership &&
      new Date(latestMembership.expiryDate) > new Date()
    ) {
      // If they have an active/future membership, start after it
      startDate = new Date(latestMembership.expiryDate);
      startDate.setDate(startDate.getDate() + 1);
      status = MembershipStatus.UPCOMING;
    }

    const expiryDate = new Date(startDate);
    expiryDate.setDate(expiryDate.getDate() + plan.duration);

    const membership = this.membershipRepository.create({
      member,
      plan,
      planName: plan.name,
      planDuration: plan.duration,
      startDate,
      expiryDate,
      pricePaid: pricePaid || plan.price,
      status,
    });

    const savedMembership = await this.membershipRepository.save(membership);

    // Update member's general status if they were cancelled/expired
    if (
      member.membershipStatus !== MembershipStatus.ACTIVE &&
      status === MembershipStatus.ACTIVE
    ) {
      member.membershipStatus = MembershipStatus.ACTIVE;
      await this.memberRepository.save(member);
    }

    return savedMembership;
  }

  async findAllDashboard(queryDto: MemberQueryDto) {
    const {
      search,
      status,
      gender,
      expiry,
      planId,
      sortBy = MemberSortBy.CREATED_AT,
      sortOrder = 'DESC',
      page = 1,
      limit = 10,
    } = queryDto;

    const numericPage = Number(page);
    const numericLimit = Number(limit);
    const skip = (numericPage - 1) * numericLimit;

    const query = this.memberRepository
      .createQueryBuilder('member')
      .leftJoinAndSelect('member.user', 'user')
      .leftJoinAndSelect('member.memberships', 'membership')
      .leftJoinAndSelect('membership.plan', 'plan')
      .where('member.deletedAt IS NULL');

    if (search) {
      query.andWhere(
        '(user.name ILIKE :search OR user.email ILIKE :search OR member.mobile ILIKE :search)',
        { search: `%${search}%` },
      );
    }

    if (status) {
      query.andWhere('member.membershipStatus = :status', { status });
    }

    if (gender) {
      query.andWhere('member.gender = :gender', { gender });
    }

    if (expiry) {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      if (expiry === MembershipExpiryFilter.THIS_WEEK) {
        end.setDate(end.getDate() + (7 - ((end.getDay() + 6) % 7)));
      } else {
        end.setMonth(end.getMonth() + 1, 1);
      }
      query.andWhere(
        `EXISTS (
          SELECT 1 FROM member_memberships expiring_membership
          WHERE expiring_membership.member_id = member.id
            AND expiring_membership."expiryDate" >= :expiryStart
            AND expiring_membership."expiryDate" < :expiryEnd
        )`,
        { expiryStart: start, expiryEnd: end },
      );
    }

    if (planId) {
      // Filter members who have at least one membership with this plan
      query.andWhere('plan.id = :planId', { planId });
    }

    const sortColumn =
      sortBy && sortBy.includes('.')
        ? sortBy
        : `member.${sortBy || 'createdAt'}`;

    query.orderBy(sortColumn, sortOrder).skip(skip).take(numericLimit);

    const [items, total] = await query.getManyAndCount();

    return {
      items,
      meta: {
        total,
        page: numericPage,
        limit: numericLimit,
        totalPages: Math.ceil(total / numericLimit),
      },
    };
  }

  async remove(id: string): Promise<void> {
    const member = await this.findOne(id);
    await this.memberRepository.softRemove(member);
  }
}
