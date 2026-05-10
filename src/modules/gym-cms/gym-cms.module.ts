import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GymContent } from './entities/gym-content.entity';
import { Trainer } from './entities/trainer.entity';

import { GymCmsController } from './gym-cms.controller';
import { GymCmsService } from './gym-cms.service';

@Module({
  imports: [TypeOrmModule.forFeature([GymContent, Trainer])],
  controllers: [GymCmsController],
  providers: [GymCmsService],
})
export class GymCmsModule {}
