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
import { MemberService } from './member.service';
import { CreateMemberDto } from './dto/create-member.dto';
import { UpdateMemberDto } from './dto/update-member.dto';
import { MemberQueryDto } from './dto/member-query.dto';
import { ChangeMembershipAccessDto } from './dto/change-membership-access.dto';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/enums';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Members')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Register a new gym member' })
  create(@Body() createMemberDto: CreateMemberDto) {
    return this.memberService.create(createMemberDto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get all members (Basic)' })
  findAll() {
    return this.memberService.findAll();
  }

  @Get('dashboard')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get paginated members for admin dashboard' })
  findAllDashboard(@Query() queryDto: MemberQueryDto) {
    return this.memberService.findAllDashboard(queryDto);
  }

  @Get('my-profile')
  @Roles(Role.MEMBER)
  @ApiOperation({ summary: 'Get current member profile' })
  findMyProfile(@CurrentUser() user: any) {
    return this.memberService.findByUserId(user.id);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get member by ID' })
  findOne(@Param('id') id: string) {
    return this.memberService.findOne(id);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update member details' })
  update(@Param('id') id: string, @Body() updateMemberDto: UpdateMemberDto) {
    return this.memberService.update(id, updateMemberDto);
  }

  @Patch(':id/membership-access')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel or reactivate a member membership' })
  changeMembershipAccess(
    @Param('id') id: string,
    @Body() accessDto: ChangeMembershipAccessDto,
  ) {
    return this.memberService.changeMembershipAccess(id, accessDto.action);
  }

  @Delete(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Remove a member' })
  remove(@Param('id') id: string) {
    return this.memberService.remove(id);
  }
}
