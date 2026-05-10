import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Coupon } from './entities/coupon.entity';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponService {
  constructor(
    @InjectRepository(Coupon)
    private readonly couponRepository: Repository<Coupon>,
  ) {}

  async create(createCouponDto: CreateCouponDto): Promise<Coupon> {
    const existing = await this.couponRepository.findOne({
      where: { code: createCouponDto.code },
    });
    if (existing) {
      throw new ConflictException('Coupon code already exists');
    }
    const coupon = this.couponRepository.create(createCouponDto);
    return this.couponRepository.save(coupon);
  }

  async findAll(): Promise<Coupon[]> {
    return this.couponRepository.find();
  }

  async findOne(id: string): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { id } });
    if (!coupon) {
      throw new NotFoundException(`Coupon with ID ${id} not found`);
    }
    return coupon;
  }

  async update(id: string, updateCouponDto: UpdateCouponDto): Promise<Coupon> {
    const coupon = await this.findOne(id);
    Object.assign(coupon, updateCouponDto);
    return this.couponRepository.save(coupon);
  }

  async remove(id: string): Promise<void> {
    const coupon = await this.findOne(id);
    await this.couponRepository.softRemove(coupon);
  }

  async validateCoupon(code: string, purchaseAmount: number): Promise<Coupon> {
    const coupon = await this.couponRepository.findOne({ where: { code } });
    
    if (!coupon) throw new NotFoundException('Invalid coupon code');
    if (!coupon.isActive) throw new ConflictException('Coupon is inactive');
    if (new Date() > new Date(coupon.expiryDate)) throw new ConflictException('Coupon has expired');
    if (coupon.minPurchaseAmount > purchaseAmount) throw new ConflictException(`Minimum purchase amount of ${coupon.minPurchaseAmount} required`);
    // NOTE: Checking maxUsage and usagePerUser would require tracking coupon uses in a separate table, e.g., 'CouponUsage'.

    return coupon;
  }
}
