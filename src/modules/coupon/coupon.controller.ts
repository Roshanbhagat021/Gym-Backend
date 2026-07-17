import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { CouponService } from './coupon.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('Coupons')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('coupons')
export class CouponController {
  constructor(private readonly couponService: CouponService) {}

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new coupon' })
  create(@Body() createCouponDto: CreateCouponDto) {
    return this.couponService.create(createCouponDto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all coupons' })
  findAll() {
    return this.couponService.findAll();
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Get(':id')
  @ApiOperation({ summary: 'Get a specific coupon by ID' })
  findOne(@Param('id') id: string) {
    return this.couponService.findOne(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a coupon' })
  update(@Param('id') id: string, @Body() updateCouponDto: UpdateCouponDto) {
    return this.couponService.update(id, updateCouponDto);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a coupon' })
  remove(@Param('id') id: string) {
    return this.couponService.remove(id);
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.MEMBER)
  @Get('validate/:code')
  @ApiOperation({ summary: 'Validate a coupon code' })
  @ApiQuery({ name: 'purchaseAmount', required: true, type: Number })
  validateCoupon(
    @Param('code') code: string,
    @Query('purchaseAmount') purchaseAmount: number,
  ) {
    return this.couponService.validateCoupon(code, purchaseAmount);
  }
}
