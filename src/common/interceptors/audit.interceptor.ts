import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable, from, of } from 'rxjs';
import { tap, mergeMap, catchError } from 'rxjs/operators';
import { AuditLogService } from '../../modules/audit-log/audit-log.service';
import { AuditLogAction } from '../enums';
import { EntityManager } from 'typeorm';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(
    private readonly auditLogService: AuditLogService,
    private readonly entityManager: EntityManager,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, user, params } = request;

    // Only log write operations
    const writeMethods = ['POST', 'PATCH', 'PUT', 'DELETE'];
    if (!writeMethods.includes(method)) {
      return next.handle();
    }

    const entityType = this.extractEntityType(url);
    const entityId = params?.id || body?.id;

    // Pre-fetch previous data for UPDATE and DELETE operations
    return from(this.fetchPreviousData(entityType, entityId, method)).pipe(
      mergeMap((previousData) => {
        return next.handle().pipe(
          tap(async (response) => {
            try {
              const action = this.mapMethodToAction(method);
              const finalEntityId = response?.id || entityId || 'N/A';

              if (user?.id) {
                await this.auditLogService.logAction({
                  action,
                  performedById: user.id,
                  entityType,
                  entityId: String(finalEntityId),
                  newData:
                    method !== 'DELETE'
                      ? response?.data || response || body
                      : null,
                  previousData: previousData,
                });
              }
            } catch (error) {
              console.error('Audit logging failed in tap:', error);
            }
          }),
        );
      }),
      catchError((err) => {
        // If pre-fetching or the main handler fails, we still want to handle the error properly
        throw err;
      }),
    );
  }

  private async fetchPreviousData(
    entityType: string,
    id: string,
    method: string,
  ): Promise<any> {
    if (['PATCH', 'PUT', 'DELETE'].includes(method) && id && id !== 'N/A') {
      try {
        // Try to fetch the current state of the entity before it's modified/deleted
        // entityType derived from URL (e.g., 'Member', 'MembershipPlan') should match entity class names
        return await this.entityManager.findOne(entityType, {
          where: { id },
        });
      } catch (e) {
        // If entityType doesn't match a TypeORM entity or ID is not found, return null
        return null;
      }
    }
    return null;
  }

  private mapMethodToAction(method: string): AuditLogAction {
    switch (method) {
      case 'POST':
        return AuditLogAction.CREATE;
      case 'PATCH':
      case 'PUT':
        return AuditLogAction.UPDATE;
      case 'DELETE':
        return AuditLogAction.DELETE;
      default:
        return AuditLogAction.UPDATE;
    }
  }

  private extractEntityType(url: string): string {
    const path = url.split('?')[0];
    const parts = path
      .split('/')
      .filter((p) => p && !['api', 'v1', 'v2'].includes(p));

    if (parts.length === 0) return 'Unknown';

    // Find the last part that isn't a UUID or numeric ID
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let resource = '';

    for (let i = parts.length - 1; i >= 0; i--) {
      const part = parts[i];
      if (!uuidPattern.test(part) && isNaN(Number(part))) {
        resource = part;
        break;
      }
    }

    if (!resource) resource = parts[0];

    // Special case mappings if needed
    const mappings: Record<string, string> = {
      auth: 'User',
      'gym-cms': 'GymContent',
    };

    if (mappings[resource]) return mappings[resource];

    // Capitalize and handle kebab-case
    let entity = resource
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');

    // Singularize
    if (entity.endsWith('ies')) {
      entity = entity.slice(0, -3) + 'y';
    } else if (entity.endsWith('s') && !entity.endsWith('ss')) {
      entity = entity.slice(0, -1);
    }

    return entity;
  }
}
