import {
  BadRequestException,
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
import { MembershipAccessAction } from './dto/change-membership-access.dto';

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

  /**
   * Reconciles stored membership statuses with their date ranges. Running this
   * before reads keeps dashboards accurate even when the server was offline at
   * the moment a membership expired or an upcoming membership became active.
   */
  async syncMembershipStatuses(memberId?: string): Promise<void> {
    const today = this.getGymLocalDate();
    const protectedStatuses = [MembershipStatus.CANCELLED];

    await this.memberRepository.manager.transaction(async (manager) => {
      const memberships = manager.getRepository(MemberMembership);
      const members = manager.getRepository(Member);
      const memberScope = memberId ? ' AND "member_id" = :memberId' : '';
      const parameters = { today, protectedStatuses, memberId };

      await memberships
        .createQueryBuilder()
        .update(MemberMembership)
        .set({ status: MembershipStatus.EXPIRED })
        .where('"expiryDate" < :today')
        .andWhere('status NOT IN (:...protectedStatuses)')
        .andWhere(`1 = 1${memberScope}`)
        .setParameters(parameters)
        .execute();

      await memberships
        .createQueryBuilder()
        .update(MemberMembership)
        .set({ status: MembershipStatus.UPCOMING })
        .where('"startDate" > :today')
        .andWhere('status NOT IN (:...protectedStatuses)')
        .andWhere(`1 = 1${memberScope}`)
        .setParameters(parameters)
        .execute();

      await memberships
        .createQueryBuilder()
        .update(MemberMembership)
        .set({ status: MembershipStatus.ACTIVE })
        .where('"startDate" <= :today')
        .andWhere('"expiryDate" >= :today')
        .andWhere('status NOT IN (:...protectedStatuses)')
        .andWhere(`1 = 1${memberScope}`)
        .setParameters(parameters)
        .execute();

      const membersToReconcile = await members.find({
        ...(memberId ? { where: { id: memberId } } : {}),
        relations: ['memberships'],
      });

      for (const member of membersToReconcile) {
        const nextStatus = this.resolveMemberStatus(member.memberships || []);
        if (member.membershipStatus !== nextStatus) {
          await members.update(member.id, { membershipStatus: nextStatus });
        }
      }
    });
  }

  private resolveMemberStatus(
    memberships: MemberMembership[],
  ): MembershipStatus {
    const statuses = new Set(memberships.map((membership) => membership.status));

    if (statuses.has(MembershipStatus.ACTIVE))
      return MembershipStatus.ACTIVE;
    if (statuses.has(MembershipStatus.UPCOMING)) return MembershipStatus.UPCOMING;

    const latestMembership = [...memberships].sort(
      (a, b) =>
        new Date(b.expiryDate).getTime() - new Date(a.expiryDate).getTime(),
    )[0];

    if (latestMembership?.status === MembershipStatus.CANCELLED)
      return MembershipStatus.CANCELLED;
    if (latestMembership) return MembershipStatus.EXPIRED;
    return MembershipStatus.CANCELLED;
  }

  private getGymLocalDate(date = new Date()): string {
    const timeZone = process.env.GYM_TIMEZONE || 'Asia/Kolkata';
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((item) => item.type === type)?.value;

    return `${part('year')}-${part('month')}-${part('day')}`;
  }

  private dateStringToUtcDate(value: string): Date {
    const [year, month, day] = value.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

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
    await this.syncMembershipStatuses();
    return this.memberRepository.find({
      relations: ['user', 'memberships', 'memberships.plan'],
    });
  }

  async findOne(id: string): Promise<Member> {
    await this.syncMembershipStatuses(id);
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
    const memberRecord = await this.memberRepository.findOne({
      where: { user: { id: userId } },
      select: { id: true },
    });
    if (memberRecord) await this.syncMembershipStatuses(memberRecord.id);

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

    Object.assign(member, memberData);
    await this.memberRepository.save(member);

    if (activePlanId) {
      await this.purchaseMembership(member.id, activePlanId, 0);
    }

    return this.findOne(id);
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

    const today = this.getGymLocalDate();
    let startDate = this.dateStringToUtcDate(today);
    let status = MembershipStatus.ACTIVE;

    if (latestMembership) {
      const latestExpiry = this.getGymLocalDate(
        new Date(latestMembership.expiryDate),
      );

      if (latestExpiry >= today) {
        // If they have an active/future membership, start after it
        startDate = this.dateStringToUtcDate(latestExpiry);
        startDate.setUTCDate(startDate.getUTCDate() + 1);
        status = MembershipStatus.UPCOMING;
      }
    }

    const expiryDate = new Date(startDate);
    expiryDate.setUTCDate(expiryDate.getUTCDate() + plan.duration);

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

    await this.syncMembershipStatuses(memberId);

    return savedMembership;
  }

  async changeMembershipAccess(
    memberId: string,
    action: MembershipAccessAction,
  ): Promise<Member> {
    await this.syncMembershipStatuses(memberId);
    const member = await this.memberRepository.findOne({
      where: { id: memberId },
      relations: ['user', 'memberships', 'memberships.plan'],
    });
    if (!member) throw new NotFoundException('Member not found');

    if (action === MembershipAccessAction.CANCEL) {
      const membershipsToCancel = member.memberships.filter((membership) =>
        [MembershipStatus.ACTIVE, MembershipStatus.UPCOMING].includes(
          membership.status,
        ),
      );
      if (!membershipsToCancel.length) {
        throw new BadRequestException(
          'This member has no active or upcoming membership to cancel',
        );
      }

      membershipsToCancel.forEach((membership) => {
        membership.status = MembershipStatus.CANCELLED;
      });
      await this.membershipRepository.save(membershipsToCancel);
    } else {
      if (member.membershipStatus !== MembershipStatus.CANCELLED) {
        throw new BadRequestException(
          'Only a cancelled membership can be reactivated',
        );
      }
      const today = this.getGymLocalDate();
      const membershipsToReactivate = member.memberships.filter(
        (membership) =>
          membership.status === MembershipStatus.CANCELLED &&
          this.getGymLocalDate(new Date(membership.expiryDate)) >= today,
      );
      if (!membershipsToReactivate.length) {
        throw new BadRequestException(
          'This membership has expired. Renew the plan instead of reactivating it',
        );
      }

      membershipsToReactivate.forEach((membership) => {
        const startDate = this.getGymLocalDate(new Date(membership.startDate));
        membership.status =
          startDate > today
            ? MembershipStatus.UPCOMING
            : MembershipStatus.ACTIVE;
      });
      await this.membershipRepository.save(membershipsToReactivate);
    }

    await this.syncMembershipStatuses(memberId);
    return this.findOne(memberId);
  }

  async findAllDashboard(queryDto: MemberQueryDto) {
    await this.syncMembershipStatuses();
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
