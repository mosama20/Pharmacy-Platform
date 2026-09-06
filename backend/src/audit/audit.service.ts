import { Injectable } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

export interface CreateAuditLogParams {
  action: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  entity: string;
  entityId?: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaService) {}

  async log(params: CreateAuditLogParams) {
    try {
      return await this.prisma.auditLog.create({
        data: {
          action: params.action,
          userId: params.userId || null,
          userEmail: params.userEmail || null,
          userRole: params.userRole || null,
          entity: params.entity,
          entityId: params.entityId || null,
          oldValue: params.oldValue ? (params.oldValue as any) : null,
          newValue: params.newValue ? (params.newValue as any) : null,
          ipAddress: params.ipAddress || null,
          userAgent: params.userAgent || null,
        },
      });
    } catch (err: any) {
      console.warn('⚠️ Failed to persist audit log to database:', err.message);
      return null;
    }
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    action?: string;
    entity?: string;
    userId?: string;
  }) {
    const page = Math.max(1, Number(params?.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(params?.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params?.action) where.action = params.action;
    if (params?.entity) where.entity = params.entity;
    if (params?.userId) where.userId = params.userId;

    const [total, data] = await Promise.all([
      this.prisma.auditLog.count({ where }),
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }
}
