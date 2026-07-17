import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { CreateAuditLogDto } from './dto/create-audit-log.dto';

@Injectable()
export class AuditLogService {
  constructor(
    @InjectRepository(AuditLog)
    private readonly auditLogRepository: Repository<AuditLog>,
  ) {}

  async logAction(createDto: CreateAuditLogDto): Promise<AuditLog> {
    const { performedById, ...logData } = createDto;
    const log = this.auditLogRepository.create({
      ...logData,
      performedBy: { id: performedById },
    });
    return this.auditLogRepository.save(log);
  }

  async findAll(limit: number = 50): Promise<AuditLog[]> {
    return this.auditLogRepository.find({
      relations: ['performedBy'],
      order: { timestamp: 'DESC' },
      take: limit,
    });
  }
}
