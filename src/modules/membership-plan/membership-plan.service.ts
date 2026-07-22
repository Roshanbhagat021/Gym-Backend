import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MembershipPlan } from './entities/membership-plan.entity';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';

@Injectable()
export class MembershipPlanService {
  constructor(
    @InjectRepository(MembershipPlan)
    private readonly planRepository: Repository<MembershipPlan>,
  ) {}

  async create(
    createPlanDto: CreateMembershipPlanDto,
  ): Promise<MembershipPlan> {
    if (createPlanDto.isPopular) {
      await this.planRepository.update({ isPopular: true }, { isPopular: false });
    }
    const plan = this.planRepository.create(createPlanDto);
    return this.planRepository.save(plan);
  }

  async findAll(activeOnly: boolean = false): Promise<MembershipPlan[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.planRepository.find({ where });
  }

  async findOne(id: string): Promise<MembershipPlan> {
    const plan = await this.planRepository.findOne({ where: { id } });
    if (!plan) {
      throw new NotFoundException(`Membership Plan with ID ${id} not found`);
    }
    return plan;
  }

  async update(
    id: string,
    updatePlanDto: UpdateMembershipPlanDto,
  ): Promise<MembershipPlan> {
    const plan = await this.findOne(id);
    if (updatePlanDto.isPopular) {
      await this.planRepository.update({ isPopular: true }, { isPopular: false });
    }
    Object.assign(plan, updatePlanDto);
    return this.planRepository.save(plan);
  }

  async remove(id: string): Promise<void> {
    const plan = await this.findOne(id);
    // Soft delete to preserve historical data for members already on this plan
    await this.planRepository.softRemove(plan);
  }
}
