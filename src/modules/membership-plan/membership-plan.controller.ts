import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { MembershipPlanService } from './membership-plan.service';
import { CreateMembershipPlanDto } from './dto/create-membership-plan.dto';
import { UpdateMembershipPlanDto } from './dto/update-membership-plan.dto';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';

@ApiTags('Membership Plans')
@Controller('membership-plans')
export class MembershipPlanController {
  constructor(private readonly planService: MembershipPlanService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new membership plan' })
  create(@Body() createPlanDto: CreateMembershipPlanDto) {
    return this.planService.create(createPlanDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all membership plans (public)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAll(@Query('activeOnly') activeOnly?: boolean) {
    return this.planService.findAll(activeOnly !== false);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific membership plan by ID' })
  findOne(@Param('id') id: string) {
    return this.planService.findOne(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a membership plan' })
  update(@Param('id') id: string, @Body() updatePlanDto: UpdateMembershipPlanDto) {
    return this.planService.update(id, updatePlanDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete(':id')
  @ApiOperation({ summary: 'Remove a membership plan' })
  remove(@Param('id') id: string) {
    return this.planService.remove(id);
  }
}
