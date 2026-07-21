import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('stats')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get dashboard statistics for admin' })
  @ApiQuery({
    name: 'period',
    required: false,
    type: String,
    description: 'Dashboard period. Defaults to thisMonth.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    format: 'date',
    description: 'Required only when period is custom.',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    format: 'date',
    description: 'Required only when period is custom.',
  })
  async getStats(
    @Query('period') period?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.dashboardService.getDashboardStats(period, startDate, endDate);
  }
}
