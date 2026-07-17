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
import { GymCmsService } from './gym-cms.service';
import { UpdateGymContentDto } from './dto/update-gym-content.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';
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

@ApiTags('Gym CMS')
@Controller('cms')
export class GymCmsController {
  constructor(private readonly cmsService: GymCmsService) {}

  // --- Gym Content ---
  @Get('content')
  @ApiOperation({ summary: 'Get public gym content details' })
  getGymContent() {
    return this.cmsService.getGymContent();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('content')
  @ApiOperation({ summary: 'Update gym content details' })
  updateGymContent(@Body() updateDto: UpdateGymContentDto) {
    return this.cmsService.updateGymContent(updateDto);
  }

  // --- Trainers ---
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Post('trainers')
  @ApiOperation({ summary: 'Add a new trainer' })
  createTrainer(@Body() createDto: CreateTrainerDto) {
    return this.cmsService.createTrainer(createDto);
  }

  @Get('trainers')
  @ApiOperation({ summary: 'Get all trainers (public)' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  findAllTrainers(@Query('activeOnly') activeOnly?: boolean) {
    return this.cmsService.findAllTrainers(activeOnly !== false);
  }

  @Get('trainers/:id')
  @ApiOperation({ summary: 'Get trainer by ID' })
  findOneTrainer(@Param('id') id: string) {
    return this.cmsService.findOneTrainer(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Patch('trainers/:id')
  @ApiOperation({ summary: 'Update trainer' })
  updateTrainer(@Param('id') id: string, @Body() updateDto: UpdateTrainerDto) {
    return this.cmsService.updateTrainer(id, updateDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Delete('trainers/:id')
  @ApiOperation({ summary: 'Remove trainer' })
  removeTrainer(@Param('id') id: string) {
    return this.cmsService.removeTrainer(id);
  }
}
