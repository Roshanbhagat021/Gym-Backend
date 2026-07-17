import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GymContent } from './entities/gym-content.entity';
import { Trainer } from './entities/trainer.entity';
import { UpdateGymContentDto } from './dto/update-gym-content.dto';
import { CreateTrainerDto } from './dto/create-trainer.dto';
import { UpdateTrainerDto } from './dto/update-trainer.dto';

@Injectable()
export class GymCmsService {
  constructor(
    @InjectRepository(GymContent)
    private readonly contentRepository: Repository<GymContent>,
    @InjectRepository(Trainer)
    private readonly trainerRepository: Repository<Trainer>,
  ) {}

  // --- Gym Content ---
  async getGymContent(): Promise<GymContent> {
    const content = await this.contentRepository.find();
    if (content.length === 0) {
      // Create default if none exists
      return this.contentRepository.save(
        this.contentRepository.create({ gymName: 'My Gym' }),
      );
    }
    return content[0];
  }

  async updateGymContent(updateDto: UpdateGymContentDto): Promise<GymContent> {
    const content = await this.getGymContent();
    Object.assign(content, updateDto);
    return this.contentRepository.save(content);
  }

  // --- Trainers ---
  async createTrainer(createDto: CreateTrainerDto): Promise<Trainer> {
    const trainer = this.trainerRepository.create(createDto);
    return this.trainerRepository.save(trainer);
  }

  async findAllTrainers(activeOnly: boolean = false): Promise<Trainer[]> {
    const where = activeOnly ? { isActive: true } : {};
    return this.trainerRepository.find({ where });
  }

  async findOneTrainer(id: string): Promise<Trainer> {
    const trainer = await this.trainerRepository.findOne({ where: { id } });
    if (!trainer) throw new NotFoundException(`Trainer ${id} not found`);
    return trainer;
  }

  async updateTrainer(
    id: string,
    updateDto: UpdateTrainerDto,
  ): Promise<Trainer> {
    const trainer = await this.findOneTrainer(id);
    Object.assign(trainer, updateDto);
    return this.trainerRepository.save(trainer);
  }

  async removeTrainer(id: string): Promise<void> {
    const trainer = await this.findOneTrainer(id);
    await this.trainerRepository.remove(trainer);
  }
}
